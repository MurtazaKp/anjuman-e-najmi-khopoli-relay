"use client";

import { useState } from "react";
import { QrCode, PhoneCall, Copy, Check } from "lucide-react";

interface DigitalQrCardProps {
  imageSrc?: string;
  size?: "normal" | "large";
}

export default function DigitalQrCard({ imageSrc = "/Qr.jpg" }: DigitalQrCardProps) {
  const [copied, setCopied] = useState(false);
  const upiId = "bom250701315428@mahb";

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-gold-600 shadow-xl space-y-4 text-center relative overflow-hidden w-full">
      {/* Header */}
      <div className="navy-header -mx-6 -mt-6 p-4 text-white flex items-center justify-between border-b-2 border-gold-600 shadow-sm">
        <div className="flex items-center gap-2 font-black text-base">
          <QrCode className="w-5 h-5 text-gold-400" />
          <span>Niyaz e Hussain Payment QR Code</span>
        </div>
        <span className="px-3 py-1 bg-gold-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow">
          Payment QR
        </span>
      </div>

      <p className="font-black text-sm text-gold-700 leading-snug">
        Aa QR code si aap Niyaz e Hussain ma raqam ada kari sako cho.
      </p>

      {/* Full Width Front Display of Uploaded QR Photo */}
      <div className="p-3 sm:p-5 bg-white rounded-3xl border-2 border-navy-950 shadow-xl w-full">
        <img
          src={imageSrc}
          alt="Niyaz e Hussain Payment QR Code"
          className="w-full h-auto max-h-[650px] object-contain mx-auto rounded-2xl"
        />
      </div>

      {/* Prominent Copyable UPI ID Box */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border-2 border-gold-500 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="text-left space-y-0.5">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-900 block">
            Direct Bank UPI ID:
          </span>
          <span className="font-mono font-black text-sm sm:text-base text-navy-950 select-all tracking-tight">
            {upiId}
          </span>
        </div>

        <button
          onClick={handleCopyUpi}
          type="button"
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow border ${
            copied
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-gold-600 hover:bg-gold-700 text-white border-gold-400 active:scale-95"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>UPI ID Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white" />
              <span>Copy UPI ID</span>
            </>
          )}
        </button>
      </div>

      {/* Payment Instructions Below QR */}
      <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-xs text-navy-950 text-left space-y-2 font-bold shadow-sm">
        <p className="text-navy-950 font-black">
          📝 Cover per Aapnu <strong>NAME</strong> ane <strong>ITS number</strong> Likhwu.
        </p>
        <p className="text-slate-800 font-semibold leading-relaxed">
          📸 Payment kidha baad, payment nu screenshot aa number par send karye: <strong className="text-navy-950 font-black text-sm">9823563647 (Hozefa Bhai Timbawala)</strong>
        </p>
        <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between gap-1 text-slate-700 font-semibold">
          <div className="flex items-center gap-1.5 text-navy-950 font-bold">
            <PhoneCall className="w-4 h-4 text-gold-600 shrink-0" />
            <span>For Online Assistance: <strong>+91 98235 63647</strong></span>
          </div>
          <span className="text-slate-500 font-bold text-[11px]">(Huzefa bhai - Jamaat Member)</span>
        </div>
      </div>
    </div>
  );
}
