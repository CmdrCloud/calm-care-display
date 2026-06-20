import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function Row({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </div>
      <Button variant="ghost" size="sm">Edit</Button>
    </div>
  );
}

export function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Account, caregivers, and preferences">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Family account</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label>Account name</Label><Input defaultValue="Hayes Family" /></div>
            <div className="grid gap-2"><Label>Primary email</Label><Input defaultValue="maria@carecircle.app" /></div>
            <div className="grid gap-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Time zone</Label>
              <Select defaultValue="pt">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Pacific (US)</SelectItem>
                  <SelectItem value="mt">Mountain (US)</SelectItem>
                  <SelectItem value="ct">Central (US)</SelectItem>
                  <SelectItem value="et">Eastern (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Notification rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow label="Send SMS for missed doses" defaultChecked />
            <ToggleRow label="Email daily summary at 9pm" defaultChecked />
            <ToggleRow label="Push reminder 5 min before each dose" defaultChecked />
            <ToggleRow label="Alert family on 2 consecutive missed doses" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Caregiver access</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row name="Maria Lopez" role="Admin" />
            <Row name="David Hayes" role="View only" />
            <Button variant="outline" className="rounded-full">Invite caregiver</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">Care Plan · Family</div>
              <p className="text-sm text-muted-foreground">Up to 2 patients · 4 e-ink devices · unlimited reminders</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-success/15 text-success">Active</Badge>
              <Button variant="outline" className="rounded-full">Manage plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
