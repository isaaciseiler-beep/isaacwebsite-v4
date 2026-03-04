import { INDEX_VERSION, buildSearchIndex } from "@/lib/search/index";

export type SearchIndexPayload = {
  version: string;
  docs: ReturnType<typeof buildSearchIndex>;
};

export const buildSearchIndexPayload = (): SearchIndexPayload => ({
  version: INDEX_VERSION,
  docs: buildSearchIndex()
});

export const buildSearchIndexJson = (): string => JSON.stringify(buildSearchIndexPayload());
