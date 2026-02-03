declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    SESSION_SECRET: string;
    AUTH_PASSWORD: string;
    CRON_SECRET: string;
    LLM_PROVIDER: "openai" | "anthropic";
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
