"use client";

import { useEffect } from "react";

export default function ScreenshotGuard() {
  useEffect(() => {
    // 1. Intercept PrintScreen and clear clipboard
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(""); // Wipe out clipboard data
        }
        alert("Screenshots are restricted on this platform.");
      }
    };

    // 2. Intercept Print / Save commands
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "p") {
        e.preventDefault();
        e.stopPropagation();
        alert("Printing is disabled.");
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
