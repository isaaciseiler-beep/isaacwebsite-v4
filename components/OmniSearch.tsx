"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { safeDuration, usePrefersReducedMotion } from "@/lib/motion";
import { SearchDoc, toDocHref } from "@/lib/search/index";
import { SearchResult, createSearchEngine, searchTextUtils } from "@/lib/search/search";
import styles from "./OmniSearch.module.scss";

type SearchIndexPayload = {
  version: string;
  docs: SearchDoc[];
};

type Tab = "search" | "ask";

type TypeChipKey = "pages" | "projects" | "photos" | "linkedin";

type Citation = {
  label: string;
  url: string;
  quote: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
};

const CONTACT_EVENT = "site:open-contact";
const UI_STATE_KEY = "omni-search-ui-state-v1";
const INDEX_CACHE_KEY = "omni-search-index-cache-v1";

const TYPE_CHIPS: Array<{ key: TypeChipKey; label: string; types: SearchDoc["type"][] }> = [
  { key: "pages", label: "Pages", types: ["page", "contact"] },
  { key: "projects", label: "Projects", types: ["project", "block"] },
  { key: "photos", label: "Photos", types: ["photo"] },
  { key: "linkedin", label: "LinkedIn", types: ["linkedin"] }
];

const DEFAULT_CHIPS: Record<TypeChipKey, boolean> = {
  pages: true,
  projects: true,
  photos: true,
  linkedin: true
};

const isExternalHref = (href: string): boolean => /^[a-z]+:\/\//i.test(href);

const isInternalHref = (href: string): boolean => {
  return href.startsWith("/") || href.startsWith("#") || href.startsWith("?");
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compactText = (value: string): string => value.replace(/\s+/g, " ").trim();

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseInlineMarkdown = (
  text: string,
  keyPrefix: string,
  onNavigate: (href: string) => void
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const matcher = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

  let cursor = 0;
  let partIndex = 0;
  let match: RegExpExecArray | null = matcher.exec(text);

  while (match) {
    const [full, codeText, linkLabel, linkHref] = match;
    const start = match.index;

    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    if (codeText) {
      nodes.push(
        <code key={`${keyPrefix}-code-${partIndex}`} className={styles.inlineCode}>
          {codeText}
        </code>
      );
    } else if (linkLabel && linkHref) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${partIndex}`}
          href={linkHref}
          onClick={(event) => {
            if (isInternalHref(linkHref)) {
              event.preventDefault();
              onNavigate(linkHref);
            }
          }}
          target={isExternalHref(linkHref) ? "_blank" : undefined}
          rel={isExternalHref(linkHref) ? "noreferrer" : undefined}
        >
          {linkLabel}
        </a>
      );
    } else {
      nodes.push(full);
    }

    cursor = start + full.length;
    partIndex += 1;
    match = matcher.exec(text);
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
};

const renderTinyMarkdown = (
  markdown: string,
  keyPrefix: string,
  onNavigate: (href: string) => void
): ReactNode[] => {
  const lines = markdown.split("\n");
  const blocks: Array<{ type: "paragraph" | "list"; items: string[] }> = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    blocks.push({ type: "paragraph", items: [paragraphBuffer.join(" ")] });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) {
      return;
    }

    blocks.push({ type: "list", items: [...listBuffer] });
    listBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      listBuffer.push(trimmed.slice(2).trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.map((block, index) => {
    if (block.type === "list") {
      return (
        <ul key={`${keyPrefix}-list-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`${keyPrefix}-list-item-${index}-${itemIndex}`}>
              {parseInlineMarkdown(item, `${keyPrefix}-list-inline-${index}-${itemIndex}`, onNavigate)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`${keyPrefix}-paragraph-${index}`}>
        {parseInlineMarkdown(block.items[0], `${keyPrefix}-paragraph-inline-${index}`, onNavigate)}
      </p>
    );
  });
};

const highlightMatches = (value: string, terms: string[], keyPrefix: string): ReactNode[] => {
  const cleanedTerms = Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)));
  if (cleanedTerms.length === 0) {
    return [value];
  }

  const regex = new RegExp(`(${cleanedTerms.map((term) => escapeRegExp(term)).join("|")})`, "ig");
  const parts = value.split(regex);

  return parts.map((part, index) => {
    const isMatch = cleanedTerms.some((term) => term.toLowerCase() === part.toLowerCase());
    if (!isMatch) {
      return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
    }

    return (
      <mark key={`${keyPrefix}-mark-${index}`}>
        {part}
      </mark>
    );
  });
};

const parseSseEvent = (payload: string): { event: string; data: string } | null => {
  const lines = payload.split("\n");
  let eventName = "message";
  const dataParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataParts.push(line.slice("data:".length).trim());
    }
  }

  if (dataParts.length === 0) {
    return null;
  }

  return {
    event: eventName,
    data: dataParts.join("\n")
  };
};

const extractPhotoLocation = (doc: SearchDoc): string => {
  const inTags = (doc.tags ?? []).find((tag) => tag.includes(","));
  return inTags ?? doc.title;
};

export default function OmniSearch() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLUListElement | null>(null);
  const askScrollRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ask");

  const [typeChips, setTypeChips] = useState<Record<TypeChipKey, boolean>>(DEFAULT_CHIPS);
  const [photoLocationFilter, setPhotoLocationFilter] = useState("");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  const [indexPayload, setIndexPayload] = useState<SearchIndexPayload | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [askInput, setAskInput] = useState("");
  const [asking, setAsking] = useState(false);

  const indexLoadPromiseRef = useRef<Promise<SearchIndexPayload | null> | null>(null);
  const askAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawState = window.sessionStorage.getItem(UI_STATE_KEY);
    if (rawState) {
      try {
        const parsed = JSON.parse(rawState) as {
          tab?: Tab;
          query?: string;
          chips?: Record<TypeChipKey, boolean>;
        };

        if (parsed.tab === "search" || parsed.tab === "ask") {
          setTab(parsed.tab);
        }

        if (typeof parsed.query === "string") {
          setQuery(parsed.query);
        }

        if (parsed.chips) {
          setTypeChips((previous) => ({ ...previous, ...parsed.chips }));
        }
      } catch {
        window.sessionStorage.removeItem(UI_STATE_KEY);
      }
    }

    const rawIndex = window.sessionStorage.getItem(INDEX_CACHE_KEY);
    if (rawIndex) {
      try {
        const parsed = JSON.parse(rawIndex) as SearchIndexPayload;
        if (Array.isArray(parsed.docs) && typeof parsed.version === "string") {
          setIndexPayload(parsed);
        }
      } catch {
        window.sessionStorage.removeItem(INDEX_CACHE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      UI_STATE_KEY,
      JSON.stringify({
        tab,
        query,
        chips: typeChips
      })
    );
  }, [query, tab, typeChips]);

  const loadIndex = useCallback(async (): Promise<SearchIndexPayload | null> => {
    if (indexLoadPromiseRef.current) {
      return indexLoadPromiseRef.current;
    }

    const runner = (async () => {
      setIndexLoading(true);
      setIndexError(null);

      try {
        const response = await fetch("/api/search-index", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load search index.");
        }

        const payload = (await response.json()) as SearchIndexPayload;
        if (!payload || !Array.isArray(payload.docs) || typeof payload.version !== "string") {
          throw new Error("Malformed search index payload.");
        }

        setIndexPayload((previous) => {
          if (previous?.version === payload.version && previous.docs.length === payload.docs.length) {
            return previous;
          }
          return payload;
        });

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(payload));
        }

        return payload;
      } catch (error) {
        setIndexError(error instanceof Error ? error.message : "Unable to load search index.");
        return indexPayload;
      } finally {
        setIndexLoading(false);
        indexLoadPromiseRef.current = null;
      }
    })();

    indexLoadPromiseRef.current = runner;
    return runner;
  }, [indexPayload]);

  useEffect(() => {
    let engaged = false;

    const schedulePrefetch = () => {
      if (engaged) {
        return;
      }

      engaged = true;

      const run = () => {
        void loadIndex();
      };

      const win = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      };

      if (typeof win.requestIdleCallback === "function") {
        win.requestIdleCallback(run, { timeout: 1200 });
        return;
      }

      window.setTimeout(run, 260);
    };

    window.addEventListener("pointerdown", schedulePrefetch, { once: true, passive: true });
    window.addEventListener("keydown", schedulePrefetch, { once: true });

    return () => {
      window.removeEventListener("pointerdown", schedulePrefetch);
      window.removeEventListener("keydown", schedulePrefetch);
    };
  }, [loadIndex]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectedTypes = useMemo(() => {
    const output = new Set<SearchDoc["type"]>();

    TYPE_CHIPS.forEach((chip) => {
      if (!typeChips[chip.key]) {
        return;
      }

      chip.types.forEach((type) => output.add(type));
    });

    if (output.size === 0) {
      validFallbackTypes.forEach((type) => output.add(type));
    }

    return Array.from(output);
  }, [typeChips]);

  const engine = useMemo(() => {
    if (!indexPayload) {
      return null;
    }

    return createSearchEngine(indexPayload.docs);
  }, [indexPayload]);

  const photoLocations = useMemo(() => {
    if (!indexPayload) {
      return [] as string[];
    }

    const locations = new Set<string>();
    indexPayload.docs.forEach((doc) => {
      if (doc.type !== "photo") {
        return;
      }

      const location = extractPhotoLocation(doc);
      if (location) {
        locations.add(location);
      }
    });

    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  }, [indexPayload]);

  const highlightTerms = useMemo(() => {
    return searchTextUtils.tokenize(searchTextUtils.normalizeText(debouncedQuery));
  }, [debouncedQuery]);

  const searchResults = useMemo(() => {
    if (!engine) {
      return [] as SearchResult[];
    }

    if (!debouncedQuery.trim()) {
      return [] as SearchResult[];
    }

    return engine.search(debouncedQuery, {
      limit: 32,
      types: selectedTypes,
      photoLocation: photoLocationFilter || undefined
    });
  }, [debouncedQuery, engine, photoLocationFilter, selectedTypes]);

  const fallbackResults = useMemo(() => {
    if (!indexPayload) {
      return [] as SearchResult[];
    }

    const docs = indexPayload.docs
      .filter((doc) => selectedTypes.includes(doc.type))
      .slice(0, 8)
      .map((doc) => ({
        doc,
        score: 0,
        snippet: compactText(doc.body).slice(0, 160),
        matchedTerms: []
      }));

    return docs;
  }, [indexPayload, selectedTypes]);

  const displayResults = debouncedQuery.trim() ? searchResults : fallbackResults;

  useEffect(() => {
    setActiveResultIndex(0);
  }, [debouncedQuery, photoLocationFilter, selectedTypes]);

  useEffect(() => {
    if (!open || tab !== "search" || !resultsRef.current) {
      return;
    }

    const items = Array.from(resultsRef.current.querySelectorAll("[data-result-item='true']"));
    if (items.length === 0) {
      return;
    }

    const tween = gsap.fromTo(
      items,
      { autoAlpha: 0, y: reducedMotion ? 0 : 8 },
      {
        autoAlpha: 1,
        y: 0,
        duration: safeDuration(0.22, reducedMotion),
        ease: "power2.out",
        stagger: reducedMotion ? 0 : 0.028
      }
    );

    return () => {
      tween.kill();
    };
  }, [displayResults, open, reducedMotion, tab]);

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setMounted(true);
    setTab("ask");
    setOpen(true);
    void loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    if (!mounted || !drawerRef.current) {
      return;
    }

    const node = drawerRef.current;

    if (open) {
      gsap.killTweensOf(node);
      gsap.fromTo(
        node,
        {
          autoAlpha: 0,
          y: 0,
          scaleY: reducedMotion ? 1 : 0.35,
          transformOrigin: "bottom center"
        },
        {
          autoAlpha: 1,
          y: 0,
          scaleY: 1,
          duration: safeDuration(0.28, reducedMotion),
          ease: "power2.out"
        }
      );

      return;
    }

    const tween = gsap.to(node, {
      autoAlpha: 0,
      y: 0,
      scaleY: reducedMotion ? 1 : 0.35,
      duration: safeDuration(0.2, reducedMotion),
      ease: "power1.out",
      onComplete: () => {
        setMounted(false);
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    });

    return () => {
      tween.kill();
    };
  }, [mounted, open, reducedMotion]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (tab === "search") {
        searchInputRef.current?.focus();
        return;
      }

      askInputRef.current?.focus();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [open, tab]);

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      const lowered = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && lowered === "k") {
        event.preventDefault();
        if (open) {
          closeDrawer();
        } else {
          openDrawer();
        }
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        closeDrawer();
      }
    };

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [closeDrawer, open, openDrawer]);

  useEffect(() => {
    if (!open || !drawerRef.current) {
      return;
    }

    const container = drawerRef.current;

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", trapFocus);
    return () => container.removeEventListener("keydown", trapFocus);
  }, [open]);

  const onNavigate = useCallback(
    (href: string) => {
      if (href === "#contact") {
        window.dispatchEvent(new Event(CONTACT_EVENT));
        closeDrawer();
        return;
      }

      if (isInternalHref(href)) {
        if (href.includes("contact=open")) {
          router.push(href);
          window.dispatchEvent(new Event(CONTACT_EVENT));
          closeDrawer();
          return;
        }

        router.push(href);
        closeDrawer();
        return;
      }

      if (isExternalHref(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
        closeDrawer();
      }
    },
    [closeDrawer, router]
  );

  const openSearchDoc = useCallback(
    (doc: SearchDoc) => {
      if (doc.type === "contact") {
        window.dispatchEvent(new Event(CONTACT_EVENT));
        closeDrawer();
        return;
      }

      onNavigate(toDocHref(doc));
    },
    [closeDrawer, onNavigate]
  );

  const submitAsk = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const value = compactText(askInput);
      if (!value || asking) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: value,
        citations: []
      };

      const assistantMessageId = createId();
      setAskInput("");
      setAsking(true);

      setChatMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          citations: []
        }
      ]);

      const historyForApi = [...chatMessages, userMessage].map((message) => ({
        role: message.role,
        content: message.content
      }));

      const activeTypes = selectedTypes;
      const controller = new AbortController();
      askAbortRef.current = controller;

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: historyForApi,
            filters: {
              types: activeTypes,
              photoLocation: photoLocationFilter || undefined
            }
          }),
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error("Ask request failed.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let done = false;

        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            buffer += decoder.decode(result.value, { stream: !done });

            let separatorIndex = buffer.indexOf("\n\n");
            while (separatorIndex >= 0) {
              const rawEvent = buffer.slice(0, separatorIndex);
              buffer = buffer.slice(separatorIndex + 2);
              separatorIndex = buffer.indexOf("\n\n");

              const parsed = parseSseEvent(rawEvent);
              if (!parsed) {
                continue;
              }

              let parsedData: unknown;
              try {
                parsedData = JSON.parse(parsed.data);
              } catch {
                parsedData = null;
              }

              if (parsed.event === "delta" && parsedData && typeof parsedData === "object" && "text" in parsedData) {
                const text = String((parsedData as { text: string }).text ?? "");
                setChatMessages((previous) =>
                  previous.map((message) => {
                    if (message.id !== assistantMessageId) {
                      return message;
                    }

                    return {
                      ...message,
                      content: `${message.content}${text}`
                    };
                  })
                );
                continue;
              }

              if (
                parsed.event === "citations" &&
                parsedData &&
                typeof parsedData === "object" &&
                "citations" in parsedData &&
                Array.isArray((parsedData as { citations: Citation[] }).citations)
              ) {
                const citations = (parsedData as { citations: Citation[] }).citations;
                setChatMessages((previous) =>
                  previous.map((message) => {
                    if (message.id !== assistantMessageId) {
                      return message;
                    }

                    return {
                      ...message,
                      citations
                    };
                  })
                );
              }
            }
          }
        }
      } catch {
        setChatMessages((previous) =>
          previous.map((message) => {
            if (message.id !== assistantMessageId) {
              return message;
            }

            return {
              ...message,
              content: "Not found in this site.",
              citations: []
            };
          })
        );
      } finally {
        setAsking(false);
        askAbortRef.current = null;
      }
    },
    [askInput, asking, chatMessages, photoLocationFilter, selectedTypes]
  );

  useEffect(() => {
    if (!askScrollRef.current) {
      return;
    }

    askScrollRef.current.scrollTop = askScrollRef.current.scrollHeight;
  }, [chatMessages, asking]);

  useEffect(() => {
    return () => {
      askAbortRef.current?.abort();
    };
  }, []);

  const onSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((previous) => {
        if (displayResults.length === 0) {
          return 0;
        }

        return (previous + 1) % displayResults.length;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((previous) => {
        if (displayResults.length === 0) {
          return 0;
        }

        return (previous - 1 + displayResults.length) % displayResults.length;
      });
      return;
    }

    if (event.key === "Enter") {
      if (!displayResults[activeResultIndex]) {
        return;
      }

      event.preventDefault();
      openSearchDoc(displayResults[activeResultIndex].doc);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
    }
  };

  const onToggleChip = (chipKey: TypeChipKey) => {
    setTypeChips((previous) => ({
      ...previous,
      [chipKey]: !previous[chipKey]
    }));
  };

  return (
    <div className={styles.root}>
      {mounted ? (
        <div
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Site search and assistant"
          ref={drawerRef}
          data-open={open}
        >
          <div className={styles.tabRow}>
            <button
              type="button"
              className={classNames(styles.tab, tab === "ask" && styles.activeTab)}
              onClick={() => setTab("ask")}
            >
              Ask
            </button>
            <button
              type="button"
              className={classNames(styles.tab, tab === "search" && styles.activeTab)}
              onClick={() => setTab("search")}
            >
              Search
            </button>
          </div>

          {tab === "search" ? (
            <div className={styles.searchPane}>
              <label className="srOnly" htmlFor="omni-search-input">
                Search site content
              </label>
              <input
                id="omni-search-input"
                ref={searchInputRef}
                className={styles.searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchInputKeyDown}
                placeholder="Search pages, projects, photos, LinkedIn..."
                autoComplete="off"
                aria-controls="omni-search-results"
              />

              <div className={styles.chipRow} role="group" aria-label="Filter search types">
                {TYPE_CHIPS.map((chip) => {
                  const active = typeChips[chip.key];
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      className={classNames(styles.chip, active && styles.activeChip)}
                      onClick={() => onToggleChip(chip.key)}
                      aria-pressed={active}
                    >
                      {chip.label}
                    </button>
                  );
                })}

                <label className={styles.locationLabel} htmlFor="omni-photo-location">
                  Photo location
                </label>
                <select
                  id="omni-photo-location"
                  className={styles.locationSelect}
                  value={photoLocationFilter}
                  onChange={(event) => setPhotoLocationFilter(event.target.value)}
                >
                  <option value="">All locations</option>
                  {photoLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.resultsWrap}>
                {indexLoading && !indexPayload ? <p className={styles.hint}>Loading search index…</p> : null}
                {indexError && !indexPayload ? <p className={styles.error}>{indexError}</p> : null}

                {!indexLoading && displayResults.length === 0 && debouncedQuery.trim() ? (
                  <p className={styles.hint}>No matches found. Try another keyword or filter.</p>
                ) : null}

                {!debouncedQuery.trim() ? (
                  <p className={styles.hint}>Start typing for instant results. Press ↑ ↓ Enter to navigate.</p>
                ) : null}

                <ul id="omni-search-results" className={styles.results} ref={resultsRef} role="listbox" aria-label="Search results">
                  {displayResults.map((result, index) => {
                    const active = activeResultIndex === index;

                    return (
                      <li key={`${result.doc.id}-${index}`} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={classNames(styles.resultItem, active && styles.resultItemActive)}
                          data-result-item="true"
                          onMouseEnter={() => {
                            setActiveResultIndex(index);
                          }}
                          onClick={() => openSearchDoc(result.doc)}
                        >
                          {result.doc.imageSrc ? (
                            <div className={styles.thumbWrap} aria-hidden="true">
                              <Image src={result.doc.imageSrc} alt="" fill sizes="64px" className={styles.thumb} />
                            </div>
                          ) : (
                            <div className={styles.thumbFallback} aria-hidden="true">
                              {result.doc.type.toUpperCase()}
                            </div>
                          )}

                          <div className={styles.resultCopy}>
                            <p className={styles.resultMeta}>
                              {result.doc.type}
                              {result.doc.date ? ` • ${new Date(result.doc.date).toLocaleDateString()}` : ""}
                            </p>

                            <h3>{highlightMatches(result.doc.title, highlightTerms, `${result.doc.id}-title`)}</h3>
                            <p>{highlightMatches(result.snippet, highlightTerms, `${result.doc.id}-snippet`)}</p>

                            {result.doc.breadcrumbs?.length ? (
                              <span className={styles.breadcrumbs}>{result.doc.breadcrumbs.join(" / ")}</span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <div className={styles.askPane}>
              <div className={styles.chatStream} ref={askScrollRef} aria-live="polite" aria-label="Assistant transcript">
                {chatMessages.length === 0 ? (
                  <p className={styles.hint}>Ask about this site. Answers are grounded to indexed site content only.</p>
                ) : null}

                {chatMessages.map((message) => (
                  <article
                    key={message.id}
                    className={classNames(styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage)}
                  >
                    <div className={styles.messageBody}>
                      {message.role === "assistant"
                        ? renderTinyMarkdown(message.content || "…", message.id, onNavigate)
                        : <p>{message.content}</p>}
                    </div>

                    {message.role === "assistant" && message.citations.length > 0 ? (
                      <div className={styles.citationRow}>
                        {message.citations.map((citation) => (
                          <button
                            key={`${message.id}-${citation.url}-${citation.label}`}
                            type="button"
                            className={styles.citationPill}
                            onClick={() => onNavigate(citation.url)}
                            title={citation.quote}
                          >
                            {citation.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}

                {asking ? <p className={styles.streaming}>Thinking…</p> : null}
              </div>

              <form className={styles.askComposer} onSubmit={submitAsk}>
                <label className="srOnly" htmlFor="omni-ask-input">
                  Ask the site assistant
                </label>
                <textarea
                  id="omni-ask-input"
                  ref={askInputRef}
                  value={askInput}
                  onChange={(event) => setAskInput(event.target.value)}
                  placeholder="Ask a grounded question about this site..."
                  rows={3}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitAsk();
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      closeDrawer();
                    }
                  }}
                />

                <div className={styles.askControls}>
                  <p>Shift+Enter for newline</p>
                  <button type="submit" disabled={asking || !compactText(askInput)}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        className={classNames(styles.trigger, mounted && styles.triggerOpen)}
        onClick={() => {
          if (open) {
            closeDrawer();
          } else {
            openDrawer();
          }
        }}
        aria-label="Open search and AI assistant"
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
        <span>{open ? "Close" : "AI"}</span>
        <kbd>{open ? "Esc" : "⌘K"}</kbd>
      </button>
    </div>
  );
}

const validFallbackTypes: SearchDoc["type"][] = ["page", "project", "block", "photo", "linkedin", "contact"];
