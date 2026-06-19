import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EInkPreview } from "@/components/eink-preview";
import { RefreshCw, Send } from "lucide-react";

export const Route = createFileRoute("/eink-preview")({
  head: () => ({ meta: [{ title: "E-Ink Preview — CareCircle AI" }] }),
  component: Preview,
});

function Preview() {
  return (
    <AppShell title="E-Ink Preview" subtitle="What the Raspberry Pi 3 display is showing right now">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Monochrome · high contrast · low-power render</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
            <Button className="rounded-full"><Send className="mr-2 h-4 w-4" /> Push to device</Button>
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardContent className="bg-muted/50 p-6 md:p-10">
            <EInkPreview />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <Detail label="Resolution" value="800 × 480" />
            <Detail label="Render time" value="~1.4 s" />
            <Detail label="Power draw" value="0.03 W idle" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
