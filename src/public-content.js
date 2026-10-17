import { doc, getDoc, increment, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { db } from "./firebase-client.js";

const contentRef = doc(db, "siteContent", "current");
const quickLinksRef = doc(db, "quickLinks", "current");
const serviceIds = new Set(["disiplin", "hafazan", "akademik", "aktiviti", "kalendar", "bpp"]);

window.hubContentStore = {
  async load() {
    if (window.authGateReady && !(await window.authGateReady)) return null;
    const snapshot = await getDoc(contentRef);
    if (!snapshot.exists()) return null;
    const content = snapshot.data();
    return {
      importantDates: Array.isArray(content.importantDates) ? content.importantDates : [],
      announcements: Array.isArray(content.announcements) ? content.announcements : []
    };
  },
  async loadLinks() {
    if (window.authGateReady && !(await window.authGateReady)) return null;
    const snapshot = await getDoc(quickLinksRef);
    return snapshot.exists() ? snapshot.data().links : null;
  },
  async recordClick(service) {
    if (!serviceIds.has(service) || (window.authGateReady && !(await window.authGateReady))) return;
    await setDoc(doc(db, "linkStats", service), {
      clicks: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};
