import { createFileRoute } from "@tanstack/react-router";
import { DevicesPage } from "@/features/devices";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "Devices — CareCircle AI" }] }),
  component: DevicesPage,
});
