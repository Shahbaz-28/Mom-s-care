import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw: string) {
  return raw.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  if (serviceKey.includes("...")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY looks truncated. Paste the full key from Supabase → Settings → API."
    );
  }

  return createClient(normalizeSupabaseUrl(url), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
