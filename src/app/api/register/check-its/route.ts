import { NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/events";
import { checkDuplicateItsIdData, lookupItsId, loadStoreFromSupabase } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itsId = searchParams.get("itsId");
    const mode = searchParams.get("mode") || "duplicate"; // "duplicate" | "lookup"

    if (!itsId) {
      return NextResponse.json({ isDuplicate: false });
    }

    await loadStoreFromSupabase();
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ isDuplicate: false });
    }

    if (mode === "lookup") {
      // Full lookup: return family info if found
      const lookup = lookupItsId(itsId);
      if (!lookup.found) {
        return NextResponse.json({ found: false });
      }
      const { family, member } = lookup;
      // Return safe subset — no passLinkToken
      return NextResponse.json({
        found: true,
        isCurrentEvent: Boolean(lookup.isCurrentEvent),
        isPastEvent: Boolean(lookup.isPastEvent),
        isHof: member?.isHof,
        member: member
          ? {
              id: member.id,
              itsId: member.itsId,
              name: member.name,
              gender: member.gender,
              type: member.type,
              isHof: member.isHof,
            }
          : null,
        currentFamilyAlreadyRegistered: lookup.currentFamilyAlreadyRegistered || null,
        alreadyRegisteredItsInCurrentEvent: lookup.alreadyRegisteredItsInCurrentEvent || [],
        family: family
          ? {
              id: family.id,
              hofName: family.hofName,
              hofItsId: family.hofItsId,
              mobileNumber: family.mobileNumber,
              mauze: family.mauze || "Lonavala",
              transportMode: family.transportMode || "Car",
              eventId: family.eventId,
              members: family.members.map((m) => ({
                id: m.id,
                itsId: m.itsId,
                name: m.name,
                gender: m.gender,
                type: m.type,
                isHof: m.isHof,
              })),
            }
          : null,
      });
    }

    // Default: duplicate check
    const result = checkDuplicateItsIdData(event.id, itsId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
