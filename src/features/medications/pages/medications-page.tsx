import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Pill, Plus, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useState } from "react";
import { NextDoseTimer } from "../components/next-dose-timer";
import { toast } from "sonner";

function StatusBadge({ status }: { status: "confirmed" | "pending" | "missed" }) {
  if (status === "confirmed")
    return <Badge className="bg-success/15 text-success hover:bg-success/20">Confirmed</Badge>;
  if (status === "missed") return <Badge variant="destructive">Missed</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function AddMedDialog({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("08:00");
  const [frequency, setFrequency] = useState("daily");
  const [notes, setNotes] = useState("");

  const createMedMutation = useMutation({
    mutationFn: (data: any) => api.post("/medications", data),
    onSuccess: () => {
      onSuccess();
      toast.success("Medication added successfully!");
      setOpen(false);
      // Reset form
      setName("");
      setDose("");
      setTime("08:00");
      setFrequency("daily");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add medication.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dose || !time) {
      toast.error("Please fill in required fields.");
      return;
    }
    createMedMutation.mutate({
      patientId,
      name,
      dose,
      scheduledTime: time + ":00",
      frequency: frequency.charAt(0).toUpperCase() + frequency.slice(1),
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add medication
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Lisinopril"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dose">Dose</Label>
                <Input
                  id="dose"
                  placeholder="e.g. 10 mg"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="twice daily">Twice daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="as needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="With food, avoid grapefruit…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMedMutation.isPending}>
              Save medication
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MedicationsPage() {
  const queryClient = useQueryClient();

  const { data: patientsList = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
  });

  const { data: doses = [], isLoading: loadingDoses } = useQuery({
    queryKey: ["medicationDoses"],
    queryFn: () => api.get<any[]>("/medications/doses"),
  });

  const confirmDoseMutation = useMutation({
    mutationFn: (doseId: string) => api.post(`/medications/doses/${doseId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicationDoses"] });
      toast.success("Dose marked as confirmed!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to confirm dose.");
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["medicationDoses"] });
  };

  const isLoading = loadingPatients || loadingDoses;

  if (isLoading) {
    return (
      <AppShell title="Medications" subtitle="Schedule, confirm, and monitor doses">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">
            Loading medication schedule...
          </p>
        </div>
      </AppShell>
    );
  }

  const patient = patientsList[0] || { id: "44444444-4444-4444-4444-444444444444" };

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

  const nextPending = mappedMeds.find((m) => m.status === "pending");
  const nextMed = nextPending || mappedMeds[0];

  return (
    <AppShell title="Medications" subtitle="Schedule, confirm, and monitor doses">
      <div className="mx-auto max-w-6xl space-y-6">
        <NextDoseTimer
          med={
            nextMed
              ? { id: nextMed.id, name: nextMed.name, dose: nextMed.dose, time: nextMed.time }
              : undefined
          }
          onConfirm={nextPending ? (doseId) => confirmDoseMutation.mutate(doseId) : undefined}
        />

        {nextPending && (
          <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-card">
            <CardContent className="flex flex-wrap items-center gap-4 p-6">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Pill className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-primary">
                  Next dose
                </div>
                <div className="text-2xl font-semibold">
                  {nextPending.name} · {nextPending.dose}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Clock className="mr-1 inline h-3.5 w-3.5" />
                  {nextPending.time} · {nextPending.frequency}
                </div>
              </div>
              <Button
                size="lg"
                className="rounded-full"
                onClick={() => confirmDoseMutation.mutate(nextPending.id)}
                disabled={confirmDoseMutation.isPending}
              >
                Mark confirmed
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Today's doses</h2>
          <AddMedDialog patientId={patient.id} onSuccess={handleRefresh} />
        </div>

        <div className="grid gap-3">
          {mappedMeds.map((m) => (
            <Card key={m.id} className="rounded-2xl">
              <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:flex sm:flex-wrap">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="min-w-0 sm:flex-1">
                  <div className="truncate font-medium">
                    {m.name} <span className="text-muted-foreground">· {m.dose}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.time} · {m.frequency}
                    {m.notes ? ` · ${m.notes}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDoseMutation.mutate(m.id)}
                      disabled={confirmDoseMutation.isPending}
                      className="rounded-full"
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {mappedMeds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No doses scheduled for today.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
