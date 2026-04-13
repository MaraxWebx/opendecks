"use client";

import { useMemo, useState } from "react";

import { BodyScrollLock } from "@/components/body-scroll-lock";
import { ModalCloseButton } from "@/components/modal-close-button";
import { ArchiveRecord, EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type ArchiveAdminManagerProps = {
  initialItems: ArchiveRecord[];
  events: EventRecord[];
};

type FormState = {
  alt: string;
  eventId: string;
  linkUrl: string;
  mediaUrl: string;
  mediaType: "photo" | "video" | "gif";
  order: string;
};

type UploadResult = {
  url: string;
  mediaType: "photo" | "video" | "gif";
};

const emptyForm: FormState = {
  alt: "",
  eventId: "",
  linkUrl: "",
  mediaUrl: "",
  mediaType: "photo",
  order: "",
};

export function ArchiveAdminManager({
  initialItems,
  events,
}: ArchiveAdminManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems[0]?.id ?? null,
  );
  const [createForm, setCreateForm] = useState<FormState>({
    ...emptyForm,
    order: String((initialItems.at(-1)?.order ?? 0) + 1),
  });
  const [editForm, setEditForm] = useState<FormState>({
    ...emptyForm,
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items],
  );
  const eventMap = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  function onCreateChange<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function onEditChange<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadMedia(file: File | null) {
    if (!file) {
      return null;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const uploadResponse = await fetch("/api/uploads/archive-media", {
      method: "POST",
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      const uploadResult = (await uploadResponse.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(uploadResult?.error || "Upload media non riuscito.");
    }

    return (await uploadResponse.json()) as UploadResult;
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      if (!createFile) {
        throw new Error("Carica un file media per la gallery.");
      }

      const selectedEvent = createForm.eventId
        ? eventMap.get(createForm.eventId)
        : undefined;

      const mediaUpload = await uploadMedia(createFile);

      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          toPayload(createForm, selectedEvent, {
            mediaUrl: mediaUpload?.url || createForm.mediaUrl,
            mediaType: mediaUpload?.mediaType || createForm.mediaType,
          }),
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error || "Salvataggio nuovo contenuto fallito.",
        );
      }

      const result = (await response.json()) as { item: ArchiveRecord };
      const nextItems = [...items, result.item].sort(
        (a, b) => a.order - b.order,
      );
      setItems(nextItems);
      setCreateForm({
        ...emptyForm,
        order: String((nextItems.at(-1)?.order ?? 0) + 1),
      });
      setCreateFile(null);
      setCreateOpen(false);
      setStatus("Nuovo contenuto gallery aggiunto.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId) {
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const selectedEvent = editForm.eventId
        ? eventMap.get(editForm.eventId)
        : undefined;

      const mediaUpload = await uploadMedia(editFile);

      const response = await fetch(`/api/archive/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          toPayload(editForm, selectedEvent, {
            mediaUrl: mediaUpload?.url || editForm.mediaUrl,
            mediaType: mediaUpload?.mediaType || editForm.mediaType,
          }),
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Aggiornamento contenuto fallito.");
      }

      const result = (await response.json()) as { item: ArchiveRecord };
      const nextItems = items
        .map((item) => (item.id === result.item.id ? result.item : item))
        .sort((a, b) => a.order - b.order);

      setItems(nextItems);
      setEditFile(null);
      setEditOpen(false);
      setStatus("Contenuto gallery aggiornato.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Errore aggiornamento.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Confermi di voler eliminare questo contenuto gallery?",
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    setStatus("");

    try {
      const response = await fetch(`/api/archive/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Eliminazione contenuto fallita.");
      }

      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);
      setStatus("Contenuto gallery eliminato.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Errore eliminazione.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openEditModal(item: ArchiveRecord) {
    setSelectedId(item.id);
    setEditForm(toFormState(item, events));
    setEditFile(null);
    setEditOpen(true);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className={ui.action.primary}
          onClick={() => setCreateOpen(true)}
        >
          Aggiungi contenuto gallery
        </button>
        <p className="min-h-6 text-sm text-white/65" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
        {sortedItems.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
          >
            <div className="bg-[#0d0d0d]">
              {item.mediaType === "video" ? (
                <video
                  src={item.mediaUrl}
                  poster={item.thumbnailUrl}
                  muted
                  playsInline
                  controls
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.alt}
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
            </div>
            <div className="grid gap-4 px-6 py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/56">
                <span>slot {item.order}</span>
                {item.event ? <span>{item.event}</span> : null}
                {item.linkUrl ? <span>link esterno</span> : null}
              </div>
              <h3 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[#f7f3ee]">
                {item.title || item.event || item.alt}
              </h3>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  className={ui.action.secondary}
                  onClick={() => openEditModal(item)}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? "Eliminazione..." : "Elimina"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {createOpen ? (
        <GalleryModal
          title="Aggiungi contenuto gallery"
          form={createForm}
          events={events}
          saving={saving}
          submitLabel="Salva contenuto"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          onChange={onCreateChange}
          mediaFile={createFile}
          setMediaFile={setCreateFile}
        />
      ) : null}

      {editOpen ? (
        <GalleryModal
          title="Modifica contenuto gallery"
          form={editForm}
          events={events}
          saving={saving}
          submitLabel="Salva modifiche"
          onClose={() => setEditOpen(false)}
          onSubmit={handleEdit}
          onChange={onEditChange}
          mediaFile={editFile}
          setMediaFile={setEditFile}
        />
      ) : null}
    </div>
  );
}

type GalleryModalProps = {
  title: string;
  form: FormState;
  events: EventRecord[];
  saving: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => void;
  mediaFile: File | null;
  setMediaFile: (file: File | null) => void;
};

function GalleryModal({
  title,
  form,
  events,
  saving,
  submitLabel,
  onClose,
  onSubmit,
  onChange,
  mediaFile,
  setMediaFile,
}: GalleryModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <BodyScrollLock />
      <div className="absolute inset-0 bg-black/72" onClick={onClose} />
      <div className={`${ui.surface.modal} max-w-4xl`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
              Gallery
            </span>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
              {title}
            </h3>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <form onSubmit={onSubmit} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Evento collegato" htmlFor={`${title}-event`}>
              <select
                id={`${title}-event`}
                className={ui.form.select}
                value={form.eventId}
                onChange={(event) => onChange("eventId", event.target.value)}
              >
                <option value="">Nessun evento collegato</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} / {event.locationName} /{" "}
                    {new Date(event.date).toLocaleDateString("it-IT")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ordine" htmlFor={`${title}-order`}>
              <input
                id={`${title}-order`}
                className={ui.form.field}
                value={form.order}
                onChange={(event) => onChange("order", event.target.value)}
                required
              />
            </Field>
            <Field label="Carica file" htmlFor={`${title}-mediaFile`} full>
              <input
                id={`${title}-mediaFile`}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime"
                className={ui.form.field}
                onChange={(event) =>
                  setMediaFile(event.target.files?.[0] || null)
                }
                required={!form.mediaUrl}
              />
            </Field>
            <Field label="Link URL opzionale" htmlFor={`${title}-linkUrl`} full>
              <input
                id={`${title}-linkUrl`}
                type="url"
                className={ui.form.field}
                value={form.linkUrl}
                onChange={(event) => onChange("linkUrl", event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Alt text" htmlFor={`${title}-alt`} full>
              <input
                id={`${title}-alt`}
                className={ui.form.field}
                value={form.alt}
                onChange={(event) => onChange("alt", event.target.value)}
                required
              />
            </Field>
          </div>

          {mediaFile || form.mediaUrl ? (
            <div className="rounded-xl border border-[color:var(--color-brand-14)] bg-[color:var(--color-brand-10)] px-4 py-3 text-sm text-white/72">
              File principale: {mediaFile?.name || "Media già presente"}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              className={ui.action.primary}
              type="submit"
              disabled={saving}
            >
              {saving ? "Salvataggio..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
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

function toPayload(
  form: FormState,
  linkedEvent?: EventRecord,
  overrides?: Partial<Pick<FormState, "mediaUrl" | "mediaType">>,
) {
  return {
    title: linkedEvent?.title || form.alt,
    format: "gallery" as const,
    mediaType: overrides?.mediaType || form.mediaType,
    mediaUrl: overrides?.mediaUrl || form.mediaUrl,
    alt: form.alt,
    event: linkedEvent?.title || "",
    year: linkedEvent?.date.slice(0, 4) || new Date().getFullYear().toString(),
    description: "",
    order: Number(form.order),
    linkUrl: form.linkUrl || undefined,
  };
}

function toFormState(
  item: ArchiveRecord | null,
  events: EventRecord[],
): FormState {
  if (!item) {
    return { ...emptyForm };
  }

  const linkedEvent = events.find((event) => event.title === item.event);

  return {
    alt: item.alt,
    eventId: linkedEvent?.id || "",
    linkUrl: item.linkUrl || "",
    mediaUrl: item.mediaUrl,
    mediaType: item.mediaType,
    order: String(item.order),
  };
}
