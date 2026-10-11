import { isLocale } from "@vetsync/shared";
import { notFound } from "next/navigation";
import { t } from "@/i18n/messages";
import { currentUser } from "@/lib/api";

export default async function WorkspaceHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const user = await currentUser();
  return (
    <main>
      <h1>{t(locale, "workspace")}</h1>
      <p>
        {user?.name} · {user?.role}
      </p>
    </main>
  );
}
