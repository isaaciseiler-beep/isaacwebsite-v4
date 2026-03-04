import { SearchDoc } from "@/lib/search/index";

const FIELD_TITLE = 1;
const FIELD_BODY = 1 << 1;
const FIELD_BREADCRUMBS = 1 << 2;
const FIELD_TAGS = 1 << 3;

type Posting = {
  docIndex: number;
  mask: number;
  titleCount: number;
  bodyCount: number;
  breadcrumbCount: number;
  tagCount: number;
};

type PreparedDoc = {
  doc: SearchDoc;
  normalizedTitle: string;
  normalizedBody: string;
  normalizedBreadcrumbs: string;
  normalizedTags: string;
};

type ExpandedTerm = {
  term: string;
  penalty: number;
};

export type SearchFilters = {
  types?: SearchDoc["type"][];
  photoLocation?: string;
};

export type SearchResult = {
  doc: SearchDoc;
  score: number;
  snippet: string;
  matchedTerms: string[];
};

export type SearchEngine = {
  search: (query: string, options?: SearchFilters & { limit?: number }) => SearchResult[];
};

const SYNONYMS: Record<string, string[]> = {
  cv: ["resume"],
  resume: ["cv"],
  photos: ["photo", "photography"],
  photo: ["photos", "photography"],
  photography: ["photo", "photos"],
  linkedin: ["post", "feed"],
  posts: ["linkedin", "feed"],
  bio: ["about"],
  ai: ["artificial", "intelligence"]
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string): string[] => {
  if (!value) {
    return [];
  }

  return value.split(" ").filter(Boolean);
};

const recencyBoost = (dateValue?: string): number => {
  if (!dateValue) {
    return 0;
  }

  const timestamp = Date.parse(dateValue);
  if (Number.isNaN(timestamp)) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  return Math.max(0, 5 * Math.exp(-ageDays / 500));
};

const typeBoost = (doc: SearchDoc, queryTerms: Set<string>): number => {
  let boost = 0;

  if (doc.type === "page") {
    boost += 1.7;
  }

  if (doc.type === "project") {
    boost += 2.1;
  }

  if (doc.type === "block") {
    boost += queryTerms.has("quote") ? 1.8 : 0.25;
  }

  if (doc.type === "photo") {
    boost += queryTerms.has("photo") || queryTerms.has("photos") || queryTerms.has("location") ? 2.3 : 0.6;
  }

  if (doc.type === "linkedin") {
    boost += queryTerms.has("linkedin") || queryTerms.has("post") ? 2.2 : 0.55;
  }

  if (doc.type === "contact") {
    const contactTerms = ["contact", "email", "linkedin", "github", "resume", "cv"];
    boost += contactTerms.some((term) => queryTerms.has(term)) ? 4.5 : 0.3;
  }

  return boost;
};

const makeExpandedTerms = (tokens: string[]): ExpandedTerm[] => {
  const output: ExpandedTerm[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (!seen.has(token)) {
      output.push({ term: token, penalty: 1 });
      seen.add(token);
    }

    const synonyms = SYNONYMS[token] ?? [];
    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeText(synonym);
      if (!normalizedSynonym || seen.has(normalizedSynonym)) {
        continue;
      }
      output.push({ term: normalizedSynonym, penalty: 0.72 });
      seen.add(normalizedSynonym);
    }
  }

  return output;
};

const buildSnippet = (doc: SearchDoc, queryTerms: string[]): string => {
  const source = doc.body || doc.title;
  if (!source) {
    return "";
  }

  const lower = source.toLowerCase();
  let startIndex = -1;

  for (const term of queryTerms) {
    const found = lower.indexOf(term.toLowerCase());
    if (found >= 0 && (startIndex < 0 || found < startIndex)) {
      startIndex = found;
    }
  }

  if (startIndex < 0) {
    const head = source.slice(0, 170).trim();
    return source.length > 170 ? `${head}…` : head;
  }

  const windowSize = 170;
  const before = 72;
  const start = Math.max(0, startIndex - before);
  const end = Math.min(source.length, start + windowSize);
  const prefix = start > 0 ? "… " : "";
  const suffix = end < source.length ? " …" : "";

  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
};

const buildPostings = (docs: PreparedDoc[]): { inverted: Map<string, Posting[]>; vocabulary: string[] } => {
  const termBuckets = new Map<string, Map<number, Posting>>();

  const addFieldTokens = (
    docIndex: number,
    fieldTokens: string[],
    maskFlag: number,
    countKey: "titleCount" | "bodyCount" | "breadcrumbCount" | "tagCount"
  ) => {
    for (const token of fieldTokens) {
      if (!token) {
        continue;
      }

      let byDoc = termBuckets.get(token);
      if (!byDoc) {
        byDoc = new Map<number, Posting>();
        termBuckets.set(token, byDoc);
      }

      const existing = byDoc.get(docIndex) ?? {
        docIndex,
        mask: 0,
        titleCount: 0,
        bodyCount: 0,
        breadcrumbCount: 0,
        tagCount: 0
      };

      existing.mask |= maskFlag;
      existing[countKey] += 1;
      byDoc.set(docIndex, existing);
    }
  };

  docs.forEach((doc, docIndex) => {
    addFieldTokens(docIndex, tokenize(doc.normalizedTitle), FIELD_TITLE, "titleCount");
    addFieldTokens(docIndex, tokenize(doc.normalizedBody), FIELD_BODY, "bodyCount");
    addFieldTokens(docIndex, tokenize(doc.normalizedBreadcrumbs), FIELD_BREADCRUMBS, "breadcrumbCount");
    addFieldTokens(docIndex, tokenize(doc.normalizedTags), FIELD_TAGS, "tagCount");
  });

  const inverted = new Map<string, Posting[]>();
  termBuckets.forEach((value, term) => {
    inverted.set(term, Array.from(value.values()));
  });

  const vocabulary = Array.from(inverted.keys()).sort();

  return { inverted, vocabulary };
};

const scorePosting = (posting: Posting): number => {
  const titleScore = Math.min(posting.titleCount, 2) * 10;
  const bodyScore = Math.min(posting.bodyCount, 4) * 3;
  const breadcrumbScore = Math.min(posting.breadcrumbCount, 2) * 6;
  const tagScore = Math.min(posting.tagCount, 3) * 5;
  return titleScore + bodyScore + breadcrumbScore + tagScore;
};

const matchesFilters = (doc: SearchDoc, options?: SearchFilters): boolean => {
  if (!options) {
    return true;
  }

  if (options.types?.length && !options.types.includes(doc.type)) {
    return false;
  }

  const location = options.photoLocation?.trim();
  if (!location) {
    return true;
  }

  if (doc.type !== "photo") {
    return false;
  }

  const haystack = normalizeText([doc.title, doc.body, ...(doc.tags ?? [])].join(" "));
  const needle = normalizeText(location);
  return haystack.includes(needle);
};

export const createSearchEngine = (rawDocs: SearchDoc[]): SearchEngine => {
  const docs: PreparedDoc[] = rawDocs.map((doc) => ({
    doc,
    normalizedTitle: normalizeText(doc.title),
    normalizedBody: normalizeText(doc.body),
    normalizedBreadcrumbs: normalizeText((doc.breadcrumbs ?? []).join(" ")),
    normalizedTags: normalizeText((doc.tags ?? []).join(" "))
  }));

  const { inverted, vocabulary } = buildPostings(docs);

  const search = (query: string, options?: SearchFilters & { limit?: number }): SearchResult[] => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return [];
    }

    const tokens = tokenize(normalizedQuery);
    if (tokens.length === 0) {
      return [];
    }

    const expandedTerms = makeExpandedTerms(tokens);
    const scores = new Map<number, number>();
    const matchedTerms = new Map<number, Set<string>>();

    const bump = (docIndex: number, value: number, matchedTerm: string) => {
      const next = (scores.get(docIndex) ?? 0) + value;
      scores.set(docIndex, next);

      const terms = matchedTerms.get(docIndex) ?? new Set<string>();
      terms.add(matchedTerm);
      matchedTerms.set(docIndex, terms);
    };

    for (const expanded of expandedTerms) {
      const postings = inverted.get(expanded.term);
      if (postings) {
        for (const posting of postings) {
          bump(posting.docIndex, scorePosting(posting) * expanded.penalty, expanded.term);
        }
      }

      if (expanded.term.length < 2) {
        continue;
      }

      let prefixMatches = 0;
      for (const vocabTerm of vocabulary) {
        if (!vocabTerm.startsWith(expanded.term) || vocabTerm === expanded.term) {
          continue;
        }

        const postingsForPrefix = inverted.get(vocabTerm);
        if (!postingsForPrefix) {
          continue;
        }

        const distancePenalty = Math.max(0.35, 1 - (vocabTerm.length - expanded.term.length) * 0.12);
        const prefixValue = 4 * expanded.penalty * distancePenalty;

        for (const posting of postingsForPrefix) {
          const fieldStrength =
            (posting.mask & FIELD_TITLE ? 1 : 0) +
            (posting.mask & FIELD_BREADCRUMBS ? 0.75 : 0) +
            (posting.mask & FIELD_TAGS ? 0.75 : 0) +
            (posting.mask & FIELD_BODY ? 0.5 : 0);

          bump(posting.docIndex, prefixValue * fieldStrength, expanded.term);
        }

        prefixMatches += 1;
        if (prefixMatches >= 16) {
          break;
        }
      }
    }

    const querySet = new Set(tokens);

    const results: SearchResult[] = [];
    scores.forEach((baseScore, docIndex) => {
      const prepared = docs[docIndex];
      const doc = prepared.doc;

      if (!matchesFilters(doc, options)) {
        return;
      }

      let score = baseScore;

      if (prepared.normalizedTitle.includes(normalizedQuery)) {
        score += 15;
      }
      if (prepared.normalizedBody.includes(normalizedQuery)) {
        score += 15;
      }

      score += recencyBoost(doc.date);
      score += typeBoost(doc, querySet);

      const snippet = buildSnippet(doc, tokens);
      if (!snippet) {
        return;
      }

      results.push({
        doc,
        score,
        snippet,
        matchedTerms: Array.from(matchedTerms.get(docIndex) ?? [])
      });
    });

    const limit = options?.limit ?? 30;

    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aDistance = Math.abs(a.doc.title.length - normalizedQuery.length);
      const bDistance = Math.abs(b.doc.title.length - normalizedQuery.length);
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }

      return a.doc.title.localeCompare(b.doc.title);
    });

    return results.slice(0, limit);
  };

  return { search };
};

export const searchDocs = (
  docs: SearchDoc[],
  query: string,
  options?: SearchFilters & { limit?: number }
): SearchResult[] => {
  return createSearchEngine(docs).search(query, options);
};

export const searchTextUtils = {
  normalizeText,
  tokenize
};
