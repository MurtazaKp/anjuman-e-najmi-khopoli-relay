import { NextResponse } from "next/server";
import { getStore, saveStore, clearSupabaseStore } from "@/lib/storage";

export const dynamic = 'force-dynamic';

const AUTHORIZED_ADMIN_EMAILS = [
  "khopoliwala52@gmail.com",
  "khapolimasool@alvazarat.org",
  "khopolimasool@alvazarat.org"
];

const ADMIN_VERIFICATION_PIN = "525252";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, pin } = body;

    if (!email || !AUTHORIZED_ADMIN_EMAILS.includes(String(email).toLowerCase())) {
      return NextResponse.json(
        { error: "Unauthorized admin email address." },
        { status: 401 }
      );
    }

    if (String(pin) !== ADMIN_VERIFICATION_PIN) {
      return NextResponse.json(
        { error: "Invalid Admin PIN code." },
        { status: 401 }
      );
    }

    const store = getStore();
    const { getFormattedExportData } = await import("@/lib/storage");
    const { syncFullStoreToGoogleSheet } = await import("@/lib/googlesheets");
    const { isSupabaseConfigured, getSupabaseCredentials } = await import("@/lib/supabase");

    const activeEvent = store.events.find((e) => e.isCurrent) || store.events[0];
    const eventId = activeEvent?.id;

    if (eventId) {
      // Clear ONLY registrations and passes for the active event (Preserve past event history!)
      store.families = store.families.filter((f) => f.eventId !== eventId);
      store.passes = store.passes.filter((p) => p.eventId !== eventId);

      const evt = store.events.find((e) => e.id === eventId);
      if (evt) {
        evt.status = "REGISTRATION_OPEN";
      }

      saveStore(store, { skipSupabaseBulkSync: true });
      await clearSupabaseStore(eventId);

      // Reset event status in Supabase
      if (isSupabaseConfigured()) {
        const { url, key } = getSupabaseCredentials();
        await fetch(`${url}/rest/v1/events?id=eq.${eventId}`, {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "REGISTRATION_OPEN" }),
        }).catch((e) => console.error("[Supabase Event Status Reset Error]", e));
      }

      // Sync clean empty state to Google Sheet tab
      const exportData = getFormattedExportData(eventId);
      await syncFullStoreToGoogleSheet(exportData).catch((e) =>
        console.error("[Google Sheet Clear Error]", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `Registrations and passes for ${activeEvent?.name || "active event"} cleared successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
