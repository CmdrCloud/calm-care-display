import { patient, nextMedication, nextRoutine, todayDate } from "@/shared/constants/mock-data";

export function EInkPreview({ size = "lg" }: { size?: "sm" | "lg" }) {
  const med = nextMedication();
  const routine = nextRoutine();

  const dims = size === "lg" ? "aspect-[4/3] max-w-3xl" : "aspect-[4/3] max-w-md";

  return (
    <div className={`eink-surface mx-auto w-full ${dims} rounded-md p-8 shadow-inner`}>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b-2 border-[var(--color-eink-border)] pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-eink-muted)]">Today</div>
            <div className="text-xl font-bold leading-tight">{todayDate}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-eink-muted)]">Patient</div>
            <div className="text-xl font-bold leading-tight">{patient.name}</div>
          </div>
        </div>

        <div className="mt-6 grid flex-1 grid-cols-2 gap-6">
          <div className="border-2 border-[var(--color-eink-border)] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">Next medication</div>
            <div className="mt-2 text-3xl font-black leading-none">{med.time}</div>
            <div className="mt-2 text-xl font-bold">{med.name}</div>
            <div className="text-base">{med.dose}</div>
            {med.notes && <div className="mt-2 text-sm">{med.notes}</div>}
          </div>
          <div className="border-2 border-[var(--color-eink-border)] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">Next routine</div>
            <div className="mt-2 text-3xl font-black leading-none">{routine.time}</div>
            <div className="mt-2 text-xl font-bold">{routine.title}</div>
            <div className="text-base">{routine.category}</div>
          </div>
        </div>

        <div className="mt-6 border-t-2 border-[var(--color-eink-border)] pt-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-bold">Status: </span>
              {med.status === "confirmed" ? "Confirmed ✓" : med.status === "missed" ? "Missed dose !" : "Awaiting confirmation"}
            </div>
            <div className="text-xs text-[var(--color-eink-muted)]">Synced 2 min ago</div>
          </div>
          {med.status === "missed" && (
            <div className="mt-2 border-2 border-[var(--color-eink-border)] bg-[var(--color-eink-fg)] px-3 py-2 text-sm font-bold text-[var(--color-eink-bg)]">
              ! Please take Aspirin 81 mg as soon as possible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
