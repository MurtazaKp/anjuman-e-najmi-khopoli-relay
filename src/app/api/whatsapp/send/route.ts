import { NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/storage";
import { sendWhatsAppPassNotification } from "@/lib/whatsapp";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const store = getStore();
    const event = store.events.find((e) => e.isCurrent) || store.events[0];

    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const family of store.families) {
      const passLinkUrl = `${baseUrl}/passes/${family.passLinkToken}`;

      const notification = await sendWhatsAppPassNotification({
        toMobile: family.mobileNumber,
        hofName: family.hofName,
        eventName: event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H",
        passLinkUrl,
      });

      family.whatsappStatus = notification.status;

      results.push({
        familyId: family.id,
        hofName: family.hofName,
        mobile: family.mobileNumber,
        status: notification.status,
        link: passLinkUrl,
      });
    }

    saveStore(store);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
