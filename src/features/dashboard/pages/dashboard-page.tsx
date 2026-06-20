import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
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
import { todayDate } from "@/shared/constants/mock-data";
import { toast } from "sonner";

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
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-2xl font-semibold leading-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: "confirmed" | "pending" | "missed" }) {
  if (status === "confirmed")
    return <Badge className="bg-success/15 text-success hover:bg-success/20">Confirmed</Badge>;
  if (status === "missed") return <Badge variant="destructive">Missed</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function DashboardPage() {
  const queryClient = useQueryClient();

  // Queries
  const { data: patientsList = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
  });

  const { data: doses = [], isLoading: loadingDoses } = useQuery({
    queryKey: ["medicationDoses"],
    queryFn: () => api.get<any[]>("/medications/doses"),
  });

  const { data: rts = [], isLoading: loadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: () => api.get<any[]>("/routines"),
  });

  const { data: devs = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<any[]>("/devices"),
  });

  const { data: notifs = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any[]>("/notifications"),
  });

  // Confirm dose mutation
  const confirmDoseMutation = useMutation({
    mutationFn: (doseId: string) => api.post(`/medications/doses/${doseId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicationDoses"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Dose marked as confirmed!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to confirm dose.");
    },
  });

  const isLoading =
    loadingPatients || loadingDoses || loadingRoutines || loadingDevices || loadingNotifications;

  if (isLoading) {
    return (
      <AppShell title="Today" subtitle={todayDate}>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">Loading care console...</p>
        </div>
      </AppShell>
    );
  }

  const patient = patientsList[0] || { name: "No Patient Found", room: "N/A" };

  // Map doses
  const mappedMeds = doses.map((d: any) => ({
    id: d.id,
    name: d.medication.name,
    dose: d.medication.dose,
    time: d.medication.scheduledTime.substring(0, 5),
    frequency: d.medication.frequency,
    notes: d.medication.notes,
    status: d.status as "confirmed" | "pending" | "missed",
  }));

  const upcomingMeds = mappedMeds.filter((m) => m.status !== "confirmed").slice(0, 4);
  const next = mappedMeds.find((m) => m.status === "pending") ||
    mappedMeds[0] || { id: null, name: "None", dose: "N/A", time: "--:--", notes: "" };
  const missed = mappedMeds.filter((m) => m.status === "missed").length;

  // Map routines
  const mappedRoutines = rts.map((r: any) => ({
    id: r.id,
    title: r.title,
    time: r.scheduledTime.substring(0, 5),
    category: r.category,
  }));
  const upcomingRoutines = mappedRoutines.slice(0, 4);

  // Map devices
  const mappedDevices = devs.map((d: any) => ({
    id: d.id,
    name: d.name,
    model: d.model,
    status: d.syncState?.status || "offline",
    lastSync: d.syncState?.lastSyncAt
      ? new Date(d.syncState.lastSyncAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never",
  }));

  // Map notifications
  const mappedNotifications = notifs.slice(0, 4).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    time: new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    patient: patient.name,
  }));

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
                Scheduled for <span className="font-medium text-foreground">{next.time}</span> ·{" "}
                {patient.name}
                {next.notes ? ` · ${next.notes}` : ""}
              </p>
            </div>
            {next.id && next.status === "pending" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  className="rounded-full"
                  onClick={() => confirmDoseMutation.mutate(next.id)}
                  disabled={confirmDoseMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark confirmed
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Doses today"
            value={`${mappedMeds.length}`}
            hint={`${mappedMeds.filter((m: any) => m.status === "confirmed").length} confirmed`}
            icon={Pill}
          />
          <StatCard
            label="Routines"
            value={`${rts.length}`}
            hint="Scheduled"
            icon={CalendarClock}
            tone="success"
          />
          <StatCard
            label="Devices online"
            value={`${mappedDevices.filter((d: any) => d.status === "online").length}/${mappedDevices.length}`}
            hint="E-ink displays"
            icon={MonitorSmartphone}
          />
          <StatCard
            label="Alerts"
            value={`${missed}`}
            hint="Missed doses"
            icon={AlertTriangle}
            tone={missed > 0 ? "destructive" : "default"}
          />
        </div>

        {/* Two-column content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Upcoming medications</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/medications">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingMeds.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.name} · {m.dose}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.time} · {m.frequency}
                      {m.notes ? ` · ${m.notes}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    {m.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmDoseMutation.mutate(m.id)}
                        disabled={confirmDoseMutation.isPending}
                        className="h-7 px-2.5 text-xs rounded-full"
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {upcomingMeds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming medications for today.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Today's routines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingRoutines.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="w-12 shrink-0 text-sm font-semibold tabular-nums">{r.time}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground capitalize">
                      {r.category}
                    </div>
                  </div>
                </div>
              ))}
              {upcomingRoutines.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No routines scheduled.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Connected devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mappedDevices.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${d.status === "online" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {d.status === "online" ? (
                      <Wifi className="h-5 w-5" />
                    ) : (
                      <WifiOff className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.model} · synced {d.lastSync}
                    </div>
                  </div>
                  <Badge
                    variant={d.status === "online" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {d.status}
                  </Badge>
                </div>
              ))}
              {mappedDevices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No connected devices.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mappedNotifications.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={
                        n.type === "missed"
                          ? "bg-destructive/15 text-destructive"
                          : n.type === "confirmed"
                            ? "bg-success/15 text-success"
                            : "bg-primary/10 text-primary"
                      }
                    >
                      {n.type === "missed" ? "!" : n.type === "confirmed" ? "✓" : "i"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {n.time} · {n.patient}
                    </div>
                  </div>
                </div>
              ))}
              {mappedNotifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
