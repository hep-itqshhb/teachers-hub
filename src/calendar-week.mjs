// Calendar dates stay in Brunei, regardless of the visitor's device timezone.
const DAY_MS = 86400000;
const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Brunei", year: "numeric", month: "2-digit", day: "2-digit"
});

export function bruneiDay(now = new Date()) {
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function validDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDays(day, count) {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + count * DAY_MS).toISOString().slice(0, 10);
}

export function currentWeek(now = new Date()) {
  const today = bruneiDay(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const start = addDays(today, -((weekday + 6) % 7));
  return { today, start, end: addDays(start, 6), days: Array.from({ length: 7 }, (_, i) => addDays(start, i)) };
}

export function weekActivities(activities, week) {
  const visible = activities.filter((item) => {
    if (!item || typeof item.Tajuk !== "string" || !item.Tajuk.trim()) return false;
    if (/^(dibatalkan|batal|cancelled|canceled)$/i.test(String(item.Status || "").trim())) return false;
    const end = item.TarikhTamat || item.TarikhMula;
    return validDay(item.TarikhMula) && validDay(end) && end >= item.TarikhMula
      && item.TarikhMula <= week.end && end >= week.start;
  });
  return week.days.map((date) => ({
    date,
    activities: visible.filter((item) => item.TarikhMula <= date && (item.TarikhTamat || item.TarikhMula) >= date)
      .sort((a, b) => (a.MasaMula || "99:99").localeCompare(b.MasaMula || "99:99") || a.Tajuk.localeCompare(b.Tajuk, "ms"))
  }));
}
