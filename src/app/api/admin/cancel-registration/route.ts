import { NextResponse } from "next/server";
import { cancelMemberRegistration } from "@/lib/storage";

const AUTHORIZED_ADMIN_EMAILS = [
  "khopoliwala52@gmail.com",
  "khapolimasool@alvazarat.org",
  "khopolimasool@alvazarat.org"
];
const ADMIN_VERIFICATION_PIN = "525252";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, pin, itsId, cancelEntireFamily } = body;

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail) || pin !== ADMIN_VERIFICATION_PIN) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin credentials." },
        { status: 401 }
      );
    }

    if (!itsId || !itsId.trim()) {
      return NextResponse.json(
        { error: "ITS ID is required." },
        { status: 400 }
      );
    }

    const result = await cancelMemberRegistration(itsId, { cancelEntireFamily });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cancel Registration Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel registration" },
      { status: 400 }
    );
  }
}
