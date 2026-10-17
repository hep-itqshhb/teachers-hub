import { doc, getDoc } from "firebase/firestore/lite";
import { db } from "./firebase-client.js";

const contentRef = doc(db, "siteContent", "current");

window.hubContentStore = {
  async load() {
    const snapshot = await getDoc(contentRef);
    if (!snapshot.exists()) return null;
    const content = snapshot.data();
    return {
      importantDates: Array.isArray(content.importantDates) ? content.importantDates : [],
      announcements: Array.isArray(content.announcements) ? content.announcements : []
    };
  }
};
