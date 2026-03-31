"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LocationRecord, EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminLocationDetailEditorProps = {
  location: LocationRecord;
  relatedEvents: EventRecord[];
};

type LocationFormState = {
  name: string;
  address: string;
  socialLink: string;
  phone: string;
  description: string;
};

declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesPromise?: Promise<void>;
  }
}

export function AdminLocationDetailEditor({
  location,
  relatedEvents
}: AdminLocationDetailEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<LocationFormState>({
    name: location.name,
    address: location.address,
    socialLink: location.socialLink,
    phone: location.phone,
    description: location.description
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState("");
  const [autocompleteMessage, setAutocompleteMessage] = useState("");
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const mapsLink = useMemo(() => buildGoogleMapsDirectionsLink(form.address), [form.address]);

  function updateField<Key extends keyof LocationFormState>(key: Key, value: LocationFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
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
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const result = (await response.json()) as { location?: LocationRecord; error?: string };

      if (!response.ok || !result.location) {
        throw new Error(result.error || "Aggiornamento location non riuscito.");
      }

      setForm({
        name: result.location.name,
        address: result.location.address,
        socialLink: result.location.socialLink,
        phone: result.location.phone,
        description: result.location.description
      });
      setStatus("Location aggiornata.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore aggiornamento location.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Confermi di voler eliminare questa location?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setStatus("");

    try {
      const response = await fetch(`/api/locations/${location.id}`, { method: "DELETE" });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Eliminazione location non riuscita.");
      }

      router.push("/admin/locations");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore eliminazione location.");
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className={ui.surface.panel}>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <span className={ui.text.eyebrow}>Modifica location</span>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                {form.name}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome location" htmlFor="detail-location-name">
                <input
                  id="detail-location-name"
                  className={ui.form.field}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                />
              </Field>
              <Field label="Indirizzo" htmlFor="detail-location-address">
                <input
                  id="detail-location-address"
                  ref={addressInputRef}
                  className={ui.form.field}
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  required
                />
              </Field>
              <Field label="Link social" htmlFor="detail-location-social">
                <input
                  id="detail-location-social"
                  className={ui.form.field}
                  value={form.socialLink}
                  onChange={(event) => updateField("socialLink", event.target.value)}
                />
              </Field>
              <Field label="Telefono" htmlFor="detail-location-phone">
                <input
                  id="detail-location-phone"
                  className={ui.form.field}
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </Field>
              <Field label="Descrizione" htmlFor="detail-location-description" full>
                <textarea
                  id="detail-location-description"
                  className={`${ui.form.field} min-h-40 resize-y`}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </Field>
            </div>

            <p className="text-sm text-white/60">{autocompleteMessage}</p>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={ui.action.primary} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/12 px-5 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting || saving || relatedEvents.length > 0}
              >
                {deleting ? "Eliminazione..." : "Elimina location"}
              </button>
              {status ? <p className="text-sm text-white/70">{status}</p> : null}
            </div>

            {relatedEvents.length > 0 ? (
              <p className="text-sm text-amber-200">
                Questa location non puo essere eliminata finche ha eventi associati.
              </p>
            ) : null}
          </form>
        </div>

        <div className="grid gap-4">
          <div className={ui.surface.panel}>
            <span className={ui.text.eyebrow}>Scheda location</span>
            <div className="mt-4 grid gap-3 text-sm text-white/74">
              <p>
                <strong className="text-white">Nome:</strong> {form.name}
              </p>
              <p>
                <strong className="text-white">Indirizzo:</strong>{" "}
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[color:var(--color-brand)] underline-offset-4"
                >
                  {form.address}
                </a>
              </p>
              <p>
                <strong className="text-white">Telefono:</strong> {form.phone || "Non disponibile"}
              </p>
              <p>
                <strong className="text-white">Social:</strong>{" "}
                {form.socialLink ? (
                  <a
                    href={form.socialLink}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline decoration-[color:var(--color-brand)] underline-offset-4"
                  >
                    {form.socialLink}
                  </a>
                ) : (
                  "Non disponibile"
                )}
              </p>
              <p>
                <strong className="text-white">Eventi collegati:</strong> {relatedEvents.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={ui.surface.panel}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span className={ui.text.eyebrow}>Eventi associati</span>
            <h3 className="mt-2 text-xl font-semibold text-[#f7f3ee]">Programmazione nella location</h3>
          </div>
        </div>

        <div className="grid gap-4">
          {relatedEvents.length ? (
            relatedEvents.map((event) => (
              <article key={event.id} className={ui.surface.card}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="grid gap-2">
                    <h4 className="text-lg font-semibold text-[#f7f3ee]">{event.title}</h4>
                    <p className="text-sm text-white/70">
                      {new Date(event.date).toLocaleDateString("it-IT")} / {event.time}
                    </p>
                    <p className="text-sm leading-7 text-white/62">{event.description}</p>
                  </div>
                  <Link href={`/admin/eventi/${event.slug}`} className={ui.action.secondary}>
                    Apri evento
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className={ui.surface.card}>
              <p className="text-sm text-white/60">Nessun evento associato a questa location.</p>
            </div>
          )}
        </div>
      </div>
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

function buildGoogleMapsDirectionsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
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
