import { supabase } from "~/lib/supabase.server";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_RETENTION_DAYS = 7;

export type SettingsRecord = {
  id: string;
  article_retention_days: number;
  created_at: string;
  updated_at: string;
};

export async function getSettings(): Promise<SettingsRecord> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        id: SETTINGS_ID,
        article_retention_days: DEFAULT_RETENTION_DAYS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw new Error("Failed to fetch settings");
  }

  return data;
}

export async function updateSettings(articleRetentionDays: number): Promise<SettingsRecord> {
  const { data, error } = await supabase
    .from("settings")
    .update({ article_retention_days: articleRetentionDays })
    .eq("id", SETTINGS_ID)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update settings");
  }

  return data;
}
