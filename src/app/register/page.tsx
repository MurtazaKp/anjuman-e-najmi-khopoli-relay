"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Lock
} from "lucide-react";
import DigitalQrCard from "@/components/DigitalQrCard";

interface Member {
  id: string;
  itsId: string;
  name: string;
  gender: "Male" | "Female";
  type: "Adult" | "Child";
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Active Event Status State
  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

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

  // Event Logistics State
  const [mauze, setMauze] = useState("Lonavala");
  const [mauzeOther, setMauzeOther] = useState("");
  const [transportMode, setTransportMode] = useState("Car");
  const [transportOther, setTransportOther] = useState("");

  // HOF Form State
  const [hofName, setHofName] = useState("");
  const [hofItsId, setHofItsId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [hofGender, setHofGender] = useState<"Male" | "Female">("Male");
  const [hofType, setHofType] = useState<"Adult" | "Child">("Adult");

  // Niyaz & Contribution State
  const [niyazJaman, setNiyazJaman] = useState("Yes, Jami ne Jaisu");
  const [niyazContribution, setNiyazContribution] = useState("7200");

  // Family Members State
  const [members, setMembers] = useState<Member[]>([]);

  // Member Modal / Form State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberItsId, setMemberItsId] = useState("");
  const [memberGender, setMemberGender] = useState<"Male" | "Female">("Male");
  const [memberType, setMemberType] = useState<"Adult" | "Child">("Adult");

  // Validation & Loading States
  const [itsChecking, setItsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalErrorMsg, setModalErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Real-time backend ITS verification
  const verifyItsIdBackend = async (itsId: string, setErrorTarget?: (msg: string) => void): Promise<boolean> => {
    try {
      const cleanIts = itsId.trim();
      if (!cleanIts) return true;

      setItsChecking(true);
      const res = await fetch(`/api/register/check-its?itsId=${encodeURIComponent(cleanIts)}`);
      const data = await res.json();
      setItsChecking(false);

      if (data.isDuplicate) {
        const msg = `This ITS ID (${cleanIts}) is already registered for this event.`;
        if (setErrorTarget) {
          setErrorTarget(msg);
        } else {
          setErrorMsg(msg);
        }
        return false;
      }
      return true;
    } catch (err) {
      setItsChecking(false);
      return true;
    }
  };

  // Handle HOF Submission (Step 1 -> Step 2)
  const handleHofContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!hofName.trim() || !hofItsId.trim() || !mobileNumber.trim()) {
      setErrorMsg("Please fill in all HOF required fields.");
      return;
    }

    if (hofItsId.trim().length !== 8) {
      setErrorMsg("HOF ITS ID must be exactly 8 digits.");
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

    const isValid = await verifyItsIdBackend(hofItsId);
    if (!isValid) return;

    setStep(2);
  };

  // Open modal for adding/editing family member
  const openAddMemberModal = () => {
    setEditingMemberId(null);
    setMemberName("");
    setMemberItsId("");
    setMemberGender("Male");
    setMemberType("Adult");
    setErrorMsg("");
    setModalErrorMsg("");
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberItsId(member.itsId);
    setMemberGender(member.gender);
    setMemberType(member.type);
    setErrorMsg("");
    setModalErrorMsg("");
    setShowMemberModal(true);
  };

  // Save Member in Family list
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMsg("");

    if (!memberName.trim() || !memberItsId.trim()) {
      setModalErrorMsg("Please enter both Name and ITS ID for the family member.");
      return;
    }

    const cleanIts = memberItsId.trim();

    if (cleanIts.length !== 8) {
      setModalErrorMsg("Family Member ITS ID must be exactly 8 digits.");
      return;
    }

    if (cleanIts === hofItsId.trim()) {
      setModalErrorMsg("This ITS ID matches the HOF's ITS ID.");
      return;
    }

    const isLocalDuplicate = members.some(
      (m) => m.itsId === cleanIts && m.id !== editingMemberId
    );
    if (isLocalDuplicate) {
      setModalErrorMsg(`ITS ID ${cleanIts} is already added in your family list.`);
      return;
    }

    const isBackendValid = await verifyItsIdBackend(cleanIts, setModalErrorMsg);
    if (!isBackendValid) return;

    if (editingMemberId) {
      setMembers(
        members.map((m) =>
          m.id === editingMemberId
            ? { ...m, name: memberName.trim(), itsId: cleanIts, gender: memberGender, type: memberType }
            : m
        )
      );
    } else {
      setMembers([
        ...members,
        {
          id: `temp-${Date.now()}-${Math.random()}`,
          name: memberName.trim(),
          itsId: cleanIts,
          gender: memberGender,
          type: memberType,
        },
      ]);
    }

    setShowMemberModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");

    const finalMauze = mauze === "Other" ? mauzeOther.trim() : mauze;
    const finalTransport = transportMode === "Other" ? transportOther.trim() : transportMode;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hofName,
          hofItsId,
          mobileNumber,
          hofGender,
          hofType,
          mauze: finalMauze,
          transportMode: finalTransport,
          niyazJaman,
          niyazContribution,
          familyMembers: members.map((m) => ({
            itsId: m.itsId,
            name: m.name,
            gender: m.gender,
            type: m.type,
          })),
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed. Please check your details.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/?registered=true&token=${data.passLinkToken}`);
      }, 2000);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || "Network error. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-cream-300 premium-card text-center max-w-md mx-auto space-y-4 my-8 animate-fade-in">
        <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto text-gold-600 border border-gold-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-navy-950">Registration Successful!</h2>
        <p className="text-sm text-navy-900 font-medium">
          Your family registration for the Waaz Mubarak Relay & Niyaz has been recorded. Redirecting to homepage...
        </p>
        <div className="w-full bg-cream-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gold-600 h-full w-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Loading Event State Guard
  if (loadingEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Checking event registration status...</p>
      </div>
    );
  }

  // Registration Closed Guard
  if (event?.status && event.status !== "REGISTRATION_OPEN") {
    return (
      <div className="bg-white rounded-3xl p-8 border-2 border-navy-950 premium-card text-center max-w-md mx-auto space-y-5 my-8 shadow-2xl animate-fade-in">
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
          Registrations for <strong>{event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}</strong> have officially closed. Digital passes will be issued shortly.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 border border-gold-500/40"
          >
            <span>Find Your Passes on Homepage</span>
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Event Header with Announcement Paragraph */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gold-600 shadow-xl space-y-4 text-center relative overflow-hidden">
        <div className="navy-header -mx-6 -mt-6 p-5 text-white space-y-2 border-b-2 border-gold-600">
          <span className="inline-block px-3 py-1 bg-gold-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow">
            Anjuman E Najmi Khopoli
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H
          </h1>
        </div>

        {/* Announcement Paragraph Text */}
        <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-navy-950 text-xs sm:text-sm text-left space-y-2 leading-relaxed">
          <p className="font-semibold">
            AqaMaula TUS ye karam ane ehsaan farmaawi ne Syedna Mohammed Burhanuddin Maula RA na urs mubarak na din waaz mubarak Khopoli ma live relay karwani raza mubarak fazal farmaawi chhe.
          </p>
          <p className="font-semibold text-gold-700">
            Aap sagla ne 16mi tareekh waaz mubarak ni talaqqi karwa waaste ane te baad salawaat na niyaz nu Aqa Maula TUS taraf si izan araz karye chhe.
          </p>
          <p className="text-xs text-slate-700 font-medium pt-1 border-t border-cream-300">
            If you are coming to Khopoli for this purpose, we kindly request you to fill out this form so that arrangements can be made accordingly. Shukran.
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Note: Please submit only one response per family or group to ensure accurate results.</span>
          </div>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-cream-300 premium-card text-xs font-bold">
        <div className={`flex items-center gap-1.5 ${step === 1 ? "text-navy-950 font-black" : "text-slate-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-navy-900 text-white" : "bg-cream-200 text-navy-900"}`}>1</div>
          <span>HOF & Details</span>
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

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900 font-bold">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: HOF & Event Logistics Registration */}
      {step === 1 && (
        <form onSubmit={handleHofContinue} className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
          <div className="border-b border-cream-200 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-600" />
            <h2 className="text-base font-black text-navy-950">Head of Family (HOF) & Location Details</h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Mauze Selection */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold-600" />
                <span>Your Mauze *</span>
              </label>
              <select
                value={mauze}
                onChange={(e) => setMauze(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
              >
                <option value="Lonavala">Lonavala</option>
                <option value="Pune">Pune</option>
                <option value="Other">Other (Please specify below)</option>
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

            {/* Mode of Transportation */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-gold-600" />
                <span>Mode of Transportation (For Parking Arrangements) *</span>
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

            <div className="border-t border-cream-200 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">HOF Full Name *</label>
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
                <label className="block text-xs font-bold text-navy-900 mb-1">HOF ITS ID (8 Digits) *</label>
                <input
                  type="text"
                  placeholder="8-digit ITS ID"
                  value={hofItsId}
                  onChange={(e) => setHofItsId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  maxLength={8}
                  pattern="\d{8}"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white tracking-wide"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Mobile Number (10 Digits) *</label>
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

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Gender</label>
                  <select
                    value={hofGender}
                    onChange={(e) => setHofGender(e.target.value as "Male" | "Female")}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Type</label>
                  <select
                    value={hofType}
                    onChange={(e) => setHofType(e.target.value as "Adult" | "Child")}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-bold text-navy-950 bg-white"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child (Gair Baligh)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={itsChecking}
            className="w-full mt-4 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-base transition shadow-md flex items-center justify-center gap-2 border border-gold-400/40"
          >
            {itsChecking ? "Verifying ITS ID..." : "Continue to Add Family Members"}
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </form>
      )}

      {/* STEP 2: Add Family Members */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-600" />
                <h2 className="text-base font-black text-navy-950">Add Family Members</h2>
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

            {/* Member List */}
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-950 text-sm">{hofName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white text-[10px] font-extrabold uppercase">
                      HOF
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    ITS: {hofItsId} · {hofGender} · {hofType}
                  </p>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-cream-300 rounded-xl text-slate-500 text-xs font-semibold">
                  No additional family members added yet. Click <strong>"+ Add Member"</strong> above to add spouse, children, or parents.
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
                          Family Member
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        ITS: {member.itsId} · {member.gender} · {member.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditMemberModal(member)}
                        className="p-1.5 text-navy-900 hover:text-gold-600 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-navy-900 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
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
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-1 border border-navy-800"
            >
              <span>Continue to Niyaz & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Niyaz Jaman, Contribution & Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-5">
            <div className="border-b border-cream-200 pb-3">
              <h2 className="text-lg font-bold text-navy-950">Niyaz Confirmation & Review</h2>
              <p className="text-xs text-slate-600 font-semibold">
                Total Family Members Attending: <strong>{members.length + 1}</strong>
              </p>
            </div>

            {/* Niyaz Jaman Confirmation Question */}
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

            {/* Niyaz Contribution Unit Selection */}
            <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 space-y-3">
              <label className="block text-xs sm:text-sm font-black text-navy-950 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-gold-600" />
                <span>Niyaz na Jaman ma aap Shamil thawani Niyat kariye che ? *</span>
              </label>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                ( Imkaan hoi to Niche aapeli unit si shamil thaiye ane ehni raqam Urs na din Bhaisaheb or Jamaat member na Nazdeek Adaa kariye )
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

              {/* Digital QR Payment Card Component */}
              <div className="mt-4">
                <DigitalQrCard size="normal" />
              </div>
            </div>

            {/* Family Summary List */}
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-slate-500">Family Members Summary</p>
              <div className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy-950 text-sm">{hofName}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    <span className="font-bold text-gold-600">HOF</span> · ITS: {hofItsId} · {hofGender} · {hofType}
                  </p>
                </div>
              </div>

              {members.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl bg-white border border-cream-300 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-navy-950 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      Family Member · ITS: {m.itsId} · {m.gender} · {m.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setStep(2); openEditMemberModal(m); }}
                      className="text-xs text-gold-600 font-bold px-2 py-1 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-3 rounded-xl border border-cream-300 bg-white text-navy-900 font-bold text-sm hover:bg-cream-100 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-base transition shadow-lg flex items-center justify-center gap-2 border border-gold-400/40"
            >
              {submitting ? "Submitting Registration..." : "Complete Registration"}
              <CheckCircle2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Modal for Adding/Editing Family Member */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-cream-300">
            <h3 className="text-base font-bold text-navy-950 border-b border-cream-200 pb-2">
              {editingMemberId ? "Edit Family Member" : "Add Family Member"}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-3 text-sm">
              {modalErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{modalErrorMsg}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Member Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Fatema Khopoliwala"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">ITS ID (8 Digits) *</label>
                <input
                  type="text"
                  placeholder="8-digit ITS ID"
                  value={memberItsId}
                  onChange={(e) => setMemberItsId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  maxLength={8}
                  pattern="\d{8}"
                  className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white tracking-wide"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Gender</label>
                  <select
                    value={memberGender}
                    onChange={(e) => setMemberGender(e.target.value as "Male" | "Female")}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-bold text-navy-950"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Type</label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as "Adult" | "Child")}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-bold text-navy-950"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child (Gair Baligh)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itsChecking}
                  className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold shadow-sm"
                >
                  {itsChecking ? "Verifying..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
