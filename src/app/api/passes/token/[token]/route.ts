import { NextResponse } from "next/server";
import { getFamilyPasses, getActiveEvent } from "@/lib/events";
import { getSupabaseClient } from "@/lib/supabase";

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

    const cleanToken = token.trim();
    const family = await getFamilyPasses(cleanToken);
    
    if (family) {
      return NextResponse.json({ success: true, family });
    }

    // Direct Supabase database fallback search
    const client = getSupabaseClient();
    if (client) {
      // 1. Search member by ITS ID
      const { data: directMembers } = await client
        .from("members")
        .select("*")
        .eq("its_id", cleanToken);

      let targetFamilyId = directMembers && directMembers.length > 0 ? directMembers[0].family_id : null;
      let matchedMemberId = directMembers && directMembers.length > 0 ? directMembers[0].id : null;

      // 2. If not found by member ITS ID, search family by HOF ITS ID, pass link token, or mobile
      if (!targetFamilyId) {
        const { data: famByToken } = await client
          .from("families")
          .select("id, hof_its_id")
          .or(`pass_link_token.eq.${cleanToken},hof_its_id.eq.${cleanToken},mobile_number.eq.${cleanToken}`)
          .maybeSingle();

        if (famByToken) {
          targetFamilyId = famByToken.id;
        }
      }

      if (targetFamilyId) {
        const { data: famData } = await client.from("families").select("*").eq("id", targetFamilyId).single();
        const { data: allMems } = await client.from("members").select("*").eq("family_id", targetFamilyId);
        const { data: allPasses } = await client.from("passes").select("*").eq("family_id", targetFamilyId);

        if (famData) {
          const activeEv = await getActiveEvent();
          const fullFamily = {
            id: famData.id,
            eventId: famData.event_id,
            hofName: famData.hof_name,
            hofItsId: famData.hof_its_id,
            mobileNumber: famData.mobile_number,
            mauze: famData.mauze,
            transportMode: famData.transport_mode,
            rajabRozaCount: famData.rajab_roza_count,
            niyazJaman: famData.niyaz_jaman,
            niyazContribution: famData.niyaz_contribution,
            passLinkToken: famData.pass_link_token,
            whatsappStatus: famData.whatsapp_status,
            createdAt: famData.created_at,
            event: activeEv,
            matchedMemberId: matchedMemberId || (allMems && allMems[0] ? allMems[0].id : null),
            members: (allMems || []).map((m: any, idx: number) => {
              const passObj = (allPasses || []).find((p: any) => p.member_id === m.id);
              return {
                id: m.id,
                familyId: m.family_id,
                eventId: m.event_id,
                itsId: m.its_id,
                name: m.name,
                gender: m.gender,
                type: m.type,
                isHof: m.is_hof,
                createdAt: m.created_at,
                passNumber: idx + 1,
                pass: passObj ? {
                  id: passObj.id,
                  eventId: passObj.event_id,
                  memberId: passObj.member_id,
                  qrToken: passObj.qr_token,
                  status: passObj.status,
                  checkedInAt: passObj.checked_in_at,
                  checkedInBy: passObj.checked_in_by,
                  createdAt: passObj.created_at,
                } : null,
              };
            }),
          };
          return NextResponse.json({ success: true, family: fullFamily });
        }
      }
    }

    return NextResponse.json({ error: "Passes not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
