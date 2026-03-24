"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __opendecksBodyLockCount?: number;
  }
}

export function BodyScrollLock() {
  useEffect(() => {
    const currentCount = window.__opendecksBodyLockCount || 0;
    window.__opendecksBodyLockCount = currentCount + 1;
    document.body.classList.add("modal-open");

    return () => {
      const nextCount = Math.max((window.__opendecksBodyLockCount || 1) - 1, 0);
      window.__opendecksBodyLockCount = nextCount;

      if (nextCount === 0) {
        document.body.classList.remove("modal-open");
      }
    };
  }, []);

  return null;
}
