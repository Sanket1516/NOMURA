import type { Metadata } from "next";
import { loadDashboard } from "@/lib/server/data";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const d = await loadDashboard();
  return (
    <>
      <PageHeader title="Notifications" origin={d.origin} description="Nudges from your agents. VAAKYA sends at most one alert a day." />
      <NotificationList items={d.notifications} />
    </>
  );
}
