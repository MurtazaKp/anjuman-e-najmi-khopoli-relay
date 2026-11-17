"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft,
  MapPin,
  Car,
  Utensils,
  Heart,
  PhoneCall,
  Info,
  Lock,
  Loader2,
  MessageCircle,
  Home,
  Search,
  UserPlus,
  Merge,
  X,
  Sparkles,
  History,
} from "lucide-react";
import DigitalQrCard from "@/components/DigitalQrCard";

interface Member {
  id: string;
  itsId: string;
  name: string;
  gender: "Male" | "Female";
  type: "Adult" | "Child";
  genderType: string;
  isHof?: boolean;
}

const parseGenderType = (val: string): { gender: "Male" | "Female"; type: "Adult" | "Child" } => {
  if (val === "Female Adult") return { gender: "Female", type: "Adult" };
  if (val === "Gair Baligh") return { gender: "Male", type: "Child" };
  return { gender: "Male", type: "Adult" };
};

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Active Event Status State
  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // ITS Verification State
  const [hofItsId, setHofItsId] = useState("");
  const [itsChecking, setItsChecking] = useState(false);
  const [itsChecked, setItsChecked] = useState(false);

  // Registration Mode
  // null = not looked up yet
  // "CURRENT_EVENT" = already registered for Zikra Waaz Majlis
  // "PAST_EVENT" = imported details from past event, ready to register for Zikra Waaz Majlis
  // "FRESH" = new family not in database
  const [regMode, setRegMode] = useState<"CURRENT_EVENT" | "PAST_EVENT" | "FRESH" | "REJOIN_CHOICE" | null>(null);

  // Active Registration Family Data (for CURRENT_EVENT manage)
  const [currentFamily, setCurrentFamily] = useState<any | null>(null);

  // Rejoin Choice State (when a cancelled member's family already registered in current event)
  const [rejoinFamilyTarget, setRejoinFamilyTarget] = useState<any | null>(null);
  const [rejoinMemberData, setRejoinMemberData] = useState<any | null>(null);
  const [rejoinSuccessFamily, setRejoinSuccessFamily] = useState<any | null>(null);

  // Event Logistics State
  const [mauze, setMauze] = useState("Lonavala");
  const [mauzeOther, setMauzeOther] = useState("");
  const [transportMode, setTransportMode] = useState("Car");
  const [transportOther, setTransportOther] = useState("");

  // HOF Form State
  const [hofName, setHofName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [hofGenderType, setHofGenderType] = useState<string>("Male Adult");

  // Niyaz & Contribution State
  const [niyazJaman, setNiyazJaman] = useState("Yes, Jami ne Jaisu");
  const [niyazContribution, setNiyazContribution] = useState("7200");

  // Family Members State (for registering)
  const [members, setMembers] = useState<Member[]>([]);

  // Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberItsId, setMemberItsId] = useState("");
  const [memberGenderType, setMemberGenderType] = useState<string>("Male Adult");
  const [memberModalLoading, setMemberModalLoading] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTargetFamily, setMergeTargetFamily] = useState<any | null>(null);
  const [pendingMergeIts, setPendingMergeIts] = useState("");

  // Cancel HOF / Family modal state
  const [cancelHofModalOpen, setCancelHofModalOpen] = useState(false);
  const [cancelEntireModalOpen, setCancelEntireModalOpen] = useState(false);
  const [cancellingHofMember, setCancellingHofMember] = useState<any | null>(null);

  // Validation & Loading States
  const [errorMsg, setErrorMsg] = useState("");
  const [modalErrorMsg, setModalErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedPassToken, setSubmittedPassToken] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/events/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.event) setEvent(data.event);
        setLoadingEvent(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingEvent(false);
      });
  }, []);

  // ── Step 1: Verify & Lookup ITS ID ──
  const handleVerifyIts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setActionSuccessMsg("");

    const cleanIts = hofItsId.trim();
    if (!cleanIts || cleanIts.length !== 8) {
      setErrorMsg("Please enter a valid 8-digit ITS ID.");
      return;
    }

    setItsChecking(true);
    try {
      const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(cleanIts)}&mode=lookup`);
      const data = await res.json();
      setItsChecking(false);

      if (data.found && data.isCurrentEvent) {
        // CASE 1: ALREADY REGISTERED FOR THIS NEW EVENT (Zikra Waaz Majlis)
        setCurrentFamily(data.family);
        setRegMode("CURRENT_EVENT");
        setItsChecked(true);
        const enteredMember = data.family?.members?.find((m: any) => m.itsId === cleanIts);
        if (enteredMember && !enteredMember.isHof) {
          setActionSuccessMsg(`✅ Welcome, ${enteredMember.name}! Your family (${data.family.hofName}'s Family) is already registered for Zikrah Waaz Majlis 1448H.`);
        }
      } else if (data.found && data.isPastEvent && data.family) {
        // CASE 2: FOUND IN PAST EVENT
        // Check if this person's family is ALREADY registered in current event (e.g. they were cancelled/separated)
        if (data.currentFamilyAlreadyRegistered) {
          setRejoinFamilyTarget(data.currentFamilyAlreadyRegistered);
          setRejoinMemberData(data.member);
          setHofItsId(cleanIts);
          setHofName(data.member?.name || "");
          setItsChecked(true);
          setRegMode("REJOIN_CHOICE");
          return;
        }

        // PRE-FILL EVERYTHING!
        const fam = data.family;
        const alreadyRegSet = new Set(data.alreadyRegisteredItsInCurrentEvent || []);

        setHofName(fam.hofName || "");
        setHofItsId(fam.hofItsId || cleanIts);
        setMobileNumber(fam.mobileNumber || "");

        // Prefill Mauze & Transport
        if (["Lonavala", "Pune"].includes(fam.mauze)) {
          setMauze(fam.mauze);
          setMauzeOther("");
        } else if (fam.mauze) {
          setMauze("Other");
          setMauzeOther(fam.mauze);
        }

        if (["Car", "Bus"].includes(fam.transportMode)) {
          setTransportMode(fam.transportMode);
          setTransportOther("");
        } else if (fam.transportMode) {
          setTransportMode("Other");
          setTransportOther(fam.transportMode);
        }

        // Prefill HOF Gender
        const hofMember = fam.members.find((m: any) => m.itsId === fam.hofItsId);
        if (hofMember) {
          setHofGenderType(hofMember.gender === "Female" ? "Female Adult" : "Male Adult");
        }

        // Prefill other family members - EXCLUDE members who are already registered in current event
        const otherMembers: Member[] = fam.members
          .filter((m: any) => m.itsId !== fam.hofItsId && !alreadyRegSet.has(m.itsId))
          .map((m: any) => ({
            id: `past-${m.id || m.itsId}`,
            itsId: m.itsId,
            name: m.name,
            gender: m.gender,
            type: m.type,
            genderType: m.type === "Child" ? "Gair Baligh" : `${m.gender} Adult`,
            isHof: false,
          }));

        setMembers(otherMembers);
        setRegMode("PAST_EVENT");
        setItsChecked(true);
        setStep(2); // Jump directly to Family Members review!
        const enteredMember = fam.members.find((m: any) => m.itsId === cleanIts);
        if (enteredMember && !enteredMember.isHof) {
          setActionSuccessMsg(`🎉 Welcome, ${enteredMember.name}! We found your family (${fam.hofName}'s Family) from the previous event. All family members are loaded below. Please review and confirm your registration.`);
        } else {
          setActionSuccessMsg(`🎉 Welcome back, ${fam.hofName}! We found your family details from the previous event. Please review and confirm your registration.`);
        }
      } else {
        // CASE 3: FRESH REGISTRATION
        setRegMode("FRESH");
        setCurrentFamily(null);
        setRejoinFamilyTarget(null);
        setRejoinMemberData(null);
        setMembers([]);
        setItsChecked(true);
        setStep(1);
      }
    } catch {
      setItsChecking(false);
      setErrorMsg("Failed to check ITS ID. Please check your network.");
    }
  };

  const handleResetIts = () => {
    setItsChecked(false);
    setRegMode(null);
    setCurrentFamily(null);
    setRejoinFamilyTarget(null);
    setRejoinMemberData(null);
    setRejoinSuccessFamily(null);
    setSuccess(false);
    setHofItsId("");
    setHofName("");
    setMobileNumber("");
    setMembers([]);
    setStep(1);
    setErrorMsg("");
    setActionSuccessMsg("");
  };

  const handleRejoinFamily = async () => {
    if (!rejoinFamilyTarget) return;
    setSubmitting(true);
    setErrorMsg("");
    setActionSuccessMsg("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_member",
          familyId: rejoinFamilyTarget.id,
          hofItsId: rejoinFamilyTarget.hofItsId,
          newMember: {
            itsId: hofItsId.trim(),
            name: rejoinMemberData?.name || hofName || `Member ${hofItsId.trim()}`,
            gender: rejoinMemberData?.gender || "Male",
            type: rejoinMemberData?.type || "Adult",
          },
          member: {
            itsId: hofItsId.trim(),
            name: rejoinMemberData?.name || hofName || `Member ${hofItsId.trim()}`,
            gender: rejoinMemberData?.gender || "Male",
            type: rejoinMemberData?.type || "Adult",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rejoin family");

      const finalFamily = data.family || rejoinFamilyTarget;
      if (finalFamily?.passLinkToken) {
        setSubmittedPassToken(finalFamily.passLinkToken);
      }

      setRejoinSuccessFamily(finalFamily);
      setCurrentFamily(finalFamily);
      setSubmitting(false);
      setSuccess(true);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || "Failed to rejoin family.");
    }
  };

  const handleStartSeparateRegistration = () => {
    setRegMode("FRESH");
    setHofName(rejoinMemberData?.name || "");
    setHofItsId(hofItsId.trim());
    if (rejoinMemberData?.gender) {
      setHofGenderType(rejoinMemberData.type === "Child" ? "Gair Baligh" : `${rejoinMemberData.gender} Adult`);
    }
    setMembers([]);
    setStep(1);
    setRejoinFamilyTarget(null);
    setRejoinMemberData(null);
    setActionSuccessMsg("Please complete registration as a new separate family.");
  };

  // ── Existing Current Family Actions (Manage pre-pass issue) ──
  const refreshCurrentFamily = async (famHofIts?: string) => {
    const queryIts = famHofIts || currentFamily?.hofItsId || hofItsId.trim();
    if (!queryIts) return;
    try {
      const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(queryIts)}&mode=lookup`);
      const data = await res.json();
      if (data.found && data.isCurrentEvent && data.family) {
        setCurrentFamily(data.family);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCurrentRemoveMember = async (member: any) => {
    if (member.isHof) {
      setCancellingHofMember(member);
      setErrorMsg("");
      setCancelHofModalOpen(true);
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.name} from your family?`)) return;
    setErrorMsg("");
    setDeletingMemberId(member.id);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_member",
          familyId: currentFamily.id,
          hofItsId: currentFamily.hofItsId,
          memberId: member.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      // OPTIMISTIC UPDATE: remove member immediately from state so it disappears instantly
      setCurrentFamily((prev: any) =>
        prev ? { ...prev, members: prev.members.filter((m: any) => m.id !== member.id) } : null
      );
      setActionSuccessMsg(`✅ Removed ${member.name} from registration.`);
      await refreshCurrentFamily(currentFamily.hofItsId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleExecuteCancelCurrentFamily = async (memberIts: string, cancelEntireFamily = false) => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_member",
          familyId: currentFamily.id,
          hofItsId: currentFamily.hofItsId,
          memberItsId: memberIts,
          cancelEntireFamily,
        }),
      });
      const data = await res.json();
      setSubmitting(false);
      setCancelHofModalOpen(false);
      setCancelEntireModalOpen(false);

      if (data.cancelledType === "ENTIRE_FAMILY" || cancelEntireFamily || (currentFamily && currentFamily.members.length <= 1)) {
        setCurrentFamily(null);
        setRegMode(null);
        setItsChecked(false);
        setHofItsId("");
        setActionSuccessMsg(`✅ Registration cancelled for entire family.`);
      } else {
        setActionSuccessMsg(`✅ ${data.message || "Registration updated."}`);
        // OPTIMISTIC UPDATE: remove cancelled HOF immediately & promote next member in local state
        const remainingMembers = (currentFamily?.members || []).filter((m: any) => m.itsId !== memberIts);
        const newHof = remainingMembers[0];
        if (remainingMembers.length > 0 && currentFamily) {
          setCurrentFamily({
            ...currentFamily,
            hofName: data.newHofName || newHof?.name || currentFamily.hofName,
            hofItsId: newHof?.itsId || currentFamily.hofItsId,
            members: remainingMembers.map((m: any, idx: number) => ({
              ...m,
              isHof: idx === 0,
            })),
          });
        }
        if (newHof) {
          setHofItsId(newHof.itsId);
          await refreshCurrentFamily(newHof.itsId);
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message);
    }
  };

  // ── Step 1 Continue for Fresh Registration ──
  const handleFreshHofContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!hofName.trim() || !mobileNumber.trim()) {
      setErrorMsg("Please fill in all HOF required fields.");
      return;
    }

    if (mobileNumber.trim().length !== 10) {
      setErrorMsg("Mobile Number must be exactly 10 digits.");
      return;
    }

    if (mauze === "Other" && !mauzeOther.trim()) {
      setErrorMsg("Please specify your Mauze name.");
      return;
    }

    if (transportMode === "Other" && !transportOther.trim()) {
      setErrorMsg("Please specify your mode of transportation.");
      return;
    }

    setStep(2);
  };

  // ── Member Modal Openers ──
  const openAddMemberModal = () => {
    setEditingMemberId(null);
    setMemberName("");
    setMemberItsId("");
    setMemberGenderType("Male Adult");
    setModalErrorMsg("");
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberItsId(member.itsId);
    const gType = member.genderType || (member.type === "Child" ? "Gair Baligh" : `${member.gender} Adult`);
    setMemberGenderType(gType);
    setModalErrorMsg("");
    setShowMemberModal(true);
  };

  // ── Save Member ──
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMsg("");

    if (!memberName.trim() || !memberItsId.trim()) {
      setModalErrorMsg("Please enter both Name and ITS ID.");
      return;
    }

    const cleanIts = memberItsId.trim();
    if (cleanIts.length !== 8) {
      setModalErrorMsg("ITS ID must be exactly 8 digits.");
      return;
    }

    const currentHofIts = currentFamily ? currentFamily.hofItsId : hofItsId.trim();
    if (cleanIts === currentHofIts) {
      setModalErrorMsg("This ITS ID matches the Head of Family's ITS ID.");
      return;
    }

    // Check duplicate in current view
    const currentList = currentFamily ? currentFamily.members : members;
    const isLocalDuplicate = currentList.some(
      (m: any) => m.itsId === cleanIts && m.id !== editingMemberId
    );
    if (isLocalDuplicate) {
      setModalErrorMsg(`ITS ID ${cleanIts} is already in your family list.`);
      return;
    }

    setMemberModalLoading(true);
    setItsChecking(true);
    try {
      // Check if this ITS is registered as a separate HOF in DB
      const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(cleanIts)}&mode=lookup`);
      const data = await res.json();
      setItsChecking(false);

      if (data.found && data.isHof && !editingMemberId) {
        // Open merge modal!
        setMergeTargetFamily(data.family);
        setPendingMergeIts(cleanIts);
        setShowMemberModal(false);
        setMergeModalOpen(true);
        setMemberModalLoading(false);
        return;
      } else if (data.found && data.isCurrentEvent && !editingMemberId) {
        setModalErrorMsg(`This ITS ID (${cleanIts}) is already registered under ${data.family?.hofName || "another family"}.`);
        setMemberModalLoading(false);
        return;
      }
    } catch {
      setItsChecking(false);
    }

    const parsed = parseGenderType(memberGenderType);

    // If updating an ALREADY registered family in DB:
    if (regMode === "CURRENT_EVENT" && currentFamily) {
      try {
        if (editingMemberId) {
          const res = await fetch("/api/family", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "edit_member",
              familyId: currentFamily.id,
              hofItsId: currentFamily.hofItsId,
              memberId: editingMemberId,
              updates: { name: memberName.trim(), gender: parsed.gender, type: parsed.type },
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update member");
          setActionSuccessMsg(`✅ Updated ${memberName.trim()}'s details.`);
          setShowMemberModal(false);
          await refreshCurrentFamily();
        } else {
          const addedName = memberName.trim();
          const res = await fetch("/api/family", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add_member",
              familyId: currentFamily.id,
              hofItsId: currentFamily.hofItsId,
              newMember: { itsId: cleanIts, name: addedName, gender: parsed.gender, type: parsed.type },
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to add member");
          setActionSuccessMsg(`✅ Added ${addedName} to your family.`);
          setShowMemberModal(false);
          setIsAddingToList(addedName);
          try {
            await refreshCurrentFamily();
          } finally {
            setIsAddingToList(null);
          }
        }
        setMemberModalLoading(false);
        return;
      } catch (err: any) {
        setMemberModalLoading(false);
        setModalErrorMsg(err.message);
        return;
      }
    }

    // Local state (for PAST_EVENT import or FRESH registration)
    if (editingMemberId) {
      setMembers(
        members.map((m) =>
          m.id === editingMemberId
            ? { ...m, name: memberName.trim(), itsId: cleanIts, gender: parsed.gender, type: parsed.type, genderType: memberGenderType }
            : m
        )
      );
      setShowMemberModal(false);
      setMemberModalLoading(false);
    } else {
      const addedName = memberName.trim();
      setShowMemberModal(false);
      setIsAddingToList(addedName);
      setTimeout(() => {
        setMembers((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            name: addedName,
            itsId: cleanIts,
            gender: parsed.gender,
            type: parsed.type,
            genderType: memberGenderType,
          },
        ]);
        setIsAddingToList(null);
        setMemberModalLoading(false);
      }, 400);
    }
  };

  // ── Handle Merge Confirmation ──
  const handleConfirmMerge = async () => {
    if (!mergeTargetFamily) return;

    if (regMode === "CURRENT_EVENT" && currentFamily) {
      // Live DB merge
      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "merge_hof",
            familyId: currentFamily.id,
            hofItsId: currentFamily.hofItsId,
            sourceHofItsId: pendingMergeIts,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Merge failed");
        setMergeModalOpen(false);
        setMergeTargetFamily(null);
        setActionSuccessMsg(`✅ Successfully merged ${data.mergedMembersCount || ""} member(s) into your family.`);
        await refreshCurrentFamily();
      } catch (err: any) {
        setModalErrorMsg(err.message);
      }
    } else {
      // Local merge: import members from that HOF family into the pending registration
      const newMems: Member[] = mergeTargetFamily.members.map((m: any) => ({
        id: `merged-${m.id || m.itsId}`,
        itsId: m.itsId,
        name: m.name,
        gender: m.gender,
        type: m.type,
        genderType: m.type === "Child" ? "Gair Baligh" : `${m.gender} Adult`,
      }));
      setMembers([...members, ...newMems]);
      setMergeModalOpen(false);
      setMergeTargetFamily(null);
      setActionSuccessMsg(`✅ Added ${mergeTargetFamily.hofName} and family members to your list.`);
    }
  };

  const handleRemoveLocalMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  // ── Final Registration Submission ──
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");

    const finalMauze = mauze === "Other" ? mauzeOther.trim() : mauze;
    const finalTransport = transportMode === "Other" ? transportOther.trim() : transportMode;
    const parsedHof = parseGenderType(hofGenderType);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hofName,
          hofItsId,
          mobileNumber,
          hofGender: parsedHof.gender,
          hofType: parsedHof.type,
          mauze: finalMauze,
          transportMode: finalTransport,
          niyazJaman,
          niyazContribution,
          familyMembers: members.map((m) => {
            const parsed = parseGenderType(m.genderType || (m.type === "Child" ? "Gair Baligh" : `${m.gender} Adult`));
            return {
              itsId: m.itsId,
              name: m.name,
              gender: parsed.gender,
              type: parsed.type,
            };
          }),
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed. Please check your details.");
        return;
      }

      if (data.passLinkToken) {
        setSubmittedPassToken(data.passLinkToken);
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || "Network error. Please try again.");
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 premium-card text-center max-w-lg mx-auto space-y-6 my-8 animate-fade-in shadow-xl">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-2 border-emerald-500 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-navy-950">Registration Successful! 🎉</h2>
          <p className="text-sm text-slate-700 font-medium leading-relaxed max-w-md mx-auto">
            {rejoinSuccessFamily ? (
              <>
                Mubarak! You have been successfully added back to <strong>{rejoinSuccessFamily.hofName}&apos;s family</strong> for <strong>Zikrah Waaz Majlis 1448H</strong>.
              </>
            ) : (
              <>
                Mubarak! Your family registration for <strong>Zikrah Waaz Majlis 1448H</strong> has been successfully recorded.
              </>
            )}
          </p>
        </div>

        {/* Registered Family Members Card */}
        {rejoinSuccessFamily && (
          <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-left space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
              <span className="text-xs font-black text-navy-900 uppercase tracking-wider">Registered Family Members</span>
              <span className="text-xs font-black text-gold-800 bg-gold-200/80 px-2.5 py-0.5 rounded-full">
                {rejoinSuccessFamily.members?.length || 0} Members
              </span>
            </div>
            <div className="space-y-1.5">
              {rejoinSuccessFamily.members?.map((m: any) => (
                <div key={m.id} className="p-2.5 rounded-xl bg-white border border-cream-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-navy-950">
                      <span>{m.name}</span>
                      {m.isHof && (
                        <span className="px-1.5 py-0.5 rounded bg-navy-900 text-white text-[9px] font-black uppercase">
                          HOF
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ITS: {m.itsId} · {m.type === "Child" ? "Gair Baligh" : `${m.gender} Adult`}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Group Join Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200 text-left space-y-3 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Join Official Relay Updates WhatsApp Group</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Please join our official WhatsApp group to receive instant venue announcements, parking guidance, and pass alerts directly from Jamaat Khidmatguzars.
          </p>
          <a
            href="https://chat.whatsapp.com/Ip8Eic5EwiW896g96RnqaC"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
            <span>Join WhatsApp Group Now</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          {rejoinSuccessFamily && (
            <Link
              href="/manage"
              className="flex-1 py-3.5 px-4 rounded-xl bg-white border-2 border-navy-950 text-navy-950 hover:bg-cream-100 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Users className="w-4 h-4 text-navy-900" />
              <span>Manage Family</span>
            </Link>
          )}
          <Link
            href={submittedPassToken ? `/?registered=true&token=${submittedPassToken}` : "/"}
            className="flex-1 py-3.5 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 active:scale-[0.99] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4 text-gold-400" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // Loading Event Guard
  if (loadingEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Loading Zikrah Waaz Majlis 1448H registration...</p>
      </div>
    );
  }

  // Registration Closed Guard
  if (event?.status && event.status !== "REGISTRATION_OPEN") {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-navy-950 premium-card text-center max-w-md mx-auto space-y-5 my-6 sm:my-8 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-navy-950 text-gold-400 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-gold-600">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest text-gold-600 uppercase">
            Anjuman E Najmi Khopoli
          </span>
          <h2 className="text-2xl font-black text-navy-950">Registration Closed</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Registrations for <strong>{event?.name || "Zikrah Waaz Majlis 1448H"}</strong> have officially closed. Digital passes will be issued shortly.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 border border-gold-500/40"
          >
            <span>Return to Homepage</span>
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Event Header Banner */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gold-600 shadow-xl space-y-4 text-center relative overflow-hidden">
        <div className="navy-header -mx-6 -mt-6 p-5 text-white space-y-2 border-b-2 border-gold-600">
          <span className="inline-block px-3 py-1 bg-gold-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow">
            Anjuman E Najmi Khopoli
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            Zikrah Waaz Majlis 1448H
          </h1>
          <p className="text-xs text-amber-200 font-bold">16 Rajab al-Asab · Maharaja Lawns, Khopoli</p>
        </div>

        <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-navy-950 text-xs sm:text-sm text-left space-y-2 leading-relaxed">
          <p className="font-semibold">
            AqaMaula TUS ye karam ane ehsaan farmaawi ne waaz mubarak Khopoli ma live relay karwani raza mubarak fazal farmaawi chhe.
          </p>
          <p className="font-semibold text-gold-700">
            Aap sagla ne 16mi tareekh waaz mubarak ni talaqqi karwa waaste ane te baad salawaat na niyaz nu Aqa Maula TUS taraf si izan araz karye chhe.
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Enter any family member's ITS ID. If your family registered for the previous event, all your family members will be pre-filled automatically!</span>
          </div>
        </div>
      </div>

      {/* Progress Steps Header (shown when registering) */}
      {itsChecked && regMode !== "CURRENT_EVENT" && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-cream-300 premium-card text-xs font-bold">
          <div className={`flex items-center gap-1.5 ${step === 1 ? "text-navy-950 font-black" : "text-slate-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-navy-900 text-white" : "bg-cream-200 text-navy-900"}`}>1</div>
            <span>HOF Details</span>
          </div>
          <div className="w-8 h-[2px] bg-cream-300"></div>
          <div className={`flex items-center gap-1.5 ${step === 2 ? "text-navy-950 font-black" : "text-slate-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? "bg-navy-900 text-white" : "bg-cream-200 text-navy-900"}`}>2</div>
            <span>Family Members</span>
          </div>
          <div className="w-8 h-[2px] bg-cream-300"></div>
          <div className={`flex items-center gap-1.5 ${step === 3 ? "text-navy-950 font-black" : "text-slate-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? "bg-navy-900 text-white" : "bg-cream-200 text-navy-900"}`}>3</div>
            <span>Review & Niyaz</span>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900 font-bold animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-950 font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE A: INITIAL HOF ITS ID INPUT
      ─────────────────────────────────────────────────────────────── */}
      {!itsChecked && (
        <form onSubmit={handleVerifyIts} className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4 shadow-md">
          <div className="border-b border-cream-200 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-600" />
            <h2 className="text-base font-black text-navy-950">Enter Your ITS ID</h2>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-navy-900">ITS ID (Any Family Member or HOF) *</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Enter 8-digit ITS ID"
              value={hofItsId}
              onChange={(e) => setHofItsId(e.target.value.replace(/\D/g, "").slice(0, 8))}
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-lg text-navy-950 bg-white tracking-widest text-center"
              required
              autoFocus
            />
            <p className="text-xs text-slate-500 font-medium">
              Any member of your family can enter their ITS ID. If your family was registered for the previous event, your entire family will be loaded automatically!
            </p>
          </div>

          <button
            type="submit"
            disabled={itsChecking || hofItsId.length !== 8}
            className="w-full py-3.5 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-60 text-white font-black text-base transition shadow-md flex items-center justify-center gap-2 border border-gold-400/40"
          >
            {itsChecking ? (
              <>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span>Checking Database...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE B: ALREADY REGISTERED FOR ZIKRA WAAZ MAJLIS (Manage)
      ─────────────────────────────────────────────────────────────── */}
      {itsChecked && regMode === "CURRENT_EVENT" && currentFamily && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-black text-navy-950 text-sm sm:text-base">Registered for Zikrah Waaz Majlis 1448H</h3>
                <p className="text-xs text-emerald-800 font-semibold">
                  HOF: {currentFamily.hofName} · ITS: {currentFamily.hofItsId} · {currentFamily.members.length} Member(s)
                </p>
              </div>
            </div>
            <button
              onClick={handleResetIts}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shrink-0"
            >
              Change ITS
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-600" />
                <h2 className="text-base font-black text-navy-950">Registered Family Members</h2>
              </div>
              <button
                type="button"
                onClick={openAddMemberModal}
                className="px-3.5 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentFamily.members.map((member: any) => (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    deletingMemberId === member.id ? "opacity-40 bg-red-50/50 border-red-200" :
                    member.isHof ? "bg-cream-100 border-cream-300" : "bg-white border-cream-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 text-sm">{member.name}</span>
                      {member.isHof && (
                        <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white text-[10px] font-extrabold uppercase">
                          HOF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ITS: {member.itsId} · {member.type === "Child" ? "Gair Baligh" : `${member.gender} Adult`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={deletingMemberId === member.id}
                      onClick={() => openEditMemberModal(member)}
                      className="p-1.5 text-navy-900 hover:text-gold-600 transition disabled:opacity-40"
                      title={member.isHof ? "Edit HOF details" : "Edit member"}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingMemberId === member.id}
                      onClick={() => handleCurrentRemoveMember(member)}
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

            <div className="pt-2 text-xs text-slate-500 font-medium border-t border-cream-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingHofMember(currentFamily.members.find((m: any) => m.isHof) || currentFamily.members[0]);
                  setCancelEntireModalOpen(true);
                }}
                className="text-red-600 hover:underline font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Entire Family Registration</span>
              </button>
              <span className="font-bold text-navy-950">{currentFamily.members.length} Member(s)</span>
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
          PHASE B.2: REJOIN / SEPARATE FAMILY DECISION
          (Triggered when a member was removed or when past family is already in current event)
      ─────────────────────────────────────────────────────────────── */}
      {itsChecked && regMode === "REJOIN_CHOICE" && rejoinFamilyTarget && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gold-400 premium-card space-y-4 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-gold-700" />
            </div>
            <div>
              <h3 className="font-black text-navy-950 text-base">Existing Family Registration Found</h3>
              <p className="text-xs text-slate-600">
                Your family ({rejoinFamilyTarget.hofName}&apos;s Family) is already registered for Zikrah Waaz Majlis 1448H.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">
              {rejoinMemberData?.name ? `${rejoinMemberData.name} (ITS: ${hofItsId})` : `ITS: ${hofItsId}`}
            </p>
            <p>
              Your family is already registered under HOF <strong>{rejoinFamilyTarget.hofName}</strong> (ITS: {rejoinFamilyTarget.hofItsId}). How would you like to proceed?
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleRejoinFamily}
              className="w-full py-3.5 px-4 rounded-xl bg-gold-600 hover:bg-gold-700 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-75 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <span>Adding back to {rejoinFamilyTarget.hofName}&apos;s Family...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add me back to {rejoinFamilyTarget.hofName}&apos;s Family</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleStartSeparateRegistration}
              className="w-full py-3 px-4 rounded-xl bg-white border-2 border-navy-950 text-navy-950 hover:bg-cream-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register as a New Separate Family</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleResetIts}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition disabled:opacity-50 cursor-pointer"
            >
              Cancel &amp; Check Another ITS
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE C: REGISTER FOR ZIKRA WAAZ MAJLIS (Past Event Pre-filled OR Fresh)
      ─────────────────────────────────────────────────────────────── */}
      {itsChecked && regMode !== "CURRENT_EVENT" && regMode !== "REJOIN_CHOICE" && (
        <>
          {/* STEP 1: HOF & Logistics Details */}
          {step === 1 && (
            <form onSubmit={handleFreshHofContinue} className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4 animate-fade-in">
              <div className="border-b border-cream-200 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-600" />
                  <h2 className="text-base font-black text-navy-950">HOF & Location Details</h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetIts}
                  className="text-xs text-gold-600 font-bold hover:underline"
                >
                  Change ITS
                </button>
              </div>

              {regMode === "PAST_EVENT" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-xs font-bold text-amber-950">
                  <History className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Pre-filled from your previous relay registration. You can edit any details.</span>
                </div>
              )}

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">1. HOF ITS ID (8 Digits) *</label>
                  <input
                    type="text"
                    value={hofItsId}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-slate-100 font-bold text-navy-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">2. HOF Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Murtaza Khopoliwala"
                    value={hofName}
                    onChange={(e) => setHofName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">3. Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    pattern="\d{10}"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">4. Gender *</label>
                  <select
                    value={hofGenderType}
                    onChange={(e) => setHofGenderType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
                  >
                    <option value="Male Adult">Male Adult</option>
                    <option value="Female Adult">Female Adult</option>
                  </select>
                </div>

                <div className="border-t border-cream-200 pt-3 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-900 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gold-600" />
                      <span>5. Your Mauze *</span>
                    </label>
                    <select
                      value={mauze}
                      onChange={(e) => setMauze(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
                    >
                      <option value="Lonavala">Lonavala</option>
                      <option value="Pune">Pune</option>
                      <option value="Other">Other (Please specify)</option>
                    </select>
                    {mauze === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify your Mauze name..."
                        value={mauzeOther}
                        onChange={(e) => setMauzeOther(e.target.value)}
                        className="w-full mt-2 px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 font-semibold text-navy-950 bg-white"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-900 mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-gold-600" />
                      <span>6. Mode of Transportation *</span>
                    </label>
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
                    >
                      <option value="Car">Car</option>
                      <option value="Bus">Bus</option>
                      <option value="Other">Other (Specify)</option>
                    </select>
                    {transportMode === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify transportation mode..."
                        value={transportOther}
                        onChange={(e) => setTransportOther(e.target.value)}
                        className="w-full mt-2 px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 font-semibold text-navy-950 bg-white"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-base transition shadow-md flex items-center justify-center gap-2 border border-gold-400/40"
              >
                <span>Continue to Family Members ({members.length + 1} Total)</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </form>
          )}

          {/* STEP 2: Family Members (Pre-filled from past event or added fresh) */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
                <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold-600" />
                    <h2 className="text-base font-black text-navy-950">Family Members</h2>
                  </div>
                  <button
                    type="button"
                    onClick={openAddMemberModal}
                    className="px-3.5 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition border border-gold-400/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                </div>

                {regMode === "PAST_EVENT" && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Your family members from the previous event are pre-loaded below. You can edit, add, or remove anyone.</span>
                  </div>
                )}

                <div className="space-y-2">
                  {/* HOF Member */}
                  <div className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 text-sm">{hofName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white text-[10px] font-extrabold uppercase">
                          HOF
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        ITS: {hofItsId} · {hofGenderType}
                      </p>
                    </div>
                  </div>

                  {/* Additional Members */}
                  {members.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-cream-300 rounded-xl text-slate-500 text-xs font-semibold">
                      No additional family members added. Click <strong>"+ Add Member"</strong> above to add spouse, children, or parents.
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-xl bg-white border border-cream-300 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-navy-950 text-sm">{member.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-cream-200 text-navy-900 text-[10px] font-bold">
                              Member
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            ITS: {member.itsId} · {member.genderType || (member.type === "Child" ? "Gair Baligh" : `${member.gender} Adult`)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditMemberModal(member)}
                            className="p-1.5 text-navy-900 hover:text-gold-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocalMember(member.id)}
                            className="p-1.5 text-navy-900 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {isAddingToList && (
                    <div className="p-3.5 rounded-xl border-2 border-dashed border-gold-400 bg-gold-50/70 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-gold-600 animate-spin shrink-0" />
                        <div>
                          <p className="font-bold text-navy-950 text-sm">{isAddingToList}</p>
                          <p className="text-xs text-gold-700 font-semibold">Adding to family list...</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gold-700 bg-gold-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Adding...</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-cream-300 bg-white text-navy-900 font-bold text-sm hover:bg-cream-100 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Edit HOF Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 border border-gold-400/40"
                >
                  <span>Continue to Niyaz & Confirm ({members.length + 1} Members)</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Niyaz & Review */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-5">
                <div className="border-b border-cream-200 pb-3">
                  <h2 className="text-lg font-bold text-navy-950">Niyaz Confirmation & Review</h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    Total Family Members Attending: <strong>{members.length + 1}</strong>
                  </p>
                </div>

                {/* Niyaz Jaman Question */}
                <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 space-y-3">
                  <label className="block text-xs sm:text-sm font-black text-navy-950 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-gold-600" />
                    <span>AAPNE AAPNI FAMILY SATHE NIYAAZ NA JAMAN NU IZAN CHE *</span>
                  </label>
                  <p className="text-xs text-slate-700 font-bold uppercase">
                    NIYAZ NU JAMAN JAMI NE JASO ?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setNiyazJaman("Yes, Jami ne Jaisu")}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                        niyazJaman === "Yes, Jami ne Jaisu"
                          ? "bg-navy-900 text-white border-navy-900 shadow-md"
                          : "bg-white text-navy-950 border-cream-300 hover:border-gold-500"
                      }`}
                    >
                      <span>Yes, Jami ne Jaisu</span>
                      {niyazJaman === "Yes, Jami ne Jaisu" && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNiyazJaman("No, Not Possible")}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                        niyazJaman === "No, Not Possible"
                          ? "bg-navy-900 text-white border-navy-900 shadow-md"
                          : "bg-white text-navy-950 border-cream-300 hover:border-gold-500"
                      }`}
                    >
                      <span>No, Not Possible</span>
                      {niyazJaman === "No, Not Possible" && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
                    </button>
                  </div>
                </div>

                {/* Niyaz Contribution */}
                <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 space-y-3">
                  <label className="block text-xs sm:text-sm font-black text-navy-950 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-gold-600 shrink-0" />
                      <span>Niyaz na Jaman ma aap Shamil thawani Niyat kariye che ? *</span>
                    </span>
                    <span className="text-[11px] font-extrabold text-gold-800 bg-gold-200/90 px-2.5 py-0.5 rounded-full border border-gold-400 shadow-sm">
                      Select one option
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    ( Imkaan hoi to Niche aapeli unit si shamil thaiye ane ehni raqam waaz na din Bhaisaheb or Jamaat member na Nazdeek Adaa kariye )
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {["7200", "14000", "21000", "53000", "121000", "Je Imkaan Thase"].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setNiyazContribution(unit)}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-center ${
                          niyazContribution === unit
                            ? "bg-gold-600 text-white border-gold-500 shadow-md"
                            : "bg-white text-navy-950 border-cream-300 hover:border-gold-500"
                        }`}
                      >
                        <span>
                          {unit === "Je Imkaan Thase"
                            ? unit
                            : `₹${Number(unit).toLocaleString("en-IN")}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niyaz e Hussain Payment QR Code Card */}
                <div className="pt-2">
                  <DigitalQrCard size="normal" />
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-xl bg-cream-50 border border-cream-300 space-y-2 text-xs">
                  <span className="font-black text-navy-950 block border-b border-cream-200 pb-1">
                    Registration Summary
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Head of Family:</span>
                    <span className="font-bold text-navy-950">{hofName} ({hofItsId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Members:</span>
                    <span className="font-bold text-navy-950">{members.length + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mauze & Transport:</span>
                    <span className="font-bold text-navy-950">{mauze === "Other" ? mauzeOther : mauze} · {transportMode}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl border border-cream-300 bg-white text-navy-900 font-bold text-sm hover:bg-cream-100 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-70 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 border border-gold-400/40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Confirm & Register for Zikrah Waaz Majlis 1448H</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD / EDIT FAMILY MEMBER
      ─────────────────────────────────────────────────────────────── */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold-600" />
                <h3 className="font-black text-navy-950">
                  {editingMemberId ? "Edit Family Member" : "Add Family Member"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="p-1 hover:text-red-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold">
                {modalErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">ITS ID (8 Digits) *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="8-digit ITS ID"
                  value={memberItsId}
                  onChange={(e) => setMemberItsId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  maxLength={8}
                  disabled={Boolean(editingMemberId)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-sm text-navy-950 disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Member full name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-sm text-navy-950"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Gender / Type *</label>
                <select
                  value={memberGenderType}
                  onChange={(e) => setMemberGenderType(e.target.value)}
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
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberModalLoading || itsChecking}
                  className="flex-1 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition disabled:opacity-70 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {(memberModalLoading || itsChecking) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingMemberId ? "Updating..." : "Adding..."}</span>
                    </>
                  ) : (
                    <span>{editingMemberId ? "Update Member" : "Add Member"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: MERGE SEPARATE HOF INTO THIS FAMILY
      ─────────────────────────────────────────────────────────────── */}
      {mergeModalOpen && mergeTargetFamily && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Merge className="w-5 h-5 text-gold-600" />
                <h3 className="font-black text-navy-950">Add Family Member</h3>
              </div>
              <button
                type="button"
                onClick={() => { setMergeModalOpen(false); setMergeTargetFamily(null); }}
                className="p-1 hover:text-red-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
              <p className="font-extrabold text-sm text-amber-950">
                Registered as Head of Family
              </p>
              <p className="leading-relaxed">
                ITS <strong>{pendingMergeIts}</strong> is registered as a separate Head of Family (<strong>{mergeTargetFamily.hofName}</strong> with {mergeTargetFamily.members?.length || 1} member(s)).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs text-navy-950 font-semibold space-y-1">
              <p className="font-bold">Do you want to add them into your family?</p>
              <p className="text-slate-600 text-[11px]">
                Their separate HOF registration will be removed and their members will be joined under your family.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setMergeModalOpen(false); setMergeTargetFamily(null); }}
                className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="flex-1 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition flex items-center justify-center gap-1 shadow-md"
              >
                <Merge className="w-4 h-4" />
                <span>Yes, Add to My Family</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: CANCEL HOF REGISTRATION
      ─────────────────────────────────────────────────────────────── */}
      {cancelHofModalOpen && cancellingHofMember && currentFamily && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-navy-950">Cancel HOF Registration</h3>
              </div>
              <button onClick={() => setCancelHofModalOpen(false)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-1">
              <p className="font-bold">You are cancelling the registration for Head of Family:</p>
              <p className="font-black text-sm">{cancellingHofMember.name} (ITS: {cancellingHofMember.itsId})</p>
            </div>

            {currentFamily.members.length > 1 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                <p className="font-black text-amber-900">Next Person Becomes HOF:</p>
                <p className="leading-relaxed font-semibold">
                  <strong>{currentFamily.members.find((m: any) => m.id !== cancellingHofMember.id)?.name}</strong> will automatically become the new Head of Family for the remaining {currentFamily.members.length - 1} member(s).
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {currentFamily.members.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleExecuteCancelCurrentFamily(cancellingHofMember.itsId, false)}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Cancel {cancellingHofMember.name} (Promote Next Member)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteCancelCurrentFamily(cancellingHofMember.itsId, true)}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel Entire Family Registration</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExecuteCancelCurrentFamily(cancellingHofMember.itsId, true)}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Yes, Cancel Registration</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCancelHofModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-xs hover:bg-cream-100 transition"
              >
                Keep Registration (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: CANCEL ENTIRE FAMILY REGISTRATION
      ─────────────────────────────────────────────────────────────── */}
      {cancelEntireModalOpen && currentFamily && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between text-red-600">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-navy-950">Cancel Entire Registration</h3>
              </div>
              <button onClick={() => setCancelEntireModalOpen(false)} className="p-1 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-1">
              <p className="font-bold">Are you sure you want to cancel the entire family registration?</p>
              <p className="leading-relaxed">
                This will remove <strong>{currentFamily.hofName}'s family ({currentFamily.members.length} members)</strong> from Zikrah Waaz Majlis 1448H.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCancelEntireModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-cream-300 text-navy-900 font-bold text-xs hover:bg-cream-100 transition"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCancelCurrentFamily(currentFamily.hofItsId, true)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition disabled:opacity-70 flex items-center justify-center gap-1 shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Yes, Cancel All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
