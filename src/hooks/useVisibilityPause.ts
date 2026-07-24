"use client";

import { useEffect } from "react";

export function useVisibilityPause(onHidden: () => void): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) onHidden();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [onHidden]);
}
