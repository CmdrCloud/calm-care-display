import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill, Plus, Clock } from "lucide-react";
import { medications, nextMedication } from "@/lib/mock-data";
import { NextDoseTimer } from "@/components/next-dose-timer";


export const Route = createFileRoute("/medications")({
  head: () => ({ meta: [{ title: "Medications — CareCircle AI" }] }),
  component: Medications,
});

function Medications() {
  const next = nextMedication();
  return (
    <AppShell title="Medications" subtitle="Schedule, confirm, and monitor doses">
      <div className="mx-auto max-w-6xl space-y-6">
        <NextDoseTimer />
        <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-card">

          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Pill className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wide text-primary">Next dose</div>
              <div className="text-2xl font-semibold">{next.name} · {next.dose}</div>
              <div className="text-sm text-muted-foreground"><Clock className="mr-1 inline h-3.5 w-3.5" />{next.time} · {next.frequency}</div>
            </div>
            <Button size="lg" className="rounded-full">Mark confirmed</Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All medications</h2>
          <AddMedDialog />
        </div>

        <div className="grid gap-3">
          {medications.map((m) => (
            <Card key={m.id} className="rounded-2xl">
              <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:flex sm:flex-wrap">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="min-w-0 sm:flex-1">
                  <div className="truncate font-medium">{m.name} <span className="text-muted-foreground">· {m.dose}</span></div>
                  <div className="truncate text-xs text-muted-foreground">{m.time} · {m.frequency}{m.notes ? ` · ${m.notes}` : ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={m.status} />
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
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

function AddMedDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Add medication</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Add medication</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2"><Label>Name</Label><Input placeholder="e.g. Lisinopril" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Dose</Label><Input placeholder="10 mg" /></div>
            <div className="grid gap-2"><Label>Time</Label><Input type="time" defaultValue="08:00" /></div>
          </div>
          <div className="grid gap-2">
            <Label>Frequency</Label>
            <Select defaultValue="daily">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="twice">Twice daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="asneeded">As needed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Notes</Label><Textarea placeholder="With food, avoid grapefruit…" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button>Save medication</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
