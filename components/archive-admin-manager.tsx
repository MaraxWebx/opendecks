"use client";

import { useMemo, useState } from "react";

import { ArchiveRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type ArchiveAdminManagerProps = {
  initialItems: ArchiveRecord[];
};

type FormState = {
  title: string;
  mediaType: "photo" | "video" | "gif";
  mediaUrl: string;
  thumbnailUrl: string;
  alt: string;
  event: string;
  year: string;
  description: string;
  order: string;
};

const emptyForm: FormState = {
  title: "",
  mediaType: "photo",
  mediaUrl: "",
  thumbnailUrl: "",
  alt: "",
  event: "",
  year: "",
  description: "",
  order: ""
};

export function ArchiveAdminManager({ initialItems }: ArchiveAdminManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [createForm, setCreateForm] = useState<FormState>({
    ...emptyForm,
    order: String((initialItems.at(-1)?.order ?? 0) + 1)
  });
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  function onCreateChange<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function onEditChange<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm))
      });

      if (!response.ok) {
        throw new Error("Salvataggio nuovo contenuto fallito.");
      }

      const result = (await response.json()) as { item: ArchiveRecord };
      const nextItems = [...items, result.item].sort((a, b) => a.order - b.order);
      setItems(nextItems);
      setCreateForm({
        ...emptyForm,
        order: String((nextItems.at(-1)?.order ?? 0) + 1)
      });
      setCreateOpen(false);
      setStatus("Nuovo contenuto aggiunto.");
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
      const response = await fetch(`/api/archive/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm))
      });

      if (!response.ok) {
        throw new Error("Aggiornamento contenuto fallito.");
      }

      const result = (await response.json()) as { item: ArchiveRecord };
      const nextItems = items
        .map((item) => (item.id === result.item.id ? result.item : item))
        .sort((a, b) => a.order - b.order);

      setItems(nextItems);
      setEditOpen(false);
      setStatus("Contenuto aggiornato.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore aggiornamento.");
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(item: ArchiveRecord) {
    setSelectedId(item.id);
    setEditForm(toFormState(item));
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
          Aggiungi contenuto
        </button>
        <p className="min-h-6 text-sm text-white/65" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedItems.map((item) => (
          <article key={item.id} className={`overflow-hidden ${ui.surface.panel}`}>
            <div className="bg-[#111]">
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
            <div className="grid gap-3 p-5">
              <div className="flex flex-wrap gap-2 text-sm text-white/58">
                <span>{item.mediaType}</span>
                <span>{item.event}</span>
                <span>posizione {item.order}</span>
              </div>
              <h3 className="text-lg font-semibold text-[#f7f3ee]">{item.title}</h3>
              <p className="text-sm leading-7 text-white/74">{item.description}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={ui.action.secondary}
                  onClick={() => openEditModal(item)}
                >
                  Modifica
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {createOpen ? (
        <AdminContentModal
          title="Aggiungi contenuto"
          form={createForm}
          onChange={onCreateChange}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          saving={saving}
          submitLabel="Salva contenuto"
        />
      ) : null}

      {editOpen ? (
        <AdminContentModal
          title="Modifica contenuto"
          form={editForm}
          onChange={onEditChange}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEdit}
          saving={saving}
          submitLabel="Salva modifiche"
        />
      ) : null}
    </div>
  );
}

type AdminContentModalProps = {
  title: string;
  form: FormState;
  saving: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
};

function AdminContentModal({
  title,
  form,
  saving,
  submitLabel,
  onClose,
  onSubmit,
  onChange
}: AdminContentModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/72" onClick={onClose} />
      <div className={`${ui.surface.modal} max-w-4xl`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">Contenuti</span>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">{title}</h3>
          </div>
          <button
            type="button"
            className={ui.action.secondary}
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titolo" htmlFor={`${title}-title`} full>
              <input id={`${title}-title`} className={ui.form.field} value={form.title} onChange={(event) => onChange("title", event.target.value)} required />
            </Field>
            <Field label="Tipo media" htmlFor={`${title}-mediaType`}>
              <select
                id={`${title}-mediaType`}
                className={ui.form.select}
                value={form.mediaType}
                onChange={(event) => onChange("mediaType", event.target.value as FormState["mediaType"])}
              >
                <option value="photo">Foto</option>
                <option value="video">Video</option>
                <option value="gif">GIF</option>
              </select>
            </Field>
            <Field label="Ordine" htmlFor={`${title}-order`}>
              <input id={`${title}-order`} className={ui.form.field} value={form.order} onChange={(event) => onChange("order", event.target.value)} required />
            </Field>
            <Field label="URL media" htmlFor={`${title}-mediaUrl`} full>
              <input id={`${title}-mediaUrl`} className={ui.form.field} value={form.mediaUrl} onChange={(event) => onChange("mediaUrl", event.target.value)} required />
            </Field>
            <Field label="Poster video opzionale" htmlFor={`${title}-thumbnailUrl`} full>
              <input id={`${title}-thumbnailUrl`} className={ui.form.field} value={form.thumbnailUrl} onChange={(event) => onChange("thumbnailUrl", event.target.value)} />
            </Field>
            <Field label="Evento" htmlFor={`${title}-event`}>
              <input id={`${title}-event`} className={ui.form.field} value={form.event} onChange={(event) => onChange("event", event.target.value)} required />
            </Field>
            <Field label="Anno" htmlFor={`${title}-year`}>
              <input id={`${title}-year`} className={ui.form.field} value={form.year} onChange={(event) => onChange("year", event.target.value)} required />
            </Field>
            <Field label="Alt text" htmlFor={`${title}-alt`} full>
              <input id={`${title}-alt`} className={ui.form.field} value={form.alt} onChange={(event) => onChange("alt", event.target.value)} required />
            </Field>
            <Field label="Descrizione" htmlFor={`${title}-description`} full>
              <textarea
                id={`${title}-description`}
                className={`${ui.form.field} min-h-32 resize-y`}
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                required
              />
            </Field>
          </div>

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

function toPayload(form: FormState) {
  return {
    title: form.title,
    format: "gallery" as const,
    mediaType: form.mediaType,
    mediaUrl: form.mediaUrl,
    thumbnailUrl: form.thumbnailUrl || undefined,
    alt: form.alt,
    event: form.event,
    year: form.year,
    description: form.description,
    order: Number(form.order)
  };
}

function toFormState(item: ArchiveRecord | null): FormState {
  if (!item) {
    return { ...emptyForm };
  }

  return {
    title: item.title,
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl || "",
    alt: item.alt,
    event: item.event,
    year: item.year,
    description: item.description,
    order: String(item.order)
  };
}
