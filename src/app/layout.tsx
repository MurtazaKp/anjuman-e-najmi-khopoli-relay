import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Anjuman E Najmi Khopoli — Event Registration & Digital Pass",
  description: "Official mobile-friendly event registration and digital QR pass portal for Anjuman E Najmi Khopoli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-cream-50 antialiased text-navy-900 font-sans">
        {/* Navigation Bar with Mobile Hamburger Menu */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="bg-navy-950 text-slate-300 py-6 border-t-2 border-gold-600 text-center text-xs font-medium">
          <div className="max-w-4xl mx-auto px-4 space-y-2">
            <p className="font-extrabold text-amber-300 text-sm tracking-wide">Anjuman E Najmi Khopoli</p>
            <p className="text-white">Urs Al-Dai Al-Ajal Syedna Mohammed Burhanuddin R.A. 1448H</p>
            <p className="text-slate-400 text-[11px]">
              Khopoli Relay Centre · Digital Pass System
            </p>
            <p className="pt-2 border-t border-navy-800/80 text-[10px] text-slate-400 font-normal">
              Developed by{" "}
              <a
                href="https://murtaza-dev.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-300/90 hover:text-amber-200 underline decoration-gold-500/40 hover:decoration-amber-300 transition"
              >
                Murtaza Khopoliwala
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
