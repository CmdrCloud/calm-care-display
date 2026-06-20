import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Phone, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { caregivers } from "@/shared/constants/mock-data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function PatientsPage() {
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
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Add patient
          </Button>
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
