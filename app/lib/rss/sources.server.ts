import { supabase } from "~/lib/supabase.server";

const MAX_SOURCES = 10;

export type Source = {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
};

export type CreateSourceInput = {
  name: string;
  url: string;
};

export async function getSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch sources");
  }

  return data;
}

export async function getSourceCount(): Promise<number> {
  const sources = await getSources();
  return sources.length;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  // Validate URL format
  try {
    new URL(input.url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Check source limit
  const count = await getSourceCount();
  if (count >= MAX_SOURCES) {
    throw new Error("Maximum sources limit (10) reached");
  }

  const { data, error } = await supabase
    .from("sources")
    .insert({
      name: input.name,
      url: input.url,
    })
    .select()
    .single();

  if (error) {
    // PostgreSQL unique constraint violation error code
    if (error.code === "23505") {
      throw new Error("A source with this URL already exists");
    }
    throw new Error("Failed to create source");
  }

  return data;
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabase.from("sources").delete().eq("id", id);

  if (error) {
    throw new Error("Failed to delete source");
  }
}

export async function toggleSourceActive(id: string, isActive: boolean): Promise<Source> {
  const { data, error } = await supabase
    .from("sources")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update source");
  }

  return data;
}
