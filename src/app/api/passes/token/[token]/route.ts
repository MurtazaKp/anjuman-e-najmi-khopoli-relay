import { NextResponse } from "next/server";
import { getFamilyPasses } from "@/lib/events";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: "Token or ITS ID is required" }, { status: 400 });
    }

    const family = await getFamilyPasses(token);
    if (!family) {
      return NextResponse.json({ error: "Passes not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, family });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
