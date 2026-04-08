"use client";

import { useEffect, useState } from "react";

import { AdminBodyClass } from "@/components/admin-body-class";
import { ui } from "@/lib/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { Route } from "next";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", href: "/admin" as Route },
  { key: "eventi", label: "Eventi", href: "/admin/eventi" },
  { key: "locations", label: "Locations", href: "/admin/locations" },
  { key: "candidature", label: "Candidature", href: "/admin/candidature" },
  { key: "dj", label: "DJ roster", href: "/admin/dj" },
  { key: "contenuti", label: "Gallery", href: "/admin/contenuti" },
] satisfies Array<{ key: string; label: string; href: Route }>;

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", sidebarOpen);

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [sidebarOpen]);

  return (
    <>
      <AdminBodyClass />
      <div
        className={`${ui.layout.page} grid min-w-0 gap-6 overflow-x-clip py-8 lg:grid-cols-[280px_minmax(0,1fr)]`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <Image
              src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
              alt="OpenDecks Italia"
              width={260}
              height={68}
              className="h-auto w-full max-w-[10.5rem] object-contain sm:max-w-[12rem]"
            />
          </div>
          <button
            type="button"
            className={`${ui.action.navToggle} shrink-0`}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            aria-label={sidebarOpen ? "Chiudi menu admin" : "Apri menu admin"}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            aria-label="Chiudi menu admin"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-50 grid w-full min-w-0 content-start gap-5 overflow-y-auto p-5 transition duration-300 ease-out lg:sticky lg:top-28 lg:z-auto lg:w-auto lg:self-start lg:translate-x-0 ${ui.surface.panel} ${
            sidebarOpen
              ? "translate-x-0 admin-sidebar-enter"
              : "-translate-x-[105%] lg:translate-x-0"
          }`}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <Image
                src="/img/loghi/LOGO-OPEN-DECKS_bianco.png"
                alt="OpenDecks Italia"
                width={260}
                height={68}
                priority
                className="h-auto w-full max-w-[12rem] object-contain md:max-w-[14rem]"
              />
              <span className="text-xs uppercase tracking-[0.24em] text-[#E31F29]">
                Area admin
              </span>
            </div>
            <div className="shrink-0 lg:hidden">
              <button
                type="button"
                className={ui.action.secondary}
                onClick={() => setSidebarOpen(false)}
              >
                Chiudi
              </button>
            </div>
          </div>

          <nav className="grid gap-2" aria-label="Menu amministrazione">
            {sidebarItems.map((item) => (
              <Link
                key={item.key}
                href={item.href as Route}
                className={`inline-flex min-h-11 items-center rounded-[0.55rem] border px-4 py-3 text-sm transition ${
                  pathname === item.href
                    ? ui.nav.sidebarActive
                    : ui.nav.sidebarIdle
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="grid gap-2 border-t border-[color:var(--color-border-soft)] pt-4">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">
              Sito pubblico
            </span>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-[0.55rem] border border-[color:var(--color-brand-14)] bg-[color:var(--color-surface-faint)] px-4 py-3 text-sm text-white/80 transition hover:bg-[color:var(--color-brand-12)]"
              onClick={() => setSidebarOpen(false)}
            >
              Torna al sito
            </Link>
          </div>

          <form action="/api/admin/logout" method="post" className="pt-1">
            <button type="submit" className={ui.action.secondary}>
              Esci
            </button>
          </form>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
