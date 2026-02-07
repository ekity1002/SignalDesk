import { supabase } from "~/lib/supabase.server";
import type { CreatePromptInput, Prompt, UpdatePromptInput } from "./schemas";

export type { Prompt } from "./schemas";

export async function getPrompts(): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch prompts");
  }

  return data;
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  const { data, error } = await supabase.from("prompts").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error("Failed to fetch prompt");
  }

  return data;
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  // If setting as default, unset other defaults first
  if (input.is_default) {
    const { error: updateError } = await supabase
      .from("prompts")
      .update({ is_default: false })
      .eq("is_default", true);

    if (updateError) {
      throw new Error("Failed to create prompt");
    }
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      name: input.name,
      template: input.template,
      is_default: input.is_default,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to create prompt");
  }

  return data;
}

export async function updatePrompt(id: string, input: UpdatePromptInput): Promise<Prompt> {
  // If setting as default, unset other defaults first
  if (input.is_default) {
    const { error: updateError } = await supabase
      .from("prompts")
      .update({ is_default: false })
      .eq("is_default", true);

    if (updateError) {
      throw new Error("Failed to update prompt");
    }
  }

  const { data, error } = await supabase
    .from("prompts")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Prompt not found");
    }
    throw new Error("Failed to update prompt");
  }

  return data;
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from("prompts").delete().eq("id", id);

  if (error) {
    throw new Error("Failed to delete prompt");
  }
}
