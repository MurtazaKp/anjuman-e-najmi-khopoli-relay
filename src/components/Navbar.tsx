"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  QrCode,
  Home,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/register", label: "Register Family", icon: Calendar, highlight: true },
    { href: "/checkin", label: "Staff Check-in", icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-50 navy-header text-white shadow-lg border-b-2 border-gold-600">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo with Custom Uploaded Image */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-3 font-bold text-lg tracking-wide hover:opacity-95"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold-400 shadow-md bg-gold-600 shrink-0">
            <img
              src="/logo.jpg"
              alt="Anjuman E Najmi Khopoli"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wide text-white leading-tight">
              Anjuman E Najmi Khopoli
            </span>
            <span className="text-[10px] text-amber-200 font-bold tracking-wider uppercase">
              Khopoli Relay Centre
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-bold">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              pathname === "/" ? "bg-white/20 text-white font-extrabold" : "hover:bg-white/10 text-cream-100"
            }`}
          >
            <Home className="w-4 h-4 text-gold-400" />
            <span>Home</span>
          </Link>

          <Link
            href="/register"
            className="px-3.5 py-1.5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white font-black transition flex items-center gap-1.5 shadow-md border border-gold-400/40"
          >
            <Calendar className="w-4 h-4" />
            <span>Register</span>
          </Link>

          <Link
            href="/checkin"
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              pathname === "/checkin" ? "bg-white/20 text-white font-extrabold" : "hover:bg-white/10 text-cream-100"
            }`}
          >
            <QrCode className="w-4 h-4 text-gold-400" />
            <span>Check-in</span>
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={toggleMobileMenu}
          type="button"
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-gold-600/50 transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-amber-300" /> : <Menu className="w-6 h-6 text-gold-400" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-950 border-t border-gold-600/40 p-4 space-y-2 animate-fade-in shadow-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  link.highlight
                    ? "bg-gold-600 text-white font-black shadow-md border border-gold-400/40"
                    : isActive
                    ? "bg-white/15 text-amber-300 font-extrabold border border-amber-300/30"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Icon className={`w-5 h-5 ${link.highlight ? "text-white" : "text-gold-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
