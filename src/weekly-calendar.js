import { currentWeek, weekActivities, nextWeekActivity } from "./calendar-week.mjs";

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
let selectedDay = "";
let renderSignature = "";
let activityTrigger = null;
const picker = document.getElementById("weekly-day-picker");
const overview = document.getElementById("weekly-overview");
const upcoming = document.getElementById("weekly-upcoming");
const activityDialog = document.getElementById("activity-dialog");
const shortWeekday = new Intl.DateTimeFormat("ms-BN", { timeZone: "UTC", weekday: "short" });

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
  const heading = element("h4", "weekly-activity-title");
  const open = element("button", "weekly-activity-open", "Lihat butiran");
  open.type = "button";
  open.setAttribute("aria-haspopup", "dialog");
  open.setAttribute("aria-label", `Lihat butiran ${item.Tajuk}`);
  open.addEventListener("click", () => {
    activityTrigger = open;
    document.getElementById("activity-dialog-title").textContent = item.Tajuk;
    const details = document.getElementById("activity-dialog-details");
    details.replaceChildren();
    const label = (day) => dateLabel.format(new Date(`${day}T00:00:00Z`));
    const dates = item.TarikhTamat && item.TarikhTamat !== item.TarikhMula
      ? `${label(item.TarikhMula)} – ${label(item.TarikhTamat)}` : label(item.TarikhMula);
    for (const [name, value] of [["Tarikh", dates], ["Masa", time], ["Tempat", item.Tempat || "Belum dinyatakan"], ["Kategori", item.Kategori], ["Penganjur", item.Penganjur], ["Terlibat", item.PihakTerlibat], ["Penyelaras", item.PegawaiPenyelaras], ["Status", item.Status], ["Catatan", item.Catatan]]) {
      if (value) details.append(element("dt", "", name), element("dd", "", String(value)));
    }
    activityDialog.showModal();
  });
  heading.textContent = item.Tajuk;
  card.append(meta, heading);
  const details = [item.Tempat, item.Kategori].filter(Boolean);
  if (details.length) card.append(element("p", "weekly-activity-details", details.join(", ")));
  card.append(open);
  return card;
}

function selectDay(date, announce = true) {
  selectedDay = date;
  picker.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.date === date)));
  list.querySelectorAll(".weekly-day").forEach((row) => { row.hidden = row.dataset.date !== date; });
  if (announce) {
    const row = [...list.children].find((node) => node.dataset.date === date);
    const day = new Date(`${date}T00:00:00Z`);
    document.getElementById("weekly-selection-status").textContent = row
      ? `${weekdayLabel.format(day)}, ${dateLabel.format(day)}. ${row.querySelectorAll(".weekly-activity").length} aktiviti.` : "";
  }
}

function renderWeek() {
  const week = currentWeek();
  if (!selectedDay || renderedDay !== week.today || !week.days.includes(selectedDay)) selectedDay = week.today;
  renderedDay = week.today;
  const label = (day) => dateLabel.format(new Date(`${day}T00:00:00Z`));
  range.textContent = `${label(week.start)} – ${label(week.end)}`;
  root.dataset.weekStart = week.start;
  if (activities === null) return;
  const days = weekActivities(activities, week);
  const todayCount = days.find((day) => day.date === week.today).activities.length;
  document.getElementById("weekly-today-summary").textContent = todayCount
    ? `${todayCount} aktiviti hari ini. Pilih hari untuk melihat jadual.` : "Tiada aktiviti dijadualkan hari ini. Semak hari lain dalam minggu ini.";
  const next = nextWeekActivity(activities, week);
  document.getElementById("weekly-upcoming-wrap").hidden = !next;
  if (next) {
    document.getElementById("weekly-upcoming-title").textContent = `Aktiviti terdekat ${label(next.date)}: ${next.item.Tajuk}`;
    upcoming.onclick = () => { selectDay(next.date); picker.querySelector(`[data-date="${next.date}"]`).focus(); };
  }
  overview.hidden = false;
  picker.hidden = false;
  const signature = JSON.stringify([week.today, days]);
  if (signature === renderSignature) { selectDay(selectedDay, false); return; }
  renderSignature = signature;
  const focusedDate = picker.contains(document.activeElement) ? document.activeElement.dataset.date : null;
  const fragment = document.createDocumentFragment();
  const choices = document.createDocumentFragment();
  for (const day of days) {
    const choice = element("button", `weekly-day-choice${day.date === week.today ? " is-today" : ""}`);
    choice.type = "button";
    choice.dataset.date = day.date;
    choice.setAttribute("aria-controls", `agenda-${day.date}`);
    choice.setAttribute("aria-label", `${weekdayLabel.format(new Date(`${day.date}T00:00:00Z`))}, ${label(day.date)}${day.date === week.today ? ", hari ini" : ""}, ${day.activities.length} aktiviti`);
    choice.append(element("span", "weekly-choice-name", shortWeekday.format(new Date(`${day.date}T00:00:00Z`))),
      element("span", "weekly-choice-date", String(Number(day.date.slice(-2)))),
      element("span", "weekly-choice-count", day.activities.length ? `${day.activities.length} aktiviti` : "Tiada aktiviti"));
    choice.addEventListener("click", () => selectDay(day.date));
    choices.append(choice);
    const row = element("div", `weekly-day${day.date === week.today ? " is-today" : ""}`);
    row.dataset.date = day.date;
    row.id = `agenda-${day.date}`;
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
  picker.replaceChildren(choices);
  list.replaceChildren(fragment);
  selectDay(selectedDay, false);
  if (focusedDate) picker.querySelector(`[data-date="${week.days.includes(focusedDate) ? focusedDate : selectedDay}"]`)?.focus();
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
  refreshButton.setAttribute("aria-busy", "true");
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
    refreshButton.setAttribute("aria-busy", "false");
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
  activityDialog.addEventListener("close", () => {
    if (activityTrigger?.isConnected) activityTrigger.focus();
    else picker.querySelector('[aria-pressed="true"]')?.focus();
  });
  picker.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...picker.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    selectDay(buttons[next].dataset.date);
  });
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
