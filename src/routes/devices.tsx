import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Wifi, WifiOff, Plus, BatteryMedium, Plug, Eye } from "lucide-react";
import { EInkPreview } from "@/components/eink-preview";
import { devices } from "@/lib/mock-data";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "Devices — CareCircle AI" }] }),
  component: Devices,
});

function Devices() {
  const primary = devices[0];
  return (
    <AppShell title="E-Ink Devices" subtitle="Raspberry Pi 3 displays in the home">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{devices.length} devices · {devices.filter(d=>d.status==="online").length} online</p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/eink-preview"><Eye className="mr-2 h-4 w-4" /> Full preview</Link>
            </Button>
            <Button className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Register device</Button>
          </div>
        </div>

        {/* Centerpiece preview + config */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Live preview · {primary.name}</CardTitle>
              <Badge className="bg-success/15 text-success">Online</Badge>
            </CardHeader>
            <CardContent className="bg-muted/40 p-6">
              <EInkPreview />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Preview reflects exactly what is rendered on the Raspberry Pi 3 e-ink display.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2"><Label>Device name</Label><Input defaultValue={primary.name} /></div>
              <div className="grid gap-2">
                <Label>Display template</Label>
                <Select defaultValue="daily">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="next">Next Reminder Only</SelectItem>
                    <SelectItem value="schedule">Full Schedule</SelectItem>
                    <SelectItem value="message">Message Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between"><Label>Refresh interval</Label><span className="text-sm font-medium">{primary.refreshMinutes} min</span></div>
                <Slider defaultValue={[primary.refreshMinutes]} min={1} max={60} step={1} />
                <p className="text-xs text-muted-foreground">Longer intervals extend battery life on Pi 3.</p>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <ToggleRow label="Show next medication" defaultChecked />
                <ToggleRow label="Show next routine" defaultChecked />
                <ToggleRow label="Show missed-dose alerts" defaultChecked />
                <ToggleRow label="Show family message" />
              </div>
              <Button className="w-full rounded-full">Save & sync to device</Button>
            </CardContent>
          </Card>
        </div>

        {/* Device list */}
        <div className="grid gap-4 md:grid-cols-2">
          {devices.map((d) => (
            <Card key={d.id} className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${d.status==="online" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {d.status === "online" ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{d.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.model}</div>
                  </div>
                  <Badge variant={d.status==="online" ? "default" : "secondary"} className="capitalize">{d.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Info label="Last sync" value={d.lastSync} />
                  <Info label="Template" value={d.template} />
                  <Info label="Refresh" value={`${d.refreshMinutes} min`} />
                  <Info label="Power" value={d.power} icon={d.power === "Battery" ? BatteryMedium : Plug} />
                </div>
                {d.battery != null && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Battery</span><span>{d.battery}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-warning" style={{ width: `${d.battery}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 rounded-full">Configure</Button>
                  <Button variant="ghost" size="sm" className="flex-1">Sync now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Setup card */}
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Plus className="h-6 w-6" /></div>
              <div>
                <div className="font-medium">Connect a Raspberry Pi 3</div>
                <p className="mt-1 text-xs text-muted-foreground">Flash the CareCircle image, enter the 6-digit pairing code, and choose a template.</p>
              </div>
              <Button variant="outline" className="rounded-full">Start setup</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{className?: string}> }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5" />} {value}
      </div>
    </div>
  );
}
