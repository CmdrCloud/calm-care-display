import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { AlertTriangle, CheckCircle2, Info, Bell, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { toast } from "sonner";

const iconFor = (type: string) =>
  type === "missed"
    ? AlertTriangle
    : type === "confirmed"
      ? CheckCircle2
      : type === "reminder"
        ? Bell
        : Info;

const toneFor = (type: string) =>
  type === "missed"
    ? "bg-destructive/15 text-destructive"
    : type === "confirmed"
      ? "bg-success/15 text-success"
      : type === "reminder"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-primary/10 text-primary";

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const cls = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-destructive",
  }[tone];
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsList = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any[]>("/notifications"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => Promise.all(notificationsList.map((n: any) => api.put(`/notifications/${n.id}/read`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark notifications as read.");
    },
  });

  const missedCount = notificationsList.filter((n: any) => n.type === "missed").length;
  const confirmedCount = notificationsList.filter((n: any) => n.type === "confirmed").length;
  const reminderCount = notificationsList.filter((n: any) => n.type === "reminder").length;

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <AppShell title="Notifications" subtitle="Reminders, confirmations, and alerts">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total today" value={`${notificationsList.length}`} />
          <Stat label="Missed" value={`${missedCount}`} tone={missedCount > 0 ? "destructive" : "default"} />
          <Stat label="Confirmed" value={`${confirmedCount}`} tone="success" />
          <Stat label="Reminders" value={`${reminderCount}`} tone="warning" />
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Activity feed</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || notificationsList.length === 0}
            >
              Mark all read
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notificationsList.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notificationsList.map((n: any) => {
                const Icon = iconFor(n.type);
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={toneFor(n.type)}>
                        <Icon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(n.createdAt)}
                        {n.patientName ? ` · ${n.patientName}` : ""}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {n.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
