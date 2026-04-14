"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import { BodyScrollLock } from "@/components/body-scroll-lock";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { ModalCloseButton } from "@/components/modal-close-button";
import { LocationRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminLocationsManagerProps = {
  initialLocations: LocationRecord[];
  createSignal?: number;
  showCreateButton?: boolean;
};

type LocationFormState = {
  name: string;
  address: string;
  socialLink: string;
  phone: string;
  description: string;
};

const emptyForm: LocationFormState = {
  name: "",
  address: "",
  socialLink: "",
  phone: "",
  description: ""
};

declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesPromise?: Promise<void>;
  }
}

export function AdminLocationsManager({
  initialLocations,
  createSignal = 0,
  showCreateButton = true,
}: AdminLocationsManagerProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [form, setForm] = useState<LocationFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [autocompleteMessage, setAutocompleteMessage] = useState("");
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const previousCreateSignal = useRef(createSignal);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return locations.filter((location) => {
      if (!normalizedQuery) {
        return true;
      }

      return [location.name, location.address, location.socialLink, location.phone, location.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [locations, query]);

  function updateField<Key extends keyof LocationFormState>(key: Key, value: LocationFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (createSignal !== previousCreateSignal.current) {
      previousCreateSignal.current = createSignal;
      setForm(emptyForm);
      setAutocompleteMessage("");
      setMessage("");
      setOpen(true);
    }
  }, [createSignal]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setAutocompleteMessage("Inserisci `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` per attivare i suggerimenti indirizzo.");
      return;
    }

    let cancelled = false;

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (cancelled || !addressInputRef.current || !window.google?.maps?.places) {
          return;
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "it" },
          fields: ["formatted_address", "name"]
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace?.();
          const nextAddress =
            place?.formatted_address ||
            place?.name ||
            addressInputRef.current?.value ||
            "";

          updateField("address", nextAddress);
        });

        setAutocompleteMessage("Suggerimenti Google attivi.");
      })
      .catch(() => {
        if (!cancelled) {
          setAutocompleteMessage("Autocomplete Google non disponibile. Puoi comunque inserire l'indirizzo a mano.");
        }
      });

    return () => {
      cancelled = true;

      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = null;
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = (await response.json()) as { location?: LocationRecord; error?: string };

      if (!response.ok || !result.location) {
        throw new Error(result.error || "Salvataggio location non riuscito.");
      }

      setLocations((current) =>
        [...current, result.location!].sort((a, b) => a.name.localeCompare(b.name, "it"))
      );
      setForm(emptyForm);
      setOpen(false);
      setMessage("Location aggiunta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore salvataggio location.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Eliminazione location non riuscita.");
      }

      setLocations((current) => current.filter((item) => item.id !== id));
      setMessage("Location eliminata.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore eliminazione location.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      {showCreateButton ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className={ui.action.primary}
            onClick={() => {
              setForm(emptyForm);
              setAutocompleteMessage("");
              setMessage("");
              setOpen(true);
            }}
          >
            Nuova location
          </button>
          <p className="min-h-6 text-sm text-white/70" aria-live="polite">
            {message}
          </p>
        </div>
      ) : message ? (
        <p className="min-h-6 text-sm text-white/70" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className={`${ui.surface.panel} min-w-0`}>
        <div className="mb-4 grid gap-2">
          <label htmlFor="locations-query" className={ui.form.label}>
            Cerca location
          </label>
          <input
            id="locations-query"
            className={ui.form.field}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, indirizzo, social..."
          />
        </div>

        <div className="grid gap-4">
          {filteredLocations.map((location) => (
            <article key={location.id} className={`${ui.surface.card} min-w-0`}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="grid min-w-0 gap-3">
                  <h3 className="break-words text-lg font-semibold text-[#f7f3ee]">{location.name}</h3>
                  <p className="break-words text-sm leading-7 text-white/74">{location.address}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-white/55">
                    {location.phone ? (
                      <span className="rounded-md bg-white/5 px-3 py-1.5">{location.phone}</span>
                    ) : null}
                    {location.socialLink ? (
                      <a
                        href={location.socialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-white/5 px-3 py-1.5 break-all underline decoration-[color:var(--color-brand)] underline-offset-4 transition hover:bg-[color:var(--color-brand-10)]"
                      >
                        {location.socialLink}
                      </a>
                    ) : null}
                  </div>
                  {location.description ? (
                    <p className="line-clamp-2 text-sm leading-7 text-white/65">{location.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/locations/${location.id}` as Route} className={ui.action.secondary}>
                    Apri scheda
                  </Link>
                  <DeleteIconButton
                    onClick={() => handleDelete(location.id)}
                    disabled={busyId === location.id}
                    busy={busyId === location.id}
                    label={`Elimina location ${location.name}`}
                  />
                </div>
              </div>
            </article>
          ))}
          {!filteredLocations.length ? (
            <div className={ui.surface.card}>
              <p className="text-sm text-white/60">Nessuna location disponibile.</p>
            </div>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <BodyScrollLock />
          <div className="absolute inset-0 bg-black/72" onClick={() => setOpen(false)} />
          <div className={`${ui.surface.modal} max-w-3xl`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">Nuova location</span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  Inserisci location
                </h3>
              </div>
              <ModalCloseButton onClick={() => setOpen(false)} />
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome location" htmlFor="location-name">
                  <input
                    id="location-name"
                    className={ui.form.field}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Indirizzo" htmlFor="location-address">
                  <input
                    id="location-address"
                    ref={addressInputRef}
                    className={ui.form.field}
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Inizia a scrivere l'indirizzo..."
                    required
                  />
                </Field>
                <Field label="Link social" htmlFor="location-social">
                  <input
                    id="location-social"
                    className={ui.form.field}
                    value={form.socialLink}
                    onChange={(event) => updateField("socialLink", event.target.value)}
                  />
                </Field>
                <Field label="Telefono" htmlFor="location-phone">
                  <input
                    id="location-phone"
                    className={ui.form.field}
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                </Field>
                <Field label="Descrizione" htmlFor="location-description" full>
                  <textarea
                    id="location-description"
                    className={`${ui.form.field} min-h-28 resize-y`}
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                  />
                </Field>
              </div>

              <p className="text-sm text-white/60">{autocompleteMessage}</p>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className={ui.action.primary} disabled={saving}>
                  {saving ? "Salvataggio..." : "Aggiungi location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function loadGoogleMapsPlaces(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window non disponibile."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (window.__googleMapsPlacesPromise) {
    return window.__googleMapsPlacesPromise;
  }

  window.__googleMapsPlacesPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Script Google Maps non caricato."));
    document.head.appendChild(script);
  });

  return window.__googleMapsPlacesPromise;
}

function Field({
  label,
  htmlFor,
  full = false,
  children
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
