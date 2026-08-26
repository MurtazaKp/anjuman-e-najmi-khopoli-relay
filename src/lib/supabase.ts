import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gecdyeuurxkkdtsafzmh.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlY2R5ZXV1cnhra2R0c2Fmem1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzE0NjE5OSwiZXhwIjoyMTAyNzIyMTk5fQ.gB53w_1tRXD6s-hhb6426NWtER8sHIMRJbd246HANKc";

export function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL || SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;
  return { url, key, isConfigured: true };
}

export function isSupabaseConfigured(): boolean {
  return true;
}

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getSupabaseCredentials();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    },
  });
}

export const supabase = getSupabaseClient();

export async function supabaseRestFetch<T = any>(table: string, filterQuery: string = ""): Promise<T[] | null> {
  try {
    const { url, key } = getSupabaseCredentials();
    const PAGE_SIZE = 1000;
    let allRows: T[] = [];
    let page = 0;

    while (true) {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const queryStr = filterQuery ? `select=*&${filterQuery}` : "select=*";
      const endpoint = `${url}/rest/v1/${table}?${queryStr}`;

      const res = await fetch(endpoint, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Range": `${start}-${end}`,
        },
        cache: "no-store",
      });

      if (!res.ok) break;
      const rows = (await res.json()) as T[];
      if (!rows || rows.length === 0) break;

      allRows = allRows.concat(rows);
      if (rows.length < PAGE_SIZE) break;
      page++;
    }

    return allRows;
  } catch (e) {
    return null;
  }
}
