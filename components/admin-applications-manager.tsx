"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DeleteIconButton } from "@/components/delete-icon-button";
import { ApplicationRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminApplicationsManagerProps = {
  initialApplications: ApplicationRecord[];
  initialSelectedId?: string;
};

export function AdminApplicationsManager({
  initialApplications,
  initialSelectedId,
}: AdminApplicationsManagerProps) {
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const deletePanelRef = useRef<HTMLDivElement | null>(null);
  const [applications, setApplications] = useState(initialApplications);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ApplicationRecord["status"]
  >("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationRecord | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [draftStatus, setDraftStatus] =
    useState<ApplicationRecord["status"]>("new");
  const [deleteTarget, setDeleteTarget] = useState<ApplicationRecord | null>(
    null,
  );

  useEffect(() => {
    if (!initialSelectedId) {
      return;
    }

    const selected = initialApplications.find(
      (application) => application.id === initialSelectedId,
    );

    if (!selected) {
      return;
    }

    setSelectedApplication(selected);
    setDraftStatus(selected.status);
    setStatusMessage("");
  }, [initialApplications, initialSelectedId]);

  useEffect(() => {
    if (!selectedApplication) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedApplication]);

  useEffect(() => {
    if (!deleteTarget) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      deletePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [deleteTarget]);

  const events = useMemo(
    () =>
      Array.from(new Set(applications.map((item) => item.eventTitle))).sort(),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          application.name,
          formatCityProvince(application.city, application.province),
          application.region || "",
          application.email,
          application.phone,
          application.instagram,
          application.eventTitle,
          application.setLink,
          application.bio,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      const matchesEvent =
        eventFilter === "all" || application.eventTitle === eventFilter;

      return matchesQuery && matchesStatus && matchesEvent;
    });
  }, [applications, eventFilter, query, statusFilter]);

  async function changeApplicationStatus(status: ApplicationRecord["status"]) {
    if (!selectedApplication) {
      return;
    }

    setSavingStatus(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/applications/${selectedApplication.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Aggiornamento stato non riuscito.");
      }

      const result = (await response.json()) as {
        application: ApplicationRecord;
      };
      setApplications((current) =>
        current.map((item) =>
          item.id === result.application.id ? result.application : item,
        ),
      );
      setSelectedApplication(result.application);
      setDraftStatus(result.application.status);
      setStatusMessage("Stato candidatura aggiornato.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Errore aggiornamento stato.",
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDeleteApplication(application: ApplicationRecord) {
    setDeletingId(application.id);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error || "Eliminazione candidatura non riuscita.",
        );
      }

      setApplications((current) =>
        current.filter((item) => item.id !== application.id),
      );
      setSelectedApplication((current) =>
        current?.id === application.id ? null : current,
      );
      setDeleteTarget(null);
      setStatusMessage("Candidatura eliminata.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Errore eliminazione candidatura.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      {!selectedApplication ? (
        <>
          <div className="px-1 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))]">
              <div className="grid gap-2">
                <label htmlFor="applications-query" className={ui.form.label}>
                  Cerca
                </label>
                <input
                  id="applications-query"
                  className={ui.form.field}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nome, evento, citta, Instagram..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="applications-status" className={ui.form.label}>
                  Stato
                </label>
                <select
                  id="applications-status"
                  className={ui.form.select}
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                >
                  <option value="all">Tutti</option>
                  <option value="new">Nuove</option>
                  <option value="reviewing">In review</option>
                  <option value="selected">Approvate</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="applications-event" className={ui.form.label}>
                  Evento
                </label>
                <select
                  id="applications-event"
                  className={ui.form.select}
                  value={eventFilter}
                  onChange={(event) => setEventFilter(event.target.value)}
                >
                  <option value="all">Tutti</option>
                  {events.map((eventTitle) => (
                    <option key={eventTitle} value={eventTitle}>
                      {eventTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={`${ui.surface.panel} min-w-0`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-white/65">
                {filteredApplications.length} candidature trovate
              </p>
            </div>

            <div className="grid gap-4">
              {filteredApplications.map((application) => (
                <article
                  key={application.id}
                  className={`${ui.surface.card} min-w-0`}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/58">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] ${
                        application.status === "selected"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : application.status === "reviewing"
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-[color:var(--color-brand-12)] text-white"
                      }`}
                    >
                      {formatApplicationStatus(application.status)}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/58">
                    <span>{application.eventTitle}</span>

                    <span>
                      {new Date(application.submittedAt).toLocaleDateString(
                        "it-IT",
                      )}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="grid min-w-0 gap-2">
                      <h3 className="break-words text-lg font-semibold text-[#f7f3ee]">
                        {application.name}
                      </h3>
                      <p className={`${ui.text.body} break-words`}>
                        {formatCityProvince(application.city, application.province)}{" "}
                        / {application.instagram}
                      </p>
                      <p className="break-words text-sm text-white/55">
                        {application.email}
                      </p>
                      <p className="break-words text-sm text-white/55">
                        {application.phone}
                      </p>
                      <p className="line-clamp-2 text-sm leading-7 text-white/68">
                        {application.bio}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={ui.action.secondary}
                        onClick={() => {
                          setDeleteTarget(null);
                          setSelectedApplication(application);
                          setDraftStatus(application.status);
                          setStatusMessage("");
                        }}
                      >
                        Dettagli
                      </button>
                      <DeleteIconButton
                        onClick={() => {
                          setDeleteTarget(application);
                          setStatusMessage("");
                        }}
                        disabled={deletingId === application.id}
                        busy={deletingId === application.id}
                        label={`Elimina candidatura ${application.name}`}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {selectedApplication ? (
        <div ref={detailPanelRef} className="order-first grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className={ui.surface.panel}>
              <div className="grid gap-5">
                <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className={`${ui.action.secondary} gap-2 justify-self-end sm:order-2`}
                    onClick={() => setSelectedApplication(null)}
                  >
                    <ArrowLeftIcon />
                    Torna alla lista
                  </button>
                  <div className="grid min-w-0 gap-2 sm:order-1">
                    <span className={ui.text.eyebrow}>Candidatura</span>
                    <h2 className="break-words text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                      {selectedApplication.name}
                    </h2>
                    <p className="text-sm leading-7 text-white/68">
                      Scheda candidatura, contatti e valutazione operativa nello
                      stesso layout admin.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailItem
                    label="Evento"
                    value={selectedApplication.eventTitle}
                  />
                  <DetailItem
                    label="Data invio"
                    value={new Date(
                      selectedApplication.submittedAt,
                    ).toLocaleString("it-IT")}
                  />
                  <DetailItem
                    label="Citta"
                    value={formatCityProvince(
                      selectedApplication.city,
                      selectedApplication.province,
                    )}
                  />
                  <DetailItem
                    label="Regione"
                    value={selectedApplication.region || "Non definita"}
                  />
                </div>

                <div className={ui.surface.card}>
                  <div className="grid gap-3">
                    <span className={ui.form.label}>Cambia stato</span>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <div className="grid gap-2">
                        <label
                          htmlFor="application-status-detail"
                          className={ui.form.label}
                        >
                          Nuovo stato
                        </label>
                        <select
                          id="application-status-detail"
                          className={ui.form.select}
                          value={draftStatus}
                          disabled={savingStatus}
                          onChange={(event) =>
                            setDraftStatus(
                              event.target.value as ApplicationRecord["status"],
                            )
                          }
                        >
                          <option value="new">Nuova</option>
                          <option value="reviewing">In review</option>
                          <option value="selected">Approvata</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className={ui.action.primary}
                        disabled={
                          savingStatus ||
                          draftStatus === selectedApplication.status
                        }
                        onClick={() => changeApplicationStatus(draftStatus)}
                      >
                        {savingStatus ? "Salvataggio..." : "Salva stato"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <DeleteIconButton
                        onClick={() => setDeleteTarget(selectedApplication)}
                        disabled={deletingId === selectedApplication.id}
                        busy={deletingId === selectedApplication.id}
                        label={`Elimina candidatura ${selectedApplication.name}`}
                      />
                    </div>
                    {statusMessage ? (
                      <p className="text-sm text-white/70">{statusMessage}</p>
                    ) : null}
                  </div>
                </div>

                <div className={ui.surface.card}>
                  <span className={ui.form.label}>Link set</span>
                  <a
                    href={selectedApplication.setLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm text-[#f7f3ee] underline decoration-[color:var(--color-brand)] underline-offset-4"
                  >
                    {selectedApplication.setLink}
                  </a>
                </div>

                <div className={ui.surface.card}>
                  <span className={ui.form.label}>Bio</span>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/74">
                    {selectedApplication.bio}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className={ui.surface.panel}>
                <span className={ui.text.eyebrow}>Profilo</span>
                <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                  {selectedApplication.photoUrl ? (
                    <img
                      src={selectedApplication.photoUrl}
                      alt={selectedApplication.name}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-72 place-items-center bg-white/4 px-6 text-center text-sm text-white/45">
                      Nessuna foto caricata per questa candidatura.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.12em] ${
                      selectedApplication.status === "selected"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : selectedApplication.status === "reviewing"
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-[color:var(--color-brand-12)] text-white"
                    }`}
                  >
                    {formatApplicationStatus(selectedApplication.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <span className={ui.form.label}>Info anagrafiche</span>
                  <div className="grid gap-3 text-sm text-[#f7f3ee]">
                    <InfoRow
                      icon={<MailIcon />}
                      label="Email"
                      value={selectedApplication.email}
                      href={`mailto:${selectedApplication.email}`}
                    />
                    <InfoRow
                      icon={<PhoneIcon />}
                      label="Telefono"
                      value={selectedApplication.phone}
                      href={`tel:${selectedApplication.phone}`}
                    />
                    <InfoRow
                      icon={<InstagramIcon />}
                      label="Instagram"
                      value={selectedApplication.instagram}
                      href={selectedApplication.instagram}
                    />
                    <InfoRow
                      icon={<PinIcon />}
                      label="Citta"
                      value={formatCityProvince(
                        selectedApplication.city,
                        selectedApplication.province,
                      )}
                    />
                    <InfoRow
                      icon={<PinIcon />}
                      label="Regione"
                      value={selectedApplication.region || "Non definita"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          ref={deletePanelRef}
          className="order-first grid gap-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.24em] text-red-300">
                Conferma eliminazione
              </span>
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                Elimina candidatura
              </h3>
              <p className="text-sm leading-7 text-white/70">
                Stai per eliminare definitivamente la candidatura di{" "}
                <strong className="text-[#f7f3ee]">{deleteTarget.name}</strong>.
                Se la candidatura e' stata approvata, verra rimosso anche il
                record collegato dal DJ roster.
              </p>
            </div>
            <button
              type="button"
              className={ui.action.secondary}
              onClick={() => setDeleteTarget(null)}
              disabled={deletingId === deleteTarget.id}
            >
              Annulla
            </button>
          </div>

          <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm text-white/78">
            <p>Evento: {deleteTarget.eventTitle}</p>
            <p>Email: {deleteTarget.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={ui.action.danger}
              onClick={() => void handleDeleteApplication(deleteTarget)}
              disabled={deletingId === deleteTarget.id}
            >
              {deletingId === deleteTarget.id
                ? "Eliminazione..."
                : "Conferma eliminazione"}
            </button>
            <button
              type="button"
              className={ui.action.secondary}
              onClick={() => setDeleteTarget(null)}
              disabled={deletingId === deleteTarget.id}
            >
              Torna indietro
            </button>
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

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#E31F29]">{icon}</span>
      <div className="grid min-w-0 gap-1">
        <span className="text-[0.68rem] uppercase tracking-[0.18em] text-white/48">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="break-all leading-6 text-[#f7f3ee] underline decoration-[#E31F29]/55 underline-offset-4"
          >
            {value}
          </a>
        ) : (
          <p className="break-words leading-6 text-[#f7f3ee]">{value}</p>
        )}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7.5 12 13l8-5.5M5 6h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.2 4h3L11 7.8c.1.5 0 1-.4 1.4l-1.5 1.5a15 15 0 0 0 4.9 4.9l1.5-1.5c.4-.4.9-.5 1.4-.4L20 14.8v3c0 .7-.6 1.2-1.3 1.2A15.8 15.8 0 0 1 5 5.3C5 4.6 5.5 4 6.2 4h1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
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
        y="3.75"
        width="16.5"
        height="16.5"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" />
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

function formatApplicationStatus(status: ApplicationRecord["status"]) {
  if (status === "new") {
    return "Nuova";
  }

  if (status === "reviewing") {
    return "In review";
  }

  return "Approvata";
}

function formatCityProvince(city: string, province?: string) {
  return province ? `${city} (${province})` : city;
}
