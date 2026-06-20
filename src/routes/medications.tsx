import { createFileRoute } from "@tanstack/react-router";
import { MedicationsPage } from "@/features/medications";

export const Route = createFileRoute("/medications")({
  head: () => ({ meta: [{ title: "Medications — CareCircle AI" }] }),
  component: MedicationsPage,
});
