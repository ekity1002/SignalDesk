import type { Tag } from "~/lib/tags/tags.server";

export type TagWithKeywords = Tag;

export type MatchedTag = {
  id: string;
  name: string;
};

export function matchTags(
  title: string,
  description: string | null,
  tags: TagWithKeywords[],
): MatchedTag[] {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (text.trim().length === 0) {
    return [];
  }

  const matched: MatchedTag[] = [];

  for (const tag of tags) {
    const hasMatch = tag.keywords.some((kw) => text.includes(kw.keyword.toLowerCase()));

    if (hasMatch) {
      matched.push({ id: tag.id, name: tag.name });
    }
  }

  return matched;
}
