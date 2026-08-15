"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  QrCode,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  Layers,
  Database,
  RefreshCw,
  MessageCircle,
  Lock,
  LogOut,
  ShieldAlert,
  KeyRound
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
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);

  // Authentication State
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<1 | 2>(1);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check local storage for persistent admin session
    const savedEmail = localStorage.getItem("ank_admin_email");
    if (savedEmail && AUTHORIZED_ADMIN_EMAILS.includes(savedEmail.toLowerCase())) {
      setAuthenticatedEmail(savedEmail.toLowerCase());
    }
  }, []);

  const fetchActiveEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events/active");
      const data = await res.json();
      if (data.event) setEvent(data.event);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticatedEmail) {
      fetchActiveEvent();
    }
  }, [authenticatedEmail]);

  // Handle Admin Email Verification
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError("Please enter your admin email address.");
      return;
    }

    if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAuthError(`Access Denied: ${cleanEmail} is not an authorized administrator email.`);
      return;
    }

    setAuthStep(2);
  };

  // Handle Admin PIN Verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (inputPin.trim() !== ADMIN_VERIFICATION_PIN) {
      setAuthError("Incorrect Admin Security PIN. Please try again.");
      return;
    }

    const cleanEmail = inputEmail.trim().toLowerCase();
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

      if (res.ok) {
        setEvent(data.event);
        setActionMsg(`Event status updated to ${newStatus}`);
      } else {
        setErrorMsg(data.error || "Failed to update status");
      }
    } catch (err: any) {
      setStatusUpdating(false);
      setErrorMsg(err.message || "Failed to update status");
    }
  };

  const handleGeneratePasses = async () => {
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
      }
    } catch (err: any) {
      setGeneratingPasses(false);
      setErrorMsg(err.message);
    }
  };

  const handleSendWhatsapp = async () => {
    setSendingWhatsapp(true);
    setActionMsg("");
    setErrorMsg("");
    setWhatsappLogs([]);

    try {
      const res = await fetch("/api/whatsapp/send", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json();
      setSendingWhatsapp(false);

      if (res.ok) {
        setActionMsg(`WhatsApp notifications processed for ${data.processed} families.`);
        if (data.results) setWhatsappLogs(data.results);
      } else {
        setErrorMsg(data.error || "Failed to send notifications");
      }
    } catch (err: any) {
      setSendingWhatsapp(false);
      setErrorMsg(err.message);
    }
  };

  // Render Authentication Modal if not logged in as Admin
  if (!authenticatedEmail) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border-2 border-navy-900 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-navy-950 text-gold-400 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-gold-600">
            <Lock className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-gold-600 uppercase">
            Restricted Access
          </span>
          <h1 className="text-xl font-black text-navy-950">
            Admin Authentication
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Anjuman E Najmi Khopoli Event Management Portal
          </p>
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 border border-gold-500/40"
            >
              <span>Verify Authorized Email</span>
              <KeyRound className="w-4 h-4 text-gold-400" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs font-bold text-navy-950 flex items-center justify-between">
              <span>Email: <strong>{inputEmail}</strong></span>
              <button
                type="button"
                onClick={() => setAuthStep(1)}
                className="text-[11px] text-gold-700 underline font-bold"
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
              className="w-full py-3.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 border border-gold-400"
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
      <div className="bg-navy-950 rounded-2xl p-6 text-white border border-gold-600/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Anjuman E Najmi Khopoli</span>
          </div>
          <h1 className="text-xl font-black tracking-tight mt-1 text-white">
            Admin Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Authenticated Admin: <strong className="text-gold-300">{authenticatedEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-gold-600 text-white text-xs font-black uppercase tracking-wide border border-gold-400">
            {event?.status}
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
            title="Log out from Admin session"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-300" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Google Sheets & Data Export Section */}
      <section className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-navy-950 text-base">
            <FileSpreadsheet className="w-5 h-5 text-gold-600" />
            <span>Google Sheets & Formatted Excel Export</span>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cream-100 text-navy-900 rounded border border-cream-300">
            PRD Spec Compliant
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Exports registration records in the exact Khopoli Relay Centre format: Single-sheet layout with main event heading, family grouping, blank row separators, and columns (ITS ID, Name, Status, Gender, Type, Mobile Number).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSyncGoogleSheet}
            disabled={syncingSheet}
            className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 border border-gold-400"
          >
            <RefreshCw className={`w-4 h-4 ${syncingSheet ? "animate-spin" : ""}`} />
            <span>{syncingSheet ? "Syncing to Google Sheet..." : "Sync All Data to Google Sheet"}</span>
          </button>

          <a
            href="/api/export?format=excel"
            download
            className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-black text-xs shadow-md transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-gold-400" />
            <span>Download Excel (.xlsx)</span>
          </a>

          <a
            href="/api/export?format=csv"
            download
            className="px-5 py-2.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-navy-900 font-bold text-xs shadow-sm transition flex items-center gap-2 border border-cream-300"
          >
            <Database className="w-4 h-4 text-gold-600" />
            <span>Download CSV</span>
          </a>
        </div>
      </section>

      {/* 2. Automated Pass Generation & WhatsApp Notifications */}
      <section className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex items-center gap-2 font-black text-navy-950 text-base">
          <QrCode className="w-5 h-5 text-gold-600" />
          <span>Automated Pass Generation & WhatsApp Notifications</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Generates unique QR codes for every registered family member after registration closes, and sends WhatsApp pass links to HOFs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Generate Passes Button (Requires REGISTRATION_CLOSED) */}
          <button
            onClick={handleGeneratePasses}
            disabled={generatingPasses || !isRegistrationClosed}
            className={`p-4 rounded-xl border text-left space-y-1 transition shadow-sm ${
              isRegistrationClosed
                ? "bg-gold-600 text-white border-gold-500 hover:bg-gold-700 cursor-pointer"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black">Generate All Digital Passes</span>
              {isRegistrationClosed ? (
                <QrCode className="w-5 h-5 text-white" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
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

          <button
            onClick={handleSendWhatsapp}
            disabled={sendingWhatsapp}
            className="p-4 rounded-xl bg-cream-100 border border-cream-300 hover:bg-cream-200 text-navy-950 font-bold text-xs transition text-left space-y-1 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black">Send WhatsApp Pass Links</span>
              <Send className="w-5 h-5 text-gold-600" />
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {sendingWhatsapp ? "Dispatching..." : "Notifies HOFs with WhatsApp pass link"}
            </p>
          </button>
        </div>

        {/* WhatsApp Logs & Direct Chat Links */}
        {whatsappLogs.length > 0 && (
          <div className="pt-3 border-t border-cream-200 space-y-2">
            <p className="text-xs font-black text-navy-950 uppercase tracking-wider">
              WhatsApp Notifications Logs ({whatsappLogs.length})
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {whatsappLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-navy-950">{log.hofName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-black uppercase">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">Mobile: {log.mobile}</p>
                  </div>
                  {log.waDirectLink && (
                    <a
                      href={log.waDirectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Event Lifecycle Status Controls */}
      <section className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
        <div className="border-b border-cream-200 pb-3 flex items-center gap-2 font-black text-navy-950 text-base">
          <Layers className="w-5 h-5 text-slate-700" />
          <span>Event Registration Status Toggle</span>
        </div>

        <p className="text-xs text-slate-600 font-semibold">
          Current status: <strong className="uppercase text-gold-600">{event?.status}</strong>
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleUpdateStatus("REGISTRATION_OPEN")}
            disabled={statusUpdating || event?.status === "REGISTRATION_OPEN"}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gold-600 text-white hover:bg-gold-700 disabled:opacity-50 transition"
          >
            Open Registration
          </button>
          <button
            onClick={() => handleUpdateStatus("REGISTRATION_CLOSED")}
            disabled={statusUpdating || event?.status === "REGISTRATION_CLOSED"}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50 transition"
          >
            Close Registration
          </button>
        </div>
      </section>
    </div>
  );
}
