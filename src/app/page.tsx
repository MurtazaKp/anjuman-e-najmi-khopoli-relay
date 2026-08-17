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
  PhoneCall
} from "lucide-react";
import DigitalQrCard from "@/components/DigitalQrCard";

export default function EventHomepage() {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchToken, setSearchToken] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetch("/api/events/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.event) setEvent(data.event);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePassLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;
    setSearching(true);
    setSearchError("");

    window.location.href = `/passes/${searchToken.trim()}`;
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
      <section className="relative overflow-hidden rounded-3xl text-white shadow-2xl border-2 border-gold-600 min-h-[340px] flex flex-col justify-end p-6 sm:p-8">
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
        <div className="relative z-10 space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gold-600 text-white shadow border border-gold-400">
              <img src="/logo.jpg" className="w-4 h-4 rounded-full object-cover" alt="" />
              <span>Anjuman E Najmi Khopoli</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
            {event?.name || "Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H"}
          </h1>

          <p className="text-cream-100 text-xs sm:text-sm leading-relaxed max-w-2xl font-medium drop-shadow">
            {event?.description}
          </p>

          {/* Quick Info Pills */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-200 font-bold">
            <div className="flex items-center gap-2 bg-navy-950/80 px-3.5 py-2.5 rounded-xl backdrop-blur-md border border-gold-600/50 shadow">
              <Calendar className="w-4 h-4 text-gold-400 shrink-0" />
              <span>{event?.date || "16th Rabi al-Awwal 1448H"}</span>
            </div>
            <div className="flex items-center gap-2 bg-navy-950/80 px-3.5 py-2.5 rounded-xl backdrop-blur-md border border-gold-600/50 shadow">
              <Clock className="w-4 h-4 text-gold-400 shrink-0" />
              <span>{event?.time || "9:00 AM Onwards"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Full-Width Registration Banner */}
      <section>
        {isRegistrationOpen ? (
          <Link
            href="/register"
            className="flex items-center justify-between p-6 rounded-3xl bg-gold-600 hover:bg-gold-700 text-white font-black text-lg shadow-xl hover:shadow-2xl transition group transform hover:-translate-y-0.5 border-2 border-gold-400/60 relative overflow-hidden"
          >
            <div className="space-y-1 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white shadow-sm">
                ✨ Event Registration Open
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Register Your Family Now
              </h2>
              <p className="text-xs text-cream-100 font-medium">
                Submit logistics & niyaz details to obtain official digital event passes
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </Link>
        ) : (
          <div className="p-6 sm:p-7 rounded-3xl bg-amber-50 text-navy-950 font-medium text-sm border-2 border-amber-400 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  ⛔ Capacity Reached · Registration Closed
                </span>
                <h2 className="text-lg sm:text-xl font-black text-navy-950 pt-0.5">
                  Event Registration Full
                </h2>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200 text-xs sm:text-sm text-navy-950 font-bold leading-relaxed space-y-1 shadow-sm">
              <p className="text-slate-800 font-extrabold leading-relaxed">
                Those who couldn't register are requested to go to other nearest Relay Centre as we are now full.
              </p>
              <p className="text-slate-600 font-semibold text-xs pt-1">
                Thank you for your cooperation & sorry for the inconvenience caused.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Pass Lookup Hub */}
      <section className="bg-white rounded-3xl p-6 border-2 border-cream-300 card-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <div className="flex items-center gap-2 font-black text-navy-950 text-base">
            <Search className="w-5 h-5 text-gold-600" />
            <span>Find Your Family Passes</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Instant Lookup
          </span>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Enter your <strong>8-digit ITS ID</strong>, <strong>Mobile Number</strong>, or <strong>Pass Token</strong> to view your family's digital event passes.
        </p>

        <form onSubmit={handlePassLookup} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Enter ITS ID, Mobile Number, or Pass Token..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-navy-900 focus:ring-2 focus:ring-gold-500 focus:outline-none font-bold text-navy-950 bg-cream-50 text-sm"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 border border-gold-500/40 shrink-0"
          >
            <Search className="w-4 h-4 text-gold-400" />
            <span>{searching ? "Searching..." : "Lookup Passes"}</span>
          </button>
        </form>
      </section>

      {/* 4. Venue & Event Location Details */}
      <section className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
        <div className="flex items-center gap-2 font-black text-navy-950 text-base border-b border-cream-200 pb-3">
          <MapPin className="w-5 h-5 text-gold-600" />
          <span>Venue & Parking Directions</span>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-sm font-black text-navy-950">
            {event?.venue || "Maharaja Lawns - Khopoli"}
          </p>
          <p className="text-slate-600 leading-relaxed font-medium">
            {event?.location || "L. M. Sable Nagar, Old Mumbai-Pune Highway, Dist. Khopoli, Maharashtra 410203"}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <a
            href={event?.mapUrl || "https://maps.google.com/?q=Maharaja+Lawns+Khopoli"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-950 font-bold text-xs border border-gold-500/40 shadow-sm transition"
          >
            <MapPin className="w-4 h-4 text-gold-600" />
            <span>Open Venue Location on Google Maps &rarr;</span>
          </a>

          <a
            href={event?.parkingMapUrl || "https://www.google.com/maps/place/18%C2%B047'39.0%22N+73%C2%B020'09.9%22E/@18.7941691,73.3335153,17z/data=!3m1!4b1!4m4!3m3!8m2!3d18.7941691!4d73.3360902!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs border border-gold-500/40 shadow-md transition"
          >
            <span>🚘 Open Parking Location in Maps ↗</span>
          </a>
        </div>
      </section>

      {/* 5. Niyaz e Hussain Payment QR Code Section (Placed Below Venue, Before Instructions) */}
      <DigitalQrCard size="large" />

      {/* 6. General Instructions Section */}
      <section className="bg-white rounded-2xl p-6 border-2 border-gold-500/60 premium-card space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <div className="flex items-center gap-2 font-black text-navy-950 text-base">
            <Info className="w-5 h-5 text-gold-600" />
            <span>General Instructions</span>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gold-600 text-white rounded-full">
            Important Notice
          </span>
        </div>

        <ul className="space-y-3 text-xs sm:text-sm text-navy-950">
          <li className="p-3.5 rounded-xl bg-navy-950 text-white font-bold leading-relaxed flex items-start gap-2.5 shadow-md border border-gold-500/40">
            <span className="text-base shrink-0">📱</span>
            <div>
              <span className="font-extrabold text-gold-400 text-sm block">Digital Entry Pass:</span>
              <span className="text-xs text-cream-100 font-semibold">
                Mumineen must <strong>show their digital pass screen on their mobile phone at the entrance counter to gain entry</strong> to the venue.
              </span>
            </div>
          </li>

          <li className="p-3.5 rounded-xl bg-gold-600 text-white font-bold leading-relaxed flex items-start gap-2.5 shadow-md border border-gold-400">
            <span className="text-base shrink-0">💳</span>
            <div>
              <span className="font-extrabold text-white text-sm block">Bring Physical ITS Card:</span>
              <span className="text-xs text-cream-100 font-semibold">
                Kindly <strong>bring your physical ITS card for scanning and verification</strong> at the entrance counter.
              </span>
            </div>
          </li>

          <li className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 font-bold text-amber-950 leading-relaxed flex items-start gap-2.5 shadow-sm">
            <span className="text-base shrink-0">🪑</span>
            <div>
              <span className="font-extrabold text-navy-950 text-sm block">Bring Your Own Chair:</span>
              <span className="text-xs text-amber-900 font-bold">
                Kindly bring your own chair if required. Chairs will <strong>NOT be provided under any circumstances</strong> at the venue.
              </span>
            </div>
          </li>

          <li className="p-3.5 rounded-xl bg-slate-900 text-white font-bold leading-relaxed flex items-start gap-2.5 shadow-md border border-navy-700">
            <span className="text-base shrink-0">🚘</span>
            <div>
              <span className="font-extrabold text-gold-400 text-sm block">🅿️ Parking Note & Guidance:</span>
              <span className="text-xs text-cream-100 font-semibold">
                Park your vehicle at designated parking space and <strong>a Khidmatguzar will guide you in parking</strong> upon arrival.
              </span>
            </div>
          </li>

          <li className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 font-bold text-navy-950 leading-relaxed flex items-start gap-2.5">
            <span className="text-base shrink-0">📌</span>
            <div>
              <span className="font-extrabold text-navy-950 text-sm block">Single Family Registration:</span>
              <span className="text-xs text-slate-700 font-medium">
                Please submit only one registration form response per family or group to ensure accurate arrangements.
              </span>
            </div>
          </li>
        </ul>

        <div className="pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-navy-950">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-gold-600 shrink-0" />
            <span>For Online Assistance: <strong>+91 98235 63647</strong></span>
          </div>
          <span className="text-slate-600 font-bold">(Huzefa bhai - Jamaat Member)</span>
        </div>
      </section>
    </div>
  );
}
