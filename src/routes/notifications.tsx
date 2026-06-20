import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notifications";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CareCircle AI" }] }),
  component: NotificationsPage,
});
