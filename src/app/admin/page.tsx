"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  QrCode,
  Users,
  CheckCircle2,
  AlertCircle,
  Settings,
  Layers,
  Database,
  RefreshCw,
  Lock,
  LogOut,
  ShieldAlert,
  KeyRound,
  Trash2,
  ExternalLink
} from "lucide-react";

// Authorized Administrator Emails
const AUTHORIZED_ADMIN_EMAILS = [
  "khopoliwala52@gmail.com",
  "khapolimasool@alvazarat.org",
  "khopolimasool@alvazarat.org"
];

// Admin Verification PIN
const ADMIN_VERIFICATION_PIN = "525252";

export default function AdminPage() {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generatingPasses, setGeneratingPasses] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [clearingStore, setClearingStore] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Authentication State
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<1 | 2>(1);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check local storage for persistent admin session
    const savedEmail = localStorage.getItem("ank_admin_email");
    if (savedEmail) {
      const cleanSaved = savedEmail.toLowerCase().trim();
      if (AUTHORIZED_ADMIN_EMAILS.includes(cleanSaved)) {
        setAuthenticatedEmail(cleanSaved);
      } else {
        localStorage.removeItem("ank_admin_email");
      }
    }
    fetchActiveEvent();
  }, []);

  const fetchActiveEvent = async () => {
    try {
      const res = await fetch("/api/events/active");
      const data = await res.json();
      if (data.event) setEvent(data.event);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Handle Admin Email Verification
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const cleanInput = inputEmail.trim();
    if (!cleanInput) {
      setAuthError("Please enter your authorized admin email address.");
      return;
    }

    const cleanEmail = cleanInput.toLowerCase();
    if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAuthError("Access Denied: This email address is not authorized for Admin access.");
      return;
    }

    setAuthStep(2);
  };

  // Handle Admin PIN Verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAuthError("Access Denied: Unauthorized admin email address.");
      setAuthStep(1);
      return;
    }

    if (inputPin.trim() !== ADMIN_VERIFICATION_PIN) {
      setAuthError("Incorrect Admin Security PIN.");
      return;
    }

    setAuthenticatedEmail(cleanEmail);
    localStorage.setItem("ank_admin_email", cleanEmail);
  };

  const handleLogout = () => {
    setAuthenticatedEmail(null);
    setAuthStep(1);
    setInputEmail("");
    setInputPin("");
    localStorage.removeItem("ank_admin_email");
  };

  const handleSyncGoogleSheet = async () => {
    setSyncingSheet(true);
    setActionMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/export/sync-sheet", { method: "POST" });
      const data = await res.json();
      setSyncingSheet(false);

      if (res.ok) {
        setActionMsg(data.message || "Synced all registrations to Google Sheet!");
      } else {
        setErrorMsg(data.error || "Failed to sync to Google Sheet.");
      }
    } catch (err: any) {
      setSyncingSheet(false);
      setErrorMsg(err.message);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!event) return;
    setEvent((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
    setStatusUpdating(true);
    setActionMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/events/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, status: newStatus }),
      });
      const data = await res.json();
      setStatusUpdating(false);

      if (res.ok && data.event) {
        setEvent(data.event);
        setActionMsg(`Event status updated to ${newStatus}`);
      } else {
        setErrorMsg(data.error || "Failed to update status");
        fetchActiveEvent();
      }
    } catch (err: any) {
      setStatusUpdating(false);
      setErrorMsg(err.message || "Failed to update status");
      fetchActiveEvent();
    }
  };

  const handleGeneratePasses = async () => {
    if (event) {
      setEvent((prev: any) => (prev ? { ...prev, status: "PASSES_ISSUED" } : prev));
    }
    setGeneratingPasses(true);
    setActionMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/passes/generate", { method: "POST" });
      const data = await res.json();
      setGeneratingPasses(false);

      if (res.ok) {
        setActionMsg(data.message || "Digital passes generated successfully!");
        fetchActiveEvent();
      } else {
        setErrorMsg(data.error || "Failed to generate passes");
        fetchActiveEvent();
      }
    } catch (err: any) {
      setGeneratingPasses(false);
      setErrorMsg(err.message);
      fetchActiveEvent();
    }
  };

  const handleClearStore = async () => {
    const confirmClear = window.confirm(
      "⚠️ ARE YOU SURE?\n\nThis will clear all family registrations and generated passes for this event in the live environment. This action cannot be undone."
    );
    if (!confirmClear) return;

    try {
      setClearingStore(true);
      setActionMsg("");
      setErrorMsg("");

      const res = await fetch("/api/admin/clear-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authenticatedEmail,
          pin: ADMIN_VERIFICATION_PIN,
        }),
      });

      const data = await res.json();
      setClearingStore(false);

      if (res.ok) {
        setActionMsg("Store registrations and passes cleared successfully!");
        fetchActiveEvent();
      } else {
        setErrorMsg(data.error || "Failed to clear store");
      }
    } catch (err: any) {
      setClearingStore(false);
      setErrorMsg(err.message);
    }
  };

  // Render Authentication Modal if not logged in as Admin
  if (!authenticatedEmail) {
    return (
      <div className="max-w-md mx-auto my-4 sm:my-8 p-4 sm:p-8 bg-white rounded-3xl border-2 border-navy-900 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-navy-950 text-gold-400 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-gold-600">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-gold-600 uppercase">
            Restricted Access
          </span>
          <h1 className="text-lg sm:text-xl font-black text-navy-950">
            Admin Authentication
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Anjuman E Najmi Khopoli Event Management Portal
          </p>
        </div>

        {authError && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {authStep === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">
                Authorized Administrator Email *
              </label>
              <input
                type="email"
                placeholder=""
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white text-xs sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 border border-gold-500/40"
            >
              <span>Verify Authorized Email</span>
              <KeyRound className="w-4 h-4 text-gold-400" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs font-bold text-navy-950 flex items-center justify-between">
              <span className="truncate pr-2">Email: <strong>{inputEmail}</strong></span>
              <button
                type="button"
                onClick={() => setAuthStep(1)}
                className="text-[11px] text-gold-700 underline font-bold shrink-0"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">
                Admin Security PIN *
              </label>
              <input
                type="password"
                placeholder=""
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white text-center tracking-widest text-lg"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 border border-gold-400"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Authenticate & Access Dashboard</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Loading Admin Control Center...</p>
      </div>
    );
  }

  const isRegistrationClosed = event?.status === "REGISTRATION_CLOSED" || event?.status === "PASSES_ISSUED";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Admin Header with Logged-in Email */}
      <div className="bg-navy-950 rounded-2xl p-4 sm:p-6 text-white border border-gold-600/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Anjuman E Najmi Khopoli</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-white">
            Admin Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 font-medium truncate max-w-xs sm:max-w-none">
            Authenticated Admin: <strong className="text-gold-300">{authenticatedEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-3 py-1 rounded-full bg-gold-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wide border border-gold-400">
            {event?.status}
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shrink-0"
            title="Log out from Admin session"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Google Sheets & Data Export Section */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-black text-navy-950 text-sm sm:text-base">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 shrink-0" />
            <span>Google Sheets & Formatted Excel Export</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 bg-cream-100 text-navy-900 rounded border border-cream-300 shrink-0">
            PRD Spec Compliant
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Exports registration records in the exact Khopoli Relay Centre format: Single-sheet layout with main event heading, family grouping, blank row separators, and columns (ITS ID, Name, Status, Gender, Type, Mobile Number).
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <button
            onClick={handleSyncGoogleSheet}
            disabled={syncingSheet}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 border border-gold-400"
          >
            <RefreshCw className={`w-4 h-4 ${syncingSheet ? "animate-spin" : ""}`} />
            <span>{syncingSheet ? "Syncing..." : "Sync All Data to Google Sheet"}</span>
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1xp75B9scBNHy1BobMFhgUwaV41JV39IUnKyz8W-Wwts"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 border border-emerald-500"
          >
            <ExternalLink className="w-4 h-4 text-white shrink-0" />
            <span>Open Live Google Sheet</span>
          </a>

          <a
            href="/api/export?format=excel"
            download
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-gold-400 shrink-0" />
            <span>Download Excel (.xlsx)</span>
          </a>

          <a
            href="/api/export?format=csv"
            download
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-navy-900 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 border border-cream-300"
          >
            <Database className="w-4 h-4 text-gold-600 shrink-0" />
            <span>Download CSV</span>
          </a>
        </div>
      </section>

      {/* Live Capacity Progress Card */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-cream-300 premium-card space-y-3">
        <div className="flex items-center justify-between font-black text-navy-950 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-600 shrink-0" />
            <span>Event Capacity & Registration Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActiveEvent}
              className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-navy-950 transition border border-cream-300"
              title="Refresh live capacity count"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-cream-100 text-navy-950 border border-cream-300">
              {event?.weightedCapacityCount !== undefined ? event.weightedCapacityCount : (event?.totalRegisteredMembers || 0)} / {event?.maxCapacity || 15} Capacity Units
            </span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-cream-200 rounded-full h-3.5 overflow-hidden border border-cream-300">
            <div
              className={`h-full transition-all duration-500 ${
                (event?.weightedCapacityCount !== undefined ? event.weightedCapacityCount : (event?.totalRegisteredMembers || 0)) >= (event?.maxCapacity || 15)
                  ? "bg-red-600"
                  : (event?.weightedCapacityCount !== undefined ? event.weightedCapacityCount : (event?.totalRegisteredMembers || 0)) > (event?.maxCapacity || 15) * 0.8
                  ? "bg-amber-500"
                  : "bg-gold-600"
              }`}
              style={{
                width: `${Math.min(100, Math.round(((event?.weightedCapacityCount !== undefined ? event.weightedCapacityCount : (event?.totalRegisteredMembers || 0)) / (event?.maxCapacity || 15)) * 100))}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Capacity Used: {event?.weightedCapacityCount || 0} Units ({event?.totalRegisteredMembers || 0} Members in {event?.totalFamilies || 0} Families)</span>
            <span>Limit: {event?.maxCapacity || 15} Units</span>
          </div>
        </div>

        {(event?.weightedCapacityCount !== undefined ? event.weightedCapacityCount : (event?.totalRegisteredMembers || 0)) >= (event?.maxCapacity || 15) && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <span>Capacity Full! Registration is automatically CLOSED.</span>
          </div>
        )}
      </section>

      {/* 2. Automated Pass Generation Section */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex items-center gap-2 font-black text-navy-950 text-sm sm:text-base">
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 shrink-0" />
          <span>Automated Pass Generation</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Generates unique scannable QR tokens for every registered family member after registration closes.
        </p>

        <div className="pt-1">
          {/* Generate Passes Button (Requires REGISTRATION_CLOSED) */}
          <button
            onClick={handleGeneratePasses}
            disabled={generatingPasses || !isRegistrationClosed}
            className={`w-full sm:w-auto p-3.5 sm:p-4 rounded-xl border text-left space-y-1 transition shadow-sm ${
              isRegistrationClosed
                ? "bg-gold-600 text-white border-gold-500 hover:bg-gold-700 cursor-pointer"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-black">Generate All Digital Passes</span>
              {isRegistrationClosed ? (
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
              )}
            </div>
            <p className={`text-[11px] font-medium ${isRegistrationClosed ? "text-cream-100" : "text-slate-500"}`}>
              {generatingPasses
                ? "Processing digital passes..."
                : isRegistrationClosed
                ? "Click to create scannable QR tokens for all members"
                : "🔒 Close registration first to enable pass generation"}
            </p>
          </button>
        </div>
      </section>

      {/* 3. Event Lifecycle Status Controls */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex items-center gap-2 font-black text-navy-950 text-sm sm:text-base">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
          <span>Event Registration Status Toggle</span>
        </div>

        <p className="text-xs text-slate-600 font-semibold">
          Current status: <strong className="uppercase text-gold-600">{event?.status}</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={() => handleUpdateStatus("REGISTRATION_OPEN")}
            disabled={statusUpdating || event?.status === "REGISTRATION_OPEN"}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gold-600 text-white hover:bg-gold-700 disabled:opacity-50 transition"
          >
            Open Registration
          </button>
          <button
            onClick={() => handleUpdateStatus("REGISTRATION_CLOSED")}
            disabled={statusUpdating || event?.status === "REGISTRATION_CLOSED"}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50 transition"
          >
            Close Registration
          </button>
        </div>
      </section>

      {/* 4. Database Maintenance & Store Reset */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-red-200 premium-card space-y-4 shadow-sm">
        <div className="border-b border-red-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-black text-red-950 text-sm sm:text-base">
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
            <span>Database Maintenance & Store Reset</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-900 rounded border border-red-200 shrink-0">
            Admin Control
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Allows authorized administrators to clear stored family registration records and passes for this event in the live environment.
        </p>

        <div className="pt-1">
          <button
            onClick={handleClearStore}
            disabled={clearingStore}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 border border-red-500"
          >
            <Trash2 className={`w-4 h-4 ${clearingStore ? "animate-spin" : ""}`} />
            <span>{clearingStore ? "Clearing Store..." : "Clear All Store Registrations"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
