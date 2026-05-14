"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GlobalLoader } from "@/components/global-loader";
import { useInvisibleRecaptcha } from "@/components/use-invisible-recaptcha";
import { applicationFormCopy } from "@/content/site-copy";
import {
  buildCityAutocompleteOptionFromPlace,
  loadGoogleMapsPlaces,
  type CityAutocompleteOption,
} from "@/lib/google-places";
import { EventRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type ApplicationFormProps = {
  events: EventRecord[];
  initialSlug?: string;
};

type FormState = {
  eventSlug: string;
  name: string;
  city: string;
  province: string;
  region: string;
  email: string;
  phone: string;
  photoUrl: string;
  instagram: string;
  setLink: string;
  bio: string;
  privacyAccepted: boolean;
};

type MunicipalityOption = CityAutocompleteOption;
type SubmissionStage = "idle" | "security" | "upload" | "saving";
type WizardStep = 1 | 2 | 3;

type CalendarDay = {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  events: EventRecord[];
};

const initialState: FormState = {
  eventSlug: "",
  name: "",
  city: "",
  province: "",
  region: "",
  email: "",
  phone: "",
  photoUrl: "",
  instagram: "",
  setLink: "",
  bio: "",
  privacyAccepted: false,
};

const fieldClass =
  "w-full rounded-lg border border-[#E31F29]/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#E31F29]/60";

const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function ApplicationForm({ events, initialSlug }: ApplicationFormProps) {
  const defaultEventSlug = initialSlug || events[0]?.slug || "";
  const defaultSelectedEvent =
    events.find((item) => item.slug === defaultEventSlug) || events[0] || null;
  const defaultMonthKey = defaultSelectedEvent
    ? getMonthKey(defaultSelectedEvent.date)
    : getMonthKey(new Date().toISOString().slice(0, 10));
  const defaultDate = defaultSelectedEvent?.date || "";

  const [form, setForm] = useState<FormState>({
    ...initialState,
    eventSlug: defaultEventSlug,
  });
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<MunicipalityOption[]>([]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [isGoogleAutocompleteReady, setIsGoogleAutocompleteReady] =
    useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [status, setStatus] = useState<{
    type: "idle" | "ok" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] =
    useState<SubmissionStage>("idle");
  const {
    recaptchaContainerRef,
    executeRecaptcha,
    isRecaptchaReady,
  } = useInvisibleRecaptcha();
  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const cityAutocompleteRef = useRef<any>(null);

  const monthKeys = useMemo(
    () =>
      Array.from(new Set(events.map((event) => getMonthKey(event.date)))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [events],
  );

  const calendarEvents = useMemo(
    () =>
      events.filter((event) => getMonthKey(event.date) === selectedMonthKey),
    [events, selectedMonthKey],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonthKey, calendarEvents),
    [selectedMonthKey, calendarEvents],
  );

  const selectedDateEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );

  const selectedEvent =
    events.find((item) => item.slug === form.eventSlug) || null;

  useEffect(() => {
    if (!selectedDate && events[0]) {
      setSelectedDate(events[0].date);
    }
  }, [events, selectedDate]);

  useEffect(() => {
    if (!monthKeys.includes(selectedMonthKey)) {
      setSelectedMonthKey(monthKeys[0] || defaultMonthKey);
    }
  }, [defaultMonthKey, monthKeys, selectedMonthKey]);

  useEffect(() => {
    if (
      selectedDate &&
      getMonthKey(selectedDate) === selectedMonthKey &&
      selectedDateEvents.length
    ) {
      return;
    }

    const firstMonthEvent = calendarEvents[0];

    if (firstMonthEvent) {
      setSelectedDate(firstMonthEvent.date);
      setForm((current) => ({
        ...current,
        eventSlug:
          selectedDateEvents.find((event) => event.slug === current.eventSlug)
            ?.slug || firstMonthEvent.slug,
      }));
    }
  }, [calendarEvents, selectedDate, selectedDateEvents, selectedMonthKey]);

  useEffect(() => {
    if (!selectedDateEvents.length) {
      return;
    }

    if (!selectedDateEvents.some((event) => event.slug === form.eventSlug)) {
      setForm((current) => ({
        ...current,
        eventSlug: selectedDateEvents[0].slug,
      }));
    }
  }, [form.eventSlug, selectedDateEvents]);

  function resetApplicationForm(eventSlug = defaultEventSlug) {
    const fallbackEvent =
      events.find((item) => item.slug === eventSlug) ||
      events.find((item) => item.slug === defaultEventSlug) ||
      events[0] ||
      null;

    setForm({
      ...initialState,
      eventSlug: fallbackEvent?.slug || "",
    });
    setCurrentStep(1);
    setSelectedMonthKey(
      fallbackEvent ? getMonthKey(fallbackEvent.date) : defaultMonthKey,
    );
    setSelectedDate(fallbackEvent?.date || "");
    setCityQuery("");
    setCityOptions([]);
    setCityMenuOpen(false);
    setPhotoFile(null);
    setPhotoInputKey((current) => current + 1);
  }

  function applyMunicipalitySelection(municipality: MunicipalityOption | null) {
    if (!municipality) {
      setForm((current) => ({
        ...current,
        city: "",
        province: "",
        region: "",
      }));
      return;
    }

    setCityQuery(municipality.label);
    setForm((current) => ({
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
      cityOptions.find((municipality) => municipality.label === normalizedLabel) ||
      null;

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
        if (
          cancelled ||
          !cityInputRef.current ||
          !window.google?.maps?.places
        ) {
          return;
        }

        cityAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          cityInputRef.current,
          {
            types: ["geocode"],
            fields: ["address_components", "name", "place_id", "formatted_address"],
          },
        );

        cityAutocompleteRef.current.addListener("place_changed", () => {
          const place = cityAutocompleteRef.current?.getPlace?.();
          const municipality = buildCityAutocompleteOptionFromPlace(place);

          if (!municipality) {
            return;
          }

          applyMunicipalitySelection(municipality);
          setCityOptions([]);
          setCityMenuOpen(false);
        });

        setIsGoogleAutocompleteReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setIsGoogleAutocompleteReady(false);
        }
      });

    return () => {
      cancelled = true;

      if (cityAutocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          cityAutocompleteRef.current,
        );
      }

      cityAutocompleteRef.current = null;
    };
  }, []);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || submissionStage !== "idle") {
      return;
    }

    setSubmitting(true);
    setSubmissionStage("security");
    setStatus({ type: "idle", message: "" });

    try {
      const currentEvent = events.find((item) => item.slug === form.eventSlug);

      if (!currentEvent) {
        throw new Error("Seleziona un evento valido.");
      }

      if (!form.province) {
        const resolvedMunicipality =
          await resolveMunicipalityFromQuery(cityQuery);

        if (!resolvedMunicipality) {
          throw new Error("Seleziona una citta valida dall'autocomplete.");
        }
      }

      const recaptchaToken = await executeRecaptcha();
      setSubmissionStage("upload");
      const photoUrl = await uploadPhoto(photoFile);
      setSubmissionStage("saving");

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: currentEvent.id,
          eventTitle: currentEvent.title,
          name: form.name,
          city: form.city,
          province: form.province,
          region: form.region,
          email: form.email,
          phone: form.phone,
          photoUrl,
          instagram: form.instagram,
          setLink: form.setLink,
          bio: form.bio,
          privacyAccepted: form.privacyAccepted,
          recaptchaToken,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Invio non riuscito.");
      }

      resetApplicationForm(currentEvent.slug);
      setStatus({ type: "ok", message: "Candidatura inviata correttamente." });
    } catch (error) {
      resetApplicationForm(form.eventSlug || defaultEventSlug);
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Si e verificato un errore.",
      });
    } finally {
      setSubmitting(false);
      setSubmissionStage("idle");
    }
  }

  const loaderContent =
    submissionStage === "upload"
      ? {
          eyebrow: "Caricamento foto",
          title: "Stiamo preparando i materiali",
          description:
            "La foto personale viene caricata e collegata alla candidatura.",
        }
      : submissionStage === "saving"
        ? {
            eyebrow: applicationFormCopy.loaderEyebrow,
            title: applicationFormCopy.loaderTitle,
            description: applicationFormCopy.loaderDescription,
          }
        : null;

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function restartApplicationFlow() {
    window.location.href = `/prenota?retry=${Date.now()}`;
  }

  function handleSelectMonth(direction: -1 | 1) {
    const currentIndex = monthKeys.indexOf(selectedMonthKey);
    const nextIndex = currentIndex + direction;
    const nextMonth = monthKeys[nextIndex];

    if (!nextMonth) {
      return;
    }

    setSelectedMonthKey(nextMonth);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const dayEvents = events.filter((event) => event.date === date);

    if (dayEvents.length) {
      setForm((current) => ({
        ...current,
        eventSlug: dayEvents.some((event) => event.slug === current.eventSlug)
          ? current.eventSlug
          : dayEvents[0].slug,
      }));
    }
  }

  function goToStep(step: WizardStep) {
    setCurrentStep(step);
  }

  function handleNextStep() {
    if (currentStep === 1) {
      if (!form.eventSlug) {
        setStatus({
          type: "error",
          message: "Seleziona prima un evento dal calendario.",
        });
        return;
      }
      setStatus({ type: "idle", message: "" });
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (
        !form.name.trim() ||
        !cityQuery.trim() ||
        !form.instagram.trim() ||
        !form.email.trim() ||
        !form.phone.trim()
      ) {
        setStatus({
          type: "error",
          message: "Completa i dati principali prima di continuare.",
        });
        return;
      }

      setStatus({ type: "idle", message: "" });
      setCurrentStep(3);
    }
  }

  return (
    <div className="rounded-xl border border-[#E31F29]/18 bg-white/[0.03] p-4 md:p-6">
      {!events.length ? (
        <EmptyApplicationsState />
      ) : status.type === "error" && currentStep === 1 ? (
        <div className="relative">
          <WizardShell
            currentStep={currentStep}
            selectedEvent={selectedEvent}
            form={form}
          >
            <InlineError message={status.message} />
            <StepOneCalendar
              selectedMonthKey={selectedMonthKey}
              monthKeys={monthKeys}
              calendarDays={calendarDays}
              selectedDate={selectedDate}
              selectedDateEvents={selectedDateEvents}
              selectedEventSlug={form.eventSlug}
              onSelectMonth={handleSelectMonth}
              onSelectDate={handleSelectDate}
              onSelectEvent={(slug) => updateField("eventSlug", slug)}
            />
            <WizardActions
              currentStep={currentStep}
              canGoBack={false}
              onBack={() => null}
              onNext={handleNextStep}
              submitting={submitting}
              submissionStage={submissionStage}
            />
          </WizardShell>
        </div>
      ) : status.type === "error" ? (
        <FeedbackState
          type="error"
          title={applicationFormCopy.errorTitle}
          eyebrow={applicationFormCopy.errorEyebrow}
          description={status.message}
          retryCta={applicationFormCopy.retryCta}
          supportCta={applicationFormCopy.supportCta}
          onRetry={restartApplicationFlow}
        />
      ) : status.type === "ok" ? (
        <FeedbackState
          type="ok"
          title={applicationFormCopy.successTitle}
          eyebrow={applicationFormCopy.successEyebrow}
          description={applicationFormCopy.successDescription}
          retryCta={applicationFormCopy.retryCta}
          supportCta={applicationFormCopy.supportCta}
          onRetry={restartApplicationFlow}
        />
      ) : (
        <div className="relative">
          <form
            onSubmit={handleSubmit}
            className={
              submissionStage !== "idle"
                ? "pointer-events-none grid gap-6 opacity-30"
                : "grid gap-6"
            }
          >
            <WizardShell
              currentStep={currentStep}
              selectedEvent={selectedEvent}
              form={form}
            >
              {currentStep === 1 ? (
                <StepOneCalendar
                  selectedMonthKey={selectedMonthKey}
                  monthKeys={monthKeys}
                  calendarDays={calendarDays}
                  selectedDate={selectedDate}
                  selectedDateEvents={selectedDateEvents}
                  selectedEventSlug={form.eventSlug}
                  onSelectMonth={handleSelectMonth}
                  onSelectDate={handleSelectDate}
                  onSelectEvent={(slug) => updateField("eventSlug", slug)}
                />
              ) : null}

              {currentStep === 2 ? (
                <StepTwoProfile
                  cityInputRef={cityInputRef}
                  cityMenuOpen={cityMenuOpen}
                  cityOptions={cityOptions}
                  cityQuery={cityQuery}
                  fieldClass={fieldClass}
                  form={form}
                  isGoogleAutocompleteReady={isGoogleAutocompleteReady}
                  onApplyMunicipalitySelection={applyMunicipalitySelection}
                  onCityBlur={() => {
                    if (isGoogleAutocompleteReady) {
                      return;
                    }

                    window.setTimeout(() => {
                      setCityMenuOpen(false);
                      void resolveMunicipalityFromQuery(cityQuery);
                    }, 120);
                  }}
                  onCityChange={(value) => {
                    setCityQuery(value);
                    setForm((current) => ({
                      ...current,
                      city: "",
                      province: "",
                      region: "",
                    }));

                    if (!isGoogleAutocompleteReady) {
                      setCityMenuOpen(true);
                      void resolveMunicipalityFromQuery(value);
                    }
                  }}
                  onCityFocus={() => {
                    if (!isGoogleAutocompleteReady && cityOptions.length) {
                      setCityMenuOpen(true);
                    }
                  }}
                  onUpdateField={updateField}
                />
              ) : null}

              {currentStep === 3 ? (
                <StepThreeAssets
                  fieldClass={fieldClass}
                  form={form}
                  photoFile={photoFile}
                  photoInputKey={photoInputKey}
                  selectedEvent={selectedEvent}
                  onUpdateField={updateField}
                  onSelectPhoto={(file) => setPhotoFile(file)}
                />
              ) : null}

              <WizardActions
                currentStep={currentStep}
                canGoBack={currentStep > 1}
                onBack={() => goToStep((currentStep - 1) as WizardStep)}
                onNext={handleNextStep}
                submitting={submitting}
                submissionStage={submissionStage}
              />

              <div ref={recaptchaContainerRef} />
              {!isRecaptchaReady ? (
                <span className="text-xs text-white/45">
                  Verifica sicurezza in caricamento.
                </span>
              ) : null}
            </WizardShell>
          </form>

          {loaderContent ? (
            <div className="absolute inset-0 z-10 rounded-xl border border-[#E31F29]/18 bg-black/72 backdrop-blur-sm">
              <GlobalLoader
                compact
                eyebrow={loaderContent.eyebrow}
                title={loaderContent.title}
                description={loaderContent.description}
                className="min-h-full"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptyApplicationsState() {
  return (
    <div className="grid gap-6 rounded-xl border border-[#E31F29]/18 bg-[linear-gradient(180deg,rgba(227,31,41,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6 md:p-8">
      <div className="flex flex-col items-start gap-5">
        <BrandLogo />
        <div className="grid gap-3">
          <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
            Candidature chiuse
          </span>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
            Resta connesso per i prossimi eventi.
          </h2>
          <p className="max-w-[42rem] text-base leading-7 text-white/76">
            Al momento non ci sono eventi con candidature aperte. A breve
            verranno pubblicate nuove call: torna presto o seguici sui canali
            OpenDecks per i prossimi aggiornamenti.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/eventi" className={ui.action.secondary}>
          Vedi gli eventi
        </Link>
        <Link href="/contatti" className={ui.action.secondary}>
          Contattaci
        </Link>
      </div>
    </div>
  );
}

function FeedbackState({
  type,
  title,
  eyebrow,
  description,
  retryCta,
  supportCta,
  onRetry,
}: {
  type: "ok" | "error";
  title: string;
  eyebrow: string;
  description: string;
  retryCta: string;
  supportCta: string;
  onRetry: () => void;
}) {
  const shellClass =
    type === "ok"
      ? "border-emerald-500/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.08)_0%,rgba(255,255,255,0.03)_100%)]"
      : "border-[#E31F29]/24 bg-[linear-gradient(180deg,rgba(227,31,41,0.1)_0%,rgba(255,255,255,0.03)_100%)]";
  const eyebrowClass =
    type === "ok"
      ? "text-emerald-300"
      : "text-[#ff8b92]";

  return (
    <div className={`grid gap-6 rounded-xl p-6 md:p-8 ${shellClass}`}>
      <div className="flex flex-col items-start gap-5">
        <BrandLogo />
        <div className="grid gap-3">
          <span className={`text-xs uppercase tracking-[0.24em] ${eyebrowClass}`}>
            {eyebrow}
          </span>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#f7f3ee]">
            {title}
          </h2>
          <p className="max-w-[42rem] text-base leading-7 text-white/76">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={ui.action.secondary} onClick={onRetry}>
          {retryCta}
        </button>
        <Link href="/contatti" className={ui.action.secondary}>
          {supportCta}
        </Link>
      </div>
    </div>
  );
}

function WizardShell({
  currentStep,
  selectedEvent,
  form,
  children,
}: {
  currentStep: WizardStep;
  selectedEvent: EventRecord | null;
  form: FormState;
  children: React.ReactNode;
}) {
  const steps = [
    { id: 1, label: "Evento" },
    { id: 2, label: "Profilo" },
    { id: 3, label: "Materiali" },
  ] as const;

  return (
    <>
      <div className="grid gap-3">
        <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
          {applicationFormCopy.eyebrow}
        </span>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee]">
          {applicationFormCopy.title}
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-white/70">
          {applicationFormCopy.description}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#E31F29]/15 bg-[linear-gradient(180deg,rgba(227,31,41,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2 text-sm ${
                  isActive
                    ? "border-[#E31F29] bg-[#E31F29] text-white"
                    : isCompleted
                      ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-100"
                      : "border-white/10 bg-black/20 text-white/62"
                }`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-[0.72rem] font-semibold">
                  {step.id}
                </span>
                <span className="uppercase tracking-[0.14em]">{step.label}</span>
              </div>
            );
          })}
        </div>

        {selectedEvent ? (
          <div className="grid gap-2 rounded-xl border border-white/8 bg-black/25 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="grid gap-1">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#E31F29]">
                Evento selezionato
              </p>
              <h3 className="text-lg font-semibold text-[#f7f3ee]">
                {selectedEvent.title}
              </h3>
              <p className="text-sm text-white/62">
                {new Date(selectedEvent.date).toLocaleDateString("it-IT")} /{" "}
                {selectedEvent.time} / {selectedEvent.locationName}
              </p>
            </div>
            <div className="text-sm text-white/55">
              {form.eventSlug ? "Step attivo" : "Scegli una data"}
            </div>
          </div>
        ) : null}

        {children}
      </div>
    </>
  );
}

function StepOneCalendar({
  selectedMonthKey,
  monthKeys,
  calendarDays,
  selectedDate,
  selectedDateEvents,
  selectedEventSlug,
  onSelectMonth,
  onSelectDate,
  onSelectEvent,
}: {
  selectedMonthKey: string;
  monthKeys: string[];
  calendarDays: CalendarDay[];
  selectedDate: string;
  selectedDateEvents: EventRecord[];
  selectedEventSlug: string;
  onSelectMonth: (direction: -1 | 1) => void;
  onSelectDate: (date: string) => void;
  onSelectEvent: (slug: string) => void;
}) {
  const currentIndex = monthKeys.indexOf(selectedMonthKey);

  return (
    <div className="grid gap-5">
      <div className="px-1 md:px-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#E31F29]">
            Step 1
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[#f7f3ee]">
            Scegli data ed evento
          </h3>
          <p className="mt-1 text-sm leading-6 text-white/62">
            Prima scegli la call dal calendario. Su mobile puoi toccare il
            giorno e poi selezionare l&apos;evento sotto la griglia.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onSelectMonth(-1)}
            disabled={currentIndex <= 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E31F29]/22 bg-black/20 text-white transition hover:bg-[#E31F29]/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Mese precedente"
          >
            <ArrowLeftIcon />
          </button>
          <div className="min-w-[12rem] rounded-lg border border-[#E31F29]/16 bg-black/25 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white">
            {formatMonthLabel(selectedMonthKey)}
          </div>
          <button
            type="button"
            onClick={() => onSelectMonth(1)}
            disabled={currentIndex === -1 || currentIndex >= monthKeys.length - 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E31F29]/22 bg-black/20 text-white transition hover:bg-[#E31F29]/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Mese successivo"
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      </div>

      <div className="-mx-4 rounded-2xl border border-[#E31F29]/16 bg-[#080808] px-2 py-3 md:mx-0 md:p-4">
        <div className="mb-2 grid grid-cols-7 gap-2 px-2 md:px-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[0.68rem] uppercase tracking-[0.14em] text-white/35"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 px-2 md:px-0">
          {calendarDays.map((day) => {
            const hasEvents = day.events.length > 0;
            const isSelected = day.date === selectedDate;
            const hasOpenEvents = day.events.some((event) => event.applicationsOpen);

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => hasEvents && onSelectDate(day.date)}
                disabled={!hasEvents}
                className={`relative min-h-[3.35rem] rounded-xl border p-2 text-left transition md:min-h-[4.2rem] ${
                  isSelected
                    ? "border-[#E31F29] bg-[#E31F29]/14 text-white shadow-[0_0_0_1px_rgba(227,31,41,0.35)]"
                    : hasEvents
                      ? "border-white/10 bg-white/[0.04] text-white hover:border-[#E31F29]/36 hover:bg-[#E31F29]/10"
                      : "border-white/5 bg-white/[0.02] text-white/24"
                } ${!day.inCurrentMonth ? "opacity-40" : ""} ${
                  !hasEvents ? "cursor-default" : ""
                }`}
              >
                <span className="block text-sm font-semibold">{day.dayNumber}</span>
                {hasEvents ? (
                  <span className="mt-1 flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.12em] text-white/65">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${
                        hasOpenEvents ? "bg-emerald-400" : "bg-[#E31F29]"
                      }`}
                    />
                    {day.events.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 px-1 md:px-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#E31F29]">
              Giorno selezionato
            </p>
            <h4 className="mt-1 text-lg font-semibold text-[#f7f3ee]">
              {selectedDate
                ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Nessuna data"}
            </h4>
          </div>
          <p className="text-sm text-white/55">
            {selectedDateEvents.length}{" "}
            {selectedDateEvents.length === 1 ? "evento disponibile" : "eventi disponibili"}
          </p>
        </div>

        <div className="grid gap-3">
          {selectedDateEvents.map((event) => {
            const isActive = event.slug === selectedEventSlug;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event.slug)}
                className={`grid gap-2 rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-[#E31F29] bg-[#E31F29]/12"
                    : "border-white/10 bg-black/20 hover:border-[#E31F29]/28 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h5 className="text-base font-semibold text-[#f7f3ee]">
                    {event.title}
                  </h5>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] ${
                      isActive
                        ? "border-[#E31F29] bg-[#E31F29] text-white"
                        : "border-white/10 text-white/62"
                    }`}
                  >
                    {isActive ? "Selezionato" : "Seleziona"}
                  </span>
                </div>
                <p className="text-sm text-white/62">
                  {event.locationName} / {event.time}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepTwoProfile({
  cityInputRef,
  cityMenuOpen,
  cityOptions,
  cityQuery,
  fieldClass,
  form,
  isGoogleAutocompleteReady,
  onApplyMunicipalitySelection,
  onCityBlur,
  onCityChange,
  onCityFocus,
  onUpdateField,
}: {
  cityInputRef: React.RefObject<HTMLInputElement | null>;
  cityMenuOpen: boolean;
  cityOptions: MunicipalityOption[];
  cityQuery: string;
  fieldClass: string;
  form: FormState;
  isGoogleAutocompleteReady: boolean;
  onApplyMunicipalitySelection: (municipality: MunicipalityOption) => void;
  onCityBlur: () => void;
  onCityChange: (value: string) => void;
  onCityFocus: () => void;
  onUpdateField: <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#E31F29]">
          Step 2
        </p>
        <h3 className="mt-1 text-xl font-semibold text-[#f7f3ee]">
          Inserisci i dati principali
        </h3>
        <p className="mt-1 text-sm leading-6 text-white/62">
          Queste informazioni servono per identificarti e ricontattarti.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Nome DJ
          </label>
          <input
            id="name"
            className={fieldClass}
            value={form.name}
            onChange={(event) => onUpdateField("name", event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="city" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Citta
          </label>
          <div className="relative">
            <input
              id="city"
              ref={cityInputRef}
              className={fieldClass}
              value={cityQuery}
              onChange={(event) => onCityChange(event.target.value)}
              onFocus={onCityFocus}
              onBlur={onCityBlur}
              placeholder="Scrivi e seleziona la citta, es. Roma o Berlin"
              autoComplete="off"
              required
            />
            {cityMenuOpen && cityOptions.length ? (
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[#E31F29]/20 bg-[#0b0b0c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                {cityOptions.map((municipality) => (
                  <button
                    key={municipality.code}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/82 transition hover:bg-white/6"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onApplyMunicipalitySelection(municipality);
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
          {!isGoogleAutocompleteReady ? (
            <span className="text-xs text-white/45">
              Suggerimenti citta attivi da tastiera.
            </span>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="instagram" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Link Instagram
          </label>
          <input
            id="instagram"
            type="url"
            className={fieldClass}
            value={form.instagram}
            onChange={(event) => onUpdateField("instagram", event.target.value)}
            placeholder="https://instagram.com/..."
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            value={form.email}
            onChange={(event) => onUpdateField("email", event.target.value)}
            placeholder="nome@email.com"
            required
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="phone" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Numero di telefono
          </label>
          <input
            id="phone"
            type="tel"
            className={fieldClass}
            value={form.phone}
            onChange={(event) => onUpdateField("phone", event.target.value)}
            placeholder="+39 ..."
            required
          />
        </div>
      </div>
    </div>
  );
}

function StepThreeAssets({
  fieldClass,
  form,
  photoFile,
  photoInputKey,
  selectedEvent,
  onUpdateField,
  onSelectPhoto,
}: {
  fieldClass: string;
  form: FormState;
  photoFile: File | null;
  photoInputKey: number;
  selectedEvent: EventRecord | null;
  onUpdateField: <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => void;
  onSelectPhoto: (file: File | null) => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#E31F29]">
          Step 3
        </p>
        <h3 className="mt-1 text-xl font-semibold text-[#f7f3ee]">
          Carica materiali e conferma
        </h3>
        <p className="mt-1 text-sm leading-6 text-white/62">
          Ultimo passaggio: set, foto e consenso privacy prima dell&apos;invio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="photo" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Foto personale
          </label>
          <input
            key={photoInputKey}
            id="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className={fieldClass}
            onChange={(event) => onSelectPhoto(event.target.files?.[0] || null)}
            required
          />
          <span className="text-xs text-white/45">
            Carica una foto chiara del profilo. Formati supportati: JPG, PNG,
            WEBP, AVIF.
          </span>
          {photoFile ? (
            <span className="text-xs text-emerald-300">
              File selezionato: {photoFile.name}
            </span>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="setLink" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Link set
          </label>
          <input
            id="setLink"
            type="url"
            className={fieldClass}
            value={form.setLink}
            onChange={(event) => onUpdateField("setLink", event.target.value)}
            placeholder="https://..."
            required
          />
          <span className="text-xs leading-6 text-white/45">
            Inserisci un link al set tramite SoundCloud, Mixcloud, Drive,
            Dropbox o WeTransfer temporaneo se necessario.
          </span>
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="bio" className="text-xs uppercase tracking-[0.18em] text-white/70">
            Bio breve
          </label>
          <textarea
            id="bio"
            className={`${fieldClass} min-h-32 resize-y`}
            value={form.bio}
            onChange={(event) => onUpdateField("bio", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-1">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#E31F29]">
            Riepilogo invio
          </p>
          <h4 className="text-lg font-semibold text-[#f7f3ee]">
            {selectedEvent?.title || "Evento selezionato"}
          </h4>
          <p className="text-sm text-white/62">
            {selectedEvent
              ? `${new Date(selectedEvent.date).toLocaleDateString("it-IT")} / ${selectedEvent.time} / ${selectedEvent.locationName}`
              : "Controlla i dati prima di inviare."}
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-[#E31F29]/16 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72">
          <input
            type="checkbox"
            checked={form.privacyAccepted}
            onChange={(event) =>
              onUpdateField("privacyAccepted", event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-[#E31F29]/30 bg-black"
            required
          />
          <span>
            Ho letto e accetto la{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="underline decoration-[#E31F29] underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <span className="text-sm text-white/60">
          {applicationFormCopy.requiredFields}
        </span>
      </div>
    </div>
  );
}

function WizardActions({
  currentStep,
  canGoBack,
  onBack,
  onNext,
  submitting,
  submissionStage,
}: {
  currentStep: WizardStep;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  submitting: boolean;
  submissionStage: SubmissionStage;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3">
        {canGoBack ? (
          <button
            type="button"
            className={ui.action.secondary}
            onClick={onBack}
          >
            Indietro
          </button>
        ) : null}
      </div>

      {currentStep < 3 ? (
        <button
          type="button"
          className={ui.action.primary}
          onClick={onNext}
        >
          Continua
        </button>
      ) : (
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E31F29] bg-[#E31F29] px-5 py-3 text-sm font-medium text-white transition hover:border-[#c91922] hover:bg-[#c91922]"
          type="submit"
          disabled={submitting || submissionStage !== "idle"}
        >
          {submissionStage === "security"
            ? "Verifica sicurezza..."
            : applicationFormCopy.submitCta}
        </button>
      )}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#E31F29]/30 bg-[#E31F29]/10 px-4 py-3 text-sm text-[#ffd7da]">
      {message}
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3">
      <Image
        src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
        alt="OpenDecks"
        width={180}
        height={42}
        className="h-auto w-[140px] md:w-[180px]"
      />
    </div>
  );
}

function buildCalendarDays(month: string, events: EventRecord[]): CalendarDay[] {
  const [year, monthNumber] = month.split("-");
  const currentMonthDate = new Date(Number(year), Number(monthNumber) - 1, 1);
  const firstDay = new Date(currentMonthDate);
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(currentMonthDate);
  gridStart.setDate(currentMonthDate.getDate() - firstWeekDay);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const isoDate = formatIsoDate(cellDate);
    const dayEvents = events.filter((event) => event.date === isoDate);

    return {
      date: isoDate,
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === currentMonthDate.getMonth(),
      events: dayEvents,
    };
  });
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
