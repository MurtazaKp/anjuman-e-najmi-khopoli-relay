"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  ShieldAlert,
  Download,
  Printer
} from "lucide-react";

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
          const hofMember = data.family.members?.find((m: any) => m.isHof) || data.family.members?.[0];
          if (hofMember) setActiveMemberPass(hofMember);
        } else {
          setError("Family passes not found. Please check your link or ITS ID.");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Failed to fetch passes. Please check your network.");
      });
  }, [token]);

  const handleDownloadPdf = () => {
    window.print();
  };

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
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl border border-red-200 premium-card text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-950">Passes Not Found</h2>
        <p className="text-xs text-slate-600 font-medium">{error || "No registration found for this link."}</p>
        <a
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs"
        >
          Return to Homepage
        </a>
      </div>
    );
  }

  const event = family.event;
  const passesGenerated = family.members.some((m: any) => m.pass !== null && m.pass?.qrToken);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-cream-300 premium-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gold-600 uppercase tracking-wide">
              Family Event Record
            </span>
            {!passesGenerated && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                Passes Pending Admin Issuance
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-navy-950 mt-0.5">
            {family.hofName}'s Family
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Registered Mobile: <strong>{family.mobileNumber}</strong> · Members: <strong>{family.members.length}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {passesGenerated ? (
            <div className="px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Passes Issued</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-cream-200 border border-gold-400 text-navy-900 text-xs font-bold flex items-center gap-1">
              <Clock className="w-4 h-4 text-gold-600" />
              <span>Registration Confirmed</span>
            </div>
          )}
        </div>
      </div>

      {/* Family Members Pass Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Member Selector List (Hidden in PDF print) */}
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
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                  isSelected
                    ? "bg-navy-900 text-white border-navy-900 shadow-md"
                    : "bg-white text-navy-950 border-cream-300 hover:border-gold-500"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{member.name}</span>
                    {member.isHof && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${isSelected ? "bg-gold-600 text-white" : "bg-cream-200 text-navy-900"}`}>
                        HOF
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 font-medium ${isSelected ? "text-cream-100" : "text-slate-500"}`}>
                    ITS: {member.itsId} · {member.gender}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isCheckedIn && (
                    <CheckCircle2 className={`w-4 h-4 ${isSelected ? "text-gold-400" : "text-emerald-600"}`} />
                  )}
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-200" : "text-slate-400"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Pass Details or Pending Banner */}
        <div className="md:col-span-2">
          {activeMemberPass ? (
            <div className="printable-pass-card bg-white rounded-3xl p-6 border-2 border-navy-900 shadow-xl space-y-5 text-center relative overflow-hidden">
              {/* Event Header */}
              <div className="navy-header -mx-6 -mt-6 p-4 text-white space-y-1 border-b-2 border-gold-600">
                <p className="text-[10px] font-black tracking-widest uppercase text-gold-400">
                  Anjuman E Najmi Khopoli
                </p>
                <h3 className="text-base font-black">
                  {event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}
                </h3>
                <div className="flex items-center justify-center gap-3 text-xs text-cream-100 pt-1 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    {event?.date || "16th Rabi al-Awwal 1448H"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    {event?.venue || "Maharaja Lawns - Khopoli"}
                  </span>
                </div>
              </div>

              {/* Member Details */}
              <div className="space-y-1 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-300 text-xs font-bold text-navy-900 mb-2">
                  <span>ITS ID: {activeMemberPass.itsId}</span>
                  <span>·</span>
                  <span>{activeMemberPass.gender}</span>
                  <span>·</span>
                  <span>{activeMemberPass.type}</span>
                </div>
                <h2 className="text-2xl font-black text-navy-950 tracking-tight">
                  {activeMemberPass.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {activeMemberPass.isHof ? "Head of Family (HOF)" : `Family Member of ${family.hofName}`}
                </p>
              </div>

              {/* QR Code Section or Pending Banner */}
              <div className="py-2">
                {activeMemberPass.pass && activeMemberPass.pass.qrToken ? (
                  <div className="inline-block p-4 bg-white rounded-2xl border-2 border-navy-900 shadow-md space-y-2">
                    <QRCodeSVG
                      value={activeMemberPass.pass.qrToken}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="text-[10px] font-mono tracking-widest text-slate-600 font-bold uppercase">
                      {activeMemberPass.pass.qrToken}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-navy-950 text-xs font-medium space-y-2 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 text-amber-900 font-black text-sm">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <span>Digital Pass Not Issued Yet</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      Your family registration is <strong>confirmed</strong>. Official digital QR passes will be generated and issued by Khopoli Relay Centre event admins.
                    </p>
                  </div>
                )}
              </div>

              {/* Status & Download PDF Button */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {activeMemberPass.pass?.status === "CHECKED_IN" && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Checked In at Entrance</span>
                    </div>
                  )}

                  {!activeMemberPass.pass && (
                    <p className="text-xs text-amber-800 font-bold">
                      Check back after pass generation is completed by admin.
                    </p>
                  )}

                  {activeMemberPass.pass && (
                    <button
                      onClick={handleDownloadPdf}
                      className="no-print px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 border border-gold-500/40"
                      title="Download Digital Pass in PDF Format"
                    >
                      <Printer className="w-4 h-4 text-gold-400" />
                      <span>Download Pass as PDF</span>
                    </button>
                  )}
                </div>

                {activeMemberPass.pass && (
                  <p className="text-xs text-slate-600 font-medium">
                    Scan this QR code at the entrance counter for entry check-in.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl bg-white">
              Select a family member to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
