import { AppShell } from "@/shared/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Plus, Utensils, Footprints, Droplets, HeartPulse, Moon, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useState } from "react";
import { toast } from "sonner";

const iconFor = (cat: string) => {
  const c = cat.toLowerCase();
  if (c === "meal") return Utensils;
  if (c === "activity") return Footprints;
  if (c === "hydration") return Droplets;
  if (c === "therapy") return HeartPulse;
  if (c === "sleep") return Moon;
  return Calendar;
};

function AddRoutineDialog({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<
    "meal" | "activity" | "hydration" | "therapy" | "sleep" | "calendar" | "other"
  >("meal");
  const [recurrenceRule, setRecurrenceRule] = useState("DAILY");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);

  const createRoutineMutation = useMutation({
    mutationFn: (data: any) => api.post("/routines", data),
    onSuccess: () => {
      onSuccess();
      toast.success("Routine added successfully!");
      setOpen(false);
      // Reset form
      setTitle("");
      setTime("09:00");
      setCategory("meal");
      setRecurrenceRule("DAILY");
      setPriority("medium");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add routine.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time) {
      toast.error("Please fill in required fields.");
      return;
    }
    setLoading(true);
    createRoutineMutation.mutate({
      patientId,
      title,
      scheduledTime: time + ":00",
      category,
      recurrenceRule,
      priority,
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add routine
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add routine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Morning walk"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal">Meal</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="hydration">Hydration</SelectItem>
                  <SelectItem value="therapy">Therapy</SelectItem>
                  <SelectItem value="sleep">Sleep</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Input
                id="recurrence"
                placeholder="e.g. DAILY, WEEKLY"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Save routine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoutinesPage() {
  const queryClient = useQueryClient();

  const { data: patientsList = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get<any[]>("/patients"),
  });

  const { data: routinesList = [], isLoading: loadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: () => api.get<any[]>("/routines"),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["routines"] });
  };

  const isLoading = loadingPatients || loadingRoutines;

  if (isLoading) {
    return (
      <AppShell title="Routines" subtitle="Daily rhythm of meals, activity, and care">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse text-sm">Loading routines...</p>
        </div>
      </AppShell>
    );
  }

  const patient = patientsList[0] || { id: "44444444-4444-4444-4444-444444444444" };

  return (
    <AppShell title="Routines" subtitle="Daily rhythm of meals, activity, and care">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{routinesList.length} routines scheduled</p>
          <AddRoutineDialog patientId={patient.id} onSuccess={handleRefresh} />
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Today's schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative ml-3 space-y-4 border-l-2 border-border pl-6">
              {routinesList.map((r) => {
                const Icon = iconFor(r.category);
                const displayTime = r.scheduledTime.substring(0, 5);
                return (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="w-16 shrink-0 text-base font-semibold tabular-nums">
                        {displayTime}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.title}</div>
                        <div className="truncate text-xs text-muted-foreground capitalize">
                          {r.category} · {r.recurrenceRule}
                        </div>
                      </div>
                      <Badge
                        variant={r.priority === "high" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {r.priority}
                      </Badge>
                    </div>
                  </li>
                );
              })}
              {routinesList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No routines scheduled.
                </p>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
