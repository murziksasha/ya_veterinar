import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { ClinicScreen } from "../screen";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return <ClinicScreen locale={locale} screen="vaccinations" />;
}
