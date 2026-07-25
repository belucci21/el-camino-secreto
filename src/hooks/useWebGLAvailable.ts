"use client";

import { useEffect, useState } from "react";

export function useWebGLAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      if (process.env.NODE_ENV === "test") {
        setAvailable(false);
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        const context =
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");
        setAvailable(Boolean(context));
      } catch {
        setAvailable(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return available;
}
