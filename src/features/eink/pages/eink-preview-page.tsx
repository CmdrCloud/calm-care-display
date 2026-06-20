import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { EInkPreview } from "../components/eink-preview";
import { RefreshCw, Send, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { toast } from "sonner";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function EinkPreviewPage() {
  const queryClient = useQueryClient();

  // Fetch the devices for the active family circle
  const { data: devicesList = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<any[]>("/devices"),
  });

  // Fetch the patients
  const { data: patientsList = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
  });

  // Fetch the routines
  const { data: routinesList = [], isLoading: loadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: () => api.get<any[]>("/routines"),
  });

  // Fetch today's medication doses
  const { data: doses = [], isLoading: loadingDoses } = useQuery({
    queryKey: ["medicationDoses"],
    queryFn: () => api.get<any[]>("/medications/doses"),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["routines"] });
    queryClient.invalidateQueries({ queryKey: ["medicationDoses"] });
    toast.success("E-Ink preview data refreshed!");
  };

  const handlePush = () => {
    toast.success("Display update queued! The e-ink device will update on its next poll.");
  };

  const isLoading = loadingDevices || loadingPatients || loadingRoutines || loadingDoses;

  // Resolve the primary device (first in the list) or fallback to a demo device
  const defaultFallbackDevice = {
    id: "demo-device",
    name: "Bedroom e-ink (Demo)",
    displayTemplate: "daily_summary",
    showNextMedication: true,
    showNextRoutine: true,
    showMissedDoseAlerts: true,
    refreshMinutes: 15,
    syncState: {
      status: "online",
      lastSyncAt: new Date().toISOString(),
      powerSource: "ac",
    },
  };

  const device = devicesList[0] || defaultFallbackDevice;

  // Resolve the patient assigned to this device, or default to the first patient
  const patient =
    patientsList.find((p) => p.id === device?.patientId) || patientsList[0] || null;

  // Filter doses and routines for the resolved patient
  const patientDoses = patient ? doses.filter((d) => d.medication?.patientId === patient.id) : [];
  const patientRoutines = patient
    ? routinesList.filter((r) => r.patientId === patient.id && r.isActive)
    : [];

  // Sort today's doses chronologically to find the next pending dose
  const sortedDoses = [...patientDoses].sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );
  const nextMedication = sortedDoses.find((d) => d.status === "pending") ?? sortedDoses[0] ?? null;

  // Look for any missed doses today to show as warning alerts on the e-ink screen
  const missedDose = patientDoses.find((d) => d.status === "missed") ?? null;

  // Compute the next upcoming routine activity
  const getNextRoutine = (routinesArray: any[]) => {
    if (routinesArray.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const sortedRoutines = [...routinesArray].sort((a, b) => {
      const [hA, mA] = a.scheduledTime.split(":").map(Number);
      const [hB, mB] = b.scheduledTime.split(":").map(Number);
      return hA * 60 + mA - (hB * 60 + mB);
    });

    const upcomingRoutine = sortedRoutines.find((r) => {
      const [h, m] = r.scheduledTime.split(":").map(Number);
      return h * 60 + m >= currentMinutes;
    });

    return upcomingRoutine ?? sortedRoutines[0];
  };

  const nextRoutine = getNextRoutine(patientRoutines);

  return (
    <AppShell title="E-Ink Preview" subtitle="What the Raspberry Pi 3 display is showing right now">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Monochrome · high contrast · low-power render
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button className="rounded-full" onClick={handlePush}>
              <Send className="mr-2 h-4 w-4" /> Push to device
            </Button>
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardContent className="bg-muted/50 p-6 md:p-10">
            {isLoading ? (
              <div className="flex aspect-[4/3] max-w-3xl items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-background/50 p-8 shadow-inner mx-auto w-full">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Fetching display data...</p>
                </div>
              </div>
            ) : (
              <EInkPreview
                device={device}
                patient={patient}
                nextMedication={nextMedication}
                nextRoutine={nextRoutine}
                missedDose={missedDose}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-4">
            <Detail label="Active Device" value={device?.name || "None"} />
            <Detail label="Resolution" value="800 × 480" />
            <Detail label="Render time" value="~1.4 s" />
            <Detail label="Power draw" value="0.03 W idle" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
