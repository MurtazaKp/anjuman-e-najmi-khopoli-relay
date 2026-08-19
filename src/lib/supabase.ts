import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export function getSupabaseCredentials() {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Direct .env file reader fallback if environment variables are missing in dev
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split(/\r?\n/).forEach((line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
          if (k === "SUPABASE_URL" && !url) url = v;
          if (k === "SUPABASE_SERVICE_ROLE_KEY") serviceKey = v;
          if (k === "SUPABASE_ANON_KEY" && !anonKey) anonKey = v;
        }
      });
    }
  } catch (e) {}

  const key = serviceKey || anonKey;
  const isConfigured = Boolean(url && key && !url.includes("placeholder"));
  return { url, key, isConfigured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const supabase = getSupabaseClient();
