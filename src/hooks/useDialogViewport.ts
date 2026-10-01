"use client";

import { useEffect } from "react";

// iOS keeps the layout viewport tall while its keyboard shrinks the visible
// viewport. Fit every dialog to the latter, including after focus/scroll.
export function useDialogViewport(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      root.style.setProperty("--journey-dialog-height", `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty("--journey-dialog-top", `${viewport?.offsetTop ?? 0}px`);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.matches("input, textarea, select") && active.closest('[role="dialog"]')) {
          const bounds = active.getBoundingClientRect();
          const top = viewport?.offsetTop ?? 0;
          const bottom = top + (viewport?.height ?? window.innerHeight);
          if (bounds.top < top + 12 || bounds.bottom > bottom - 12) active.scrollIntoView?.({ block: "nearest", inline: "nearest" });
        }
      });
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      root.style.removeProperty("--journey-dialog-height");
      root.style.removeProperty("--journey-dialog-top");
    };
  }, [open]);
}
