"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DjRosterRecord, EventRecord, TagRecord } from "@/lib/types";
import { ui } from "@/lib/ui";
import { TagMultiSelect } from "@/components/tag-multi-select";

type AdminEventDetailEditorProps = {
  event: EventRecord;
  approvedDjs: DjRosterRecord[];
  availableTags: TagRecord[];
};

type EventFormState = {
  title: string;
  city: string;
  venue: string;
  coverImage: string;
  coverAlt: string;
  date: string;
  time: string;
  excerpt: string;
  description: string;
  applicationsOpen: boolean;
  tagIds: string[];
  status: EventRecord["status"];
};

type DeleteState = {
  open: boolean;
  requiresForce: boolean;
  linkedApplicationsCount: number;
  linkedDjCount: number;
  message: string;
};

export function AdminEventDetailEditor({
  event,
  approvedDjs,
  availableTags
}: AdminEventDetailEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormState>({
    title: event.title,
    city: event.city,
    venue: event.venue,
    coverImage: event.coverImage,
    coverAlt: event.coverAlt,
    date: event.date,
    time: event.time,
    excerpt: event.excerpt,
    description: event.description,
    applicationsOpen: event.applicationsOpen,
    tagIds: event.tagIds || [],
    status: event.status
  });
  const [tags, setTags] = useState(availableTags);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState("");
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    requiresForce: false,
    linkedApplicationsCount: 0,
    linkedDjCount: 0,
    message: "Confermi di voler eliminare questo evento?"
  });

  function updateField<Key extends keyof EventFormState>(key: Key, value: EventFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      let coverImage = form.coverImage;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/event-image", {
          method: "POST",
          body: uploadData
        });

        if (!uploadResponse.ok) {
          const uploadResult = (await uploadResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(uploadResult?.error || "Upload immagine non riuscito.");
        }

        const uploadResult = (await uploadResponse.json()) as { url: string };
        coverImage = uploadResult.url;
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage,
        })
      });

      if (!response.ok) {
        throw new Error("Aggiornamento evento non riuscito.");
      }

      const result = (await response.json()) as { event: EventRecord };
      setForm({
        title: result.event.title,
        city: result.event.city,
        venue: result.event.venue,
        coverImage: result.event.coverImage,
        coverAlt: result.event.coverAlt,
        date: result.event.date,
        time: result.event.time,
        excerpt: result.event.excerpt,
        description: result.event.description,
        applicationsOpen: result.event.applicationsOpen,
        tagIds: result.event.tagIds || [],
        status: result.event.status
      });
      setImageFile(null);
      setStatus("Evento aggiornato.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore aggiornamento evento.");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal() {
    setDeleteState({
      open: true,
      requiresForce: false,
      linkedApplicationsCount: 0,
      linkedDjCount: 0,
      message: "Confermi di voler eliminare questo evento?"
    });
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setDeleteState((current) => ({
      ...current,
      open: false
    }));
  }

  async function handleDeleteConfirmation(force = false) {
    setDeleting(true);
    setStatus("");

    try {
      const response = await fetch(`/api/events/${event.id}${force ? "?force=true" : ""}`, {
        method: "DELETE"
      });

      if (response.status === 409) {
        const warning = (await response.json()) as {
          error?: string;
          linkedApplicationsCount?: number;
          linkedDjCount?: number;
        };
        setDeleteState({
          open: true,
          requiresForce: true,
          linkedApplicationsCount: warning.linkedApplicationsCount || 0,
          linkedDjCount: warning.linkedDjCount || 0,
          message:
            warning.error ||
            "Questo evento ha dati collegati. Conferma di nuovo per eliminarli insieme all'evento."
        });
        setDeleting(false);
        return;
      }

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error || "Eliminazione evento non riuscita.");
      }

      setDeleteState((current) => ({
        ...current,
        open: false
      }));
      router.push("/admin/eventi");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore eliminazione evento.");
      setDeleting(false);
    }
  }

  async function handleForceDelete() {
    await handleDeleteConfirmation(true);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className={ui.surface.panel}>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <span className={ui.text.eyebrow}>Modifica evento</span>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                {event.title}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titolo" htmlFor="detail-title">
                <input id="detail-title" className={ui.form.field} value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
              </Field>
              <Field label="Citta" htmlFor="detail-city">
                <input id="detail-city" className={ui.form.field} value={form.city} onChange={(event) => updateField("city", event.target.value)} required />
              </Field>
              <Field label="Venue" htmlFor="detail-venue">
                <input id="detail-venue" className={ui.form.field} value={form.venue} onChange={(event) => updateField("venue", event.target.value)} required />
              </Field>
              <Field label="Data" htmlFor="detail-date">
                <input id="detail-date" type="date" className={ui.form.field} value={form.date} onChange={(event) => updateField("date", event.target.value)} required />
              </Field>
              <Field label="Orario" htmlFor="detail-time">
                <input id="detail-time" type="time" className={ui.form.field} value={form.time} onChange={(event) => updateField("time", event.target.value)} required />
              </Field>
              <Field label="Stato evento" htmlFor="detail-status">
                <select id="detail-status" className={ui.form.select} value={form.status} onChange={(event) => updateField("status", event.target.value as EventRecord["status"])}>
                  <option value="upcoming">Prossimo</option>
                  <option value="past">Passato</option>
                </select>
              </Field>
              <Field label="Candidature aperte" htmlFor="detail-applications">
                <select id="detail-applications" className={ui.form.select} value={form.applicationsOpen ? "yes" : "no"} onChange={(event) => updateField("applicationsOpen", event.target.value === "yes")}>
                  <option value="yes">Si</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field label="Carica immagine" htmlFor="detail-cover-file">
                <input id="detail-cover-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className={ui.form.field} onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              </Field>
              <Field label="Alt immagine" htmlFor="detail-cover-alt" full>
                <input id="detail-cover-alt" className={ui.form.field} value={form.coverAlt} onChange={(event) => updateField("coverAlt", event.target.value)} required />
              </Field>
              <Field label="Excerpt" htmlFor="detail-excerpt" full>
                <textarea id="detail-excerpt" className={`${ui.form.field} min-h-28 resize-y`} value={form.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} required />
              </Field>
              <Field label="Descrizione" htmlFor="detail-description" full>
                <textarea id="detail-description" className={`${ui.form.field} min-h-40 resize-y`} value={form.description} onChange={(event) => updateField("description", event.target.value)} required />
              </Field>
              <Field label="Tag" htmlFor="detail-tags" full>
                <div id="detail-tags">
                  <TagMultiSelect
                    tags={tags}
                    value={form.tagIds}
                    onChange={(nextValue) => updateField("tagIds", nextValue)}
                    onTagsChange={setTags}
                  />
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={ui.action.primary} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/12 px-5 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={openDeleteModal}
                disabled={deleting || saving}
              >
                {deleting ? "Eliminazione..." : "Elimina evento"}
              </button>
              {status ? <p className="text-sm text-white/70">{status}</p> : null}
            </div>
          </form>
        </div>

        <div className="grid gap-4">
          <div className={ui.surface.panel}>
            <span className={ui.text.eyebrow}>Anteprima</span>
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : form.coverImage}
                alt={form.coverAlt}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-white/74">
              <p>
                <strong className="text-white">Luogo:</strong> {form.venue}, {form.city}
              </p>
              <p>
                <strong className="text-white">Data:</strong> {new Date(form.date).toLocaleDateString("it-IT")} / {form.time}
              </p>
              <p>
                <strong className="text-white">Slug:</strong> {createSlug(form.title)}
              </p>
            </div>
          </div>

          <div className={ui.surface.panel}>
            <span className={ui.text.eyebrow}>Roster approvato</span>
            <div className="mt-4 flex flex-wrap gap-2">
              {approvedDjs.length ? (
                approvedDjs.map((record) => (
                  <span
                    key={record.id}
                    className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-emerald-300"
                  >
                    {record.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/45">Nessun DJ approvato.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteState.open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/78"
            onClick={closeDeleteModal}
            aria-label="Chiudi conferma eliminazione"
          />
          <div className={`${ui.surface.modal} max-w-xl`}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.24em] text-red-300">
                  Conferma eliminazione
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  Elimina evento
                </h3>
                <p className="text-sm leading-7 text-white/70">
                  {deleteState.message}
                </p>
              </div>

              {deleteState.requiresForce ? (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-white/78">
                  <p>Candidature collegate: {deleteState.linkedApplicationsCount}</p>
                  <p>DJ collegati: {deleteState.linkedDjCount}</p>
                  <p className="mt-2 text-red-200">
                    Questa azione eliminerà anche i record collegati.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/12 px-5 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={
                    deleteState.requiresForce
                      ? handleForceDelete
                      : () => void handleDeleteConfirmation(false)
                  }
                  disabled={deleting}
                >
                  {deleting
                    ? "Eliminazione..."
                    : deleteState.requiresForce
                      ? "Conferma ed elimina tutto"
                      : "Conferma eliminazione"}
                </button>
                <button
                  type="button"
                  className={ui.action.secondary}
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Annulla
                </button>
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

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
