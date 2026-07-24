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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [onHidden, onVisible]);
}
