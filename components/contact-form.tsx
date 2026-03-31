"use client";

import { useState } from "react";

import { ui } from "@/lib/ui";

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Invio messaggio non riuscito.");
      }

      setForm(initialState);
      setStatus("Messaggio inviato correttamente.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore invio messaggio.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="contact-name" className={ui.form.label}>
          Nome
        </label>
        <input
          id="contact-name"
          className={ui.form.field}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="contact-email" className={ui.form.label}>
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            className={ui.form.field}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="contact-phone" className={ui.form.label}>
            Telefono
          </label>
          <input
            id="contact-phone"
            type="tel"
            className={ui.form.field}
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="contact-message" className={ui.form.label}>
          Messaggio
        </label>
        <textarea
          id="contact-message"
          className={`${ui.form.field} min-h-40 resize-y`}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={ui.action.primary} disabled={sending}>
          {sending ? "Invio..." : "Invia richiesta"}
        </button>
        <span className="text-sm text-white/55">{status}</span>
      </div>
    </form>
  );
}
