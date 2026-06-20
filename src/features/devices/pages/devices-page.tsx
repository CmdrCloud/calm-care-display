import { Link } from "@tanstack/react-router";
import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Slider } from "@/shared/components/ui/slider";
import { Switch } from "@/shared/components/ui/switch";
import { Wifi, WifiOff, Plus, BatteryMedium, Plug, Eye } from "lucide-react";
import { EInkPreview } from "@/features/eink/components/eink-preview";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5" />} {value}
      </div>
    </div>
  );
}

export function DevicesPage() {
  const queryClient = useQueryClient();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

  // Form states for config
  const [deviceName, setDeviceName] = useState("");
  const [displayTemplate, setDisplayTemplate] = useState("daily_summary");
  const [refreshMinutes, setRefreshMinutes] = useState(15);
  const [showNextMedication, setShowNextMedication] = useState(true);
  const [showNextRoutine, setShowNextRoutine] = useState(true);
  const [showMissedDoseAlerts, setShowMissedDoseAlerts] = useState(true);
  const [showFamilyMessage, setShowFamilyMessage] = useState(false);

  // Queries
  const { data: devicesList = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<any[]>("/devices"),
  });

  const selectedDevice = devicesList[selectedDeviceIndex] || null;

  // Initialize form when selected device changes
  useEffect(() => {
    if (selectedDevice) {
      setDeviceName(selectedDevice.name);
      setDisplayTemplate(selectedDevice.displayTemplate);
      setRefreshMinutes(selectedDevice.refreshMinutes);
      setShowNextMedication(selectedDevice.showNextMedication);
      setShowNextRoutine(selectedDevice.showNextRoutine);
      setShowMissedDoseAlerts(selectedDevice.showMissedDoseAlerts);
      setShowFamilyMessage(selectedDevice.showFamilyMessage);
    }
  }, [selectedDevice]);

  // Mutations
  const updateDeviceMutation = useMutation({
    mutationFn: (data: any) => api.put(`/devices/${selectedDevice.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Device configuration saved and synced!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update device configuration.");
    },
  });

  const handleSaveConfig = () => {
    if (!selectedDevice) return;
    updateDeviceMutation.mutate({
      name: deviceName,
      displayTemplate,
      refreshMinutes,
      showNextMedication,
      showNextRoutine,
      showMissedDoseAlerts,
      showFamilyMessage,
    });
  };

  if (isLoading) {
    return (
      <AppShell title="E-Ink Devices" subtitle="Raspberry Pi 3 displays in the home">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">
            Loading connected devices...
          </p>
        </div>
      </AppShell>
    );
  }

  const mappedDevices = devicesList.map((d: any) => ({
    id: d.id,
    name: d.name,
    model: d.model || "Raspberry Pi 3",
    status: d.syncState?.status || "offline",
    lastSync: d.syncState?.lastSyncAt
      ? new Date(d.syncState.lastSyncAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never",
    power: d.syncState?.powerSource === "battery" ? "Battery" : "AC adapter",
    battery: d.syncState?.batteryPercentage || null,
    template:
      d.displayTemplate === "daily_summary"
        ? "Daily Summary"
        : d.displayTemplate === "next_reminder"
          ? "Next Reminder"
          : "Full Schedule",
    refreshMinutes: d.refreshMinutes,
  }));

  const primary = mappedDevices[selectedDeviceIndex] || null;

  return (
    <AppShell title="E-Ink Devices" subtitle="Raspberry Pi 3 displays in the home">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {mappedDevices.length} devices ·{" "}
            {mappedDevices.filter((d: any) => d.status === "online").length} online
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/eink-preview">
                <Eye className="mr-2 h-4 w-4" /> Full preview
              </Link>
            </Button>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Register device
            </Button>
          </div>
        </div>

        {primary && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Centerpiece preview + config */}
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Live preview · {primary.name}</CardTitle>
                <Badge variant={primary.status === "online" ? "default" : "secondary"}>
                  {primary.status === "online" ? "Online" : "Offline"}
                </Badge>
              </CardHeader>
              <CardContent className="bg-muted/40 p-6">
                <EInkPreview />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Preview reflects exactly what is rendered on the Raspberry Pi 3 e-ink display.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="device-name">Device name</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template-select">Display template</Label>
                  <Select value={displayTemplate} onValueChange={setDisplayTemplate}>
                    <SelectTrigger id="template-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_summary">Daily Summary</SelectItem>
                      <SelectItem value="next_reminder">Next Reminder Only</SelectItem>
                      <SelectItem value="full_schedule">Full Schedule</SelectItem>
                      <SelectItem value="message_card">Message Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Refresh interval</Label>
                    <span className="text-sm font-medium">{refreshMinutes} min</span>
                  </div>
                  <Slider
                    value={[refreshMinutes]}
                    min={1}
                    max={60}
                    step={1}
                    onValueChange={([val]) => setRefreshMinutes(val)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Longer intervals extend battery life on Pi 3.
                  </p>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Show next medication</span>
                    <Switch checked={showNextMedication} onCheckedChange={setShowNextMedication} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Show next routine</span>
                    <Switch checked={showNextRoutine} onCheckedChange={setShowNextRoutine} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Show missed-dose alerts</span>
                    <Switch
                      checked={showMissedDoseAlerts}
                      onCheckedChange={setShowMissedDoseAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">Show family message</span>
                    <Switch checked={showFamilyMessage} onCheckedChange={setShowFamilyMessage} />
                  </div>
                </div>
                <Button
                  className="w-full rounded-full"
                  onClick={handleSaveConfig}
                  disabled={updateDeviceMutation.isPending}
                >
                  Save & sync to device
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Device list */}
        <div className="grid gap-4 md:grid-cols-2">
          {mappedDevices.map((d: any, idx: number) => (
            <Card
              key={d.id}
              className={`rounded-2xl transition-all ${idx === selectedDeviceIndex ? "border-primary shadow-sm" : ""}`}
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${d.status === "online" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {d.status === "online" ? (
                      <Wifi className="h-6 w-6" />
                    ) : (
                      <WifiOff className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{d.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.model}</div>
                  </div>
                  <Badge
                    variant={d.status === "online" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {d.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Info label="Last sync" value={d.lastSync} />
                  <Info label="Template" value={d.template} />
                  <Info label="Refresh" value={`${d.refreshMinutes} min`} />
                  <Info
                    label="Power"
                    value={d.power}
                    icon={d.power === "Battery" ? BatteryMedium : Plug}
                  />
                </div>
                {d.battery != null && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Battery</span>
                      <span>{d.battery}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-warning" style={{ width: `${d.battery}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full"
                    onClick={() => setSelectedDeviceIndex(idx)}
                  >
                    Configure
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    Sync now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Setup card */}
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium">Connect a Raspberry Pi 3</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Flash the CareCircle image, enter the 6-digit pairing code, and choose a template.
                </p>
              </div>
              <Button variant="outline" className="rounded-full">
                Start setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
