import { currentWeek, weekActivities } from "./calendar-week.mjs";

const REFRESH_MS = 5 * 60 * 1000;
const root = document.getElementById("weekly-calendar");
const list = document.getElementById("weekly-calendar-days");
const range = document.getElementById("weekly-calendar-range");
const status = document.getElementById("weekly-calendar-status");
const refreshButton = document.getElementById("weekly-calendar-refresh");
const dateLabel = new Intl.DateTimeFormat("ms-BN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const weekdayLabel = new Intl.DateTimeFormat("ms-BN", { timeZone: "UTC", weekday: "long" });
const updateLabel = new Intl.DateTimeFormat("ms-BN", { timeZone: "Asia/Brunei", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
let activities = null;
let loadedAt = null;
let renderedDay = "";
let loading = false;
let lastAttempt = 0;

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function activityCard(item) {
  const card = element("li", "weekly-activity");
  const meta = element("div", "weekly-activity-meta");
  const allDay = /^(ya|true)$/i.test(String(item.SepanjangHari || ""));
  const start = /^\d{2}:\d{2}$/.test(item.MasaMula || "") ? item.MasaMula : "";
  const end = /^\d{2}:\d{2}$/.test(item.MasaTamat || "") ? item.MasaTamat : "";
  const time = allDay ? "Sepanjang hari" : start ? `${start}${end ? `–${end}` : ""}` : "Masa belum dinyatakan";
  meta.append(element("span", "weekly-activity-time", time));
  if (item.Status && item.Status !== "Disahkan") meta.append(element("span", "weekly-activity-status", item.Status));
  card.append(meta, element("h4", "weekly-activity-title", item.Tajuk));
  const details = [item.Tempat, item.Kategori].filter(Boolean);
  if (details.length) card.append(element("p", "weekly-activity-details", details.join(" · ")));
  return card;
}

function renderWeek() {
  const week = currentWeek();
  renderedDay = week.today;
  const label = (day) => dateLabel.format(new Date(`${day}T00:00:00Z`));
  range.textContent = `${label(week.start)} – ${label(week.end)}`;
  root.dataset.weekStart = week.start;
  if (activities === null) return;
  const fragment = document.createDocumentFragment();
  for (const day of weekActivities(activities, week)) {
    const row = element("div", `weekly-day${day.date === week.today ? " is-today" : ""}`);
    const heading = element("h3", "weekly-day-heading");
    const date = new Date(`${day.date}T00:00:00Z`);
    const time = element("time", "weekly-day-date");
    time.dateTime = day.date;
    time.append(element("span", "weekly-weekday", weekdayLabel.format(date)), element("span", "weekly-date-label", label(day.date)));
    heading.append(time);
    if (day.date === week.today) heading.append(element("span", "weekly-today", "Hari ini"));
    row.append(heading);
    if (day.activities.length) {
      const events = element("ul", "weekly-activities");
      events.append(...day.activities.map(activityCard));
      row.append(events);
    } else {
      row.append(element("p", "weekly-no-activities", "Tiada aktiviti dijadualkan."));
    }
    fragment.append(row);
  }
  list.replaceChildren(fragment);
}

async function refresh() {
  // Always roll the visible week forward, even if the next request fails.
  renderWeek();
  if (loading || !navigator.onLine) {
    if (!navigator.onLine) showFailure();
    return;
  }
  loading = true;
  lastAttempt = Date.now();
  refreshButton.disabled = true;
  refreshButton.textContent = "Mengemas kini…";
  root.setAttribute("aria-busy", "true");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const url = new URL(HUB_CONFIG.calendarFeedUrl);
    if (url.protocol !== "https:") throw new Error("Invalid calendar URL");
    const response = await fetch(url.href, { signal: controller.signal, cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error(`Calendar HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.activities)) throw new Error("Invalid calendar data");
    activities = payload.activities;
    loadedAt = new Date();
    renderWeek();
    status.textContent = `Daripada Kalendar ITQSHHB · Dikemas kini ${updateLabel.format(loadedAt)} (Brunei)`;
  } catch (error) {
    console.warn("Kalendar mingguan tidak dapat dikemas kini.", error);
    showFailure();
  } finally {
    window.clearTimeout(timeout);
    loading = false;
    refreshButton.disabled = false;
    refreshButton.textContent = "Muat semula";
    root.setAttribute("aria-busy", "false");
  }
}

function showFailure() {
  root.setAttribute("aria-busy", "false");
  status.textContent = loadedAt
    ? `Sambungan terganggu. Data terakhir ${updateLabel.format(loadedAt)} (Brunei); perubahan terkini belum disemak.`
    : "Kalendar belum dapat dimuatkan. Cuba muat semula atau buka kalendar penuh.";
  if (activities === null) list.replaceChildren(element("p", "content-empty", "Aktiviti minggu ini belum dapat dimuatkan."));
}

async function start() {
  if (!root) return;
  if (window.authGateReady && !(await window.authGateReady)) return;
  const fullCalendar = document.getElementById("weekly-calendar-link");
  fullCalendar.href = HUB_CONFIG.links.kalendar;
  refreshButton.addEventListener("click", refresh);
  window.addEventListener("online", refresh);
  window.addEventListener("offline", () => { renderWeek(); showFailure(); });
  const check = () => {
    if (document.hidden) return;
    if (currentWeek().today !== renderedDay || Date.now() - lastAttempt >= REFRESH_MS) refresh();
  };
  window.addEventListener("pageshow", check);
  document.addEventListener("visibilitychange", check);
  window.setInterval(check, 15000);
  await refresh();
}

start();
