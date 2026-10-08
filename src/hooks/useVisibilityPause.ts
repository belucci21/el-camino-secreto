"use client";

import { useEffect } from "react";

export function useVisibilityPause(
  onHidden: () => void,
  onVisible?: () => void,
): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        onHidden();
      } else {
        onVisible?.();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    // Returning from an external app on iOS may restore the page from the
    // back/forward cache without a matching visibilitychange event.
    window.addEventListener("pagehide", onHidden);
    window.addEventListener("pageshow", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", onHidden);
      window.removeEventListener("pageshow", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [onHidden, onVisible]);
}
