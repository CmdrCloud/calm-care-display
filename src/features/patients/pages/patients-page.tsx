import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Phone, UserPlus } from "lucide-react";
import { patient, caregivers } from "@/shared/constants/mock-data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function PatientsPage() {
  return (
    <AppShell title="Patients" subtitle="Care recipients you are monitoring">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">1 active patient</p>
          <Button className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Add patient</Button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">{patient.avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">{patient.age} years · {patient.room}</p>
              <p className="mt-2 text-sm">{patient.notes}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full">Edit profile</Button>
              <Button variant="ghost" className="rounded-full">View care plan</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Assigned caregivers</CardTitle>
              <Button variant="ghost" size="sm"><UserPlus className="mr-1 h-4 w-4" /> Invite</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {caregivers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary">{c.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.role}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-4 w-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Care summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Primary diagnosis" value="Hypertension, mild cognitive decline" />
              <Row label="Allergies" value="Penicillin" />
              <Row label="Mobility" value="Walks with cane" />
              <Row label="Emergency contact" value="David Hayes (son)" />
              <div className="pt-2">
                <Badge variant="secondary">Low risk</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
