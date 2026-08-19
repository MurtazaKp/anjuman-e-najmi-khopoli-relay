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
    store.families = [];
    store.passes = [];
    if (store.events.length > 0) {
      store.events[0].status = "REGISTRATION_OPEN";
    }
    saveStore(store);
    await clearSupabaseStore();

    return NextResponse.json({
      success: true,
      message: "All registrations and passes cleared successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
