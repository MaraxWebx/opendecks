"use client";

import { useEffect, useState } from "react";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "@/lib/ui";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/progetto", label: "Il progetto" },
  { href: "/eventi", label: "Eventi" },

  { href: "/archive", label: "Archivio" },
  { href: "/prenota", label: "Prenota il tuo set", featured: true },
] satisfies Array<{ href: Route; label: string; featured?: boolean }>;

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E31F29]/25 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex w-auto flex-none items-center justify-between gap-4 max-md:w-full">
          <Link
            href="/"
            className="inline-flex items-center"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
              alt="OpenDecks Italia"
              width={240}
              height={48}
              priority
              className="h-14 w-auto object-contain md:h-16"
            />
          </Link>

          <button
            type="button"
            className={ui.action.navToggle}
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>

        <nav
          id="site-nav"
          className="hidden items-center justify-end gap-2 md:flex"
          aria-label="Navigazione principale"
        >
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={`w-auto rounded-[0.55rem] border px-4 py-2 text-[0.95rem] text-white transition ${
                item.featured
                  ? "border-[#ff5a63] bg-[#E31F29] shadow-[0_0_12px_rgba(227,31,41,0.45),0_0_28px_rgba(227,31,41,0.18)] hover:border-[#ff7077] hover:bg-[#c91922]"
                  : pathname === item.href
                    ? ui.nav.active
                    : ui.nav.idle
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <div
          id="site-nav"
          className="menu-overlay-enter fixed inset-0 z-50 flex min-h-screen w-full flex-col overflow-hidden bg-black/95 px-4 py-4 backdrop-blur-xl md:hidden"
          aria-label="Navigazione principale"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(227,31,41,0.22),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(227,31,41,0.08),transparent)]" />
          <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#E31F29]/12 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-24 h-48 w-48 rounded-full bg-[#E31F29]/10 blur-3xl" />

          <div className="menu-panel-enter relative mb-4 flex items-center justify-between gap-4 border-b border-[#E31F29]/20 pb-4">
            <Image
              src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
              alt="OpenDecks Italia"
              width={240}
              height={48}
              className="h-16 w-auto object-contain"
            />
            <button
              type="button"
              className={ui.action.secondary}
              aria-label="Chiudi menu"
              onClick={() => setMenuOpen(false)}
            >
              Chiudi
            </button>
          </div>

          <nav
            className="menu-panel-enter relative flex flex-1 flex-col  gap-2"
            aria-label="Menu mobile"
          >
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={`menu-link-enter w-full border-b py-5 text-[1.45rem] font-medium tracking-[-0.02em] text-white transition ${
                  item.featured
                    ? "border-[#E31F29]/35 bg-[#E31F29]/16 pl-3 shadow-[0_0_14px_rgba(227,31,41,0.2)]"
                    : pathname === item.href
                      ? "border-[#E31F29]/15 bg-[color:var(--color-brand-10)] pl-3"
                      : "border-[#E31F29]/15 hover:bg-white/[0.03] hover:pl-3"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
