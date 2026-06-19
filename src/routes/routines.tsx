import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Utensils, Footprints, Droplets, HeartPulse, Moon, Calendar } from "lucide-react";
import { routines } from "@/lib/mock-data";

export const Route = createFileRoute("/routines")({
  head: () => ({ meta: [{ title: "Routines — CareCircle AI" }] }),
  component: Routines,
});

const iconFor = (cat: string) => {
  if (cat === "Meal") return Utensils;
  if (cat === "Activity") return Footprints;
  if (cat === "Hydration") return Droplets;
  if (cat === "Therapy") return HeartPulse;
  if (cat === "Sleep") return Moon;
  return Calendar;
};

function Routines() {
  return (
    <AppShell title="Routines" subtitle="Daily rhythm of meals, activity, and care">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{routines.length} routines scheduled today</p>
          <Button className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Add routine</Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Today's schedule</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative ml-3 space-y-4 border-l-2 border-border pl-6">
              {routines.map((r) => {
                const Icon = iconFor(r.category);
                return (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="w-16 shrink-0 text-base font-semibold tabular-nums">{r.time}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.category} · {r.recurrence}</div>
                      </div>
                      <Badge variant={r.priority === "High" ? "default" : "secondary"}>{r.priority}</Badge>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
