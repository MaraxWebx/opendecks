"use client";

import { useEffect, useMemo, useState } from "react";

import { EventCard } from "@/components/event-card";
import { EventRecord, TagRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type PublicEventsBrowserProps = {
  events: EventRecord[];
  tags: TagRecord[];
  initialMonthKey: string;
};

type MonthOption = {
  count: number;
  value: string;
  label: string;
  year: string;
  month: string;
};

export function PublicEventsBrowser({
  events,
  tags,
  initialMonthKey,
}: PublicEventsBrowserProps) {
  const monthOptions = useMemo<MonthOption[]>(() => {
    const monthCounts = events.reduce<Record<string, number>>((acc, event) => {
      const monthKey = getMonthKey(event.date);
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(monthCounts)
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => {
        const [year, month] = monthKey.split("-");

        return {
          count: monthCounts[monthKey],
          value: monthKey,
          label: formatMonthLabel(monthKey),
          year,
          month,
        };
      });
  }, [events]);

  const defaultMonthKey = monthOptions.some(
    (option) => option.value === initialMonthKey,
  )
    ? initialMonthKey
    : monthOptions[0]?.value || initialMonthKey;

  const defaultMonth =
    monthOptions.find((option) => option.value === defaultMonthKey) || null;

  const yearOptions = useMemo(
    () => Array.from(new Set(monthOptions.map((option) => option.year))).sort((a, b) => b.localeCompare(a)),
    [monthOptions],
  );

  const [selectedYear, setSelectedYear] = useState(
    defaultMonth?.year || yearOptions[0] || "",
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  const availableMonthsForYear = useMemo(
    () => monthOptions.filter((option) => option.year === selectedYear),
    [monthOptions, selectedYear],
  );

  useEffect(() => {
    if (
      availableMonthsForYear.length &&
      !availableMonthsForYear.some((option) => option.value === selectedMonthKey)
    ) {
      setSelectedMonthKey(availableMonthsForYear[0].value);
    }
  }, [availableMonthsForYear, selectedMonthKey]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => getMonthKey(event.date) === selectedMonthKey),
    [events, selectedMonthKey],
  );

  return (
    <section className="pb-14 md:pb-16">
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#E31F29]/18 bg-[linear-gradient(180deg,rgba(227,31,41,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
        <div className="border-b border-[#E31F29]/14 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[#E31F29]">
                Naviga Eventi
              </p>
              <p className="mt-1 text-sm text-white/62">
                Filtra il calendario pubblico per anno e mese.
              </p>
            </div>
            <div className="rounded-full border border-[#E31F29]/20 bg-black/20 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/70">
              {events.length} eventi totali
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,280px)_1fr] md:items-end">
          <div className="grid gap-2">
            <label
              htmlFor="events-filter-year"
              className="text-xs uppercase tracking-[0.18em] text-white/55"
            >
              Anno
            </label>
            <div className="relative">
              <select
                id="events-filter-year"
                className={`${ui.form.select} min-h-12 border-[#E31F29]/24 bg-[#120b0d] pr-12 text-[0.96rem] shadow-[0_16px_40px_rgba(0,0,0,0.22)]`}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#E31F29]">
                <SelectChevron />
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="events-filter-month"
              className="text-xs uppercase tracking-[0.18em] text-white/55"
            >
              Mese
            </label>
            <div className="relative">
              <select
                id="events-filter-month"
                className={`${ui.form.select} min-h-12 border-[#E31F29]/24 bg-[#120b0d] pr-12 text-[0.96rem] shadow-[0_16px_40px_rgba(0,0,0,0.22)]`}
                value={selectedMonthKey}
                onChange={(event) => setSelectedMonthKey(event.target.value)}
              >
                {availableMonthsForYear.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#E31F29]">
                <SelectChevron />
              </span>
            </div>
          </div>

          <div className="flex min-h-11 items-center justify-start md:justify-end">
            <span className="text-sm text-white/64">
              {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventi"} in{" "}
              <span className="text-white">{formatMonthLabel(selectedMonthKey)}</span>
            </span>
          </div>
        </div>
        </div>
      </div>

      {filteredEvents.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} tags={tags} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E31F29]/18 bg-white/[0.03] p-6 text-white/72">
          Nessun evento pubblicato per {formatMonthLabel(selectedMonthKey)}.
        </div>
      )}
    </section>
  );
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

function SelectChevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9.5 12 15l6-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
