import { createFileRoute } from "@tanstack/react-router";
import { RoutinesPage } from "@/features/routines";

export const Route = createFileRoute("/routines")({
  head: () => ({ meta: [{ title: "Routines — CareCircle AI" }] }),
  component: RoutinesPage,
});
