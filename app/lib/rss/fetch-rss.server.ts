import RssParser from "rss-parser";
import {
  articleExistsByCanonicalUrl,
  attachTagsToArticle,
  createArticle,
  deleteArticle,
} from "~/lib/rss/articles.server";
import { getSources, type Source } from "~/lib/rss/sources.server";
import { matchTags, type TagWithKeywords } from "~/lib/rss/tag-matcher";
import { normalizeUrl } from "~/lib/rss/url-normalizer";
import { getTags } from "~/lib/tags/tags.server";

export type FetchResult = {
  sourceId: string;
  sourceName: string;
  created: number;
  skipped: number;
  errors: string[];
};

export type BatchFetchResult = {
  totalSources: number;
  results: FetchResult[];
};

const parser = new RssParser();

export async function fetchRssSource(
  source: Source,
  tags: TagWithKeywords[],
): Promise<FetchResult> {
  const result: FetchResult = {
    sourceId: source.id,
    sourceName: source.name,
    created: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const feed = await parser.parseURL(source.url);

    for (const item of feed.items) {
      try {
        const title = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? null;
        const link = item.link ?? "";
        const pubDate = item.pubDate ?? item.isoDate ?? null;

        if (!link) {
          continue;
        }

        const canonicalUrl = normalizeUrl(link);
        const exists = await articleExistsByCanonicalUrl(canonicalUrl);

        if (exists) {
          result.skipped++;
          continue;
        }

        const matchedTags = matchTags(title, description, tags);
        const status = matchedTags.length > 0 ? "visible" : "excluded";

        const article = await createArticle({
          title,
          description,
          link,
          canonical_url: canonicalUrl,
          published_at: pubDate,
          source_id: source.id,
          status,
        });

        if (matchedTags.length > 0) {
          try {
            await attachTagsToArticle(
              article.id,
              matchedTags.map((t) => t.id),
            );
          } catch (tagError) {
            await deleteArticle(article.id);
            throw tagError;
          }
        }

        result.created++;
      } catch (itemError) {
        result.errors.push(
          `Item "${item.title ?? "unknown"}": ${itemError instanceof Error ? itemError.message : String(itemError)}`,
        );
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

export async function fetchAllRssSources(): Promise<BatchFetchResult> {
  const allSources = await getSources();
  const activeSources = allSources.filter((s) => s.is_active);
  const tags = await getTags();

  const results: FetchResult[] = [];

  for (const source of activeSources) {
    const result = await fetchRssSource(source, tags);
    results.push(result);
  }

  return {
    totalSources: activeSources.length,
    results,
  };
}
