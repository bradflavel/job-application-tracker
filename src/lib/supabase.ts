import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

// Note: we don't pass a Database generic here. Our row types live in
// `@/types/database` and are applied at the call site (via select<Row>()
// or explicit return-type annotations on the query hooks). This avoids
// brittle type inference issues between supabase-js generics and a
// hand-maintained Database type.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
