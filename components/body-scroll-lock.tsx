"use client";

import { useEffect } from "react";

type BodyStyleSnapshot = {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  paddingRight: string;
};

declare global {
  interface Window {
    __opendecksBodyLockCount?: number;
    __opendecksBodyLockScrollY?: number;
    __opendecksBodyLockSnapshot?: BodyStyleSnapshot;
  }
}

export function BodyScrollLock() {
  useEffect(() => {
    const currentCount = window.__opendecksBodyLockCount || 0;

    if (currentCount === 0) {
      const scrollbarCompensation =
        window.innerWidth - document.documentElement.clientWidth;

      window.__opendecksBodyLockScrollY = window.scrollY;
      window.__opendecksBodyLockSnapshot = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
      };

      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.__opendecksBodyLockScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";

      if (scrollbarCompensation > 0) {
        document.body.style.paddingRight = `${scrollbarCompensation}px`;
      }
    }

    window.__opendecksBodyLockCount = currentCount + 1;

    return () => {
      const nextCount = Math.max((window.__opendecksBodyLockCount || 1) - 1, 0);
      window.__opendecksBodyLockCount = nextCount;

      if (nextCount === 0) {
        const snapshot = window.__opendecksBodyLockSnapshot;
        const scrollY = window.__opendecksBodyLockScrollY || 0;

        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");
        document.body.style.overflow = snapshot?.overflow || "";
        document.body.style.position = snapshot?.position || "";
        document.body.style.top = snapshot?.top || "";
        document.body.style.left = snapshot?.left || "";
        document.body.style.right = snapshot?.right || "";
        document.body.style.width = snapshot?.width || "";
        document.body.style.paddingRight = snapshot?.paddingRight || "";

        window.__opendecksBodyLockSnapshot = undefined;
        window.__opendecksBodyLockScrollY = undefined;
        window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      }
    };
  }, []);

  return null;
}
