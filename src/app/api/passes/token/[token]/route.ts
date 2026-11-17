import { NextResponse } from "next/server";
import { getActiveEvent, getFamilyPasses } from "@/lib/events";
import { isSupabaseConfigured, supabaseRestFetch } from "@/lib/supabase";

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
    const activeEv = await getActiveEvent();
    if (!activeEv) {
      return NextResponse.json({ error: "No active event found" }, { status: 404 });
    }

    // 1. Direct real-time Supabase Database Search scoped strictly to the ACTIVE EVENT
    if (isSupabaseConfigured()) {
      const directMembers = await supabaseRestFetch(
        "members",
        `its_id=eq.${cleanToken}&event_id=eq.${activeEv.id}`
      );
      let targetFamilyId = directMembers && directMembers.length > 0 ? directMembers[0].family_id : null;
      let matchedMemberId = directMembers && directMembers.length > 0 ? directMembers[0].id : null;

      if (!targetFamilyId) {
        const famByToken = await supabaseRestFetch(
          "families",
          `event_id=eq.${activeEv.id}&or=(pass_link_token.eq.${cleanToken},hof_its_id.eq.${cleanToken},mobile_number.eq.${cleanToken})`
        );
        if (famByToken && famByToken.length > 0) {
          targetFamilyId = famByToken[0].id;
        }
      }

      if (targetFamilyId) {
        const famList = await supabaseRestFetch(
          "families",
          `id=eq.${targetFamilyId}&event_id=eq.${activeEv.id}`
        );
        const famData = famList && famList.length > 0 ? famList[0] : null;

        if (famData) {
          const allMems = await supabaseRestFetch("members", `family_id=eq.${targetFamilyId}&event_id=eq.${activeEv.id}`);
          const allPasses = await supabaseRestFetch("passes", `family_id=eq.${targetFamilyId}&event_id=eq.${activeEv.id}`);

          // Fetch all event members in order of registration to assign continuous global token numbers
          const eventMems = await supabaseRestFetch("members", `event_id=eq.${activeEv.id}&order=created_at.asc`);
          const globalPassNumberMap = new Map<string, number>();
          (eventMems || []).forEach((m: any, idx: number) => {
            globalPassNumberMap.set(m.id, idx + 1);
          });

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
              const passObj = (allPasses || []).find(
                (p: any) => p.member_id === m.id || (p.qr_token && p.qr_token.includes(m.its_id))
              );

              const isIssued = activeEv?.status === "PASSES_ISSUED" && Boolean(passObj);

              const calculatedPassNumber = passObj?.pass_number || globalPassNumberMap.get(m.id) || (idx + 1);

              const passData = isIssued
                ? {
                    id: passObj?.id || `pass-${m.id}`,
                    eventId: passObj?.event_id || famData.event_id,
                    memberId: passObj?.member_id || m.id,
                    passNumber: calculatedPassNumber,
                    qrToken: passObj?.qr_token || `KRC-${(activeEv?.slug || "EVENT").toUpperCase()}-${m.its_id}`,
                    status: passObj?.status || "ISSUED",
                    checkedInAt: passObj?.checked_in_at || null,
                    checkedInBy: passObj?.checked_in_by || null,
                    createdAt: passObj?.created_at || new Date().toISOString(),
                  }
                : null;

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
                passNumber: calculatedPassNumber,
                pass: passData,
              };
            }),
          };
          return NextResponse.json({ success: true, family: fullFamily });
        }
      }
    }

    // 2. Fallback to local store (scoped to active event)
    const family = await getFamilyPasses(cleanToken);
    if (family && family.eventId === activeEv.id) {
      return NextResponse.json({ success: true, family });
    }

    return NextResponse.json({ error: "Passes not found for this event" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
