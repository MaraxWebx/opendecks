"use client";

import { useEffect } from "react";

export function AdminBodyClass() {
  useEffect(() => {
    document.body.classList.add("admin-private");

    return () => {
      document.body.classList.remove("admin-private");
    };
  }, []);

  return null;
}
