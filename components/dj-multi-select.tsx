"use client";

import { useMemo, useState } from "react";

import { DjRosterProfile } from "@/lib/dj-roster";

type DjMultiSelectProps = {
  djs: DjRosterProfile[];
  value: string[];
  onChange: (nextValue: string[]) => void;
};

export function DjMultiSelect({ djs, value, onChange }: DjMultiSelectProps) {
  const [query, setQuery] = useState("");

  const selectedDjs = useMemo(
    () => value.map((id) => djs.find((dj) => dj.id === id)).filter(Boolean) as DjRosterProfile[],
    [djs, value]
  );

  const availableDjs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return djs.filter((dj) => {
      if (value.includes(dj.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [dj.name, dj.city, dj.instagram, dj.email]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [djs, query, value]);

  const showDropdown = query.trim().length > 0;

  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-[color:var(--color-brand-20)] bg-[color:var(--color-surface)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {selectedDjs.map((dj) => (
            <span
              key={dj.id}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-brand-25)] bg-[color:var(--color-brand-10)] px-3 py-1.5 text-sm text-white"
            >
              {dj.name}
              <button
                type="button"
                className="text-white/55 transition hover:text-white"
                onClick={() => onChange(value.filter((id) => id !== dj.id))}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="min-w-28 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-white/35"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca DJ"
          />
        </div>
      </div>

      {showDropdown && availableDjs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)]">
          {availableDjs.slice(0, 8).map((dj) => (
            <button
              key={dj.id}
              type="button"
              className="flex w-full items-center justify-between border-b border-[color:var(--color-border-soft)] px-4 py-3 text-left text-sm text-white transition last:border-b-0 hover:bg-[color:var(--color-brand-12)]"
              onClick={() => {
                onChange([...value, dj.id]);
                setQuery("");
              }}
            >
              <span>{dj.name}</span>
              <span className="text-white/35">
                {[dj.city, dj.instagram].filter(Boolean).join(" / ")}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
