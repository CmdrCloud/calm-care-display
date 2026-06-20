import { createFileRoute } from "@tanstack/react-router";
import { EinkPreviewPage } from "@/features/eink";

export const Route = createFileRoute("/eink-preview")({
  head: () => ({ meta: [{ title: "E-Ink Preview — CareCircle AI" }] }),
  component: EinkPreviewPage,
});
