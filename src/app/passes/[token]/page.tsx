"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  ShieldAlert,
  ExternalLink,
  Car,
  Utensils,
  Heart,
  PhoneCall,
  User,
  Navigation
} from "lucide-react";
import ScreenshotGuard from "@/components/ScreenshotGuard";

export default function PassesPage() {
  const params = useParams();
  const token = params?.token as string;

  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMemberPass, setActiveMemberPass] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/passes/token/${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.family) {
          setFamily(data.family);
          const cleanToken = token.trim();
          const matchedMember = data.family.members?.find(
            (m: any) => m.id === data.family.matchedMemberId || m.itsId === cleanToken
          );
          const defaultMember = matchedMember || data.family.members?.find((m: any) => m.isHof) || data.family.members?.[0];
          if (defaultMember) setActiveMemberPass(defaultMember);
        } else {
          setError("Family passes not found. Please check your link or ITS ID.");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Failed to fetch passes. Please check your network.");
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Loading digital pass records...</p>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl border border-red-200 premium-card text-center space-y-4 shadow-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-black text-navy-950">No Registration Found</h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          We couldn't find a pass registered under <strong>"{token}"</strong>. Please verify your ITS ID / Mobile Number or register your family below.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
          <a
            href="/register"
            className="px-5 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 border border-gold-400"
          >
            <span>Register Family Now</span>
          </a>
          <a
            href="/"
            className="px-5 py-3 rounded-xl bg-cream-200 hover:bg-cream-300 text-navy-950 font-bold text-xs border border-cream-300 transition flex items-center justify-center"
          >
            <span>Back to Home</span>
          </a>
        </div>
      </div>
    );
  }

  const event = family.event;
  const passesGenerated =
    family.members.some((m: any) => m.pass !== null && m.pass?.qrToken) ||
    event?.status === "PASSES_ISSUED";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ScreenshotGuard />
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-300 premium-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-black text-gold-600 uppercase tracking-wide">
              Family Event Record
            </span>
            {!passesGenerated && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] sm:text-[10px] font-black border border-amber-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                <span>Passes Pending Issuance</span>
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-black text-navy-950 tracking-tight">
            {family.hofName}'s Family
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
            Registered Mobile: <strong>{family.mobileNumber}</strong> · Members: <strong>{family.members.length}</strong>
          </p>
        </div>

        <div className="self-start sm:self-center">
          {passesGenerated ? (
            <div className="px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Passes Issued</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-cream-200 border border-gold-400 text-navy-900 text-xs font-bold flex items-center gap-1 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span>Registration Confirmed</span>
            </div>
          )}
        </div>
      </div>

      {/* Conditional Rendering: Pending Registration Confirmation vs Full Issued Passes */}
      {!passesGenerated ? (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-emerald-500 shadow-xl text-center space-y-5 sm:space-y-6 w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md border-2 border-emerald-400">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Registration Confirmed</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 pt-1 leading-tight">
              Registration Confirmed for {family.hofName}'s Family
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
              Assalamu Alaikum! Your family registration for <strong>{event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}</strong> is <strong>100% Confirmed</strong>. Official digital entry pass cards with QR codes will be unlocked right here once Jamaat Admin issues passes after registration closes.
            </p>
          </div>

          {/* Registered Family Members Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-cream-50 border border-cream-300 text-left space-y-3 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-2.5 text-xs font-bold text-navy-950">
              <span className="text-navy-950 font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmed Family Members ({family.members.length} Members)</span>
              </span>
              <span className="text-navy-950 font-bold font-mono text-[11px] bg-cream-200 px-2.5 py-1 rounded-lg border border-cream-300">
                HOF ITS: {family.hofItsId}
              </span>
            </div>

            <div className="space-y-2">
              {family.members.map((m: any) => (
                <div key={m.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs p-3 rounded-xl bg-white border border-cream-300 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-navy-950 text-xs sm:text-sm truncate">{m.name}</span>
                    {m.isHof && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-gold-600 text-white shrink-0">HOF</span>
                    )}
                  </div>
                  <span className="text-slate-700 font-mono font-bold text-[11px] bg-cream-100 px-2 py-0.5 rounded-lg border border-cream-200 shrink-0">
                    ITS: {m.itsId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Family Members Pass Cards List (When Passes Issued) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Member Selector List */}
          <div className="md:col-span-1 space-y-2 no-print">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Registered Family Members
            </p>

            {family.members.map((member: any) => {
              const isSelected = activeMemberPass?.id === member.id;
              const isCheckedIn = member.pass?.status === "CHECKED_IN";

              return (
                <button
                  key={member.id}
                  onClick={() => setActiveMemberPass(member)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-navy-900 text-white border-navy-900 shadow-md"
                      : "bg-white text-navy-950 border-cream-300 hover:border-gold-500"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm truncate">{member.name}</span>
                      {member.isHof && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${isSelected ? "bg-gold-600 text-white" : "bg-cream-200 text-navy-900"}`}>
                          HOF
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] sm:text-xs mt-0.5 font-medium truncate ${isSelected ? "text-cream-100" : "text-slate-500"}`}>
                      ITS: {member.itsId} · {member.gender} {(member.type === "Child" || member.type === "Gair Baliqh") ? "· Gair Baliqh" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isCheckedIn && (
                      <CheckCircle2 className={`w-4 h-4 ${isSelected ? "text-gold-400" : "text-emerald-600"}`} />
                    )}
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-200" : "text-slate-400"}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Member Relay Pass Card (UNIFIED LIGHT BLUE + BLACK TEXT & BORDER) */}
          <div className="md:col-span-2">
            {activeMemberPass ? (
              <div
                className="printable-pass-card bg-sky-50 rounded-xl p-4 sm:p-6 border-2 border-black shadow-xl space-y-4 text-center relative overflow-hidden select-none text-black"
              >
                {/* Event Header Info */}
                <div className="space-y-2 text-center">
                  {/* Top Row: 2x Extra Large Logo (No Border) + Anjuman Text, Centered Big RELAY PASS badge */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-black/20 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src="/logo.jpg"
                        alt="Anjuman E Najmi Khopoli"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shrink-0 shadow-sm"
                      />
                      <p className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-black text-left leading-tight">
                        ANJUMAN E NAJMI<br />KHOPOLI
                      </p>
                    </div>
                    
                    <div className="mx-auto sm:mx-0">
                      <span className="inline-block px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase bg-black text-white border-2 border-black tracking-widest shrink-0 shadow-md">
                        RELAY PASS
                      </span>
                    </div>
                  </div>

                  {/* Main Event Title - Single Line Fit */}
                  <h3 className="text-[10px] sm:text-xs font-black text-black text-center pt-1 leading-snug whitespace-nowrap tracking-tight overflow-hidden">
                    {event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}
                  </h3>

                  {/* Refined Divider Line with Venue & 16 Rabi al-Awwal Below Line */}
                  <div className="border-t border-black/30 pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-black font-extrabold text-center">
                    <span className="flex items-center gap-1 font-black">
                      <Calendar className="w-3.5 h-3.5 text-black shrink-0" />
                      {event?.date || "16th Rabi al-Awwal 1448H"}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-black">
                      <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                      {event?.venue || "Maharaja Lawns - Khopoli"}
                    </span>
                  </div>
                </div>

                {/* Member Pass Identity Info */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black text-[11px] sm:text-xs font-black text-black shadow-sm">
                      <span>ITS ID: {activeMemberPass.itsId}</span>
                      <span>·</span>
                      <span>{activeMemberPass.gender}</span>
                      {(activeMemberPass.type === "Child" || activeMemberPass.type === "Gair Baliqh") && (
                        <>
                          <span>·</span>
                          <span>Gair Baliqh</span>
                        </>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-black tracking-tight break-words leading-tight">
                    {activeMemberPass.name}
                  </h2>

                  <p className="text-xs text-black font-extrabold">
                    {activeMemberPass.isHof ? "Head of Family (HOF)" : `Family Member of ${family.hofName}`}
                  </p>

                  {/* Pass Token Badge */}
                  <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-block px-3 py-1.5 bg-black text-white rounded-lg text-[10px] sm:text-xs font-mono font-black tracking-wider sm:tracking-widest uppercase shadow break-all">
                      TOKEN: {activeMemberPass.pass?.qrToken || `KRC-URS1448H-${activeMemberPass.itsId}`}-{String(activeMemberPass.passNumber || 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Important Instructions Section with Highlighted Words */}
                  <div className="border-t-2 border-black/20 pt-3 text-left space-y-2">
                    <p className="text-xs font-black uppercase text-black tracking-wider">
                      📋 Important Instructions:
                    </p>
                    <ul className="text-[10px] sm:text-[11px] font-bold text-black space-y-1.5 pl-4 list-disc leading-relaxed">
                      <li><strong>ITS Card Matching:</strong> ITS Card number will be matched and verified with this pass at entry.</li>
                      <li><strong>Physical ITS Card:</strong> Please bring your physical ITS Card along with this digital pass.</li>
                      <li><strong>Venue Gates:</strong> Gates will open at 9:00 AM.</li>
                      <li><strong>Parking Note & Guidance:</strong> Park your car at designated parking space and a Khidmatguzar will guide you in parking.</li>
                      <li><strong>Bring Your Own Chair:</strong> If required for sitting.</li>
                      <li><strong>Bring An Umbrella:</strong> In case of rainy weather.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl bg-white">
                Select a family member to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
