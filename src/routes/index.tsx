import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareCircle AI" },
      { name: "description", content: "Daily caregiving overview: medications, routines, and connected e-ink displays." },
    ],
  }),
  component: DashboardPage,
});
