import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/features/patients";

export const Route = createFileRoute("/patients")({
  head: () => ({ meta: [{ title: "Patients — CareCircle AI" }] }),
  component: PatientsPage,
});
