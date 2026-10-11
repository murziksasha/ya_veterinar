import { isLocale, TENANT_HEADER } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { t } from "@/i18n/messages";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const other = localeParam === "uk" ? "en" : "uk";

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1.5rem" }}>
      <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e" }}>
        {t(localeParam, "product")}
      </p>
      <h1>{t(localeParam, "title")}</h1>
      <p>{t(localeParam, "body")}</p>
      <p>
        <a href={`/${other}`}>{other.toUpperCase()}</a>
      </p>
      <p style={{ color: "#64748b" }}>
        {t(localeParam, "tenantHeader")}: <code>{TENANT_HEADER}</code>
      </p>
    </main>
  );
}
