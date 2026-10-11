import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { t, type MessageKey } from "@/i18n/messages";

export async function Soon({
  params,
  title,
}: {
  params: Promise<{ locale: string }>;
  title: MessageKey;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <main>
      <h1>{t(locale, title)}</h1>
      <p>{t(locale, "comingNext")}</p>
    </main>
  );
}
