"use client";

import { useState, useRef, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RotateCcw,
  Clock,
  Radio,
  Camera,
  CameraOff
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function StaffCheckinPage() {
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Keep input field focused for continuous RFID / USB Barcode card scanning
    if (inputRef.current && !cameraActive) {
      inputRef.current.focus();
    }
  }, [scanResult, errorMsg, scanning, cameraActive]);

  const verifyPassToken = async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) return;

    setScanning(true);
    setScanResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/passes/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: cleanToken }),
      });

      const data = await res.json();
      setScanning(false);

      if (!res.ok && !data.status) {
        setErrorMsg(data.error || "Failed to verify pass");
        setQrInput("");
        return;
      }

      setScanResult(data);
      setQrInput("");
    } catch (err: any) {
      setScanning(false);
      setErrorMsg(err.message || "Network error");
      setQrInput("");
    }
  };

  const handleScanOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    verifyPassToken(qrInput);
  };

  const startCamera = async () => {
    setCameraActive(true);
    setErrorMsg("");
    setScanResult(null);

    setTimeout(() => {
      try {
        const qrScanner = new Html5Qrcode("reader");
        html5QrCodeRef.current = qrScanner;

        qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            verifyPassToken(decodedText);
            stopCamera();
          },
          () => {}
        ).catch((err) => {
          console.error("Camera error:", err);
          setErrorMsg("Could not access phone camera. Please grant camera permission.");
          setCameraActive(false);
        });
      } catch (err: any) {
        setErrorMsg("Camera initialization failed: " + err.message);
        setCameraActive(false);
      }
    }, 300);
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
        setCameraActive(false);
        html5QrCodeRef.current = null;
      });
    } else {
      setCameraActive(false);
    }
  };

  const handleReset = () => {
    setQrInput("");
    setScanResult(null);
    setErrorMsg("");
    if (inputRef.current && !cameraActive) inputRef.current.focus();
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="bg-navy-950 rounded-2xl p-6 text-white text-center space-y-2 border border-gold-600/30 card-shadow">
        <div className="w-12 h-12 rounded-full bg-gold-600 text-white flex items-center justify-center mx-auto shadow-md border border-gold-400/40">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Entrance Check-in Counter</span>
        </h1>
        <p className="text-xs text-amber-200">
          Khopoli Relay Centre Staff Entry Verification Portal
        </p>
      </div>

      {/* QR Code & ITS Search / Scan Input Form */}
      <div className="bg-white rounded-2xl p-6 border border-cream-300 card-shadow space-y-4">
        {/* Phone Camera Scanner Button */}
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
            Scan Method
          </span>

          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-gold-500/40"
            >
              <Camera className="w-4 h-4 text-gold-400" />
              <span>Use Phone Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <CameraOff className="w-4 h-4" />
              <span>Close Camera</span>
            </button>
          )}
        </div>

        {/* Live Video Viewport for Phone Camera */}
        {cameraActive && (
          <div className="space-y-2 text-center p-3 bg-navy-950 rounded-2xl border-2 border-gold-600 shadow-inner">
            <p className="text-xs text-gold-400 font-bold flex items-center justify-center gap-1">
              <Camera className="w-4 h-4 animate-bounce" />
              <span>Point Phone Camera at Pass QR Code</span>
            </p>
            <div id="reader" className="w-full overflow-hidden rounded-xl bg-black min-h-[250px]" />
          </div>
        )}

        <form onSubmit={handleScanOrSubmit} className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
            Search Member ITS ID or Pass QR Code
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter ITS ID or scan QR token..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-navy-900 focus:ring-2 focus:ring-gold-500 focus:outline-none text-base font-bold font-mono text-navy-950 bg-cream-50"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={scanning}
              className="px-6 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-sm transition shadow-md flex items-center gap-1.5 border border-gold-400/40"
            >
              <Search className="w-4 h-4" />
              <span>{scanning ? "Verifying..." : "Verify"}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* SCAN RESULTS DISPLAY */}
      {scanResult && (
        <div className="space-y-4 animate-scale-up">
          {/* 1. VALID PASS RESULT */}
          {scanResult.status === "VALID" && (
            <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-500 card-shadow text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow">
                  ✅ VALID PASS
                </span>
                <h2 className="text-2xl font-black text-navy-900 mt-2">
                  {scanResult.member?.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  ITS ID: <strong>{scanResult.member?.itsId}</strong> · {scanResult.member?.type === "Child" ? "Gair Baligh" : `${scanResult.member?.gender} Adult`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Family: <strong>{scanResult.member?.family?.hofName}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                <Clock className="w-4 h-4" />
                <span>Checked In At: {new Date(scanResult.checkedInAt).toLocaleTimeString()}</span>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-gold-400" />
                <span>Scan Next Pass</span>
              </button>
            </div>
          )}

          {/* 2. ALREADY CHECKED IN WARNING */}
          {scanResult.status === "ALREADY_CHECKED_IN" && (
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-gold-500 card-shadow text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3.5 py-1 rounded-full bg-gold-600 text-white text-xs font-black uppercase tracking-wider shadow">
                  ⚠️ Already Checked In
                </span>
                <h2 className="text-2xl font-black text-navy-900 mt-2">
                  {scanResult.member?.name}
                </h2>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  ITS ID: <strong>{scanResult.member?.itsId}</strong> · {scanResult.member?.gender}
                </p>
                <p className="text-xs text-amber-950 font-bold mt-2 bg-amber-100/80 p-2 rounded-lg inline-block border border-amber-200">
                  Previous Check-in Timestamp: {scanResult.checkedInAt ? new Date(scanResult.checkedInAt).toLocaleString() : "Earlier Today"}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-gold-400" />
                <span>Scan Next Pass</span>
              </button>
            </div>
          )}

          {/* 3. INVALID PASS */}
          {scanResult.status === "INVALID" && (
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-500 card-shadow text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3.5 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow">
                  ❌ INVALID PASS
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-2">
                  {scanResult.message || "This QR pass token is not recognized for this event."}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-gold-400" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
