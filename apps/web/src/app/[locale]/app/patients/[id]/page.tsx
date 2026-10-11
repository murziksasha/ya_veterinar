import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { ClinicScreen } from "../../screen";

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return <ClinicScreen locale={locale} screen="patient" patientId={id} />;
}
