"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const whatsappUrl = "https://wa.me/919403825153?text=Assalamu%20Alaikum,%20I%20need%20help%20with%20Khopoli%20Relay%20Registration";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Technical Support"
      className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border-2 border-white transition transform hover:scale-105 active:scale-95 group font-black text-xs sm:text-sm"
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
      </span>
      <MessageCircle className="w-5 h-5 fill-white text-[#25D366] shrink-0" />
      <span className="tracking-wide shadow-sm">Need Help? WhatsApp Us</span>
    </a>
  );
}
