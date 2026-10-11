"use client";

import { isLocale, type Locale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { use, useState, type FormEvent } from "react";
import { t } from "@/i18n/messages";

export default function BookPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: localeParam, slug } = use(params);
  if (!isLocale(localeParam)) {
    notFound();
  }
  return <BookForm locale={localeParam} slug={slug} />;
}

function BookForm({ locale, slug }: { locale: Locale; slug: string }) {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/v1/public/clinics/${slug}/appointments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerName: form.get("ownerName"),
        phone: form.get("phone"),
        petName: form.get("petName"),
        species: form.get("species"),
        start: new Date(String(form.get("start"))).toISOString(),
        note: form.get("note"),
      }),
    });
    const body = (await response.json()) as { message?: string; appointment?: { id: string } };
    setMessage(response.ok ? body.appointment?.id ?? "ok" : body.message ?? "invalid_input");
  }

  return (
    <main style={{ maxWidth: 540, margin: "3rem auto", padding: "0 1.5rem" }}>
      <div className="card" style={{ padding: "1.75rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem" }}>{t(locale, "book")}</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>{slug}</p>
        <form onSubmit={onSubmit} className="form-grid">
          <input name="ownerName" required placeholder={t(locale, "ownerName")} className="form-input" />
          <input name="phone" placeholder={t(locale, "phone")} className="form-input" />
          <input name="petName" required placeholder={t(locale, "petName")} className="form-input" />
          <input name="species" required placeholder={t(locale, "species")} className="form-input" />
          <input name="start" type="datetime-local" required className="form-input" />
          <input name="note" placeholder={t(locale, "note")} className="form-input" />
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>{t(locale, "book")}</button>
        </form>
        {message ? (
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: "var(--radius-sm)" }}>
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
