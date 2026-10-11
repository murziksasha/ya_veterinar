import { Soon } from "../soon";

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  return Soon({ params, title: "navCalendar" });
}
