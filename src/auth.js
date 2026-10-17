import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { ADMIN_EMAIL, app, db } from "./firebase-client.js";

const auth = getAuth(app);
auth.useDeviceLanguage();
const byId = (id) => document.getElementById(id);
const formsView = byId("auth-forms");
const verifyView = byId("verify-view");
const loginForm = byId("login-form");
const registerForm = byId("register-form");
const status = byId("auth-status");
let verificationSentAt = 0;

function isEduEmail(email) {
  return /^[A-Z0-9._%+-]+@itqshhb\.edu\.bn$/i.test(email.trim());
}

function isAllowedUser(user) {
  return user?.emailVerified && (isEduEmail(user.email || "") || user.email === ADMIN_EMAIL);
}

function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
  status.hidden = !message;
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "E-mel ini sudah mempunyai akaun. Cuba log masuk.",
    "auth/invalid-credential": "E-mel atau kata laluan tidak tepat.",
    "auth/invalid-email": "Alamat e-mel tidak sah.",
    "auth/too-many-requests": "Terlalu banyak percubaan. Cuba lagi kemudian.",
    "auth/weak-password": "Kata laluan belum cukup kuat.",
    "auth/user-disabled": "Akaun ini telah dinyahaktifkan."
  };
  return messages[error?.code] || "Tindakan belum berjaya. Sila cuba lagi.";
}

function showForm(mode) {
  const registering = mode === "register";
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  byId("login-tab").classList.toggle("is-active", !registering);
  byId("register-tab").classList.toggle("is-active", registering);
  byId("login-tab").setAttribute("aria-selected", String(!registering));
  byId("register-tab").setAttribute("aria-selected", String(registering));
  byId("auth-heading").textContent = registering ? "Daftar akaun" : "Log masuk";
  byId("auth-intro").textContent = registering
    ? "Daftar menggunakan e-mel rasmi @itqshhb.edu.bn biskita."
    : "Gunakan akaun Teacher's Hub biskita untuk meneruskan.";
  setStatus("");
}

function showVerification(user) {
  formsView.hidden = true;
  verifyView.hidden = false;
  byId("verify-email").textContent = user.email || "e-mel biskita";
}

async function sendVerification(user, isResend = false) {
  const now = Date.now();
  if (isResend && now - verificationSentAt < 30000) {
    setStatus("Tunggu 30 saat sebelum menghantar semula.");
    return;
  }
  await sendEmailVerification(user, {
    url: "https://teachershub-itq.web.app/auth.html?verified=1",
    handleCodeInApp: false
  });
  verificationSentAt = now;
  setStatus(isResend ? "E-mel pengesahan sudah dihantar semula." : "E-mel pengesahan sudah dihantar.", "success");
}

byId("login-tab").addEventListener("click", () => showForm("login"));
byId("register-tab").addEventListener("click", () => showForm("register"));

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = byId(button.dataset.passwordToggle);
    const revealing = input.type === "password";
    input.type = revealing ? "text" : "password";
    button.textContent = revealing ? "Sorok" : "Lihat";
    button.setAttribute("aria-label", revealing ? "Sorokkan kata laluan" : "Tunjukkan kata laluan");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginForm.elements.namedItem("email").value.trim().toLowerCase();
  if (!isEduEmail(email)) {
    setStatus("Gunakan alamat e-mel rasmi yang berakhir dengan @itqshhb.edu.bn.", "error");
    return;
  }
  const submit = loginForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setStatus("Sedang log masuk…");
  try {
    const credential = await signInWithEmailAndPassword(auth, email, loginForm.elements.namedItem("password").value);
    if (credential.user.emailVerified) window.location.replace("/");
    else showVerification(credential.user);
  } catch (error) {
    setStatus(friendlyError(error), "error");
  } finally {
    submit.disabled = false;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = registerForm.elements.namedItem("name").value.trim();
  const phone = registerForm.elements.namedItem("phone").value.trim();
  const email = registerForm.elements.namedItem("email").value.trim().toLowerCase();
  const password = registerForm.elements.namedItem("password").value;
  if (!isEduEmail(email)) {
    setStatus("Pendaftaran hanya dibenarkan menggunakan e-mel @itqshhb.edu.bn.", "error");
    return;
  }
  if (password !== registerForm.elements.namedItem("confirm").value) {
    setStatus("Kata laluan yang disahkan tidak sepadan.", "error");
    return;
  }
  const submit = registerForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setStatus("Sedang menyediakan akaun…");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, "profiles", credential.user.uid), {
      uid: credential.user.uid,
      displayName: name,
      phone,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await sendVerification(credential.user);
    showVerification(credential.user);
  } catch (error) {
    setStatus(friendlyError(error), "error");
  } finally {
    submit.disabled = false;
  }
});

byId("forgot-password").addEventListener("click", async () => {
  const email = loginForm.elements.namedItem("email").value.trim().toLowerCase();
  if (!isEduEmail(email)) {
    setStatus("Masukkan e-mel @itqshhb.edu.bn biskita dahulu.", "error");
    byId("login-email").focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email, { url: "https://teachershub-itq.web.app/auth.html" });
    setStatus("Jika akaun itu wujud, arahan menetapkan semula kata laluan akan dihantar.", "success");
  } catch (error) {
    setStatus(friendlyError(error), "error");
  }
});

byId("resend-verification").addEventListener("click", async () => {
  const button = byId("resend-verification");
  button.disabled = true;
  try {
    if (auth.currentUser) await sendVerification(auth.currentUser, true);
  } catch (error) {
    setStatus(friendlyError(error), "error");
  } finally {
    button.disabled = false;
  }
});

byId("check-verification").addEventListener("click", async () => {
  const button = byId("check-verification");
  button.disabled = true;
  setStatus("Memeriksa pengesahan…");
  try {
    if (!auth.currentUser) throw new Error("auth/no-current-user");
    await reload(auth.currentUser);
    if (isAllowedUser(auth.currentUser)) window.location.replace("/");
    else setStatus("E-mel belum disahkan. Tekan pautan dalam e-mel dahulu.");
  } catch (error) {
    setStatus(friendlyError(error), "error");
  } finally {
    button.disabled = false;
  }
});

byId("verify-signout").addEventListener("click", async () => {
  await signOut(auth);
  verifyView.hidden = true;
  formsView.hidden = false;
  showForm("login");
});

onAuthStateChanged(auth, (user) => {
  if (isAllowedUser(user)) {
    window.location.replace("/");
    return;
  }
  if (user) showVerification(user);
  else if (new URLSearchParams(location.search).get("mode") === "register") showForm("register");
});
