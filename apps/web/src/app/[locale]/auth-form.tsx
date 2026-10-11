"use client";

import type { Locale } from "@vetsync/shared";
import { useState, type CSSProperties, type FormEvent } from "react";
import { t } from "@/i18n/messages";

const errors: Record<string, "invalidInput" | "emailTaken" | "invalidCredentials"> = {
  invalid_input: "invalidInput",
  email_taken: "emailTaken",
  invalid_credentials: "invalidCredentials",
};

export function AuthForm({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "login" | "register";
}) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const response = await fetch(mode === "login" ? "/v1/auth/login" : "/v1/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clinicName: form.get("clinicName"),
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => undefined)) as { message?: string } | undefined;
      const key = errors[body?.message ?? ""] ?? "invalidInput";
      setError(t(locale, key));
      return;
    }
    window.location.href = `/${locale}/app`;
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      {mode === "register" ? (
        <>
          <label>
            {t(locale, "clinicName")}
            <input name="clinicName" required style={field} />
          </label>
          <label>
            {t(locale, "yourName")}
            <input name="name" required style={field} />
          </label>
        </>
      ) : null}
      <label>
        {t(locale, "email")}
        <input name="email" type="email" required autoComplete="email" style={field} />
      </label>
      <label>
        {t(locale, "password")}
        <input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} style={field} />
      </label>
      {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={pending} style={{ padding: "0.6rem 1rem" }}>
        {t(locale, mode === "login" ? "signIn" : "register")}
      </button>
    </form>
  );
}

const field: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.25rem",
  padding: "0.45rem 0.5rem",
  boxSizing: "border-box",
};
