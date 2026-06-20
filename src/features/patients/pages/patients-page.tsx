import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Phone, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { caregivers } from "@/shared/constants/mock-data";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function AddPatientDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [room, setRoom] = useState("");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [allergies, setAllergies] = useState("");
  const [mobility, setMobility] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const createPatientMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("[AddPatientDialog] Sending API request to POST /patients with data:", data);
      return api.post("/patients", data);
    },
    onSuccess: (response) => {
      console.log("[AddPatientDialog] API request succeeded. Response:", response);
      onSuccess();
      toast.success("Patient added successfully!");
      setOpen(false);
      // Reset form
      setName("");
      setDateOfBirth("");
      setRoom("");
      setPrimaryDiagnosis("");
      setAllergies("");
      setMobility("");
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setRiskLevel("low");
      setNotes("");
    },
    onError: (err: any) => {
      console.error("[AddPatientDialog] API request failed:", err);
      toast.error(err.message || "Failed to add patient.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AddPatientDialog] handleSubmit triggered with fields:", {
      name,
      dateOfBirth,
      room,
      primaryDiagnosis,
      allergies,
      mobility,
      emergencyContactName,
      emergencyContactPhone,
      riskLevel,
      notes
    });

    if (!name || !dateOfBirth) {
      console.warn("[AddPatientDialog] Missing required fields");
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      createPatientMutation.mutate({
        name,
        dateOfBirth,
        room: room || undefined,
        primaryDiagnosis: primaryDiagnosis || undefined,
        allergies: allergies || undefined,
        mobility: mobility || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        riskLevel,
        notes: notes || undefined,
      });
    } catch (err) {
      console.error("[AddPatientDialog] Mutation call failed synchronously:", err);
      toast.error("An error occurred before submitting the form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="grid gap-1.5 col-span-1 sm:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Eleanor Hayes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Date of Birth */}
            <div className="grid gap-1.5">
              <Label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Room / Location */}
            <div className="grid gap-1.5">
              <Label htmlFor="room" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Room / Location
              </Label>
              <Input
                id="room"
                placeholder="e.g. Home - Bedroom 1"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Primary Diagnosis */}
            <div className="grid gap-1.5">
              <Label htmlFor="primaryDiagnosis" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Primary Diagnosis
              </Label>
              <Input
                id="primaryDiagnosis"
                placeholder="e.g. Hypertension"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Risk Level */}
            <div className="grid gap-1.5">
              <Label htmlFor="riskLevel" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Risk Level
              </Label>
              <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                <SelectTrigger id="riskLevel" className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary capitalize">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low" className="capitalize">Low Risk</SelectItem>
                  <SelectItem value="medium" className="capitalize">Medium Risk</SelectItem>
                  <SelectItem value="high" className="capitalize">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="grid gap-1.5">
              <Label htmlFor="allergies" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allergies
              </Label>
              <Input
                id="allergies"
                placeholder="e.g. Penicillin"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Mobility */}
            <div className="grid gap-1.5">
              <Label htmlFor="mobility" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mobility Status
              </Label>
              <Input
                id="mobility"
                placeholder="e.g. Walks with cane"
                value={mobility}
                onChange={(e) => setMobility(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Emergency Contact Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="emergencyContactName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Emergency Contact Name
              </Label>
              <Input
                id="emergencyContactName"
                placeholder="e.g. David Hayes (son)"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="grid gap-1.5">
              <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergencyContactPhone"
                placeholder="e.g. (555) 887-2210"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Notes */}
            <div className="grid gap-1.5 col-span-1 sm:col-span-2">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Care Notes & Preferences
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. Mild memory loss. Drinks tea with breakfast."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPatientMutation.isPending || loading}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createPatientMutation.isPending ? "Creating..." : "Create Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PatientsPage() {
  const queryClient = useQueryClient();
  const { data: patientsList = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
  });

  if (isLoading) {
    return (
      <AppShell title="Patients" subtitle="Care recipients you are monitoring">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">Loading patient profile...</p>
        </div>
      </AppShell>
    );
  }

  const patient = patientsList[0] || {
    id: "",
    name: "No Patient Configured",
    dateOfBirth: "",
    room: "N/A",
    notes: "No notes.",
    primaryDiagnosis: "N/A",
    allergies: "None",
    mobility: "N/A",
    emergencyContactName: "N/A",
    emergencyContactPhone: "N/A",
    riskLevel: "low",
    avatarInitials: "?",
  };

  const getAge = (dobString: string) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const patientAge = getAge(patient.dateOfBirth);

  return (
    <AppShell title="Patients" subtitle="Care recipients you are monitoring">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{patientsList.length} active patient</p>
          <AddPatientDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["patients"] })} />
        </div>

        <Card className="rounded-2xl">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                {patient.avatarInitials || patient.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">
                {patientAge > 0 ? `${patientAge} years · ` : ""}
                {patient.room}
              </p>
              <p className="mt-2 text-sm">{patient.notes}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full">
                Edit profile
              </Button>
              <Button variant="ghost" className="rounded-full">
                View care plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Assigned caregivers</CardTitle>
              <Button variant="ghost" size="sm">
                <UserPlus className="mr-1 h-4 w-4" /> Invite
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {caregivers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.role}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Care summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Primary diagnosis" value={patient.primaryDiagnosis || "None"} />
              <Row label="Allergies" value={patient.allergies || "None"} />
              <Row label="Mobility" value={patient.mobility || "Unknown"} />
              <Row label="Emergency contact" value={patient.emergencyContactName || "None"} />
              {patient.emergencyContactPhone && (
                <Row label="Emergency phone" value={patient.emergencyContactPhone} />
              )}
              <div className="pt-2">
                <Badge variant="secondary" className="capitalize">
                  {patient.riskLevel} risk
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
