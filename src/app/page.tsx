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

      {/* 2. Main Action Buttons */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isRegistrationOpen ? (
          <Link
            href="/register"
            className="flex items-center justify-between p-5 rounded-2xl bg-gold-600 hover:bg-gold-700 text-white font-black text-lg shadow-lg hover:shadow-xl transition group transform hover:-translate-y-0.5 border border-gold-400/40"
          >
            <div className="space-y-1">
              <span className="block text-xs uppercase tracking-wider text-amber-100 font-bold">
                Event Registration
              </span>
              <span>Register Family</span>
            </div>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="p-5 rounded-2xl bg-cream-100 text-navy-900 font-medium text-sm flex items-center gap-3 border border-cream-300 shadow-sm">
            <AlertCircle className="w-6 h-6 text-navy-900 shrink-0" />
            <div>
              <p className="font-extrabold text-navy-900">Registration Closed</p>
              <p className="text-xs text-navy-900/80 font-medium">
                Registrations for this event have closed. Digital passes will be issued shortly.
              </p>
            </div>
          </div>
        )}

        <Link
          href="/checkin"
          className="flex items-center justify-between p-5 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-black text-base shadow-md hover:shadow-lg transition group border border-navy-800"
        >
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-wider text-amber-300 font-bold">
              Venue Entry
            </span>
            <span>Staff Check-in Scanner</span>
          </div>
          <QrCode className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform" />
        </Link>
      </section>

      {/* 3. Pass Lookup Form */}
      <section className="bg-white rounded-2xl p-5 border-1.5 border-cream-300 premium-card space-y-3">
        <div className="flex items-center gap-2 font-black text-navy-900 text-base">
          <Search className="w-5 h-5 text-gold-600" />
          <span>Already Registered? Find Your Passes</span>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Enter your HOF ITS ID or Pass Link Token to view your family's digital QR passes.
        </p>

        <form onSubmit={handlePassLookup} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter HOF ITS ID or Pass Token..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-cream-300 focus:ring-2 focus:ring-navy-900 focus:outline-none font-semibold text-navy-950 bg-white text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition"
          >
            {searching ? "Searching..." : "Lookup Passes"}
          </button>
        </form>
      </section>

      {/* 4. Venue & Event Location Details */}
      <section className="bg-white rounded-2xl p-6 border border-cream-300 premium-card space-y-4">
        <div className="flex items-center gap-2 font-black text-navy-950 text-base border-b border-cream-200 pb-3">
          <MapPin className="w-5 h-5 text-gold-600" />
          <span>Venue & Directions</span>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-sm font-black text-navy-950">
            {event?.venue || "Maharaja Lawns - Khopoli"}
          </p>
          <p className="text-slate-600 leading-relaxed font-medium">
            {event?.location || "L. M. Sable Nagar, Old Mumbai-Pune Highway, Dist. Khopoli, Maharashtra 410203"}
          </p>
        </div>

        <div className="pt-2">
          <a
            href={event?.mapUrl || "https://maps.google.com/?q=Maharaja+Lawns+Khopoli"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-950 font-bold text-xs border border-gold-500/40 shadow-sm transition"
          >
            <MapPin className="w-4 h-4 text-gold-600" />
            <span>Open Location on Google Maps &rarr;</span>
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
            Notice
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-navy-950">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 font-bold text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="text-base shrink-0">📌</span>
            <span>Note: Please submit only one response per family or group to ensure accurate results.</span>
          </div>

          <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-navy-950">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-gold-600 shrink-0" />
              <span>For Online Assistance: <strong>+91 98235 63647</strong></span>
            </div>
            <span className="text-slate-600 font-bold">(Huzefa bhai - Jamaat Member)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
