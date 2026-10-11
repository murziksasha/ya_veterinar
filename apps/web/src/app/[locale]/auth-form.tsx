"use client";

import type { Locale } from "@vetsync/shared";
import { useId, useState, type FormEvent } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const hintId = useId();
  const errorId = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    let response: Response;
    try {
      response = await fetch(mode === "login" ? "/v1/auth/login" : "/v1/auth/register", {
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
    } catch {
      setPending(false);
      setError(t(locale, "requestFailed"));
      return;
    }
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => undefined)) as { message?: string } | undefined;
      const key = errors[body?.message ?? ""];
      setError(t(locale, key ?? "requestFailed"));
      return;
    }
    window.location.href = `/${locale}/app`;
  }

  const describedBy = [mode === "register" ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <form className="form-grid" onSubmit={onSubmit} noValidate={false}>
      {mode === "register" ? (
        <>
          <label className="form-label">
            {t(locale, "clinicName")}
            <input className="form-input" name="clinicName" required autoComplete="organization" />
          </label>
          <label className="form-label">
            {t(locale, "yourName")}
            <input className="form-input" name="name" required autoComplete="name" />
          </label>
        </>
      ) : null}
      <label className="form-label">
        {t(locale, "email")}
        <input
          className="form-input"
          name="email"
          type="email"
          required
          autoComplete="email"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
        />
      </label>
      <label className="form-label">
        {t(locale, "password")}
        <span className="password-field">
          <input
            className="form-input password-input"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={200}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            title={t(locale, "passwordHint")}
          />
          <button
            type="button"
            className="password-toggle"
            aria-pressed={showPassword}
            aria-label={t(locale, showPassword ? "hidePassword" : "showPassword")}
            title={t(locale, showPassword ? "hidePassword" : "showPassword")}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </span>
        {mode === "register" ? (
          <span className="field-hint" id={hintId}>
            {t(locale, "passwordHint")}
          </span>
        ) : null}
      </label>
      {error ? (
        <p className="form-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
        {t(locale, mode === "login" ? "signIn" : "register")}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M3 3l18 18M10.5 10.7A2.5 2.5 0 0 0 14 14.2M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.2M6.1 6.8C3.7 8.5 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.3 3.6-.8"
      />
    </svg>
  );
}
