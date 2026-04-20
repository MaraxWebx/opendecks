"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BodyScrollLock } from "@/components/body-scroll-lock";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { ModalCloseButton } from "@/components/modal-close-button";
import { buildDjRosterProfiles, getEventLineupDjs } from "@/lib/dj-roster";
import {
  ApplicationRecord,
  DjRosterRecord,
  EventRecord,
  LocationRecord,
  TagRecord,
} from "@/lib/types";
import { ui } from "@/lib/ui";
import { DjMultiSelect } from "@/components/dj-multi-select";
import { TagMultiSelect } from "@/components/tag-multi-select";

type AdminEventDetailEditorProps = {
  event: EventRecord;
  djRoster: DjRosterRecord[];
  relatedApplications: ApplicationRecord[];
  availableTags: TagRecord[];
  availableLocations: LocationRecord[];
};

type EventFormState = {
  title: string;
  locationId: string;
  coverImage: string;
  date: string;
  time: string;
  description: string;
  applicationsOpen: boolean;
  lineupPublished: boolean;
  lineupDjIds: string[];
  tagIds: string[];
};

type FieldErrors = Partial<Record<keyof EventFormState, string>>;

type DeleteState = {
  open: boolean;
  requiresForce: boolean;
  linkedApplicationsCount: number;
  linkedDjCount: number;
  message: string;
};

export function AdminEventDetailEditor({
  event,
  djRoster,
  relatedApplications,
  availableTags,
  availableLocations,
}: AdminEventDetailEditorProps) {
  const router = useRouter();
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [originalLineupDjIds, setOriginalLineupDjIds] = useState(
    event.lineupDjIds || [],
  );
  const [form, setForm] = useState<EventFormState>({
    title: event.title,
    locationId: event.locationId,
    coverImage: event.coverImage,
    date: event.date,
    time: event.time,
    description: event.description,
    applicationsOpen: event.applicationsOpen,
    lineupPublished: event.lineupPublished,
    lineupDjIds: event.lineupDjIds || [],
    tagIds: event.tagIds || [],
  });
  const [tags, setTags] = useState(availableTags);
  const [locations] = useState(availableLocations);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    requiresForce: false,
    linkedApplicationsCount: 0,
    linkedDjCount: 0,
    message: "Confermi di voler eliminare questo evento?",
  });
  const lineupOptions = useMemo(
    () => buildDjRosterProfiles(djRoster),
    [djRoster],
  );
  const lineupDjs = useMemo(
    () =>
      getEventLineupDjs({ ...event, lineupDjIds: form.lineupDjIds }, djRoster),
    [djRoster, event, form.lineupDjIds],
  );
  const applicationStats = useMemo(() => {
    const counts = {
      new: relatedApplications.filter(
        (application) => application.status === "new",
      ).length,
      reviewing: relatedApplications.filter(
        (application) => application.status === "reviewing",
      ).length,
      selected: relatedApplications.filter(
        (application) => application.status === "selected",
      ).length,
    };

    return {
      ...counts,
      total: counts.new + counts.reviewing + counts.selected,
    };
  }, [relatedApplications]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  function updateField<Key extends keyof EventFormState>(
    key: Key,
    value: EventFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  async function handleSubmit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setSaving(true);
    setStatus("");
    setFieldErrors({});

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

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage,
          previousLineupDjIds: originalLineupDjIds,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          field?: keyof EventFormState;
        } | null;
        if (errorPayload?.field) {
          setFieldErrors({
            [errorPayload.field]:
              errorPayload.error || "Controlla questo campo.",
          });
        }
        throw new Error(
          errorPayload?.error || "Aggiornamento evento non riuscito.",
        );
      }

      const result = (await response.json()) as { event: EventRecord };
      setForm({
        title: result.event.title,
        locationId: result.event.locationId,
        coverImage: result.event.coverImage,
        date: result.event.date,
        time: result.event.time,
        description: result.event.description,
        applicationsOpen: result.event.applicationsOpen,
        lineupPublished: result.event.lineupPublished,
        lineupDjIds: result.event.lineupDjIds || [],
        tagIds: result.event.tagIds || [],
      });
      setFieldErrors({});
      setOriginalLineupDjIds(result.event.lineupDjIds || []);
      setImageFile(null);
      setOpen(false);
      setStatus("Evento aggiornato.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore aggiornamento evento.";
      setStatus(message);
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
      message: "Confermi di voler eliminare questo evento?",
    });
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setDeleteState((current) => ({
      ...current,
      open: false,
    }));
  }

  async function handleDeleteConfirmation(force = false) {
    setDeleting(true);
    setStatus("");

    try {
      const response = await fetch(
        `/api/events/${event.id}${force ? "?force=true" : ""}`,
        {
          method: "DELETE",
        },
      );

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
            "Questo evento ha dati collegati. Conferma di nuovo per eliminarli insieme all'evento.",
        });
        setDeleting(false);
        return;
      }

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error || "Eliminazione evento non riuscita.",
        );
      }

      setDeleteState((current) => ({
        ...current,
        open: false,
      }));
      router.push("/admin/eventi");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Errore eliminazione evento.",
      );
      setDeleting(false);
    }
  }

  async function handleForceDelete() {
    await handleDeleteConfirmation(true);
  }

  return (
    <div className="grid gap-6">
      {!open ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className={ui.surface.panel}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <span className={ui.text.eyebrow}>Scheda evento</span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                  {form.title}
                </h2>
                <p className="text-sm leading-7 text-white/68">
                  Gestione evento, line up e andamento candidature in un'unica
                  scheda.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem
                  label="Location"
                  value={
                    locations.find((item) => item.id === form.locationId)?.name ||
                    "Non selezionata"
                  }
                />
                <DetailItem
                  label="Indirizzo"
                  value={
                    locations.find((item) => item.id === form.locationId)
                      ?.address || "Non disponibile"
                  }
                />
                <DetailItem
                  label="Data"
                  value={`${new Date(form.date).toLocaleDateString("it-IT")} / ${form.time}`}
                />
                <DetailItem
                  label="Line up pubblica"
                  value={form.lineupPublished ? "Si" : "No"}
                />
                <DetailItem
                  label="Candidature aperte"
                  value={form.applicationsOpen ? "Si" : "No"}
                />
                <DetailItem
                  label="Tag"
                  value={
                    tags
                      .filter((tag) => form.tagIds.includes(tag.id))
                      .map((tag) => tag.label)
                      .join(" / ") || "Nessun tag"
                  }
                />
              </div>

              <div className={ui.surface.card}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className={ui.form.label}>Statistiche candidature</span>
                    <p className="mt-2 text-sm text-white/62">
                      Nuove, in review e approvate relative a questo evento.
                    </p>
                  </div>
                  <span className="rounded-md bg-white/6 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-white/84">
                    {applicationStats.total} totali
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-white/68">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E31F29]" />
                    Nuove
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    In review
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Approvate
                  </span>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="flex h-full overflow-hidden rounded-full"
                    style={{
                      width: `${Math.max(applicationStats.total ? 100 : 0, applicationStats.total ? 8 : 0)}%`,
                    }}
                  >
                    <div
                      className="h-full shrink-0 bg-[linear-gradient(90deg,#ff676f_0%,#E31F29_100%)]"
                      style={{
                        width: `${(applicationStats.new / Math.max(applicationStats.total, 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full shrink-0 bg-[linear-gradient(90deg,#fcd34d_0%,#f59e0b_100%)]"
                      style={{
                        width: `${(applicationStats.reviewing / Math.max(applicationStats.total, 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full shrink-0 bg-[linear-gradient(90deg,#6ee7b7_0%,#10b981_100%)]"
                      style={{
                        width: `${(applicationStats.selected / Math.max(applicationStats.total, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-3">
                  <p>Nuove: {applicationStats.new}</p>
                  <p>In review: {applicationStats.reviewing}</p>
                  <p>Approvate: {applicationStats.selected}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={ui.action.primary}
                  onClick={() => setOpen(true)}
                >
                  Modifica evento
                </button>
                <DeleteIconButton
                  onClick={openDeleteModal}
                  disabled={deleting}
                  busy={deleting}
                  label={`Elimina evento ${form.title}`}
                />
                {status ? (
                  <p className="text-sm text-white/70">{status}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="order-1 grid gap-4 xl:order-2">
            <div className={ui.surface.panel}>
              <span className={ui.text.eyebrow}>Anteprima</span>
              <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                <img
                  src={
                    imageFile ? URL.createObjectURL(imageFile) : form.coverImage
                  }
                  alt={buildEventCoverAlt(form.title, form.locationId, locations)}
                  className="w-full object-cover"
                />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-white/74">
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
                  {new Date(form.date).toLocaleDateString("it-IT")} / {form.time}
                </p>
                <p>
                  <strong className="text-white">Line up pubblica:</strong>{" "}
                  {form.lineupPublished ? "Si" : "No"}
                </p>
                <p>
                  <strong className="text-white">Slug:</strong>{" "}
                  {createSlug(form.title)}
                </p>

                <span className={ui.text.eyebrow}>Line up evento</span>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lineupDjs.length ? (
                    lineupDjs.map((record) => (
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
      ) : null}

      {open ? (
        <div ref={editPanelRef} className="order-first grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className={ui.surface.panel}>
              <div className="grid gap-5">
                <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
                  <div className="justify-self-end sm:order-2">
                    <ModalCloseButton
                      onClick={() => setOpen(false)}
                      disabled={saving}
                      label="Chiudi modifica evento"
                    />
                  </div>
                  <div className="grid min-w-0 gap-2 sm:order-1">
                    <span className={ui.text.eyebrow}>Modifica evento</span>
                    <h2 className="break-words text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                      {form.title}
                    </h2>
                    <p className="text-sm leading-7 text-white/68">
                      Modifica dati, line up e pubblicazione nello stesso layout admin.
                    </p>
                  </div>
                </div>

                {status ? (
                  <p className="text-sm text-white/70">{status}</p>
                ) : null}

                <form onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Titolo" htmlFor="detail-title">
                      <input
                        id="detail-title"
                        className={`${ui.form.field} ${
                          fieldErrors.title
                            ? "border-red-400 bg-red-500/10 focus:border-red-300"
                            : ""
                        }`}
                        value={form.title}
                        onChange={(event) =>
                          updateField("title", event.target.value)
                        }
                        aria-invalid={Boolean(fieldErrors.title)}
                        aria-describedby={
                          fieldErrors.title ? "detail-title-error" : undefined
                        }
                        required
                      />
                      {fieldErrors.title ? (
                        <p
                          id="detail-title-error"
                          className="text-sm leading-6 text-red-200"
                        >
                          {fieldErrors.title}
                        </p>
                      ) : null}
                    </Field>
                    <Field label="Location" htmlFor="detail-location">
                      <select
                        id="detail-location"
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
                    <Field label="Data" htmlFor="detail-date">
                      <input
                        id="detail-date"
                        type="date"
                        className={ui.form.field}
                        value={form.date}
                        onChange={(event) =>
                          updateField("date", event.target.value)
                        }
                        required
                      />
                    </Field>
                    <Field label="Orario" htmlFor="detail-time">
                      <input
                        id="detail-time"
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
                      htmlFor="detail-applications"
                    >
                      <select
                        id="detail-applications"
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
                    <Field
                      label="Line up pubblica"
                      htmlFor="detail-lineup-public"
                    >
                      <select
                        id="detail-lineup-public"
                        className={ui.form.select}
                        value={form.lineupPublished ? "yes" : "no"}
                        onChange={(event) =>
                          updateField(
                            "lineupPublished",
                            event.target.value === "yes",
                          )
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Si</option>
                      </select>
                    </Field>
                    <Field label="Carica immagine" htmlFor="detail-cover-file">
                      <input
                        id="detail-cover-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className={ui.form.field}
                        onChange={(event) =>
                          setImageFile(event.target.files?.[0] || null)
                        }
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4">
                    <Field label="Descrizione" htmlFor="detail-description" full>
                      <textarea
                        id="detail-description"
                        className={`${ui.form.field} min-h-40 resize-y`}
                        value={form.description}
                        onChange={(event) =>
                          updateField("description", event.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="DJ in line up"
                      htmlFor="detail-lineup-djs"
                      full
                    >
                      <div id="detail-lineup-djs">
                        <DjMultiSelect
                          djs={lineupOptions}
                          value={form.lineupDjIds}
                          onChange={(nextValue) =>
                            updateField("lineupDjIds", nextValue)
                          }
                        />
                      </div>
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
                    <button
                      type="submit"
                      className={ui.action.primary}
                      disabled={saving}
                    >
                      {saving ? "Salvataggio..." : "Salva modifiche"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="grid gap-4 xl:order-2">
              <div className={ui.surface.panel}>
                <span className={ui.text.eyebrow}>Anteprima</span>
                <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                  <img
                    src={
                      imageFile ? URL.createObjectURL(imageFile) : form.coverImage
                    }
                    alt={buildEventCoverAlt(form.title, form.locationId, locations)}
                    className="w-full object-cover"
                  />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-white/74">
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
                    {new Date(form.date).toLocaleDateString("it-IT")} / {form.time}
                  </p>
                  <p>
                    <strong className="text-white">Line up pubblica:</strong>{" "}
                    {form.lineupPublished ? "Si" : "No"}
                  </p>
                  <p>
                    <strong className="text-white">Slug:</strong>{" "}
                    {createSlug(form.title)}
                  </p>

                  <span className={ui.text.eyebrow}>Line up evento</span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lineupDjs.length ? (
                      lineupDjs.map((record) => (
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

      {deleteState.open ? (
        <div className="fixed inset-0 z-50 grid items-start justify-items-center overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:items-center">
          <BodyScrollLock />
          <button
            type="button"
            className="absolute inset-0 bg-black"
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
                <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm text-white/78">
                  <p>
                    Candidature collegate: {deleteState.linkedApplicationsCount}
                  </p>
                  <p>DJ collegati: {deleteState.linkedDjCount}</p>
                  <p className="mt-2 text-red-200">
                    Questa azione eliminerà anche i record collegati.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-500/35 bg-red-500/12 px-5 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={ui.surface.card}>
      <span className={ui.form.label}>{label}</span>
      <p className="mt-2 break-words text-sm leading-7 text-[#f7f3ee]">
        {value}
      </p>
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

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
