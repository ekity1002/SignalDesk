import { supabase } from "~/lib/supabase.server";

export type Article = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  canonical_url: string | null;
  published_at: string | null;
  source_id: string;
  status: "visible" | "excluded";
  created_at: string;
  updated_at: string;
};

export type ArticleWithRelations = Article & {
  sources: { id: string; name: string } | null;
  article_tags: { tag_id: string; tags: { id: string; name: string } }[];
  favorites: { id: string }[];
};

export type CreateArticleInput = {
  title: string;
  description?: string | null;
  link: string;
  canonical_url: string | null;
  published_at?: string | null;
  source_id: string;
  status: "visible" | "excluded";
};

type GetArticlesParams = {
  page: number;
  limit: number;
  status?: "visible" | "excluded";
  tagId?: string;
  search?: string;
  favoritesOnly?: boolean;
};

export async function getArticles(
  params: GetArticlesParams,
): Promise<{ data: Article[]; total: number }> {
  const { page, limit, status, search } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("articles")
    .select("*, sources(id, name), article_tags(tag_id, tags:tags(id, name)), favorites(id)", {
      count: "exact",
    })
    .eq("status", status ?? "visible");

  if (search) {
    const sanitized = search.replace(/[,()]/g, "");
    if (sanitized.length > 0) {
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }
  }

  const { data, error, count } = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    throw new Error("Failed to fetch articles");
  }

  return { data: data ?? [], total: count ?? 0 };
}

export async function articleExistsByCanonicalUrl(canonicalUrl: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .eq("canonical_url", canonicalUrl)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to check article existence");
  }

  return data !== null;
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: input.title,
      description: input.description ?? null,
      link: input.link,
      canonical_url: input.canonical_url,
      published_at: input.published_at ?? null,
      source_id: input.source_id,
      status: input.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to create article");
  }

  return data;
}

export async function attachTagsToArticle(articleId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const rows = tagIds.map((tagId) => ({
    article_id: articleId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("article_tags").insert(rows);

  if (error) {
    throw new Error("Failed to attach tags to article");
  }
}

export async function updateArticleStatus(
  id: string,
  status: "visible" | "excluded",
): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update article status");
  }

  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    throw new Error("Failed to delete article");
  }
}

export async function toggleFavorite(articleId: string): Promise<{ favorited: boolean }> {
  const { data: existing, error: fetchError } = await supabase
    .from("favorites")
    .select("*")
    .eq("article_id", articleId)
    .maybeSingle();

  if (fetchError) {
    throw new Error("Failed to check favorite status");
  }

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("article_id", articleId);
    if (error) {
      throw new Error("Failed to remove favorite");
    }
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ article_id: articleId })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to add favorite");
  }

  return { favorited: true };
}
