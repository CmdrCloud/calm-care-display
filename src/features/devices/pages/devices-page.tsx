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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Wifi, WifiOff, Plus, BatteryMedium, Plug, Eye, Copy, Check, KeyRound } from "lucide-react";
import { EInkPreview } from "@/features/eink/components/eink-preview";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateDeviceKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function RegisterDeviceDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const setOpen = onOpenChange;

  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [deviceKeyHash, setDeviceKeyHash] = useState("");
  const [model, setModel] = useState("");
  const [refreshMinutes, setRefreshMinutes] = useState(15);
  const [displayTemplate, setDisplayTemplate] = useState("daily_summary");
  const [copied, setCopied] = useState(false);

  const { data: patientsList = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
    enabled: open,
  });

  const createDeviceMutation = useMutation({
    mutationFn: (data: any) => api.post("/devices", data),
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Device registered successfully! Copy the device key — you'll need it for the Pi.");
      setCopied(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register device.");
    },
  });

  const handleGenerateKey = async () => {
    const key = generateDeviceKey();
    setDeviceKey(key);
    const hash = await sha256Hex(key);
    setDeviceKeyHash(hash);
  };

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(deviceKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setPatientId("");
    setName("");
    setDeviceKey("");
    setDeviceKeyHash("");
    setModel("");
    setRefreshMinutes(15);
    setDisplayTemplate("daily_summary");
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !name || !deviceKeyHash) {
      toast.error("Please fill in required fields and generate a device key.");
      return;
    }
    const payload: any = {
      patientId,
      name,
      deviceKeyHash,
    };
    if (model) payload.model = model;
    if (refreshMinutes !== 15) payload.refreshMinutes = refreshMinutes;
    if (displayTemplate !== "daily_summary") payload.displayTemplate = displayTemplate;
    createDeviceMutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Register device
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register a new device</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientsList.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-name">Device name</Label>
              <Input
                id="dev-name"
                placeholder="e.g. Eleanor's room display"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Device key</Label>
              {deviceKey ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs">
                    <span className="flex-1 break-all">{deviceKey}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopyKey}
                    >
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy this key — you'll need it to configure the Raspberry Pi. It won't be shown again.
                  </p>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={handleGenerateKey}>
                  <KeyRound className="mr-2 h-4 w-4" /> Generate device key
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-model">Model</Label>
              <Input
                id="dev-model"
                placeholder="Raspberry Pi 3"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dev-refresh">Refresh (min)</Label>
                <Input
                  id="dev-refresh"
                  type="number"
                  min={1}
                  max={60}
                  value={refreshMinutes}
                  onChange={(e) => setRefreshMinutes(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dev-template">Template</Label>
                <Select value={displayTemplate} onValueChange={setDisplayTemplate}>
                  <SelectTrigger id="dev-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_summary">Daily Summary</SelectItem>
                    <SelectItem value="next_reminder">Next Reminder</SelectItem>
                    <SelectItem value="full_schedule">Full Schedule</SelectItem>
                    <SelectItem value="message_card">Message Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeviceMutation.isPending || !deviceKeyHash}>
              Register device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

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
            <RegisterDeviceDialog
              open={registerDialogOpen}
              onOpenChange={setRegisterDialogOpen}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["devices"] })}
            />
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
              <Button variant="outline" className="rounded-full" onClick={() => setRegisterDialogOpen(true)}>
                Start setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
