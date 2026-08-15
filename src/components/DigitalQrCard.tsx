"use client";

import { QrCode, PhoneCall } from "lucide-react";

interface DigitalQrCardProps {
  imageSrc?: string;
  size?: "normal" | "large";
}

export default function DigitalQrCard({ imageSrc = "/Qr.jpg" }: DigitalQrCardProps) {
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

      {/* Payment Instructions Below QR */}
      <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-xs text-navy-950 text-left space-y-2 font-bold shadow-sm">
        <p className="text-navy-950 font-black">
          📝 Cover per Aapnu <strong>NAME</strong> ane <strong>ITS number</strong> Likhwu.
        </p>
        <p className="text-slate-800 font-semibold leading-relaxed">
          📸 Payment kidha baad, payment nu screenshot aa number par send kariye: <strong className="text-navy-950 font-black text-sm">9823563647 (Hozefa Bhai Timbawala)</strong>
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
