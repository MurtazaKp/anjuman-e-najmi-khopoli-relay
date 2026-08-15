import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border-2 border-navy-900 shadow-2xl text-center space-y-5">
      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-amber-300">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black tracking-widest text-gold-600 uppercase">
          404 Not Found
        </span>
        <h2 className="text-xl font-black text-navy-950">Page Not Found</h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          The requested page or digital pass could not be found. Please check your link or register your family.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
        <Link
          href="/register"
          className="px-5 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 border border-gold-400"
        >
          <span>Register Family</span>
        </Link>

        <Link
          href="/"
          className="px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4 text-gold-400" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
