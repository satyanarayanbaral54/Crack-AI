import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabaseConfigError =
  "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function getSupabaseProjectUrl(url: string | undefined) {
  if (!url) {
    return "https://example.supabase.co";
  }

  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export const supabase = createClient(
  getSupabaseProjectUrl(supabaseUrl),
  supabaseKey ?? "missing-anon-key",
);
