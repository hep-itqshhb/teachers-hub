import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

// Public Firebase web settings. Access is enforced by Firestore rules, not this object.
export const ADMIN_EMAIL = "azharsuhaili19@gmail.com";
export const firebaseConfig = {
  apiKey: "AIzaSyAmwYTyWalI9sHaeZlLfn3c36Bv7cmgj20",
  authDomain: "teachershub-itq.web.app",
  projectId: "teachers-hub-itqshhb-261017",
  appId: "1:1036062585142:web:9dd61e6f5264ed05bd8397"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "teachers-hub-content");
