import { getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { ADMIN_EMAIL, app, db } from "./firebase-client.js";

const auth = getAuth(app);
const contentRef = doc(db, "siteContent", "current");
const quickLinksRef = doc(db, "quickLinks", "current");
const quickLinks = [
  { id: "disiplin", name: "Laporan Kes Disiplin", detail: "Borang laporan disiplin" },
  { id: "hafazan", name: "Kemajuan Hafazan Al-Quran", detail: "Borang perkembangan hafazan" },
  { id: "akademik", name: "Kemajuan Akademik", detail: "Borang perkembangan akademik" },
  { id: "aktiviti", name: "Laporan Aktiviti Pelajar", detail: "Borang laporan aktiviti" },
  { id: "kalendar", name: "Kalendar Aktiviti", detail: "Kalendar rasmi Institut" },
  { id: "bpp", name: "Bahagian Pembangunan Pelajar", detail: "Laman web BPP" }
];
const byId = (id) => document.getElementById(id);
const loginView = byId("login-view");
const editorView = byId("editor-view");
const deniedView = byId("denied-view");
const status = byId("admin-status");
const saveButton = byId("save-content");
const dateList = byId("date-list");
const announcementList = byId("announcement-list");
const linksList = byId("links-list");
let currentContent = { importantDates: [], announcements: [] };
let clickStats = Object.fromEntries(quickLinks.map(({ id }) => [id, 0]));

function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
  status.hidden = !message;
}

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Brunei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function addEntry(type, item = {}, focus = true) {
  const template = byId(type === "date" ? "date-template" : "announcement-template");
  const list = type === "date" ? dateList : announcementList;
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector('[name="title"]').value = item.title || "";
  row.querySelector('[name="date"]').value = type === "date" ? localDateTime(item.date) : (item.date || "").slice(0, 10);
  if (type === "date") {
    row.querySelector('[name="label"]').value = item.label || "Tarikh akhir";
  } else {
    row.querySelector('[name="summary"]').value = item.summary || "";
    row.querySelector('[name="link"]').value = item.link || "";
    row.querySelector('[name="linkLabel"]').value = item.linkLabel || "";
    row.querySelector('[name="expiresAt"]').value = localDateTime(item.expiresAt);
  }
  row.querySelector('[name="active"]').checked = item.status !== "inactive";
  row.querySelector(".remove-entry").addEventListener("click", () => {
    row.remove();
    updateCounts();
    setStatus("Perubahan belum disimpan. Tekan Simpan perubahan untuk menerbitkan.");
  });
  list.append(row);
  updateCounts();
  if (focus) row.querySelector('[name="title"]').focus({ preventScroll: true });
}

function updateCounts() {
  byId("date-count").textContent = `${dateList.children.length} entri`;
  byId("announcement-count").textContent = `${announcementList.children.length} entri`;
}

function renderEditor(content) {
  currentContent = content;
  dateList.replaceChildren();
  announcementList.replaceChildren();
  (content.importantDates || []).forEach((item) => addEntry("date", item, false));
  (content.announcements || []).forEach((item) => addEntry("announcement", item, false));
  updateCounts();
}

function httpsLink(value) {
  if (!value) return "";
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Semua pautan mesti menggunakan HTTPS tanpa nama pengguna atau kata laluan dalam URL.");
  return url.href;
}

function renderLinks(savedLinks = {}) {
  linksList.replaceChildren();
  quickLinks.forEach(({ id, name, detail }, index) => {
    const fallback = HUB_CONFIG.serviceStatus?.[id] || { status: "active", note: "" };
    const item = savedLinks[id] || { url: HUB_CONFIG.links?.[id] || "", ...fallback };
    const row = byId("link-template").content.firstElementChild.cloneNode(true);
    row.dataset.service = id;
    row.querySelector(".link-index").textContent = String(index + 1).padStart(2, "0");
    row.querySelector("h3").textContent = name;
    row.querySelector(".link-entry-heading p").textContent = detail;
    row.querySelector('[name="url"]').value = item.url || "";
    row.querySelector('[name="status"]').value = item.status || "active";
    row.querySelector('[name="note"]').value = item.note || "";
    linksList.append(row);
  });
  updateDashboard();
}

function collectLinks() {
  return Object.fromEntries([...linksList.children].map((row) => {
    const url = httpsLink(row.querySelector('[name="url"]').value.trim());
    const status = row.querySelector('[name="status"]').value;
    if (status === "active" && !url) throw new Error(`${row.querySelector("h3").textContent}: isi URL atau tukar status kepada Ditutup.`);
    return [row.dataset.service, { url, status, note: row.querySelector('[name="note"]').value.trim() }];
  }));
}

function activeContentCount() {
  const now = Date.now();
  const dates = (currentContent.importantDates || []).filter((item) => item.status !== "inactive" && Date.parse(item.date) >= now);
  const announcements = (currentContent.announcements || []).filter((item) => item.status !== "inactive" && (!item.expiresAt || Date.parse(item.expiresAt) >= now));
  return dates.length + announcements.length;
}

function updateDashboard() {
  const total = Object.values(clickStats).reduce((sum, count) => sum + count, 0);
  const top = [...quickLinks].sort((a, b) => clickStats[b.id] - clickStats[a.id])[0];
  const activeLinks = [...linksList.children].filter((row) => row.querySelector('[name="status"]').value === "active" && row.querySelector('[name="url"]').value.trim()).length;
  byId("metric-total-clicks").textContent = total.toLocaleString("ms-BN");
  byId("metric-top-link").textContent = total ? top.name : "Belum ada klik";
  byId("metric-top-clicks").textContent = total ? `${clickStats[top.id].toLocaleString("ms-BN")} klik` : "Berdasarkan klik";
  byId("metric-active-links").textContent = String(activeLinks);
  byId("metric-active-content").textContent = String(activeContentCount());

  const max = Math.max(1, ...Object.values(clickStats));
  const chart = byId("click-chart");
  chart.replaceChildren();
  quickLinks.forEach(({ id, name }) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    const label = document.createElement("span");
    label.className = "chart-row-label";
    label.textContent = name;
    label.title = name;
    const track = document.createElement("div");
    track.className = "chart-track";
    const fill = document.createElement("div");
    fill.className = "chart-fill";
    fill.style.width = `${clickStats[id] / max * 100}%`;
    track.append(fill);
    const count = document.createElement("strong");
    count.className = "chart-count";
    count.textContent = clickStats[id].toLocaleString("ms-BN");
    row.append(label, track, count);
    chart.append(row);
  });
}

async function loadStats() {
  const button = byId("refresh-stats");
  button.disabled = true;
  byId("stats-note").textContent = "Memuatkan statistik…";
  try {
    const snapshots = await Promise.all(quickLinks.map(({ id }) => getDoc(doc(db, "linkStats", id))));
    clickStats = Object.fromEntries(quickLinks.map(({ id }, index) => [id, Math.max(0, Number(snapshots[index].data()?.clicks) || 0)]));
    updateDashboard();
    byId("stats-note").textContent = "Jumlah klik, bukan bilangan pengguna unik.";
  } catch {
    byId("stats-note").textContent = "Statistik belum dapat dimuatkan. Cuba muat semula.";
  } finally {
    button.disabled = false;
  }
}

function collectContent() {
  const importantDates = [...dateList.children].map((row) => ({
    title: row.querySelector('[name="title"]').value.trim(),
    date: `${row.querySelector('[name="date"]').value}:00+08:00`,
    label: row.querySelector('[name="label"]').value.trim() || "Tarikh",
    status: row.querySelector('[name="active"]').checked ? "active" : "inactive"
  }));
  const announcements = [...announcementList.children].map((row) => {
    const link = httpsLink(row.querySelector('[name="link"]').value.trim());
    const expiry = row.querySelector('[name="expiresAt"]').value;
    return {
      title: row.querySelector('[name="title"]').value.trim(),
      date: row.querySelector('[name="date"]').value,
      summary: row.querySelector('[name="summary"]').value.trim(),
      link,
      linkLabel: link ? row.querySelector('[name="linkLabel"]').value.trim() || "Baca selanjutnya" : "",
      expiresAt: expiry ? `${expiry}:00+08:00` : "",
      status: row.querySelector('[name="active"]').checked ? "active" : "inactive"
    };
  });
  if (importantDates.length > 30 || announcements.length > 40) {
    throw new Error("Had maksimum ialah 30 tarikh penting dan 40 makluman.");
  }
  return { importantDates, announcements };
}

byId("google-login").addEventListener("click", async () => {
  setStatus("Membuka log masuk Google…");
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account", login_hint: ADMIN_EMAIL });
    await signInWithRedirect(auth, provider);
  } catch (error) {
    setStatus(`Log masuk gagal: ${error.message}`, "error");
  }
});

getRedirectResult(auth).catch((error) => {
  setStatus(`Log masuk gagal: ${error.message}`, "error");
});

byId("sign-out").addEventListener("click", () => signOut(auth));
byId("denied-sign-out").addEventListener("click", () => signOut(auth));
byId("add-date").addEventListener("click", () => addEntry("date"));
byId("add-announcement").addEventListener("click", () => addEntry("announcement"));
byId("refresh-stats").addEventListener("click", loadStats);
byId("links-form").addEventListener("input", updateDashboard);
byId("links-form").addEventListener("change", updateDashboard);

byId("links-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const button = byId("save-links");
  button.disabled = true;
  setStatus("Menyimpan pautan Akses Pantas…");
  try {
    await setDoc(quickLinksRef, { links: collectLinks(), updatedAt: serverTimestamp() });
    byId("links-updated").textContent = "Pautan dikemas kini. Muat semula laman utama untuk melihat perubahan.";
    setStatus("Pautan Akses Pantas berjaya diterbitkan.", "success");
    updateDashboard();
  } catch (error) {
    setStatus(`Tidak dapat menyimpan pautan: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
});

byId("content-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  saveButton.disabled = true;
  setStatus("Menyimpan kandungan…");
  try {
    const content = collectContent();
    await setDoc(contentRef, { ...content, updatedAt: serverTimestamp() });
    currentContent = content;
    updateDashboard();
    setStatus("Perubahan berjaya diterbitkan. Muat semula laman utama untuk melihatnya.", "success");
  } catch (error) {
    setStatus(`Tidak dapat menyimpan: ${error.message}`, "error");
  } finally {
    saveButton.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  loginView.hidden = true;
  editorView.hidden = true;
  deniedView.hidden = true;
  if (!user) {
    loginView.hidden = false;
    setStatus("");
    return;
  }
  try {
    const token = await user.getIdTokenResult(true);
    const isAdmin = token.claims.email === ADMIN_EMAIL
      && token.claims.email_verified === true
      && token.claims.firebase?.sign_in_provider === "google.com";
    if (!isAdmin) {
      deniedView.hidden = false;
      byId("denied-email").textContent = user.email || "Akaun ini";
      setStatus("Akaun ini tiada akses admin.", "error");
      return;
    }
    byId("admin-email").textContent = user.email;
    const [contentSnapshot, linksSnapshot] = await Promise.all([getDoc(contentRef), getDoc(quickLinksRef)]);
    if (contentSnapshot.exists()) {
      renderEditor(contentSnapshot.data());
      setStatus("");
    } else {
      renderEditor({
        importantDates: [...(HUB_CONFIG.importantDates || [])],
        announcements: [...(HUB_CONFIG.announcements || [])]
      });
      setStatus("Kandungan semasa dimuatkan. Tekan Simpan perubahan untuk mula mengurusnya di sini.");
    }
    renderLinks(linksSnapshot.data()?.links);
    const updatedAt = linksSnapshot.data()?.updatedAt?.toDate?.();
    if (updatedAt) byId("links-updated").textContent = `Kemas kini terakhir: ${new Intl.DateTimeFormat("ms-BN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Brunei" }).format(updatedAt)}`;
    editorView.hidden = false;
    void loadStats();
  } catch (error) {
    loginView.hidden = false;
    setStatus(`Tidak dapat membuka editor: ${error.message}`, "error");
  }
});
