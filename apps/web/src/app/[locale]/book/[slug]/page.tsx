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
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>{t(locale, "book")}</h1>
      <p>{slug}</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.5rem" }}>
        <input name="ownerName" required placeholder={t(locale, "ownerName")} />
        <input name="phone" placeholder={t(locale, "phone")} />
        <input name="petName" required placeholder={t(locale, "petName")} />
        <input name="species" required placeholder={t(locale, "species")} />
        <input name="start" type="datetime-local" required />
        <input name="note" placeholder={t(locale, "note")} />
        <button type="submit">{t(locale, "book")}</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
