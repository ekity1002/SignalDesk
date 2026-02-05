import { supabase } from "~/lib/supabase.server";

export type TagKeyword = {
  id: string;
  tag_id: string;
  keyword: string;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
  keywords: TagKeyword[];
};

export type CreateTagInput = {
  name: string;
  keywords: string[];
};

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*, keywords:tag_keywords(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch tags");
  }

  return data;
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .insert({ name: input.name })
    .select()
    .single();

  if (tagError) {
    if (tagError.code === "23505") {
      throw new Error("A tag with this name already exists");
    }
    throw new Error("Failed to create tag");
  }

  if (input.keywords.length === 0) {
    return { ...tag, keywords: [] };
  }

  const keywordRows = input.keywords.map((keyword) => ({
    tag_id: tag.id,
    keyword,
  }));

  const { data: keywords, error: keywordsError } = await supabase
    .from("tag_keywords")
    .insert(keywordRows)
    .select();

  if (keywordsError) {
    throw new Error("Failed to create keywords");
  }

  return { ...tag, keywords };
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    throw new Error("Failed to delete tag");
  }
}

export async function updateTagKeywords(tagId: string, keywords: string[]): Promise<TagKeyword[]> {
  const { error: deleteError } = await supabase.from("tag_keywords").delete().eq("tag_id", tagId);

  if (deleteError) {
    throw new Error("Failed to update keywords");
  }

  if (keywords.length === 0) {
    return [];
  }

  const keywordRows = keywords.map((keyword) => ({
    tag_id: tagId,
    keyword,
  }));

  const { data, error: insertError } = await supabase
    .from("tag_keywords")
    .insert(keywordRows)
    .select();

  if (insertError) {
    throw new Error("Failed to update keywords");
  }

  return data;
}
