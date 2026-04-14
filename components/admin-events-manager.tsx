"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { buildDjRosterProfiles, getEventLineupDjs } from "@/lib/dj-roster";
import {
  DjRosterRecord,
  EventRecord,
  LocationRecord,
  TagRecord,
} from "@/lib/types";
import { ui } from "@/lib/ui";
import { GlobalLoader } from "@/components/global-loader";
import { DjMultiSelect } from "@/components/dj-multi-select";
import { ModalCloseButton } from "@/components/modal-close-button";
import { TagMultiSelect } from "@/components/tag-multi-select";

type AdminEventsManagerProps = {
  initialEvents: EventRecord[];
  djRoster: DjRosterRecord[];
  availableTags: TagRecord[];
  availableLocations: LocationRecord[];
  createSignal?: number;
  showCreateButton?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
};

type EventFormState = {
  title: string;
  locationId: string;
  coverImage: string;
  date: string;
  time: string;
  description: string;
  applicationsOpen: boolean;
  lineupDjIds: string[];
  tagIds: string[];
};

const emptyForm: EventFormState = {
  title: "",
  locationId: "",
  coverImage: "",
  date: "",
  time: "",
  description: "",
  applicationsOpen: true,
  lineupDjIds: [],
  tagIds: [],
};

export function AdminEventsManager({
  initialEvents,
  djRoster,
  availableTags,
  availableLocations,
  createSignal = 0,
  showCreateButton = true,
  onCreateOpenChange,
}: AdminEventsManagerProps) {
  const [events, setEvents] = useState(initialEvents);
  const [tags, setTags] = useState(availableTags);
  const [locations] = useState(availableLocations);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const createPanelRef = useRef<HTMLDivElement | null>(null);
  const previousCreateSignal = useRef(createSignal);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.date.localeCompare(a.date)),
    [events],
  );
  const locationsByFilter = useMemo(
    () =>
      Array.from(
        new Map(
          events.map((event) => [
            event.locationId,
            { id: event.locationId, name: event.locationName },
          ]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name, "it")),
    [events],
  );
  const months = useMemo(
    () =>
      Array.from(
        new Set(
          events.map((event) => {
            const date = new Date(event.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          }),
        ),
      ).sort(),
    [events],
  );
  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const eventMonth = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      const matchesQuery =
        !normalizedQuery ||
        [event.title, event.locationName, event.locationAddress, event.slug]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesLocation =
        locationFilter === "all" || event.locationId === locationFilter;
      const matchesMonth = monthFilter === "all" || eventMonth === monthFilter;

      return matchesQuery && matchesLocation && matchesMonth;
    });
  }, [locationFilter, monthFilter, query, sortedEvents]);
  const lineupOptions = useMemo(
    () => buildDjRosterProfiles(djRoster),
    [djRoster],
  );
  const activeCalendarMonth = useMemo(() => {
    if (monthFilter !== "all") {
      return monthFilter;
    }

    const todayMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    if (months.includes(todayMonth)) {
      return todayMonth;
    }

    return months[0] || todayMonth;
  }, [monthFilter, months]);
  const calendarEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const eventMonth = `${new Date(event.date).getFullYear()}-${String(
          new Date(event.date).getMonth() + 1,
        ).padStart(2, "0")}`;
        return eventMonth === activeCalendarMonth;
      }),
    [activeCalendarMonth, filteredEvents],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(activeCalendarMonth, calendarEvents),
    [activeCalendarMonth, calendarEvents],
  );
  useEffect(() => {
    if (createSignal !== previousCreateSignal.current) {
      previousCreateSignal.current = createSignal;
      setForm(emptyForm);
      setImageFile(null);
      setOpen(true);
    }
  }, [createSignal]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      createPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    onCreateOpenChange?.(open);
  }, [onCreateOpenChange, open]);

  function updateField<Key extends keyof EventFormState>(
    key: Key,
    value: EventFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function shiftCalendarMonth(direction: -1 | 1) {
    if (!months.length) {
      return;
    }

    const currentIndex = months.indexOf(activeCalendarMonth);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = Math.min(
      Math.max(safeIndex + direction, 0),
      months.length - 1,
    );
    setMonthFilter(months[nextIndex]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      let coverImage = form.coverImage;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/event-image", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          const uploadResult = (await uploadResponse
            .json()
            .catch(() => null)) as { error?: string } | null;
          throw new Error(
            uploadResult?.error || "Upload immagine non riuscito.",
          );
        }

        const uploadResult = (await uploadResponse.json()) as { url: string };
        coverImage = uploadResult.url;
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage,
          lineupDjIds: form.lineupDjIds,
          tagIds: form.tagIds,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error || "Salvataggio evento non riuscito.",
        );
      }

      const result = (await response.json()) as { event: EventRecord };
      setEvents((current) => [...current, result.event]);
      setForm(emptyForm);
      setImageFile(null);
      setOpen(false);
      setStatus("Evento aggiunto correttamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore salvataggio evento.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      {!open ? (
        <>
          {showCreateButton ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={ui.action.primary}
                onClick={() => {
                  setForm(emptyForm);
                  setImageFile(null);
                  setStatus("");
                  setOpen(true);
                }}
              >
                Nuovo evento
              </button>
              <p className="min-h-6 text-sm text-white/65" aria-live="polite">
                {status}
              </p>
            </div>
          ) : status ? (
            <p className="min-h-6 text-sm text-white/65" aria-live="polite">
              {status}
            </p>
          ) : null}

          <div className={`${ui.surface.panel} min-w-0 p-0 sm:p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${ui.action.secondary} ${viewMode === "list" ? ui.nav.sidebarActive : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="Vista lista"
                  title="Vista lista"
                >
                  <ListViewIcon />
                </button>
                <button
                  type="button"
                  className={`${ui.action.secondary} ${viewMode === "calendar" ? ui.nav.sidebarActive : ""}`}
                  onClick={() => setViewMode("calendar")}
                  aria-label="Vista calendario"
                  title="Vista calendario"
                >
                  <CalendarViewIcon />
                </button>
              </div>
              {viewMode === "calendar" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={ui.action.secondary}
                    onClick={() => shiftCalendarMonth(-1)}
                    disabled={!months.length || activeCalendarMonth === months[0]}
                    aria-label="Mese precedente"
                    title="Mese precedente"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <span className="min-w-36 text-center text-sm text-white/80">
                    {formatMonth(activeCalendarMonth)}
                  </span>
                  <button
                    type="button"
                    className={ui.action.secondary}
                    onClick={() => shiftCalendarMonth(1)}
                    disabled={
                      !months.length ||
                      activeCalendarMonth === months[months.length - 1]
                    }
                    aria-label="Mese successivo"
                    title="Mese successivo"
                  >
                    <ArrowRightIcon />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
              <div className="grid gap-2">
                <label htmlFor="events-query" className={ui.form.label}>
                  Cerca
                </label>
                <input
                  id="events-query"
                  className={ui.form.field}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Titolo, location, indirizzo..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="events-location" className={ui.form.label}>
                  Location
                </label>
                <select
                  id="events-location"
                  className={ui.form.select}
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                >
                  <option value="all">Tutti</option>
                  {locationsByFilter.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="events-month" className={ui.form.label}>
                  Mese
                </label>
                <select
                  id="events-month"
                  className={ui.form.select}
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                >
                  <option value="all">Tutti</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5 md:hidden">
              <span className={ui.form.label}>Calendario rapido</span>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  className={`${ui.action.secondary} shrink-0`}
                  onClick={() => setMonthFilter("all")}
                >
                  Tutti
                </button>
                {months.map((month) => (
                  <button
                    key={month}
                    type="button"
                    className={`shrink-0 rounded-lg border px-4 py-3 text-sm transition ${
                      monthFilter === month
                        ? ui.nav.sidebarActive
                        : ui.nav.sidebarIdle
                    }`}
                    onClick={() => setMonthFilter(month)}
                  >
                    {formatMonth(month)}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === "calendar" ? (
              <div className="grid gap-4">
                <div className="-mx-1 overflow-x-auto pb-2">
                  <div className="grid min-w-[42rem] grid-cols-7 gap-2 px-1 md:min-w-0">
                    {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
                      (day) => (
                        <div
                          key={day}
                          className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)] px-2 py-3 text-center text-xs uppercase tracking-[0.16em] text-white/55"
                        >
                          {day}
                        </div>
                      ),
                    )}
                    {calendarDays.map((day) => (
                      <div
                        key={day.date}
                        className={`min-h-36 min-w-0 rounded-lg border p-3 align-top ${
                          day.inCurrentMonth
                            ? "border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]"
                            : "border-[color:var(--color-brand-10)] bg-black/20"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-medium ${
                              day.inCurrentMonth ? "text-white" : "text-white/35"
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          {day.events.length ? (
                            <span className="shrink-0 rounded-full bg-[color:var(--color-brand-12)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
                              {day.events.length}
                            </span>
                          ) : null}
                        </div>

                        <div className="grid min-w-0 gap-2">
                          {day.events.map((event) => (
                            <Link
                              key={event.id}
                              href={`/admin/eventi/${event.slug}`}
                              className="min-w-0 rounded-lg border border-[color:var(--color-brand-14)] bg-[color:var(--color-brand-10)] p-2 transition hover:border-[color:var(--color-brand-38)] hover:bg-[color:var(--color-brand-12)]"
                              title={`Apri ${event.title}`}
                            >
                              <p className="text-xs break-words font-medium leading-5 text-white">
                                {event.title}
                              </p>
                              <p className="mt-1 break-words text-[11px] leading-4 text-white/70">
                                {event.time} / {event.locationName}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!calendarEvents.length ? (
                  <div className={ui.surface.card}>
                    <p className="text-sm text-white/65">
                      Nessun evento trovato per il mese selezionato con i filtri
                      attuali.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className={`${ui.surface.card} min-w-0`}>
                    <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)] md:items-start">
                      <div className="overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                        <img
                          src={event.coverImage}
                          alt={event.coverAlt}
                          className=" w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2 text-sm text-white/58">
                          <span>
                            {new Date(event.date).toLocaleDateString("it-IT")}
                          </span>
                          <span>{event.locationName}</span>
                          <span>{event.status}</span>
                        </div>
                        <h3 className="mb-2 break-words text-lg font-semibold text-[#f7f3ee]">
                          {event.title}
                        </h3>
                        <p className="break-words text-sm leading-7 text-white/74">
                          {event.locationAddress} / {event.time}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link
                            href={`/admin/eventi/${event.slug}`}
                            className={ui.action.secondary}
                          >
                            Apri dettaglio
                          </Link>
                        </div>
                        <div className="mt-3">
                          <span className={ui.form.label}>Line up</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getEventLineupDjs(event, djRoster).length ? (
                              getEventLineupDjs(event, djRoster).map((record) => (
                                <span
                                  key={record.id}
                                  className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-emerald-300"
                                >
                                  {record.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-white/45">
                                Nessun DJ in line up.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      {open ? (
        <div ref={createPanelRef} className="order-first grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className={ui.surface.panel}>
              <div className="grid gap-5">
                <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
                  <div className="justify-self-end sm:order-2">
                    <ModalCloseButton
                      onClick={() => setOpen(false)}
                      disabled={saving}
                      label="Chiudi creazione evento"
                    />
                  </div>
                  <div className="grid min-w-0 gap-2 sm:order-1">
                    <span className={ui.text.eyebrow}>Nuovo evento</span>
                    <h2 className="break-words text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                      Inserisci evento
                    </h2>
                    <p className="text-sm leading-7 text-white/68">
                      Crea un nuovo evento nello stesso layout admin, senza uscire dalla pagina.
                    </p>
                  </div>
                </div>

                {status ? (
                  <p className="text-sm text-white/70" aria-live="polite">
                    {status}
                  </p>
                ) : null}

                {saving ? (
                  <GlobalLoader
                    eyebrow="Salvataggio in corso"
                    title="Stiamo mettendo il disco sul piatto"
                    description="L'evento viene creato ora. Aspetta un istante e poi tornerai alla lista aggiornata."
                  />
                ) : (
                  <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Titolo" htmlFor="event-title">
                        <input
                          id="event-title"
                          className={ui.form.field}
                          value={form.title}
                          onChange={(event) =>
                            updateField("title", event.target.value)
                          }
                          required
                        />
                      </Field>
                      <Field label="Location" htmlFor="event-location">
                        <select
                          id="event-location"
                          className={ui.form.select}
                          value={form.locationId}
                          onChange={(event) =>
                            updateField("locationId", event.target.value)
                          }
                          required
                        >
                          <option value="">Seleziona location</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name} / {location.address}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Data" htmlFor="event-date">
                        <input
                          id="event-date"
                          type="date"
                          className={ui.form.field}
                          value={form.date}
                          onChange={(event) =>
                            updateField("date", event.target.value)
                          }
                          required
                        />
                      </Field>
                      <Field label="Orario" htmlFor="event-time">
                        <input
                          id="event-time"
                          type="time"
                          className={ui.form.field}
                          value={form.time}
                          onChange={(event) =>
                            updateField("time", event.target.value)
                          }
                          required
                        />
                      </Field>
                      <Field
                        label="Candidature aperte"
                        htmlFor="event-applications"
                      >
                        <select
                          id="event-applications"
                          className={ui.form.select}
                          value={form.applicationsOpen ? "yes" : "no"}
                          onChange={(event) =>
                            updateField(
                              "applicationsOpen",
                              event.target.value === "yes",
                            )
                          }
                        >
                          <option value="yes">Si</option>
                          <option value="no">No</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Carica immagine" htmlFor="event-cover-file">
                        <input
                          id="event-cover-file"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          className={ui.form.field}
                          onChange={(event) =>
                            setImageFile(event.target.files?.[0] || null)
                          }
                        />
                      </Field>
                      <Field label="Descrizione" htmlFor="event-description">
                        <textarea
                          id="event-description"
                          className={`${ui.form.field} min-h-32 resize-y`}
                          value={form.description}
                          onChange={(event) =>
                            updateField("description", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4">
                      <Field
                        label="Line up dal roster"
                        htmlFor="event-lineup"
                        full
                      >
                        <div id="event-lineup">
                          <DjMultiSelect
                            djs={lineupOptions}
                            value={form.lineupDjIds}
                            onChange={(nextValue) =>
                              updateField("lineupDjIds", nextValue)
                            }
                          />
                        </div>
                      </Field>
                      <Field label="Tag" htmlFor="event-tags" full>
                        <div id="event-tags">
                          <TagMultiSelect
                            tags={tags}
                            value={form.tagIds}
                            onChange={(nextValue) =>
                              updateField("tagIds", nextValue)
                            }
                            onTagsChange={setTags}
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className={ui.action.primary}
                        disabled={saving}
                      >
                        Salva evento
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:order-2">
              <div className={ui.surface.panel}>
                <span className={ui.text.eyebrow}>Anteprima</span>
                <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                  {imageFile || form.coverImage ? (
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : form.coverImage}
                      alt={buildEventCoverAlt(form.title, form.locationId, locations)}
                      className="w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-72 place-items-center bg-white/4 px-6 text-center text-sm text-white/45">
                      Carica una cover per vedere l'anteprima dell'evento.
                    </div>
                  )}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-white/74">
                  <p>
                    <strong className="text-white">Titolo:</strong>{" "}
                    {form.title || "Non impostato"}
                  </p>
                  <p>
                    <strong className="text-white">Location:</strong>{" "}
                    {locations.find((item) => item.id === form.locationId)?.name ||
                      "Non selezionata"}
                  </p>
                  <p>
                    <strong className="text-white">Indirizzo:</strong>{" "}
                    {locations.find((item) => item.id === form.locationId)
                      ?.address || "Non disponibile"}
                  </p>
                  <p>
                    <strong className="text-white">Data:</strong>{" "}
                    {form.date
                      ? `${new Date(form.date).toLocaleDateString("it-IT")} / ${form.time || "--:--"}`
                      : "Non impostata"}
                  </p>
                  <p>
                    <strong className="text-white">Candidature aperte:</strong>{" "}
                    {form.applicationsOpen ? "Si" : "No"}
                  </p>
                  <p>
                    <strong className="text-white">Slug:</strong>{" "}
                    {form.title ? createSlug(form.title) : "Non disponibile"}
                  </p>

                  <span className={ui.text.eyebrow}>Line up selezionata</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lineupOptions.filter((record) =>
                      form.lineupDjIds.includes(record.id),
                    ).length ? (
                      lineupOptions
                        .filter((record) => form.lineupDjIds.includes(record.id))
                        .map((record) => (
                          <span
                            key={record.id}
                            className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-emerald-300"
                          >
                            {record.name}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-white/45">
                        Nessun DJ in line up.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  full = false,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-2 ${full ? "md:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className={ui.form.label}>
        {label}
      </label>
      {children}
    </div>
  );
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarDays(month: string, events: EventRecord[]) {
  const [year, monthNumber] = month.split("-");
  const currentMonthDate = new Date(Number(year), Number(monthNumber) - 1, 1);
  const firstDay = new Date(currentMonthDate);
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(currentMonthDate);
  gridStart.setDate(currentMonthDate.getDate() - firstWeekDay);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const isoDate = cellDate.toISOString().slice(0, 10);
    const dayEvents = events.filter((event) => event.date === isoDate);

    return {
      date: isoDate,
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === currentMonthDate.getMonth(),
      events: dayEvents,
    };
  });
}

function buildEventCoverAlt(
  title: string,
  locationId: string,
  locations: LocationRecord[],
) {
  const location = locations.find((item) => item.id === locationId);
  return (
    [title, location?.name].filter(Boolean).join(" - ") || "Copertina evento"
  );
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ListViewIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6h10M9 12h10M9 18h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="5" cy="6" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CalendarViewIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.75"
        y="5.75"
        width="16.5"
        height="14.5"
        rx="2.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 3.75v4M16.5 3.75v4M3.75 9.25h16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9.5 5.5 6.5 6.5-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
