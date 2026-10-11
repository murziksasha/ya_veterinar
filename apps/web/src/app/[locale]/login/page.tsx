import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { t } from "@/i18n/messages";
import { AuthForm } from "../auth-form";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <main style={{ maxWidth: 420, margin: "4rem auto", padding: "0 1.5rem" }}>
      <h1>{t(locale, "signIn")}</h1>
      <AuthForm locale={locale} mode="login" />
      <p>
        <a href={`/${locale}/register`}>{t(locale, "needAccount")}</a>
      </p>
    </main>
  );
}
