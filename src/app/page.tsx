"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  QrCode,
  Search,
  AlertCircle,
  Info,
  PhoneCall,
  Smartphone,
  CreditCard,
  Armchair,
  Car,
  Users,
  MessageCircle
} from "lucide-react";
import DigitalQrCard from "@/components/DigitalQrCard";

export default function EventHomepage() {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchToken, setSearchToken] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/events/active?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.event) setEvent(data.event);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active event:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePassLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = searchToken.trim();
    if (!cleanToken) return;

    if (cleanToken.length !== 8) {
      setSearchError("ITS ID must be exactly 8 digits.");
      return;
    }

    setSearching(true);
    setSearchError("");

    window.location.href = `/passes/${cleanToken}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-navy-900">Loading Anjuman E Najmi Khopoli event...</p>
      </div>
    );
  }

  const isRegistrationOpen = event?.status === "REGISTRATION_OPEN";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Premium Hero Banner Section with Custom Uploaded Image */}
      <section className="relative overflow-hidden rounded-3xl text-white shadow-2xl border-2 border-gold-600 min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-4 sm:p-8">
        {/* Background Image */}
        <img
          src="/hero.jpg"
          alt="Anjuman E Najmi Khopoli - Khopoli Relay Centre"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient Overlay for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-900/35 pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gold-600 text-white shadow border border-gold-400">
              <img src="/logo.jpg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover" alt="" />
              <span>Anjuman E Najmi Khopoli</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
            {event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}
          </h1>

          {/* Quick Info Pills */}
          <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-amber-200 font-bold">
            <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-2 rounded-xl backdrop-blur-md border border-gold-600/50 shadow">
              <Calendar className="w-4 h-4 text-gold-400 shrink-0" />
              <span>{event?.date || "16th Rabi al-Awwal 1448H"}</span>
            </div>
            <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-2 rounded-xl backdrop-blur-md border border-gold-600/50 shadow">
              <Clock className="w-4 h-4 text-gold-400 shrink-0" />
              <span>{event?.time || "9:00 AM Onwards"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. General Instructions Section (Directly Below Hero Banner) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-cream-300 premium-card space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-cream-200 pb-3">
          <div className="flex items-center gap-2 font-black text-navy-950 text-base sm:text-lg shrink-0">
            <Info className="w-5 h-5 text-gold-600 shrink-0" />
            <span className="whitespace-nowrap">General Instructions</span>
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-3 py-1 bg-gold-600 text-white rounded-full shrink-0 shadow-sm">
            Important Notice
          </span>
        </div>

        <div className="border border-cream-300 rounded-2xl bg-cream-50/50 divide-y divide-cream-200/80 overflow-hidden text-xs sm:text-sm">
          {/* Instruction Item 1: Digital Entry Pass */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-cream-100/50 transition">
            <div className="w-7 h-7 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-navy-950 block text-sm sm:text-base">
                Digital Entry Pass:
              </span>
              <p className="text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
                Mumineen must <strong className="text-navy-950 font-bold underline decoration-gold-500/50">show their digital pass screen on mobile phone at the entrance counter</strong> to gain entry.
              </p>
            </div>
          </div>

          {/* Instruction Item 2: Physical ITS Card */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-cream-100/50 transition">
            <div className="w-7 h-7 rounded-full bg-gold-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-navy-950 block text-sm sm:text-base">
                Bring Physical ITS Card:
              </span>
              <p className="text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
                Kindly <strong className="text-navy-950 font-bold underline decoration-gold-500/50">bring your physical ITS card for scanning and verification</strong> at the entrance counter.
              </p>
            </div>
          </div>

          {/* Instruction Item 3: Bring Your Own Chair */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-cream-100/50 transition">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Armchair className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-navy-950 block text-sm sm:text-base">
                Bring Your Own Chair:
              </span>
              <p className="text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
                Kindly bring your own chair if required. Chairs will <strong className="text-red-700 font-black">NOT be provided under any circumstances</strong> at the venue.
              </p>
            </div>
          </div>

          {/* Instruction Item 4: Parking Note & Guidance */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-cream-100/50 transition">
            <div className="w-7 h-7 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Car className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-navy-950 block text-sm sm:text-base">
                Parking Note & Guidance:
              </span>
              <p className="text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
                Park your vehicle at designated parking space and <strong className="text-navy-950 font-bold underline decoration-gold-500/50">a Khidmatguzar will guide you in parking</strong> upon arrival. <strong className="text-red-700 font-black">Please travel by bus if possible for ease of traffic.</strong>
              </p>
            </div>
          </div>

          {/* Instruction Item 5: Single Family Registration */}
          <div className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-cream-100/50 transition">
            <div className="w-7 h-7 rounded-full bg-slate-300 text-navy-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-navy-950 block text-sm sm:text-base">
                Single Family Registration:
              </span>
              <p className="text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
                Please submit only one registration form response per family or group to ensure accurate arrangements.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Support Footer Banner */}
        <div className="pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold text-navy-950">
          <a 
            href="https://wa.me/919403825153" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>For any technical issue: <strong className="underline decoration-emerald-500 text-emerald-900">+91 94038 25153</strong></span>
          </a>
          <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">(WhatsApp this number)</span>
        </div>
      </section>

      {/* 2. Full-Width Registration Banner */}
      <section>
        {isRegistrationOpen ? (
          <Link
            href="/register"
            className="flex items-center justify-between p-4 sm:p-6 rounded-3xl bg-gold-600 hover:bg-gold-700 text-white font-black text-base sm:text-lg shadow-xl hover:shadow-2xl transition group transform hover:-translate-y-0.5 border-2 border-gold-400/60 relative overflow-hidden"
          >
            <div className="space-y-1 relative z-10 pr-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/20 text-white shadow-sm">
                ✨ Event Registration Open
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight pt-0.5">
                Register Your Family Now
              </h2>
              <p className="text-[11px] sm:text-xs text-cream-100 font-medium">
                Submit logistics & niyaz details to obtain official digital event passes
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </Link>
        ) : (
          <div className="p-4 sm:p-7 rounded-3xl bg-amber-50 text-navy-950 font-medium text-sm border-2 border-amber-400 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  ⛔ Capacity Reached · Registration Closed
                </span>
                <h2 className="text-base sm:text-xl font-black text-navy-950 pt-0.5">
                  Event Registration Full
                </h2>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-amber-200 text-xs sm:text-sm text-navy-950 font-bold leading-relaxed space-y-1 shadow-sm">
              <p className="text-slate-800 font-extrabold leading-relaxed">
                Those who couldn't register are requested to go to other nearest Relay Centre as we are now full.
              </p>
              <p className="text-slate-600 font-semibold text-[11px] sm:text-xs pt-1">
                Thank you for your cooperation & sorry for the inconvenience caused.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Pass Lookup Hub */}
      <section className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-cream-300 card-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <div className="flex items-center gap-2 font-black text-navy-950 text-sm sm:text-base">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" />
            <span>Find Your Family Passes</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Instant Lookup
          </span>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Enter your <strong>8-digit ITS ID</strong> to view your family's digital event passes.
        </p>

        {searchError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        <form onSubmit={handlePassLookup} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter 8-Digit ITS ID..."
            value={searchToken}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              setSearchToken(val);
              if (searchError) setSearchError("");
            }}
            maxLength={8}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-navy-900 focus:ring-2 focus:ring-gold-500 focus:outline-none font-bold text-navy-950 bg-cream-50 text-xs sm:text-sm tracking-wide"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 border border-gold-500/40 shrink-0"
          >
            <Search className="w-4 h-4 text-gold-400" />
            <span>{searching ? "Searching..." : "Lookup Passes"}</span>
          </button>
        </form>
      </section>

      {/* 4. Venue & Event Location Details */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 border border-cream-300 premium-card space-y-4">
        <div className="flex items-center gap-2 font-black text-navy-950 text-sm sm:text-base border-b border-cream-200 pb-3">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" />
          <span>Venue & Parking Directions</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <p className="text-xs sm:text-sm font-black text-navy-950">
            {event?.venue || "Maharaja Lawns - Khopoli"}
          </p>
          <p className="text-slate-600 leading-relaxed font-medium text-[11px] sm:text-xs">
            {event?.location || "L. M. Sable Nagar, Old Mumbai-Pune Highway, Dist. Khopoli, Maharashtra 410203"}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <a
            href={event?.mapUrl || "https://maps.google.com/?q=Maharaja+Lawns+Khopoli"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-950 font-bold text-xs border border-gold-500/40 shadow-sm transition"
          >
            <MapPin className="w-4 h-4 text-gold-600 shrink-0" />
            <span>Open Venue Location on Google Maps &rarr;</span>
          </a>

          <a
            href={event?.parkingMapUrl || "https://www.google.com/maps/place/18%C2%B047'39.0%22N+73%C2%B020'09.9%22E/@18.7941691,73.3335153,17z/data=!3m1!4b1!4m4!3m3!8m2!3d18.7941691!4d73.3360902!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs border border-gold-500/40 shadow-md transition"
          >
            <span>🚘 Open Parking Location in Maps ↗</span>
          </a>
        </div>
      </section>

      {/* 5. Niyaz e Hussain Payment QR Code Section (Placed Below Venue) */}
      <DigitalQrCard size="large" />
    </div>
  );
}
