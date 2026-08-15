"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-cream-50 font-sans antialiased text-navy-950 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 bg-white rounded-3xl border-2 border-navy-900 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-red-200">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-navy-950">Application Exception</h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {error?.message || "An unexpected error occurred while loading this page."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
            >
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
      </body>
    </html>
  );
}
