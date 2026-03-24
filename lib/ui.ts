export const colors = {
  brand: "var(--color-brand)",
  brandHover: "var(--color-brand-hover)",
  bg: "var(--color-bg)",
  bgElevated: "var(--color-bg-elevated)",
  surface: "var(--color-surface)",
  surfaceSoft: "var(--color-surface-soft)",
  surfaceFaint: "var(--color-surface-faint)",
  border: "var(--color-border)",
  borderSoft: "var(--color-border-soft)",
  brand10: "var(--color-brand-10)",
  brand12: "var(--color-brand-12)",
  brand14: "var(--color-brand-14)",
  brand20: "var(--color-brand-20)",
  brand25: "var(--color-brand-25)",
  brand35: "var(--color-brand-35)",
  brand38: "var(--color-brand-38)",
  brand60: "var(--color-brand-60)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  textSoft: "var(--color-text-soft)"
} as const;

export const ui = {
  layout: {
    page: "mx-auto w-full  px-4 md:px-6",
    section: "py-16 md:py-20",
    sectionCompact: "py-8 md:py-10",
    sectionBottom: "pb-14 md:pb-16",
    sectionBottomCompact: "pb-10 md:pb-12"
  },
  text: {
    eyebrow: "text-xs uppercase tracking-[0.24em] text-[color:var(--color-brand)]",
    title:
      "mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.03em] text-[color:var(--color-text)]",
    lead: "mt-4 max-w-[42rem] text-lg leading-8 text-[color:var(--color-text-muted)]",
    body: "text-sm leading-7 text-[color:var(--color-text-muted)]",
    muted: "text-sm text-[color:var(--color-text-soft)]"
  },
  surface: {
    panel:
      "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6",
    card:
      "rounded-xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-soft)] p-5",
    modal:
      "relative z-10 max-h-[calc(100vh-2rem)] w-full overflow-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6"
  },
  action: {
    primary:
      "inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--color-brand)] bg-[color:var(--color-brand)] px-5 py-3 text-sm font-medium text-white transition hover:border-[color:var(--color-brand-hover)] hover:bg-[color:var(--color-brand-hover)]",
    secondary:
      "inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--color-brand-35)] px-4 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-brand-10)]",
    navToggle:
      "inline-flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-[0.55rem] border border-[color:var(--color-brand-25)] bg-[color:var(--color-brand-10)] text-white md:hidden"
  },
  form: {
    field:
      "w-full rounded-xl border border-[color:var(--color-brand-20)] bg-[color:var(--color-surface)] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-brand-60)]",
    select:
      "select-theme w-full rounded-xl border border-[color:var(--color-brand-20)] bg-[color:var(--color-surface)] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-brand-60)]",
    label: "text-xs uppercase tracking-[0.18em] text-white/70"
  },
  nav: {
    active: "border-[color:var(--color-brand-35)] bg-[color:var(--color-brand-10)]",
    idle:
      "border-transparent hover:border-[color:var(--color-brand-35)] hover:bg-[color:var(--color-brand-10)]",
    sidebarActive:
      "border-[color:var(--color-brand-38)] bg-[color:var(--color-brand-12)] text-white",
    sidebarIdle:
      "border-[color:var(--color-brand-14)] bg-[color:var(--color-surface-faint)] text-white/80 hover:bg-[color:var(--color-brand-12)]"
  }
} as const;
