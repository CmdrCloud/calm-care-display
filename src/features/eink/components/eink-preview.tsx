export interface EInkPreviewProps {
  size?: "sm" | "lg";
  device?: any;
  patient?: any;
  nextMedication?: any;
  nextRoutine?: any;
  missedDose?: any;
}

export function EInkPreview({
  size = "lg",
  device,
  patient,
  nextMedication,
  nextRoutine,
  missedDose,
}: EInkPreviewProps) {
  const dims = size === "lg" ? "aspect-[4/3] max-w-3xl" : "aspect-[4/3] max-w-md";

  // Format today's date dynamically
  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Time formatting helpers
  const formatMedTime = (scheduledForStr: string) => {
    if (!scheduledForStr) return "";
    const date = new Date(scheduledForStr);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatRoutineTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  // Sync state formatting helper
  const formatLastSync = (lastSyncAtStr: string, status: string) => {
    if (!lastSyncAtStr) return "Never synced";
    if (status === "offline") return "Offline";
    const diffMs = new Date().getTime() - new Date(lastSyncAtStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Synced just now";
    if (diffMins === 1) return "Synced 1 min ago";
    if (diffMins < 60) return `Synced ${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `Synced ${diffHours} hr ago`;
  };

  const syncStatus = device?.syncState
    ? formatLastSync(device.syncState.lastSyncAt, device.syncState.status)
    : "Offline";

  const batteryText =
    device?.syncState?.powerSource === "battery" && device?.syncState?.batteryPercentage != null
      ? ` · Battery: ${device.syncState.batteryPercentage}%`
      : "";

  const showMed = device ? device.showNextMedication : true;
  const showRoutine = device ? device.showNextRoutine : true;
  const template = device?.displayTemplate || "daily_summary";

  // Next reminder selection logic (if template is next_reminder)
  let showMedicationAsNext = true;
  if (nextMedication && nextRoutine) {
    const medDate = new Date(nextMedication.scheduledFor);
    const medMins = medDate.getHours() * 60 + medDate.getMinutes();

    const [rHours, rMins] = nextRoutine.scheduledTime.split(":").map(Number);
    const routineMins = rHours * 60 + rMins;

    showMedicationAsNext = medMins <= routineMins;
  } else if (!nextMedication && nextRoutine) {
    showMedicationAsNext = false;
  }

  return (
    <div className={`eink-surface mx-auto w-full ${dims} rounded-md p-8 shadow-inner`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[var(--color-eink-border)] pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-eink-muted)]">
              Today
            </div>
            <div className="text-xl font-bold leading-tight">{formattedToday}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-eink-muted)]">
              Patient
            </div>
            <div className="text-xl font-bold leading-tight">{patient?.name || "—"}</div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6 flex-1">
          {!patient ? (
            <div className="flex h-full items-center justify-center border-2 border-dashed border-[var(--color-eink-border)] p-6 text-center text-[var(--color-eink-muted)]">
              No Patient Assigned to Device
            </div>
          ) : template === "next_reminder" ? (
            // Next Reminder Template
            <div className="flex h-full flex-col justify-center">
              {showMedicationAsNext && nextMedication ? (
                <div className="border-2 border-[var(--color-eink-border)] p-6 text-center">
                  <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">
                    Next Medication Reminder
                  </div>
                  <div className="mt-4 text-5xl font-black leading-none">
                    {formatMedTime(nextMedication.scheduledFor)}
                  </div>
                  <div className="mt-4 text-2xl font-bold">{nextMedication.medication?.name}</div>
                  <div className="text-lg text-[var(--color-eink-muted)]">
                    {nextMedication.medication?.dose}
                  </div>
                  {nextMedication.medication?.notes && (
                    <div className="mt-3 text-sm italic">“{nextMedication.medication.notes}”</div>
                  )}
                </div>
              ) : nextRoutine ? (
                <div className="border-2 border-[var(--color-eink-border)] p-6 text-center">
                  <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">
                    Next Routine Activity
                  </div>
                  <div className="mt-4 text-5xl font-black leading-none">
                    {formatRoutineTime(nextRoutine.scheduledTime)}
                  </div>
                  <div className="mt-4 text-2xl font-bold">{nextRoutine.title}</div>
                  <div className="text-lg text-[var(--color-eink-muted)]">
                    {nextRoutine.category}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[var(--color-eink-border)] p-6 text-center text-[var(--color-eink-muted)]">
                  No upcoming activities or medications scheduled today.
                </div>
              )}
            </div>
          ) : (
            // Daily Summary / Default Template
            <div className="grid h-full grid-cols-2 gap-6">
              {/* Medication Column */}
              {showMed ? (
                <div className="border-2 border-[var(--color-eink-border)] p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">
                    Next medication
                  </div>
                  {nextMedication ? (
                    <>
                      <div className="mt-2 text-3xl font-black leading-none">
                        {formatMedTime(nextMedication.scheduledFor)}
                      </div>
                      <div className="mt-2 text-xl font-bold">{nextMedication.medication?.name}</div>
                      <div className="text-base">{nextMedication.medication?.dose}</div>
                      {nextMedication.medication?.notes && (
                        <div className="mt-2 text-sm">{nextMedication.medication.notes}</div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 text-sm text-[var(--color-eink-muted)]">
                      No medications scheduled
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed border-[var(--color-eink-border)] p-4 text-center text-[var(--color-eink-muted)] text-xs">
                  Medications hidden
                </div>
              )}

              {/* Routine Column */}
              {showRoutine ? (
                <div className="border-2 border-[var(--color-eink-border)] p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-eink-muted)]">
                    Next routine
                  </div>
                  {nextRoutine ? (
                    <>
                      <div className="mt-2 text-3xl font-black leading-none">
                        {formatRoutineTime(nextRoutine.scheduledTime)}
                      </div>
                      <div className="mt-2 text-xl font-bold">{nextRoutine.title}</div>
                      <div className="text-base capitalize">{nextRoutine.category}</div>
                    </>
                  ) : (
                    <div className="mt-4 text-sm text-[var(--color-eink-muted)]">
                      No routines scheduled
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed border-[var(--color-eink-border)] p-4 text-center text-[var(--color-eink-muted)] text-xs">
                  Routines hidden
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t-2 border-[var(--color-eink-border)] pt-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-bold">Status: </span>
              {nextMedication ? (
                nextMedication.status === "confirmed" ? (
                  "Confirmed ✓"
                ) : nextMedication.status === "missed" ? (
                  "Missed dose !"
                ) : (
                  "Awaiting confirmation"
                )
              ) : (
                "Awaiting schedule"
              )}
            </div>
            <div className="text-xs text-[var(--color-eink-muted)]">
              {syncStatus}
              {batteryText}
            </div>
          </div>

          {/* Missed Dose Alert banner */}
          {device?.showMissedDoseAlerts !== false && missedDose && (
            <div className="mt-2 border-2 border-[var(--color-eink-border)] bg-[var(--color-eink-fg)] px-3 py-2 text-sm font-bold text-[var(--color-eink-bg)]">
              ! Please take {missedDose.medication?.name} {missedDose.medication?.dose} as soon as
              possible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
