import { NextResponse } from "next/server";
import { getStore } from "@/lib/storage";
import { sendPassEmailNotification } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const store = getStore();
    const event = store.events.find((e) => e.isCurrent) || store.events[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const results = [];

    for (const family of store.families) {
      const targetEmail = (family as any).email || `${family.hofItsId}@khopolirelay.org`;
      const passLinkUrl = `${baseUrl}/passes/${family.passLinkToken}`;

      const notification = await sendPassEmailNotification({
        toEmail: targetEmail,
        hofName: family.hofName,
        eventName: event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H",
        passLinkUrl,
        familyMembers: family.members.map((m) => ({
          name: m.name,
          itsId: m.itsId,
          gender: m.gender,
          type: m.type,
        })),
      });

      results.push(notification);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
