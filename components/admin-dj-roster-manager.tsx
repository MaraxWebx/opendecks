"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { DeleteIconButton } from "@/components/delete-icon-button";
import { GlobalLoader } from "@/components/global-loader";
import { getDjEventHistory } from "@/lib/dj-roster";
import {
  buildCityAutocompleteOptionFromPlace,
  loadGoogleMapsPlaces,
  type CityAutocompleteOption,
} from "@/lib/google-places";
import { DjRosterRecord, EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type AdminDjRosterManagerProps = {
  initialRoster: DjRosterRecord[];
  events: EventRecord[];
  initialSelectedId?: string;
};

type ManualDjFormState = {
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  instagram: string;
  setLink: string;
  photoUrl: string;
  bio: string;
};

type MunicipalityOption = CityAutocompleteOption;

type SelectedDjFormState = {
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  instagram: string;
  setLink: string;
  photoUrl: string;
  bio: string;
};

type MembershipFilter = "all" | "enabled" | "disabled";

const fieldClass =
  "min-w-0 w-full rounded-lg border border-[#E31F29]/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#E31F29]/60";

export function AdminDjRosterManager({
  initialRoster,
  events,
  initialSelectedId,
}: AdminDjRosterManagerProps) {
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const createPanelRef = useRef<HTMLDivElement | null>(null);
  const [roster, setRoster] = useState(initialRoster);
  const [query, setQuery] = useState("");
  const [membershipFilter, setMembershipFilter] =
    useState<MembershipFilter>("all");
  const [selectedDj, setSelectedDj] = useState<DjRosterRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualDjFormState>(() =>
    createInitialManualForm(events),
  );
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<MunicipalityOption[]>([]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [isGoogleAutocompleteReady, setIsGoogleAutocompleteReady] =
    useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedForm, setSelectedForm] = useState<SelectedDjFormState | null>(
    null,
  );
  const [selectedCityQuery, setSelectedCityQuery] = useState("");
  const [selectedCityOptions, setSelectedCityOptions] = useState<
    MunicipalityOption[]
  >([]);
  const [selectedCityMenuOpen, setSelectedCityMenuOpen] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isSavingSelected, setIsSavingSelected] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const manualCityInputRef = useRef<HTMLInputElement | null>(null);
  const selectedCityInputRef = useRef<HTMLInputElement | null>(null);
  const manualCityAutocompleteRef = useRef<any>(null);
  const selectedCityAutocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!initialSelectedId) {
      return;
    }

    const selected = initialRoster.find(
      (entry) => entry.id === initialSelectedId,
    );

    if (!selected) {
      return;
    }

    setIsCreateOpen(false);
    setCreateMessage("");
    setSelectedDj(selected);
  }, [initialRoster, initialSelectedId]);

  const filteredRoster = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roster.filter((item) => {
      if (membershipFilter === "enabled" && !item.membershipCardEnabled) {
        return false;
      }

      if (membershipFilter === "disabled" && item.membershipCardEnabled) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        item.name,
        formatCityProvince(item.city, item.province),
        item.region || "",
        item.email,
        item.phone,
        item.instagram,
        item.sourceApplicationEventTitle || "",
        item.membershipCardId || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, roster, membershipFilter]);

  const selectedDjHistory = useMemo(() => {
    if (!selectedDj) {
      return [];
    }

    return getDjEventHistory(selectedDj, events, roster);
  }, [events, roster, selectedDj]);

  function applyMunicipalitySelection(municipality: MunicipalityOption | null) {
    if (!municipality) {
      setManualForm((current) => ({
        ...current,
        city: "",
        province: "",
        region: "",
      }));
      return;
    }

    setCityQuery(municipality.label);
    setManualForm((current) => ({
      ...current,
      city: municipality.city,
      province: municipality.provinceCode,
      region: municipality.region,
    }));
  }

  async function resolveMunicipalityFromQuery(label: string) {
    const normalizedLabel = label.trim();

    if (!normalizedLabel) {
      applyMunicipalitySelection(null);
      return null;
    }

    const localMatch =
      cityOptions.find(
        (municipality) => municipality.label === normalizedLabel,
      ) || null;

    if (localMatch) {
      applyMunicipalitySelection(localMatch);
      return localMatch;
    }

    try {
      const response = await fetch(
        `/api/municipalities?q=${encodeURIComponent(normalizedLabel)}&exact=1`,
      );
      const result = (await response.json()) as {
        municipality?: MunicipalityOption | null;
      };
      const municipality = result.municipality || null;
      applyMunicipalitySelection(municipality);
      return municipality;
    } catch {
      applyMunicipalitySelection(null);
      return null;
    }
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setIsGoogleAutocompleteReady(false);
      return;
    }

    let cancelled = false;

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (!cancelled) {
          setIsGoogleAutocompleteReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsGoogleAutocompleteReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !isGoogleAutocompleteReady ||
      !isCreateOpen ||
      !manualCityInputRef.current ||
      !window.google?.maps?.places
    ) {
      return;
    }

    manualCityAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      manualCityInputRef.current,
      {
        types: ["geocode"],
        fields: ["address_components", "name", "place_id", "formatted_address"],
      },
    );

    manualCityAutocompleteRef.current.addListener("place_changed", () => {
      const place = manualCityAutocompleteRef.current?.getPlace?.();
      const municipality = buildCityAutocompleteOptionFromPlace(place);

      if (!municipality) {
        return;
      }

      applyMunicipalitySelection(municipality);
      setCityOptions([]);
      setCityMenuOpen(false);
    });

    return () => {
      if (manualCityAutocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          manualCityAutocompleteRef.current,
        );
      }

      manualCityAutocompleteRef.current = null;
    };
  }, [isCreateOpen, isGoogleAutocompleteReady]);

  useEffect(() => {
    if (
      !isGoogleAutocompleteReady ||
      !isEditOpen ||
      !selectedDj ||
      !selectedCityInputRef.current ||
      !window.google?.maps?.places
    ) {
      return;
    }

    selectedCityAutocompleteRef.current =
      new window.google.maps.places.Autocomplete(selectedCityInputRef.current, {
        types: ["geocode"],
        fields: ["address_components", "name", "place_id", "formatted_address"],
      });

    selectedCityAutocompleteRef.current.addListener("place_changed", () => {
      const place = selectedCityAutocompleteRef.current?.getPlace?.();
      const municipality = buildCityAutocompleteOptionFromPlace(place);

      if (!municipality) {
        return;
      }

      applySelectedMunicipalitySelection(municipality);
      setSelectedCityOptions([]);
      setSelectedCityMenuOpen(false);
    });

    return () => {
      if (selectedCityAutocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          selectedCityAutocompleteRef.current,
        );
      }

      selectedCityAutocompleteRef.current = null;
    };
  }, [isEditOpen, isGoogleAutocompleteReady, selectedDj]);

  useEffect(() => {
    if (isGoogleAutocompleteReady) {
      setCityOptions([]);
      setCityMenuOpen(false);
      return;
    }

    const normalizedQuery = cityQuery.trim();

    if (normalizedQuery.length < 2) {
      setCityOptions([]);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/municipalities?q=${encodeURIComponent(normalizedQuery)}`,
        );
        const result = (await response.json()) as {
          municipalities?: MunicipalityOption[];
        };

        if (!active) {
          return;
        }

        setCityOptions(result.municipalities || []);
        setCityMenuOpen(Boolean((result.municipalities || []).length));
      } catch {
        if (active) {
          setCityOptions([]);
          setCityMenuOpen(false);
        }
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [cityQuery, isGoogleAutocompleteReady]);

  useEffect(() => {
    if (!selectedDj) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedDj]);

  useEffect(() => {
    if (!selectedDj) {
      setSelectedForm(null);
      setSelectedCityQuery("");
      setSelectedCityOptions([]);
      setSelectedCityMenuOpen(false);
      setSelectedPhotoFile(null);
      setIsEditOpen(false);
      return;
    }

    setSelectedForm({
      name: selectedDj.name,
      city: selectedDj.city,
      province: selectedDj.province || "",
      region: selectedDj.region || "",
      email: selectedDj.email,
      phone: selectedDj.phone,
      instagram: selectedDj.instagram,
      setLink: selectedDj.setLink,
      photoUrl: selectedDj.photoUrl,
      bio: selectedDj.bio,
    });
    setSelectedCityQuery(
      formatCityProvince(selectedDj.city, selectedDj.province || ""),
    );
    setSelectedCityOptions([]);
    setSelectedCityMenuOpen(false);
    setSelectedPhotoFile(null);
  }, [selectedDj]);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      createPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isCreateOpen]);

  async function uploadPhoto(file: File | null) {
    if (!file) {
      throw new Error("Carica una foto personale.");
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const uploadResponse = await fetch("/api/uploads/application-photo", {
      method: "POST",
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      const payload = (await uploadResponse.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error || "Upload foto non riuscito.");
    }

    const result = (await uploadResponse.json()) as { url: string };
    return result.url;
  }

  async function resolveSelectedMunicipalityFromQuery(label: string) {
    const normalizedLabel = label.trim();

    if (!normalizedLabel) {
      if (selectedForm) {
        setSelectedForm({
          ...selectedForm,
          city: "",
          province: "",
          region: "",
        });
      }
      return null;
    }

    const localMatch =
      selectedCityOptions.find(
        (municipality) => municipality.label === normalizedLabel,
      ) || null;

    if (localMatch) {
      applySelectedMunicipalitySelection(localMatch);
      return localMatch;
    }

    try {
      const response = await fetch(
        `/api/municipalities?q=${encodeURIComponent(normalizedLabel)}&exact=1`,
      );
      const result = (await response.json()) as {
        municipality?: MunicipalityOption | null;
      };
      const municipality = result.municipality || null;
      applySelectedMunicipalitySelection(municipality);
      return municipality;
    } catch {
      applySelectedMunicipalitySelection(null);
      return null;
    }
  }

  function applySelectedMunicipalitySelection(
    municipality: MunicipalityOption | null,
  ) {
    if (!selectedForm) {
      return;
    }

    if (!municipality) {
      setSelectedForm({
        ...selectedForm,
        city: "",
        province: "",
        region: "",
      });
      return;
    }

    setSelectedCityQuery(municipality.label);
    setSelectedForm({
      ...selectedForm,
      city: municipality.city,
      province: municipality.provinceCode,
      region: municipality.region,
    });
  }

  async function toggleMembership(entry: DjRosterRecord, enabled: boolean) {
    setBusyId(entry.id);
    setMessage("");

    try {
      const response = await fetch(`/api/dj-roster/${entry.id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const result = (await response.json()) as {
        rosterEntry?: DjRosterRecord;
        error?: string;
      };

      if (!response.ok || !result.rosterEntry) {
        throw new Error(
          result.error || "Aggiornamento membership non riuscito.",
        );
      }

      setRoster((current) =>
        current.map((item) =>
          item.id === result.rosterEntry?.id ? result.rosterEntry : item,
        ),
      );
      setSelectedDj((current) =>
        current?.id === result.rosterEntry?.id
          ? (result.rosterEntry ?? null)
          : current,
      );
      setMessage(
        enabled
          ? "Membership card attivata e inviata via email."
          : "Membership card disattivata.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore membership.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateManualDj(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setMessage("");
    setCreateMessage("");

    try {
      if (!manualForm.province) {
        const resolvedMunicipality =
          await resolveMunicipalityFromQuery(cityQuery);

        if (!resolvedMunicipality) {
          throw new Error("Seleziona una città valida dall'autocomplete.");
        }
      }

      const photoUrl = await uploadPhoto(photoFile);

      const response = await fetch("/api/dj-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          photoUrl,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        rosterEntry?: DjRosterRecord;
        error?: string;
      } | null;

      if (!response.ok || !result?.rosterEntry) {
        throw new Error(result?.error || "Creazione DJ non riuscita.");
      }

      const createdRosterEntry = result.rosterEntry;
      setRoster((current) => [createdRosterEntry, ...current]);
      setSelectedDj(createdRosterEntry);
      setManualForm(createInitialManualForm(events));
      setCityQuery("");
      setCityOptions([]);
      setCityMenuOpen(false);
      setPhotoFile(null);
      setIsCreateOpen(false);
      setMessage("DJ aggiunto manualmente al roster.");
    } catch (error) {
      setCreateMessage(
        error instanceof Error ? error.message : "Errore creazione DJ.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateSelectedDj(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedDj || !selectedForm) {
      return;
    }

    setIsSavingSelected(true);
    setMessage("");

    try {
      let nextPhotoUrl = selectedForm.photoUrl;

      if (!selectedForm.province) {
        const resolvedMunicipality =
          await resolveSelectedMunicipalityFromQuery(selectedCityQuery);

        if (!resolvedMunicipality) {
          throw new Error("Seleziona una città valida dall'autocomplete.");
        }
      }

      if (selectedPhotoFile) {
        nextPhotoUrl = await uploadPhoto(selectedPhotoFile);
      }

      const response = await fetch(`/api/dj-roster/${selectedDj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedForm,
          photoUrl: nextPhotoUrl,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        rosterEntry?: DjRosterRecord;
        error?: string;
      } | null;

      if (!response.ok || !result?.rosterEntry) {
        throw new Error(result?.error || "Aggiornamento DJ non riuscito.");
      }

      setRoster((current) =>
        current.map((item) =>
          item.id === result.rosterEntry?.id ? result.rosterEntry : item,
        ),
      );
      setSelectedDj(result.rosterEntry);
      setMessage("DJ aggiornato.");
      setSelectedPhotoFile(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Errore aggiornamento DJ.",
      );
    } finally {
      setIsSavingSelected(false);
    }
  }

  async function handleDeleteSelectedDj() {
    if (!selectedDj) {
      return;
    }

    const confirmed = window.confirm(
      `Confermi di voler eliminare ${selectedDj.name} dal roster?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSelected(true);
    setMessage("");

    try {
      const response = await fetch(`/api/dj-roster/${selectedDj.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Eliminazione DJ non riuscita.");
      }

      setRoster((current) =>
        current.filter((item) => item.id !== selectedDj.id),
      );
      setSelectedDj(null);
      setMessage("DJ eliminato dal roster.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Errore eliminazione DJ.",
      );
      setIsDeletingSelected(false);
    }
  }

  function updateManualForm<K extends keyof ManualDjFormState>(
    key: K,
    value: ManualDjFormState[K],
  ) {
    setManualForm((current) => ({ ...current, [key]: value }));
  }

  function updateSelectedForm<K extends keyof SelectedDjFormState>(
    key: K,
    value: SelectedDjFormState[K],
  ) {
    setSelectedForm((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  useEffect(() => {
    if (isGoogleAutocompleteReady) {
      setSelectedCityOptions([]);
      setSelectedCityMenuOpen(false);
      return;
    }

    const normalizedQuery = selectedCityQuery.trim();

    if (!selectedDj || normalizedQuery.length < 2) {
      setSelectedCityOptions([]);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/municipalities?q=${encodeURIComponent(normalizedQuery)}`,
        );
        const result = (await response.json()) as {
          municipalities?: MunicipalityOption[];
        };

        if (!active) {
          return;
        }

        setSelectedCityOptions(result.municipalities || []);
        setSelectedCityMenuOpen(Boolean((result.municipalities || []).length));
      } catch {
        if (active) {
          setSelectedCityOptions([]);
          setSelectedCityMenuOpen(false);
        }
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [selectedCityQuery, selectedDj, isGoogleAutocompleteReady]);

  return (
    <div className="grid min-w-0 gap-4">
      {!selectedDj && !isCreateOpen ? (
        <>
          <div className="grid gap-4 px-1 sm:px-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
                <div className="grid gap-2">
                  <label htmlFor="dj-roster-query" className={ui.form.label}>
                    Cerca DJ
                  </label>
                  <input
                    id="dj-roster-query"
                    className={ui.form.field}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome, città, email, telefono, evento..."
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="membership-filter" className={ui.form.label}>
                    Membership
                  </label>
                  <select
                    id="membership-filter"
                    className={ui.form.select}
                    value={membershipFilter}
                    onChange={(event) =>
                      setMembershipFilter(
                        event.target.value as MembershipFilter,
                      )
                    }
                  >
                    <option value="all">Tutti</option>
                    <option value="enabled">Solo membership attive</option>
                    <option value="disabled">Senza membership</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className={ui.action.primary}
                onClick={() => {
                  setMessage("");
                  setSelectedDj(null);
                  setCreateMessage("");
                  setIsCreateOpen(true);
                }}
              >
                Aggiungi DJ manualmente
              </button>
            </div>

            {message ? (
              <p className="text-sm text-white/65">{message}</p>
            ) : null}
          </div>

          <div className={`${ui.surface.panel} min-w-0 p-0 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-white/65">
                {filteredRoster.length} DJ nel roster
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRoster.length ? (
                filteredRoster.map((entry) => (
                  <article
                    key={entry.id}
                    className="group flex h-full overflow-hidden rounded-xl border border-[#E31F29]/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.012)_100%)] transition hover:border-[#E31F29]/30 hover:bg-[linear-gradient(145deg,rgba(227,31,41,0.08)_0%,rgba(255,255,255,0.04)_100%)]"
                  >
                    <button
                      type="button"
                      className="grid w-full grid-cols-[108px_minmax(0,1fr)] items-stretch text-left"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setCreateMessage("");
                        setSelectedDj(entry);
                      }}
                    >
                      <div className="relative flex min-h-full items-center justify-center overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,rgba(227,31,41,0.16)_0%,rgba(7,7,8,0.96)_100%)] p-3">
                        {entry.photoUrl ? (
                          <>
                            <img
                              src={entry.photoUrl}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 h-full w-full object-cover opacity-25 blur-2xl transition duration-300 group-hover:scale-105"
                            />
                            <img
                              src={entry.photoUrl}
                              alt={entry.name}
                              className="relative h-full max-h-40 w-full rounded-md object-contain"
                            />
                          </>
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm font-semibold uppercase tracking-[0.16em] text-white/72">
                            {buildInitials(entry.name)}
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border border-[#120d0d] bg-[#E31F29]" />
                      </div>

                      <div className="grid min-w-0 content-between gap-4 p-5">
                        <div className="grid gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-white/44">
                            {!entry.applicationId ? (
                              <span className="inline-flex rounded-full border border-[color:var(--color-brand-20)] px-2 py-1 text-[0.62rem] text-white/75">
                                Manuale
                              </span>
                            ) : entry.sourceApplicationEventTitle ? (
                              <span className="inline-flex max-w-full truncate rounded-full border border-[color:var(--color-brand-20)] px-2 py-1 text-[0.62rem] text-white/75">
                                {entry.sourceApplicationEventTitle}
                              </span>
                            ) : null}
                            {entry.membershipCardEnabled ? (
                              <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-1 text-[0.62rem] text-emerald-300">
                                Membership
                              </span>
                            ) : null}
                          </div>

                          <div className="grid min-w-0 gap-1">
                            <h3 className="text-xl font-semibold text-[#f7f3ee] transition group-hover:text-white">
                              {entry.name}
                            </h3>
                            <p className="truncate text-sm text-white/52">
                              {entry.email}
                            </p>
                            <p className="truncate text-sm text-white/46">
                              {entry.instagram}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                          <p className="truncate text-xs uppercase tracking-[0.16em] text-white/34">
                            {entry.membershipCardId || "Profilo roster"}
                          </p>
                          <span className="text-xs uppercase tracking-[0.18em] text-white/45 transition group-hover:text-white/72">
                            Apri
                          </span>
                        </div>
                        {/* 
                        <div className="grid gap-1 text-sm text-white/65">
                          <p>
                            {formatCityProvince(entry.city, entry.province)}
                          </p>
                          <p>
                            {new Date(entry.approvedAt).toLocaleDateString(
                              "it-IT",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div> */}
                      </div>
                    </button>

                    {/* <div className="border-t border-white/10 bg-[#0000000d] px-5 py-4">
                      <button
                        type="button"
                        className={
                          entry.membershipCardEnabled
                            ? ui.action.secondary
                            : ui.action.primary
                        }
                        disabled={busyId === entry.id}
                        onClick={() =>
                          toggleMembership(entry, !entry.membershipCardEnabled)
                        }
                      >
                        {busyId === entry.id
                          ? "Invio..."
                          : entry.membershipCardEnabled
                            ? "Disattiva card"
                            : "Abilita card"}
                      </button>
                    </div> */}
                  </article>
                ))
              ) : (
                <div className={ui.surface.card}>
                  <p className="text-sm text-white/60">
                    Nessun DJ trovato con i filtri attivi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {selectedDj ? (
        <div ref={detailPanelRef} className="order-first grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className={ui.surface.panel}>
              <div className="grid gap-5">
                <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
                  <div className="grid min-w-0 gap-2 sm:order-1">
                    <span className={ui.text.eyebrow}>DJ roster</span>
                    <h2 className="break-words text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                      {selectedDj.name}
                    </h2>
                    <p className="text-sm leading-7 text-white/68">
                      Scheda DJ, profilo, membership e storico eventi nello
                      stesso layout admin.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:order-2">
                    <button
                      type="button"
                      className={ui.action.secondary}
                      onClick={() => setSelectedDj(null)}
                    >
                      <ArrowLeftIcon />
                      Torna alla lista
                    </button>
                    <button
                      type="button"
                      className={ui.action.primary}
                      onClick={() => setIsEditOpen((current) => !current)}
                    >
                      {isEditOpen ? "Chiudi editor" : "Modifica DJ"}
                    </button>
                  </div>
                </div>

                {!isEditOpen ? (
                  <>
                    {message ? (
                      <p className="text-sm text-white/70">{message}</p>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <DetailItem
                        label="Origine candidatura"
                        value={
                          selectedDj.applicationId
                            ? selectedDj.sourceApplicationEventTitle ||
                              "Evento candidatura non disponibile"
                            : "Inserimento manuale"
                        }
                      />
                      <DetailItem
                        label="Origine"
                        value={
                          selectedDj.applicationId
                            ? "Da candidatura approvata"
                            : "Inserimento manuale"
                        }
                      />
                      <DetailItem
                        label="Approvato il"
                        value={new Date(selectedDj.approvedAt).toLocaleString(
                          "it-IT",
                        )}
                      />
                      <DetailItem
                        label="Membership"
                        value={
                          selectedDj.membershipCardEnabled
                            ? `Attiva / ${selectedDj.membershipCardId || "Card in generazione"}`
                            : "Non attiva"
                        }
                      />
                    </div>

                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Membership</span>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.12em] ${
                            selectedDj.membershipCardEnabled
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-[color:var(--color-brand-12)] text-white"
                          }`}
                        >
                          {selectedDj.membershipCardEnabled
                            ? "Attiva"
                            : "Non attiva"}
                        </span>
                        <span className="text-sm text-white/70">
                          Card ID: {selectedDj.membershipCardId || "Non èmessa"}
                        </span>
                        <button
                          type="button"
                          className={
                            selectedDj.membershipCardEnabled
                              ? ui.action.secondary
                              : ui.action.primary
                          }
                          disabled={busyId === selectedDj.id}
                          onClick={() =>
                            toggleMembership(
                              selectedDj,
                              !selectedDj.membershipCardEnabled,
                            )
                          }
                        >
                          {busyId === selectedDj.id
                            ? "Invio..."
                            : selectedDj.membershipCardEnabled
                              ? "Disattiva card"
                              : "Abilita card"}
                        </button>
                      </div>
                    </div>

                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Link set</span>
                      {selectedDj.setLink ? (
                        <a
                          href={selectedDj.setLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all text-sm text-[#f7f3ee] underline decoration-[color:var(--color-brand)] underline-offset-4"
                        >
                          {selectedDj.setLink}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-white/50">
                          Nessun link set disponibile.
                        </p>
                      )}
                    </div>

                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Storico eventi</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDjHistory.length ? (
                          selectedDjHistory.map((event) => (
                            <Link
                              key={event.id}
                              href={`/admin/eventi/${event.slug}`}
                              className="inline-flex rounded-md border border-[color:var(--color-brand-20)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-white/75"
                            >
                              {event.title} /{" "}
                              {new Date(event.date).toLocaleDateString("it-IT")}
                            </Link>
                          ))
                        ) : (
                          <span className="text-sm text-white/50">
                            Nessun evento collegato in storico.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={ui.surface.card}>
                      <span className={ui.form.label}>Bio</span>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/74">
                        {selectedDj.bio || "Nessuna bio disponibile."}
                      </p>
                    </div>
                  </>
                ) : null}

                {selectedForm && isEditOpen ? (
                  <form
                    className={`${ui.surface.card} grid gap-4`}
                    onSubmit={handleUpdateSelectedDj}
                  >
                    <span className={ui.form.label}>Editor DJ</span>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Nome DJ" htmlFor="selected-dj-name">
                        <input
                          id="selected-dj-name"
                          className={fieldClass}
                          value={selectedForm.name}
                          onChange={(event) =>
                            updateSelectedForm("name", event.target.value)
                          }
                          required
                        />
                      </Field>

                      <Field label="Città" htmlFor="selected-dj-city">
                        <div className="relative">
                          <input
                            id="selected-dj-city"
                            ref={selectedCityInputRef}
                            className={fieldClass}
                            value={selectedCityQuery}
                            onChange={(event) => {
                              const nextQuery = event.target.value;
                              setSelectedCityQuery(nextQuery);
                              updateSelectedForm("city", "");
                              updateSelectedForm("province", "");
                              updateSelectedForm("region", "");

                              if (!isGoogleAutocompleteReady) {
                                setSelectedCityMenuOpen(true);
                                void resolveSelectedMunicipalityFromQuery(
                                  nextQuery,
                                );
                              }
                            }}
                            onFocus={() => {
                              if (
                                !isGoogleAutocompleteReady &&
                                selectedCityOptions.length
                              ) {
                                setSelectedCityMenuOpen(true);
                              }
                            }}
                            onBlur={() => {
                              if (isGoogleAutocompleteReady) {
                                return;
                              }

                              window.setTimeout(() => {
                                setSelectedCityMenuOpen(false);
                                void resolveSelectedMunicipalityFromQuery(
                                  selectedCityQuery,
                                );
                              }, 120);
                            }}
                            placeholder="Scrivi e seleziona la citta"
                            autoComplete="off"
                            required
                          />
                          {selectedCityMenuOpen &&
                          selectedCityOptions.length ? (
                            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#E31F29]/20 bg-[#0b0b0c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                              {selectedCityOptions.map((municipality) => (
                                <button
                                  key={municipality.code}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/82 transition hover:bg-white/6"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    applySelectedMunicipalitySelection(
                                      municipality,
                                    );
                                    setSelectedCityMenuOpen(false);
                                  }}
                                >
                                  <span>{municipality.label}</span>
                                  <span className="text-xs uppercase tracking-[0.14em] text-white/45">
                                    {municipality.region}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Field>

                      <Field label="Email" htmlFor="selected-dj-email">
                        <input
                          id="selected-dj-email"
                          type="email"
                          className={fieldClass}
                          value={selectedForm.email}
                          onChange={(event) =>
                            updateSelectedForm("email", event.target.value)
                          }
                          required
                        />
                      </Field>

                      <Field label="Telefono" htmlFor="selected-dj-phone">
                        <input
                          id="selected-dj-phone"
                          type="tel"
                          className={fieldClass}
                          value={selectedForm.phone}
                          onChange={(event) =>
                            updateSelectedForm("phone", event.target.value)
                          }
                          required
                        />
                      </Field>

                      <Field label="Instagram" htmlFor="selected-dj-instagram">
                        <input
                          id="selected-dj-instagram"
                          className={fieldClass}
                          value={selectedForm.instagram}
                          onChange={(event) =>
                            updateSelectedForm("instagram", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Link set" htmlFor="selected-dj-set-link">
                        <input
                          id="selected-dj-set-link"
                          type="url"
                          className={fieldClass}
                          value={selectedForm.setLink}
                          onChange={(event) =>
                            updateSelectedForm("setLink", event.target.value)
                          }
                        />
                      </Field>

                      <Field
                        label="Nuova foto profilo"
                        htmlFor="selected-dj-photo"
                      >
                        <input
                          id="selected-dj-photo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          className={fieldClass}
                          onChange={(event) =>
                            setSelectedPhotoFile(
                              event.target.files?.[0] || null,
                            )
                          }
                        />
                        <span className="text-xs text-white/45">
                          Lascia vuoto per mantenere la foto attuale.
                        </span>
                      </Field>

                      <Field label="Bio" htmlFor="selected-dj-bio" full>
                        <textarea
                          id="selected-dj-bio"
                          className={`${fieldClass} min-h-32 resize-y`}
                          value={selectedForm.bio}
                          onChange={(event) =>
                            updateSelectedForm("bio", event.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className={ui.action.primary}
                        disabled={isSavingSelected || isDeletingSelected}
                      >
                        {isSavingSelected
                          ? "Salvataggio..."
                          : "Salva modifiche"}
                      </button>
                      <DeleteIconButton
                        onClick={handleDeleteSelectedDj}
                        disabled={isSavingSelected || isDeletingSelected}
                        busy={isDeletingSelected}
                        label={`Elimina DJ ${selectedDj.name}`}
                      />
                    </div>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4">
              <div className={ui.surface.panel}>
                <span className={ui.text.eyebrow}>Profilo</span>
                <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)]">
                  {selectedDj.photoUrl ? (
                    <div className="relative flex h-72 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(227,31,41,0.2),rgba(10,10,10,0.94)_72%)] p-4">
                      <img
                        src={selectedDj.photoUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-25 blur-3xl"
                      />
                      <img
                        src={selectedDj.photoUrl}
                        alt={selectedDj.name}
                        className="relative h-full w-full rounded-md object-contain"
                      />
                      <div className="absolute bottom-3 right-3 inline-flex items-center rounded-full border border-white/15 bg-black/72 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                        <span className="mr-2 h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                        OpenDecks
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-72 place-items-center bg-white/4 px-6 text-center text-sm text-white/45">
                      Nessuna foto profilo disponibile.
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-4">
                  <span className={ui.form.label}>Info anagrafiche</span>
                  <div className="grid gap-3 text-sm text-[#f7f3ee]">
                    <InfoRow
                      icon={<PinIcon />}
                      label="Citta"
                      value={formatCityProvince(
                        selectedDj.city,
                        selectedDj.province,
                      )}
                    />
                    <InfoRow
                      icon={<PinIcon />}
                      label="Regione"
                      value={selectedDj.region || "Non definita"}
                    />
                    <InfoRow
                      icon={<MailIcon />}
                      label="Email"
                      value={selectedDj.email || "Non disponibile"}
                      href={
                        selectedDj.email
                          ? `mailto:${selectedDj.email}`
                          : undefined
                      }
                    />
                    <InfoRow
                      icon={<PhoneIcon />}
                      label="Telefono"
                      value={selectedDj.phone || "Non disponibile"}
                      href={
                        selectedDj.phone ? `tel:${selectedDj.phone}` : undefined
                      }
                    />
                    <InfoRow
                      icon={<InstagramIcon />}
                      label="Instagram"
                      value={selectedDj.instagram || "Non disponibile"}
                      href={normalizeExternalHref(selectedDj.instagram)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <div
          ref={createPanelRef}
          className="order-first grid gap-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4 sm:p-6"
        >
          <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
            <button
              type="button"
              className={`${ui.action.secondary} gap-2 justify-self-end sm:order-2`}
              onClick={() => {
                if (!isCreating) {
                  setIsCreateOpen(false);
                }
              }}
              disabled={isCreating}
            >
              <ArrowLeftIcon />
              Torna alla lista
            </button>
            <div className="grid min-w-0 gap-2 sm:order-1">
              <span className={ui.text.eyebrow}>Inserimento manuale</span>
              <h3 className="break-words text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
                Aggiungi DJ al roster
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-white/70">
                Usa questo form per aggiungere nel roster un DJ che non ha
                inviato candidatura dal sito.
              </p>
            </div>
          </div>

          {createMessage ? (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {createMessage}
            </div>
          ) : null}

          {isCreating ? (
            <GlobalLoader
              eyebrow="Salvataggio DJ"
              title="Stiamo inserendo il profilo nel roster"
              description="Foto, dati e contatti vengono salvati ora. Aspetta un istante."
            />
          ) : (
            <form className="grid gap-5" onSubmit={handleCreateManualDj}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome DJ" htmlFor="manual-dj-name">
                  <input
                    id="manual-dj-name"
                    className={fieldClass}
                    value={manualForm.name}
                    onChange={(event) =>
                      updateManualForm("name", event.target.value)
                    }
                    required
                  />
                </Field>

                <Field label="Citta" htmlFor="manual-dj-city">
                  <div className="relative">
                    <input
                      id="manual-dj-city"
                      ref={manualCityInputRef}
                      className={fieldClass}
                      value={cityQuery}
                      onChange={(event) => {
                        const nextQuery = event.target.value;
                        setCityQuery(nextQuery);
                        setManualForm((current) => ({
                          ...current,
                          city: "",
                          province: "",
                          region: "",
                        }));

                        if (!isGoogleAutocompleteReady) {
                          setCityMenuOpen(true);
                          void resolveMunicipalityFromQuery(nextQuery);
                        }
                      }}
                      onFocus={() => {
                        if (!isGoogleAutocompleteReady && cityOptions.length) {
                          setCityMenuOpen(true);
                        }
                      }}
                      onBlur={() => {
                        if (isGoogleAutocompleteReady) {
                          return;
                        }

                        window.setTimeout(() => {
                          setCityMenuOpen(false);
                          void resolveMunicipalityFromQuery(cityQuery);
                        }, 120);
                      }}
                      placeholder="Scrivi e seleziona la citta, es. Roma o Berlin"
                      autoComplete="off"
                      required
                    />
                    {cityMenuOpen && cityOptions.length ? (
                      <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[#E31F29]/20 bg-[#0b0b0c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                        {cityOptions.map((municipality) => (
                          <button
                            key={municipality.code}
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/82 transition hover:bg-white/6"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              applyMunicipalitySelection(municipality);
                              setCityMenuOpen(false);
                            }}
                          >
                            <span>{municipality.label}</span>
                            <span className="text-xs uppercase tracking-[0.14em] text-white/45">
                              {municipality.region}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Field>

                <Field label="Email" htmlFor="manual-dj-email">
                  <input
                    id="manual-dj-email"
                    type="email"
                    className={fieldClass}
                    value={manualForm.email}
                    onChange={(event) =>
                      updateManualForm("email", event.target.value)
                    }
                    required
                  />
                </Field>

                <Field label="Telefono" htmlFor="manual-dj-phone">
                  <input
                    id="manual-dj-phone"
                    type="tel"
                    className={fieldClass}
                    value={manualForm.phone}
                    onChange={(event) =>
                      updateManualForm("phone", event.target.value)
                    }
                    required
                  />
                </Field>

                <Field label="Link Instagram" htmlFor="manual-dj-instagram">
                  <input
                    id="manual-dj-instagram"
                    type="url"
                    className={fieldClass}
                    value={manualForm.instagram}
                    onChange={(event) =>
                      updateManualForm("instagram", event.target.value)
                    }
                    placeholder="https://instagram.com/..."
                  />
                </Field>

                <Field label="Link set" htmlFor="manual-dj-set-link">
                  <input
                    id="manual-dj-set-link"
                    type="url"
                    className={fieldClass}
                    value={manualForm.setLink}
                    onChange={(event) =>
                      updateManualForm("setLink", event.target.value)
                    }
                  />
                </Field>

                <Field label="Foto personale" htmlFor="manual-dj-photo">
                  <input
                    id="manual-dj-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className={fieldClass}
                    onChange={(event) =>
                      setPhotoFile(event.target.files?.[0] || null)
                    }
                    required
                  />
                  <span className="text-xs text-white/45">
                    Carica una foto chiara del profilo. Formati supportati: JPG,
                    PNG, WEBP, AVIF.
                  </span>
                </Field>

                <Field label="Bio" htmlFor="manual-dj-bio" full>
                  <textarea
                    id="manual-dj-bio"
                    className={`${fieldClass} min-h-32 resize-y`}
                    value={manualForm.bio}
                    onChange={(event) =>
                      updateManualForm("bio", event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className={ui.action.primary}
                  disabled={isCreating}
                >
                  Salva DJ
                </button>
                <button
                  type="button"
                  className={ui.action.secondary}
                  onClick={() => {
                    setManualForm(createInitialManualForm(events));
                    setCityQuery("");
                    setCityOptions([]);
                    setCityMenuOpen(false);
                    setPhotoFile(null);
                    setMessage("");
                    setCreateMessage("");
                  }}
                  disabled={isCreating}
                >
                  Reset form
                </button>
                <button
                  type="button"
                  className={`${ui.action.secondary} gap-2`}
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  <ArrowLeftIcon />
                  Torna alla lista
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`grid gap-2 ${full ? "md:col-span-2" : ""}`}
    >
      <span className={ui.form.label}>{label}</span>
      {children}
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={ui.surface.card}>
      <span className={ui.form.label}>{label}</span>
      <p className="mt-2 break-all text-sm leading-7 text-[#f7f3ee]">{value}</p>
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

function createInitialManualForm(_events: EventRecord[]): ManualDjFormState {
  return {
    name: "",
    city: "",
    province: "",
    region: "",
    email: "",
    phone: "",
    instagram: "",
    setLink: "",
    photoUrl: "",
    bio: "",
  };
}

function normalizeExternalHref(value: string) {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("@")) {
    return `https://instagram.com/${value.slice(1)}`;
  }

  return `https://instagram.com/${value}`;
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
        d="M9.5 5.5 16 12l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCityProvince(city: string, province?: string) {
  return province ? `${city} (${province})` : city;
}

function buildInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}
