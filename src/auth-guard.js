import { getAuth, signOut } from "firebase/auth";
import { ADMIN_EMAIL, app } from "./firebase-client.js";

const auth = getAuth(app);
const isEduEmail = (email) => /^[A-Z0-9._%+-]+@itqshhb\.edu\.bn$/i.test(email || "");

window.authGateReady = auth.authStateReady().then(() => {
  const user = auth.currentUser;
  const allowed = user?.emailVerified && (isEduEmail(user.email) || user.email === ADMIN_EMAIL);
  if (!allowed) {
    const mode = user ? "verify" : "login";
    window.location.replace(`/auth.html?mode=${mode}`);
    return false;
  }
  document.documentElement.classList.remove("auth-pending");
  const name = document.getElementById("member-name");
  if (name) name.textContent = user.displayName || user.email;
  document.getElementById("member-signout")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("/auth.html");
  });
  return true;
}).catch(() => {
  window.location.replace("/auth.html?error=session");
  return false;
});
