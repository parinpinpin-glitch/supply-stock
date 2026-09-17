import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import NotifySettings from "@/components/NotifySettings";
import { listExtraEmails, listEmailLogs } from "@/lib/store";
import { isEmailConfigured } from "@/lib/email";

export default function NotificationsPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/no-access");

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">ตั้งค่าการแจ้งเตือน</h1>
      <NotifySettings initial={listExtraEmails()} logs={listEmailLogs(20)} configured={isEmailConfigured()} />
    </AppShell>
  );
}
