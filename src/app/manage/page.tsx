"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Home,
  Loader2,
  Lock,
  Search,
  ChevronLeft,
  Info,
  UserPlus,
  Merge,
  X,
  Crown,
  AlertCircle,
} from "lucide-react";

interface FamilyMember {
  id: string;
  itsId: string;
  name: string;
  gender: "Male" | "Female";
  type: "Adult" | "Child";
  isHof: boolean;
}

interface FamilyInfo {
  id: string;
  hofName: string;
  hofItsId: string;
  mobileNumber: string;
  eventId: string;
  members: FamilyMember[];
}

type ModalMode = "add" | "edit" | "merge" | "cancel_hof" | "cancel_family" | null;

const genderTypeLabel = (m: FamilyMember) =>
  m.type === "Child" ? "Gair Baligh" : `${m.gender} Adult`;

function ManagePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [itsInput, setItsInput] = useState(searchParams.get("its") || "");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [callerItsId, setCallerItsId] = useState(""); // ITS used to lookup

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [cancellingMember, setCancellingMember] = useState<FamilyMember | null>(null);
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Add member form
  const [newIts, setNewIts] = useState("");
  const [newName, setNewName] = useState("");
  const [newGenderType, setNewGenderType] = useState("Male Adult");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editGenderType, setEditGenderType] = useState("Male Adult");

  // Merge
  const [mergeIts, setMergeIts] = useState("");
  const [mergePreview, setMergePreview] = useState<FamilyInfo | null>(null);

  const [actionMsg, setActionMsg] = useState("");
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Auto-lookup if ?its= param present
  useEffect(() => {
    if (itsInput && itsInput.length === 8) {
      handleLookup(itsInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch event status
  useEffect(() => {
    fetch("/api/events/active")
      .then((r) => r.json())
      .then((d) => setEventStatus(d.event?.status || null))
      .catch(() => {});
  }, []);

  const canEdit = eventStatus === "REGISTRATION_OPEN";

  const parseGenderType = (val: string): { gender: "Male" | "Female"; type: "Adult" | "Child" } => {
    if (val === "Female Adult") return { gender: "Female", type: "Adult" };
    if (val === "Gair Baligh") return { gender: "Male", type: "Child" };
    return { gender: "Male", type: "Adult" };
  };

  const handleLookup = async (itsId?: string) => {
    const its = (itsId || itsInput).trim();
    if (!its || its.length !== 8) {
      setLookupError("Please enter a valid 8-digit ITS ID.");
      return;
    }
    setLooking(true);
    setLookupError("");
    setFamily(null);
    try {
      const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(its)}&mode=lookup`);
      const data = await res.json();
      setLooking(false);
      if (!data.found || !data.family || !data.isCurrentEvent) {
        setLookupError("No active registration found for this event (Zikrah Waaz Majlis 1448H). Please register first.");
        return;
      }
      setFamily(data.family);
      setCallerItsId(its);
      setActionMsg("");
    } catch {
      setLooking(false);
      setLookupError("Failed to lookup. Please try again.");
    }
  };

  const callFamilyApi = async (payload: object) => {
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, familyId: family!.id, hofItsId: callerItsId || family!.hofItsId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Operation failed.");
    return data;
  };

  const refreshFamily = async () => {
    const its = callerItsId || family?.hofItsId;
    if (!its) return;
    const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(its)}&mode=lookup`);
    const data = await res.json();
    if (data.found && data.family) {
      setFamily(data.family);
      setCallerItsId(data.family.hofItsId);
    }
  };

  // ── Add member ──
  const openAddModal = () => {
    setNewIts(""); setNewName(""); setNewGenderType("Male Adult");
    setModalError(""); setModalMode("add");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!newIts.trim() || newIts.trim().length !== 8) { setModalError("ITS ID must be 8 digits."); return; }
    if (!newName.trim()) { setModalError("Name is required."); return; }
    setModalLoading(true);
    try {
      const lookRes = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(newIts.trim())}&mode=lookup`);
      const lookData = await lookRes.json();

      if (lookData.found && lookData.isHof && lookData.family?.id !== family?.id) {
        setMergePreview(lookData.family);
        setMergeIts(newIts.trim());
        setModalLoading(false);
        setModalMode("merge");
        return;
      }

      const parsed = parseGenderType(newGenderType);
      await callFamilyApi({
        action: "add_member",
        newMember: { itsId: newIts.trim(), name: newName.trim(), ...parsed },
      });
      const addedName = newName.trim();
      setModalMode(null);
      setIsAddingToList(addedName);
      setActionMsg(`✅ ${addedName} added to your family.`);
      try {
        await refreshFamily();
      } finally {
        setIsAddingToList(null);
      }
    } catch (err: any) {
      setModalError(err.message);
    }
    setModalLoading(false);
  };

  // ── Edit member ──
  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditGenderType(member.type === "Child" ? "Gair Baligh" : `${member.gender} Adult`);
    setModalError(""); setModalMode("edit");
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!editName.trim()) { setModalError("Name is required."); return; }
    setModalLoading(true);
    try {
      const parsed = parseGenderType(editGenderType);
      await callFamilyApi({
        action: "edit_member",
        memberId: editingMember!.id,
        updates: { name: editName.trim(), gender: parsed.gender, type: parsed.type },
      });
      setModalMode(null);
      setActionMsg(`✅ ${editName.trim()}'s details updated.`);
      await refreshFamily();
    } catch (err: any) {
      setModalError(err.message);
    }
    setModalLoading(false);
  };

  // ── Remove / Cancel member ──
  const handleRemoveMember = async (member: FamilyMember) => {
    if (member.isHof) {
      // HOF cancellation: open modal explaining next member becomes HOF
      setCancellingMember(member);
      setModalError("");
      setModalMode("cancel_hof");
      return;
    }

    if (!confirm(`Remove ${member.name} from your family?`)) return;
    setModalError("");
    setDeletingMemberId(member.id);
    try {
      await callFamilyApi({ action: "remove_member", memberId: member.id });
      // OPTIMISTIC UPDATE: remove member immediately so it disappears from UI without refresh
      setFamily((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.id !== member.id) } : null
      );
      setActionMsg(`✅ ${member.name} removed from your family.`);
      await refreshFamily();
    } catch (err: any) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setDeletingMemberId(null);
    }
  };

  // Execute cancel member or entire family
  const handleExecuteCancel = async (memberIts: string, cancelEntireFamily = false) => {
    setModalLoading(true);
    setModalError("");
    try {
      const res = await callFamilyApi({
        action: "cancel_member",
        memberItsId: memberIts,
        cancelEntireFamily,
      });

      setModalMode(null);
      setCancellingMember(null);

      if (res.cancelledType === "ENTIRE_FAMILY" || cancelEntireFamily || (family && family.members.length <= 1)) {
        setFamily(null);
        setCallerItsId("");
        setActionMsg(`✅ Registration cancelled for entire family.`);
      } else {
        setActionMsg(`✅ ${res.message || "Registration updated."}`);
        // OPTIMISTIC UPDATE: remove cancelled HOF immediately and promote next member
        const remainingMembers = (family?.members || []).filter((m) => m.itsId !== memberIts);
        const newHof = remainingMembers[0];
        if (remainingMembers.length > 0 && family) {
          setFamily({
            ...family,
            hofName: res.newHofName || newHof?.name || family.hofName,
            hofItsId: newHof?.itsId || family.hofItsId,
            members: remainingMembers.map((m, idx) => ({ ...m, isHof: idx === 0 })),
          });
        }
        if (newHof) {
          setCallerItsId(newHof.itsId);
          await refreshFamily();
        }
      }
    } catch (err: any) {
      setModalError(err.message);
      setActionMsg(`❌ ${err.message}`);
    }
    setModalLoading(false);
  };

  // ── Merge HOF ──
  const handleMergeHof = async () => {
    if (!mergePreview) return;
    setModalLoading(true);
    setModalError("");
    try {
      await callFamilyApi({ action: "merge_hof", sourceHofItsId: mergeIts });
      setModalMode(null);
      setActionMsg(`✅ Merged ${mergePreview.hofName}'s family into yours.`);
      setMergePreview(null);
      await refreshFamily();
    } catch (err: any) {
      setModalError(err.message);
    }
    setModalLoading(false);
  };

  // Next person who will become HOF if current HOF is cancelled
  const nextInLineHof = family?.members.find((m) => !m.isHof);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gold-600 shadow-xl text-center relative overflow-hidden">
        <div className="navy-header -mx-6 -mt-6 p-5 text-white space-y-2 border-b-2 border-gold-600">
          <span className="inline-block px-3 py-1 bg-gold-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow">
            Anjuman E Najmi Khopoli
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            Manage Registration
          </h1>
          <p className="text-sm text-gold-200 font-semibold">Zikrah Waaz Majlis 1448H</p>
        </div>
        <div className="pt-4 text-xs text-slate-600 font-medium">
          Enter any family member's ITS ID to view and manage your family registration.
        </div>
      </div>

      {/* Lookup Form */}
      {!family && (
        <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
          <div className="flex items-center gap-2 border-b border-cream-200 pb-3">
            <Search className="w-5 h-5 text-gold-600" />
            <h2 className="text-base font-black text-navy-950">Find Your Registration</h2>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold text-navy-900">ITS ID (Any Family Member) *</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Enter 8-digit ITS ID"
              value={itsInput}
              onChange={(e) => setItsInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
              maxLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white tracking-wide text-center text-base"
            />
            {lookupError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}
            <button
              onClick={() => handleLookup()}
              disabled={looking || itsInput.length !== 8}
              className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-950 disabled:opacity-60 text-white font-black text-sm transition shadow flex items-center justify-center gap-2"
            >
              {looking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Looking up...</span></>
              ) : (
                <><Search className="w-4 h-4" /><span>Find My Family Registration</span></>
              )}
            </button>
            <div className="text-center pt-1">
              <Link href="/register" className="text-xs font-bold text-gold-600 hover:underline">
                Not registered yet? Register here →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Family Card */}
      {family && (
        <div className="space-y-4 animate-fade-in">
          {/* Status bar */}
          {!canEdit && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-xs text-amber-900 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Passes have been issued. Family registration is now locked and cannot be edited.</span>
            </div>
          )}

          {actionMsg && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              actionMsg.startsWith("✅") ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
            }`}>
              <span>{actionMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-600" />
                <div>
                  <h2 className="text-base font-black text-navy-950">{family.hofName}'s Family</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Head of Family ITS: {family.hofItsId}</p>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={openAddModal}
                  className="px-3.5 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-2">
              {family.members.map((member) => (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    deletingMemberId === member.id ? "opacity-40 bg-red-50/50 border-red-200" :
                    member.isHof ? "bg-cream-100 border-cream-300" : "bg-white border-cream-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy-950 text-sm">{member.name}</span>
                      {member.isHof && (
                        <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <Crown className="w-3 h-3 text-gold-400" />
                          <span>HOF</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ITS: {member.itsId} · {genderTypeLabel(member)}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        disabled={deletingMemberId === member.id}
                        className="p-1.5 text-navy-900 hover:text-gold-600 transition disabled:opacity-40"
                        title={member.isHof ? "Edit HOF details" : "Edit member details"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingMemberId === member.id}
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 text-navy-900 hover:text-red-600 transition disabled:opacity-40 cursor-pointer"
                        title={member.isHof ? "Cancel HOF registration" : "Remove member"}
                      >
                        {deletingMemberId === member.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isAddingToList && (
                <div className="p-3.5 rounded-xl border-2 border-dashed border-gold-400 bg-gold-50/70 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-gold-600 animate-spin shrink-0" />
                    <div>
                      <p className="font-bold text-navy-950 text-sm">{isAddingToList}</p>
                      <p className="text-xs text-gold-700 font-semibold">Adding member to family...</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gold-700 bg-gold-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Total: {family.members.length} member(s)</span>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    onClick={() => {
                      setCancellingMember(family.members.find((m) => m.isHof) || family.members[0]);
                      setModalMode("cancel_family");
                    }}
                    className="text-red-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel Entire Family</span>
                  </button>
                )}
                <button
                  onClick={() => { setFamily(null); setCallerItsId(""); setActionMsg(""); setItsInput(""); }}
                  className="text-gold-600 hover:underline font-bold"
                >
                  ← Lookup another ITS
                </button>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4 text-gold-400" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CANCEL HOF REGISTRATION (Promote next member or cancel all)
      ─────────────────────────────────────────────────────────────── */}
      {modalMode === "cancel_hof" && cancellingMember && family && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-navy-950">Cancel HOF Registration</h3>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-1">
              <p className="font-bold">
                You are cancelling the registration for Head of Family:
              </p>
              <p className="font-black text-sm">
                {cancellingMember.name} (ITS: {cancellingMember.itsId})
              </p>
            </div>

            {family.members.length > 1 && nextInLineHof && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Crown className="w-4 h-4 text-gold-600" />
                  <span>Next Person Becomes HOF:</span>
                </div>
                <p className="leading-relaxed font-semibold">
                  <strong>{nextInLineHof.name}</strong> (ITS: {nextInLineHof.itsId}) will automatically become the new Head of Family for the remaining {family.members.length - 1} member(s).
                </p>
              </div>
            )}

            {family.members.length <= 1 && (
              <p className="text-xs text-slate-600 font-medium">
                This is the only member in this family. Cancelling will completely delete this family's registration.
              </p>
            )}

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalError}
              </div>
            )}

            <div className="space-y-2 pt-1">
              {family.members.length > 1 && nextInLineHof ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleExecuteCancel(cancellingMember.itsId, false)}
                    disabled={modalLoading}
                    className="w-full py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                  >
                    {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                    <span>Cancel {cancellingMember.name} (Make {nextInLineHof.name} HOF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteCancel(cancellingMember.itsId, true)}
                    disabled={modalLoading}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel Entire Family Registration</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExecuteCancel(cancellingMember.itsId, true)}
                  disabled={modalLoading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Yes, Cancel Registration</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="w-full py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-xs hover:bg-cream-100 transition"
              >
                Keep Registration (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CANCEL ENTIRE FAMILY REGISTRATION
      ─────────────────────────────────────────────────────────────── */}
      {modalMode === "cancel_family" && family && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between text-red-600">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-navy-950">Cancel Entire Registration</h3>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-1">
              <p className="font-bold">Are you sure you want to cancel the entire family registration?</p>
              <p className="leading-relaxed">
                This will remove <strong>{family.hofName}'s family ({family.members.length} members)</strong> from Zikrah Waaz Majlis 1448H.
              </p>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-xs hover:bg-cream-100 transition"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCancel(family.hofItsId, true)}
                disabled={modalLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition disabled:opacity-70 flex items-center justify-center gap-1 shadow-md"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Yes, Cancel All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD MEMBER
      ─────────────────────────────────────────────────────────────── */}
      {modalMode === "add" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold-600" />
                <h3 className="font-black text-navy-950">Add Family Member</h3>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">ITS ID (8 digits) *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="8-digit ITS ID"
                  value={newIts}
                  onChange={(e) => setNewIts(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-sm text-navy-950"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">If this ITS belongs to a registered HOF, you'll be shown a merge option.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-sm text-navy-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Gender / Type *</label>
                <select
                  value={newGenderType}
                  onChange={(e) => setNewGenderType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-sm text-navy-950"
                >
                  <option value="Male Adult">Male Adult</option>
                  <option value="Female Adult">Female Adult</option>
                  <option value="Gair Baligh">Gair Baligh (Child)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition disabled:opacity-70 flex items-center justify-center gap-1"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT MEMBER
      ─────────────────────────────────────────────────────────────── */}
      {modalMode === "edit" && editingMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-gold-600" />
                <h3 className="font-black text-navy-950">Edit Member</h3>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">ITS: {editingMember.itsId}</p>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-sm text-navy-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Gender / Type *</label>
                <select
                  value={editGenderType}
                  onChange={(e) => setEditGenderType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-sm text-navy-950"
                >
                  <option value="Male Adult">Male Adult</option>
                  <option value="Female Adult">Female Adult</option>
                  <option value="Gair Baligh">Gair Baligh (Child)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-sm transition disabled:opacity-70 flex items-center justify-center gap-1"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MERGE HOF
      ─────────────────────────────────────────────────────────────── */}
      {modalMode === "merge" && mergePreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Merge className="w-5 h-5 text-gold-600" />
                <h3 className="font-black text-navy-950">Merge Family</h3>
              </div>
              <button onClick={() => { setModalMode(null); setMergePreview(null); }} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold space-y-1">
              <p className="font-black">ITS {mergeIts} is registered as a separate HOF:</p>
              <p><strong>{mergePreview.hofName}</strong> — {mergePreview.members.length} member(s)</p>
            </div>

            <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs text-navy-950 font-semibold">
              <Info className="w-4 h-4 text-gold-600 inline mr-1" />
              All members of <strong>{mergePreview.hofName}</strong>'s family will be moved into your family. Their original separate registration will be removed.
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setModalMode("add"); setMergePreview(null); }}
                className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeHof}
                disabled={modalLoading}
                className="flex-1 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition disabled:opacity-70 flex items-center justify-center gap-1"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Loading registration...</p>
      </div>
    }>
      <ManagePageContent />
    </Suspense>
  );
}
