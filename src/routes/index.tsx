import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pill,
  CalendarClock,
  MonitorSmartphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  medications,
  routines,
  devices,
  notifications,
  patient,
  todayDate,
  nextMedication,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareCircle AI" },
      { name: "description", content: "Daily caregiving overview: medications, routines, and connected e-ink displays." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${toneClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-2xl font-semibold leading-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const upcomingMeds = medications.filter((m) => m.status !== "confirmed").slice(0, 4);
  const next = nextMedication();
  const upcomingRoutines = routines.slice(0, 4);
  const missed = medications.filter((m) => m.status === "missed").length;

  return (
    <AppShell title="Today" subtitle={todayDate}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Next action hero */}
        <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 via-card to-secondary/30">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
                <Clock className="h-3.5 w-3.5" /> Next medication
              </div>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                {next.name} <span className="text-muted-foreground">· {next.dose}</span>
              </h2>
              <p className="mt-1 text-muted-foreground">
                Scheduled for <span className="font-medium text-foreground">{next.time}</span> · {patient.name}
                {next.notes ? ` · ${next.notes}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" className="rounded-full">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark confirmed
              </Button>
              <Button size="lg" variant="outline" className="rounded-full">
                Snooze 10m
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Doses today" value={`${medications.length}`} hint={`${medications.filter(m => m.status==="confirmed").length} confirmed`} icon={Pill} />
          <StatCard label="Routines" value={`${routines.length}`} hint="Scheduled" icon={CalendarClock} tone="success" />
          <StatCard label="Devices online" value={`${devices.filter(d=>d.status==="online").length}/${devices.length}`} hint="E-ink displays" icon={MonitorSmartphone} />
          <StatCard label="Alerts" value={`${missed}`} hint="Missed doses" icon={AlertTriangle} tone={missed > 0 ? "destructive" : "default"} />
        </div>

        {/* Two-column content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Upcoming medications</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/medications">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingMeds.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.name} · {m.dose}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.time} · {m.frequency}{m.notes ? ` · ${m.notes}` : ""}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Today's routines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingRoutines.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="w-12 shrink-0 text-sm font-semibold tabular-nums">{r.time}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.category}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Connected devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${d.status === "online" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {d.status === "online" ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.model} · synced {d.lastSync}</div>
                  </div>
                  <Badge variant={d.status === "online" ? "default" : "secondary"} className="capitalize">{d.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={
                      n.type === "missed" ? "bg-destructive/15 text-destructive" :
                      n.type === "confirmed" ? "bg-success/15 text-success" :
                      "bg-primary/10 text-primary"
                    }>
                      {n.type === "missed" ? "!" : n.type === "confirmed" ? "✓" : "i"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.time} · {n.patient}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: "confirmed" | "pending" | "missed" }) {
  if (status === "confirmed") return <Badge className="bg-success/15 text-success hover:bg-success/20">Confirmed</Badge>;
  if (status === "missed") return <Badge variant="destructive">Missed</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}
