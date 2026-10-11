import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { t } from "@/i18n/messages";
import { AuthForm } from "../auth-form";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <h1>{t(locale, "register")}</h1>
        <AuthForm locale={locale} mode="register" />
        <p className="auth-switch">
          <a href={`/${locale}/login`}>{t(locale, "haveAccount")}</a>
        </p>
      </section>
    </main>
  );
}
