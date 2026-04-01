"use client";

import { useState } from "react";

import { AdminLocationsManager } from "@/components/admin-locations-manager";
import { LocationRecord } from "@/lib/types";

type AdminLocationsPageContentProps = {
  locations: LocationRecord[];
};

export function AdminLocationsPageContent({
  locations,
}: AdminLocationsPageContentProps) {
  const [createSignal, setCreateSignal] = useState(0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-3">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Locations
          </span>
          <h1 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
            Gestione locations
          </h1>
          <p className="max-w-[42rem] text-lg leading-8 text-white/76">
            Crea e organizza gli spazi da collegare agli eventi.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
          onClick={() => setCreateSignal((current) => current + 1)}
        >
          Nuova location
        </button>
      </div>

      <AdminLocationsManager
        initialLocations={locations}
        createSignal={createSignal}
        showCreateButton={false}
      />
    </div>
  );
}
