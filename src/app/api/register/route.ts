import { NextResponse } from "next/server";
import { getActiveEvent, registerFamily } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      hofName,
      hofItsId,
      mobileNumber,
      hofGender,
      hofType,
      mauze,
      transportMode,
      rajabRozaCount,
      niyazJaman,
      niyazContribution,
      familyMembers
    } = body;

    if (!hofName || !hofItsId || !mobileNumber || !hofGender || !hofType) {
      return NextResponse.json(
        { error: "All HOF details are required." },
        { status: 400 }
      );
    }

    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event found." }, { status: 404 });
    }

    const family = await registerFamily(event.id, {
      hofName,
      hofItsId,
      mobileNumber,
      hofGender,
      hofType,
      mauze,
      transportMode,
      rajabRozaCount,
      niyazJaman,
      niyazContribution,
      familyMembers: familyMembers || [],
    } as any);

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully",
      passLinkToken: family.passLinkToken,
      familyId: family.id,
    });
  } catch (error: any) {
    console.error("[API Register Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process registration" },
      { status: 400 }
    );
  }
}
