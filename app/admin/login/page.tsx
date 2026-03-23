import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ui } from "@/lib/ui";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const authenticated = await isAdminAuthenticated();
  const { error } = await searchParams;

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <div className={ui.layout.page}>
      <section className={ui.layout.section}>
        <div className={`max-w-xl ${ui.surface.panel}`}>
          <span className={ui.text.eyebrow}>Login admin</span>
          <h1 className={ui.text.title}>Accesso area riservata</h1>
          <p className={ui.text.lead}>
            Inserisci username e password per gestire eventi, candidature e
            contenuti.
          </p>

          <form
            action="/api/admin/login"
            method="post"
            className="mt-6 grid gap-4"
          >
            <div className="grid gap-2">
              <label htmlFor="username" className={ui.form.label}>
                Username
              </label>
              <input
                id="username"
                name="username"
                className={ui.form.field}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className={ui.form.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={ui.form.field}
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={ui.action.primary}>
                Entra
              </button>
            </div>
            <p className={ui.text.muted}>
              Credenziali di default in sviluppo: admin-opendecks123
            </p>
            {error ? (
              <p className="text-sm text-red-300">Credenziali non valide.</p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
