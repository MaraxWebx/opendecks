"use client";

type GlobalLoaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
};

export function GlobalLoader({
  eyebrow = "Caricamento",
  title,
  description,
  className = "",
  compact = false
}: GlobalLoaderProps) {
  return (
    <div
      className={`grid place-items-center px-4 text-center ${compact ? "min-h-[260px] py-8" : "min-h-[440px] py-10"} ${className}`.trim()}
    >
      <div className="grid gap-6">
        <div className={`relative mx-auto ${compact ? "h-28 w-28" : "h-36 w-36"}`}>
          <div className="absolute inset-0 animate-[spin_1.8s_linear_infinite] rounded-full border border-[color:var(--color-brand-35)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_18%,rgba(0,0,0,0.55)_19%,rgba(0,0,0,0.88)_62%,rgba(227,31,41,0.16)_100%)] shadow-[0_0_30px_rgba(227,31,41,0.24)]" />
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#111] ${compact ? "h-10 w-10" : "h-12 w-12"}`} />
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-brand)] shadow-[0_0_12px_rgba(227,31,41,0.8)] ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
        </div>

        <div className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-brand)]">
            {eyebrow}
          </span>
          <h4 className={`${compact ? "text-xl" : "text-2xl"} font-semibold tracking-[-0.03em] text-[#f7f3ee]`}>
            {title}
          </h4>
          {description ? (
            <p className="mx-auto max-w-md text-sm leading-7 text-white/68">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
