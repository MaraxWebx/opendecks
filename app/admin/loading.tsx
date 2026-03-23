import { GlobalLoader } from "@/components/global-loader";
import { ui } from "@/lib/ui";

export default function AdminLoading() {
  return (
    <div className={ui.layout.page}>
      <section className={ui.layout.section}>
        <div className={ui.surface.panel}>
          <GlobalLoader
            compact
            eyebrow="Area admin"
            title="Stiamo aprendo la console"
            description="Carichiamo accesso, dati e navigazione dell'area riservata."
          />
        </div>
      </section>
    </div>
  );
}
