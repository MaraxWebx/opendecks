"use client";

import { useState } from "react";

import { AdminEventsManager } from "@/components/admin-events-manager";
import {
  DjRosterRecord,
  EventRecord,
  LocationRecord,
  TagRecord,
} from "@/lib/types";

type AdminEventsPageContentProps = {
  events: EventRecord[];
  djRoster: DjRosterRecord[];
  tags: TagRecord[];
  locations: LocationRecord[];
};

export function AdminEventsPageContent({
  events,
  djRoster,
  tags,
  locations,
}: AdminEventsPageContentProps) {
  const [createSignal, setCreateSignal] = useState(0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-3">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Eventi
          </span>
          <h1 className="text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
            Gestione eventi
          </h1>
          <p className="max-w-[42rem] text-lg leading-8 text-white/76">
            Qui tieni sotto controllo calendario, stato delle date e sedi.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
          onClick={() => setCreateSignal((current) => current + 1)}
        >
          Nuovo evento
        </button>
      </div>

      <AdminEventsManager
        initialEvents={events}
        djRoster={djRoster}
        availableTags={tags}
        availableLocations={locations}
        createSignal={createSignal}
        showCreateButton={false}
      />
    </div>
  );
}
