"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border-2 border-navy-900 shadow-2xl text-center space-y-5">
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-red-200">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-black text-navy-950">Something went wrong</h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
        <button
          onClick={() => reset()}
          className="px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 border border-gold-500/40"
        >
          <RefreshCw className="w-4 h-4 text-gold-400" />
          <span>Try Again</span>
        </button>

        <a
          href="/"
          className="px-5 py-3 rounded-xl bg-cream-200 hover:bg-cream-300 text-navy-950 font-bold text-xs border border-cream-300 transition flex items-center justify-center"
        >
          <span>Return Home</span>
        </a>
      </div>
    </div>
  );
}
