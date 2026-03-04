import { NextRequest, NextResponse } from "next/server";
import { SearchDoc, buildSearchIndex, toDocHref } from "@/lib/search/index";
import { createSearchEngine } from "@/lib/search/search";

export const dynamic = "force-dynamic";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type AskFilters = {
  types?: SearchDoc["type"][];
  photoLocation?: string;
};

type AskRequest = {
  messages?: ChatTurn[];
  filters?: AskFilters;
};

type ModelCitation = {
  docId: string;
  label: string;
  quote: string;
};

type ModelPayload = {
  answerMarkdown: string;
  citations: ModelCitation[];
};

type Citation = {
  label: string;
  url: string;
  quote: string;
};

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const SEARCH_THRESHOLD = 10;

const validDocTypes: SearchDoc["type"][] = ["page", "project", "block", "photo", "linkedin", "contact"];

const escapeMarkdownLabel = (value: string): string => value.replace(/[\[\]]/g, "");

const limitWords = (value: string, maxWords: number): string => {
  const words = value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}…`;
};

const compactText = (value: string): string => value.replace(/\s+/g, " ").trim();

const pickQuote = (doc: SearchDoc): string => {
  const source = compactText(doc.body || doc.title);
  if (!source) {
    return "[paraphrase]";
  }

  return limitWords(source, 20);
};

const buildNotFoundPayload = (query: string, topDocs: SearchDoc[]): { answerMarkdown: string; citations: Citation[] } => {
  const suggestions = topDocs.slice(0, 3);

  const suggestionLines =
    suggestions.length > 0
      ? suggestions
          .map((doc) => {
            const href = toDocHref(doc);
            return `- [${escapeMarkdownLabel(doc.title)}](${href})`;
          })
          .join("\n")
      : "- No close matches were found in this site index.";

  return {
    answerMarkdown: `Not found in this site for \"${query}\".\n\nClosest matches:\n${suggestionLines}`,
    citations: suggestions.map((doc) => ({
      label: doc.title,
      url: toDocHref(doc),
      quote: pickQuote(doc)
    }))
  };
};

const parseResponsePayload = (raw: string): ModelPayload | null => {
  try {
    const parsed = JSON.parse(raw) as ModelPayload;
    if (!parsed || typeof parsed.answerMarkdown !== "string" || !Array.isArray(parsed.citations)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const buildContextPack = (docs: SearchDoc[]): string => {
  return docs
    .map((doc) => {
      const payload = {
        docId: doc.id,
        type: doc.type,
        title: doc.title,
        url: toDocHref(doc),
        breadcrumbs: doc.breadcrumbs ?? [],
        tags: doc.tags ?? [],
        bodyExcerpt: limitWords(compactText(doc.body), 48)
      };

      return JSON.stringify(payload);
    })
    .join("\n");
};

const toSseResponse = (answerMarkdown: string, citations: Citation[]): Response => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("start", { ok: true });

        const chunkSize = 28;
        for (let start = 0; start < answerMarkdown.length; start += chunkSize) {
          const text = answerMarkdown.slice(start, start + chunkSize);
          send("delta", { text });
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 8);
          });
        }

        send("citations", { citations });
        send("done", { ok: true });
      } catch {
        send("error", { message: "Unable to stream response." });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
};

const normalizeCitations = (docs: SearchDoc[], citations: ModelCitation[]): Citation[] => {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const normalized: Citation[] = [];
  const seen = new Set<string>();

  for (const citation of citations) {
    if (!citation || typeof citation.docId !== "string" || seen.has(citation.docId)) {
      continue;
    }

    const doc = byId.get(citation.docId);
    if (!doc) {
      continue;
    }

    const quote = compactText(citation.quote || "");

    normalized.push({
      label: citation.label?.trim() || doc.title,
      url: toDocHref(doc),
      quote: quote ? limitWords(quote, 20) : "[paraphrase]"
    });

    seen.add(citation.docId);
  }

  return normalized;
};

const ensureInlineCitations = (answerMarkdown: string, citations: Citation[]): string => {
  if (citations.length === 0) {
    return answerMarkdown;
  }

  const hasLink = /\[[^\]]+\]\(([^)]+)\)/;
  const paragraphs = answerMarkdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return answerMarkdown;
  }

  const withLinks = paragraphs.map((paragraph, index) => {
    if (hasLink.test(paragraph)) {
      return paragraph;
    }

    const citation = citations[index % citations.length];
    return `${paragraph} [${escapeMarkdownLabel(citation.label)}](${citation.url})`;
  });

  return withLinks.join("\n\n");
};

const ensureNotFoundSuggestions = (answerMarkdown: string, topDocs: SearchDoc[]): string => {
  if (!/not found in this site/i.test(answerMarkdown)) {
    return answerMarkdown;
  }

  if (/closest matches:/i.test(answerMarkdown)) {
    return answerMarkdown;
  }

  const suggestions = topDocs.slice(0, 3);
  if (suggestions.length === 0) {
    return answerMarkdown;
  }

  const lines = suggestions.map((doc) => `- [${escapeMarkdownLabel(doc.title)}](${toDocHref(doc)})`);
  return `${answerMarkdown}\n\nClosest matches:\n${lines.join("\n")}`;
};

const callOpenAi = async ({
  contextDocs,
  conversation,
  latestQuestion
}: {
  contextDocs: SearchDoc[];
  conversation: ChatTurn[];
  latestQuestion: string;
}): Promise<ModelPayload | null> => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const contextPack = buildContextPack(contextDocs);
  const conversationText = conversation.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join("\n");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a grounded assistant for a personal site. Use only the provided context pack. If the answer is missing in context, say exactly 'Not found in this site.' and offer closest matches from context. Do not invent facts. Keep answers concise and include inline markdown links to cited URLs. Return strictly valid JSON that matches the requested schema."
          },
          {
            role: "user",
            content: [
              "Use this conversation context:",
              conversationText,
              "",
              "Latest user question:",
              latestQuestion,
              "",
              "Authoritative context pack (JSON per line):",
              contextPack,
              "",
              "Return JSON with shape:",
              '{"answerMarkdown": string, "citations": [{"docId": string, "label": string, "quote": string}]}.',
              "Rules:",
              "- Only cite docIds that exist in the context pack.",
              "- Each factual paragraph in answerMarkdown must include at least one inline markdown link.",
              "- Keep citation quotes at 20 words or fewer, or use '[paraphrase]'."
            ].join("\n")
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "grounded_site_answer",
            strict: true,
            schema: {
              type: "object",
              properties: {
                answerMarkdown: { type: "string" },
                citations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      docId: { type: "string" },
                      label: { type: "string" },
                      quote: { type: "string" }
                    },
                    required: ["docId", "label", "quote"],
                    additionalProperties: false
                  }
                }
              },
              required: ["answerMarkdown", "citations"],
              additionalProperties: false
            }
          }
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) {
      return null;
    }

    return parseResponsePayload(raw);
  } finally {
    clearTimeout(timeout);
  }
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AskRequest;

  const messages = (body.messages ?? [])
    .filter((item): item is ChatTurn => {
      return (
        Boolean(item) &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
      );
    })
    .slice(-12)
    .map((item) => ({ role: item.role, content: compactText(item.content) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "Missing messages." }, { status: 400 });
  }

  const latestUser = [...messages].reverse().find((item) => item.role === "user");
  if (!latestUser) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  const filters: AskFilters = {};
  const incomingTypes = body.filters?.types ?? [];
  if (incomingTypes.length) {
    filters.types = incomingTypes.filter((type): type is SearchDoc["type"] => validDocTypes.includes(type));
  }

  if (typeof body.filters?.photoLocation === "string" && body.filters.photoLocation.trim()) {
    filters.photoLocation = body.filters.photoLocation;
  }

  const docs = buildSearchIndex();
  const engine = createSearchEngine(docs);

  const recentUserText = messages
    .filter((item) => item.role === "user")
    .slice(-3)
    .map((item) => item.content)
    .join(" ");

  const searchResults = engine.search(recentUserText || latestUser.content, {
    limit: 10,
    ...filters
  });

  const topDocs = searchResults.slice(0, 8).map((result) => result.doc);

  if (!searchResults.length || searchResults[0].score < SEARCH_THRESHOLD) {
    const fallback = buildNotFoundPayload(latestUser.content, topDocs);
    return toSseResponse(fallback.answerMarkdown, fallback.citations);
  }

  const modelPayload = await callOpenAi({
    contextDocs: topDocs,
    conversation: messages,
    latestQuestion: latestUser.content
  });

  if (!modelPayload) {
    const fallback = buildNotFoundPayload(latestUser.content, topDocs);
    return toSseResponse(fallback.answerMarkdown, fallback.citations);
  }

  const citations = normalizeCitations(topDocs, modelPayload.citations);
  if (citations.length === 0) {
    const fallback = buildNotFoundPayload(latestUser.content, topDocs);
    return toSseResponse(fallback.answerMarkdown, fallback.citations);
  }

  const rawAnswer = compactText(modelPayload.answerMarkdown) || "Not found in this site.";
  const answerWithFallback = ensureNotFoundSuggestions(rawAnswer, topDocs);
  const answerMarkdown = ensureInlineCitations(answerWithFallback, citations);

  return toSseResponse(answerMarkdown, citations);
}
