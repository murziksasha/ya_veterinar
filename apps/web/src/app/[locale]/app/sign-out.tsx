"use client";

import type { Locale } from "@vetsync/shared";
import { t } from "@/i18n/messages";

export function SignOut({ locale }: { locale: Locale }) {
  async function onClick() {
    await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = `/${locale}/login`;
  }

  return (
    <button type="button" onClick={onClick} style={{ padding: "0.35rem 0.7rem" }}>
      {t(locale, "signOut")}
    </button>
  );
}
