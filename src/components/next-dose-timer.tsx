import { useEffect, useState } from "react";
import { AlarmClock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextMedication } from "@/lib/mock-data";

function getNextDoseDate(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

export function NextDoseTimer() {
  const med = nextMedication();
  const target = getNextDoseDate(med.time);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const hh = Math.floor(diff / 3600).toString().padStart(2, "0");
  const mm = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
  const ss = (diff % 60).toString().padStart(2, "0");

  const isToday = target.toDateString() === new Date().toDateString();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
      <div className="flex items-start justify-between">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur-sm">
          <AlarmClock className="h-7 w-7" />
        </div>
        <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold tracking-wider">
          NEXT DOSE
        </span>
      </div>

      <div className="mt-10">
        <div className="text-sm font-medium opacity-90">
          {med.name} · {med.dose}
        </div>
        <div className="mt-1 font-mono text-5xl font-bold tabular-nums sm:text-6xl">
          {hh}:{mm}:{ss}
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Scheduled for {formatTime12(med.time)}
            <br />
            {isToday ? "Today" : "Tomorrow"}
          </span>
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="h-auto rounded-2xl bg-white px-6 py-3 font-semibold leading-tight text-primary hover:bg-white/90"
        >
          Mark
          <br />
          Taken
        </Button>
      </div>
    </div>
  );
}
