import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase untuk Route Handler. Memakai service role key yang hanya
 * tersedia di server, sehingga RLS tetap aktif dan tidak ada akses langsung
 * dari browser. Jangan pernah mengimpor modul ini dari Client Component.
 */
const globalForSupabase = globalThis as typeof globalThis & {
  kfcSupabase?: SupabaseClient;
};

function readConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Konfigurasi Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL bukan URL yang valid.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL harus memakai http atau https.");
  }

  return { url: parsedUrl.origin, serviceRoleKey };
}

export function getSupabaseAdmin(): SupabaseClient {
  if (globalForSupabase.kfcSupabase) return globalForSupabase.kfcSupabase;

  const { url, serviceRoleKey } = readConfig();
  const client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { "X-Client-Info": "konter-fajar-cell" },
    },
  });

  globalForSupabase.kfcSupabase = client;
  return client;
}
