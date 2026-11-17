import { NextResponse } from "next/server";
import {
  addFamilyMember,
  removeFamilyMember,
  editFamilyMember,
  mergeHofFamily,
} from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * POST /api/family
 * Actions: add_member | remove_member | edit_member | merge_hof
 * Auth: HOF ITS ID must match the family's hofItsId (simple ownership check)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, familyId, hofItsId } = body;

    if (!action || !familyId || !hofItsId) {
      return NextResponse.json({ error: "action, familyId and hofItsId are required." }, { status: 400 });
    }

    // Ownership verification: ensure the caller's ITS belongs to this family
    const { lookupItsId, loadStoreFromSupabase } = await import("@/lib/storage");
    await loadStoreFromSupabase();
    const lookup = lookupItsId(hofItsId);
    if (!lookup.found || lookup.family?.id !== familyId) {
      return NextResponse.json(
        { error: "Unauthorized: ITS ID does not belong to this family." },
        { status: 401 }
      );
    }

    switch (action) {
      case "add_member": {
        const newMember = body.newMember || body.member;
        if (!newMember?.itsId || !newMember?.name) {
          return NextResponse.json({ error: "newMember with itsId and name required." }, { status: 400 });
        }
        const added = await addFamilyMember(familyId, newMember);
        const { getStore } = await import("@/lib/storage");
        const updatedFamily = getStore().families.find((f) => f.id === familyId);
        return NextResponse.json({ success: true, member: added, family: updatedFamily });
      }

      case "remove_member": {
        const { memberId } = body;
        if (!memberId) return NextResponse.json({ error: "memberId required." }, { status: 400 });
        const res = await removeFamilyMember(familyId, memberId);
        return NextResponse.json(res);
      }

      case "edit_member": {
        const { memberId, updates } = body;
        if (!memberId || !updates) {
          return NextResponse.json({ error: "memberId and updates required." }, { status: 400 });
        }
        const updated = await editFamilyMember(familyId, memberId, updates);
        return NextResponse.json({ success: true, member: updated });
      }

      case "merge_hof": {
        const { sourceHofItsId } = body;
        if (!sourceHofItsId) {
          return NextResponse.json({ error: "sourceHofItsId required." }, { status: 400 });
        }
        const res = await mergeHofFamily(familyId, sourceHofItsId);
        return NextResponse.json(res);
      }

      case "cancel_member": {
        const { memberItsId, cancelEntireFamily } = body;
        if (!memberItsId) {
          return NextResponse.json({ error: "memberItsId required." }, { status: 400 });
        }
        const { cancelMemberRegistration } = await import("@/lib/storage");
        const res = await cancelMemberRegistration(memberItsId, { cancelEntireFamily: Boolean(cancelEntireFamily) });
        return NextResponse.json(res);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Family API Error]", error);
    return NextResponse.json({ error: error.message || "Operation failed." }, { status: 400 });
  }
}
