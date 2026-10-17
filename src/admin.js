import { getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { ADMIN_EMAIL, app, db } from "./firebase-client.js";

const auth = getAuth(app);
const contentRef = doc(db, "siteContent", "current");
const byId = (id) => document.getElementById(id);
const loginView = byId("login-view");
const editorView = byId("editor-view");
const deniedView = byId("denied-view");
const status = byId("admin-status");
const saveButton = byId("save-content");
const dateList = byId("date-list");
const announcementList = byId("announcement-list");

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
  dateList.replaceChildren();
  announcementList.replaceChildren();
  (content.importantDates || []).forEach((item) => addEntry("date", item, false));
  (content.announcements || []).forEach((item) => addEntry("announcement", item, false));
  updateCounts();
}

function httpsLink(value) {
  if (!value) return "";
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Pautan makluman mesti bermula dengan https://.");
  return url.href;
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

byId("content-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  saveButton.disabled = true;
  setStatus("Menyimpan kandungan…");
  try {
    const content = collectContent();
    await setDoc(contentRef, { ...content, updatedAt: serverTimestamp() });
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
    const snapshot = await getDoc(contentRef);
    if (snapshot.exists()) {
      renderEditor(snapshot.data());
      setStatus("");
    } else {
      renderEditor({
        importantDates: [...(HUB_CONFIG.importantDates || [])],
        announcements: [...(HUB_CONFIG.announcements || [])]
      });
      setStatus("Kandungan semasa dimuatkan. Tekan Simpan perubahan untuk mula mengurusnya di sini.");
    }
    editorView.hidden = false;
  } catch (error) {
    loginView.hidden = false;
    setStatus(`Tidak dapat membuka editor: ${error.message}`, "error");
  }
});
