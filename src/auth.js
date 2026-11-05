import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
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
import { createVerificationSender } from "./verification-state.mjs";

const auth = getAuth(app);
auth.useDeviceLanguage();
const byId = (id) => document.getElementById(id);
const formsView = byId("auth-forms");
const verifyView = byId("verify-view");
const loginForm = byId("login-form");
const registerForm = byId("register-form");
const status = byId("auth-status");
let initialVerificationPending = false;
let checkingVerification = false;
let registrationInProgress = false;
let lastVerificationCheck = 0;
const resendButton = byId("resend-verification");
const sentTimeLabel = new Intl.DateTimeFormat("ms-BN", {
  timeZone: "Asia/Brunei", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});
const verificationSender = createVerificationSender({
  now: () => Date.now(),
  send: (user) => sendEmailVerification(user, {
    url: "https://teachershub-itq.web.app/auth.html?verified=1",
    handleCodeInApp: false
  }),
  readSentAt: (uid) => {
    try { return Number(sessionStorage.getItem(`hub-verification:${uid}`)) || 0; } catch { return 0; }
  },
  writeSentAt: (uid, sentAt) => {
    try { sessionStorage.setItem(`hub-verification:${uid}`, String(sentAt)); } catch { /* Storage can be unavailable in private browsing. */ }
  },
  onChange: updateResendButton
});

function updateResendButton() {
  const { sending, remainingMs } = verificationSender.state(auth.currentUser);
  resendButton.disabled = sending || initialVerificationPending || remainingMs > 0;
  resendButton.textContent = sending || initialVerificationPending
    ? "Sedang meminta e-mel…"
    : remainingMs > 0 ? `Hantar semula dalam ${Math.ceil(remainingMs / 1000)}s` : "Hantar semula e-mel";
}

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
    "auth/network-request-failed": "Sambungan internet terputus. Sila cuba lagi.",
    "auth/too-many-requests": "Terlalu banyak percubaan. Cuba lagi kemudian.",
    "auth/quota-exceeded": "Had penghantaran e-mel Firebase sudah dicapai. Sila cuba lagi kemudian.",
    "auth/unauthorized-continue-uri": "Pautan pengesahan belum dibenarkan dalam tetapan Firebase. Hubungi admin.",
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
  updateResendButton();
}

async function sendVerification(user, isResend = false) {
  const current = verificationSender.state(user);
  if (current.sending) return;
  if (current.remainingMs > 0) {
    if (isResend) setStatus(`Tunggu ${Math.ceil(current.remainingMs / 1000)} saat sebelum menghantar semula.`);
    return;
  }
  setStatus("Akaun siap. Sedang meminta e-mel pengesahan…");
  const slowMessage = window.setTimeout(() => {
    setStatus("Permintaan e-mel masih diproses. Sila tunggu; tidak perlu menekan hantar semula.");
  }, 8000);
  try {
    const result = await verificationSender.request(user);
    if (result.sent) {
      setStatus(`Permintaan e-mel diterima pada ${sentTimeLabel.format(new Date(result.sentAt))} (Brunei). Semak Inbox dan Junk/Spam. Pengesahan akan diperiksa secara automatik.`, "success");
    }
  } finally {
    window.clearTimeout(slowMessage);
  }
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
  if (registrationInProgress) return;
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
  registrationInProgress = true;
  initialVerificationPending = true;
  submit.disabled = true;
  setStatus("Sedang menyediakan akaun…");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    showVerification(credential.user);
    let verificationFailed = false;
    try {
      await sendVerification(credential.user);
    } catch (error) {
      verificationFailed = true;
      setStatus(`E-mel belum dapat dihantar: ${friendlyError(error)} Cuba tekan “Hantar semula e-mel”.`, "error");
    } finally {
      initialVerificationPending = false;
      updateResendButton();
    }

    try {
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, "profiles", credential.user.uid), {
        uid: credential.user.uid,
        displayName: name,
        phone,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      // A profile write must never prevent the verification email from being sent.
      console.error("Unable to save the teacher profile", error);
      if (!verificationFailed) {
        setStatus("Permintaan e-mel pengesahan berjaya, tetapi profil belum dapat disimpan. Sila hubungi pentadbir selepas mengesahkan e-mel.", "error");
      }
    }
  } catch (error) {
    setStatus(auth.currentUser?.email === email
      ? `Akaun sudah dibuat, tetapi pendaftaran belum selesai: ${friendlyError(error)} Cuba tekan “Hantar semula e-mel”.`
      : friendlyError(error), "error");
  } finally {
    registrationInProgress = false;
    initialVerificationPending = false;
    submit.disabled = false;
    updateResendButton();
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
  if (initialVerificationPending || verificationSender.state(auth.currentUser).sending) return;
  try {
    if (auth.currentUser) await sendVerification(auth.currentUser, true);
    else setStatus("Sesi sudah tamat. Log masuk semula untuk meminta e-mel pengesahan.", "error");
  } catch (error) {
    setStatus(`E-mel belum dapat dihantar: ${friendlyError(error)}`, "error");
  } finally {
    updateResendButton();
  }
});

async function checkVerification(manual = false) {
  if (checkingVerification || verificationSender.state(auth.currentUser).sending || initialVerificationPending) return;
  if (!auth.currentUser) {
    if (manual) setStatus("Sesi sudah tamat. Log masuk semula untuk menyemak pengesahan.", "error");
    return;
  }
  checkingVerification = true;
  lastVerificationCheck = Date.now();
  const button = byId("check-verification");
  button.disabled = true;
  if (manual) setStatus("Memeriksa pengesahan…");
  try {
    const user = auth.currentUser;
    await reload(user);
    // Refresh the verified claim before the portal reads protected Firestore data.
    if (auth.currentUser?.uid === user.uid && isAllowedUser(user)) {
      await getIdToken(user, true);
      window.location.replace("/");
    } else if (manual) setStatus("E-mel belum disahkan. Tekan pautan dalam e-mel dahulu.");
  } catch (error) {
    if (manual) setStatus(friendlyError(error), "error");
  } finally {
    checkingVerification = false;
    button.disabled = false;
  }
}

byId("check-verification").addEventListener("click", () => checkVerification(true));

const checkWhenVisible = () => {
  if (!document.hidden && !verifyView.hidden && Date.now() - lastVerificationCheck >= 5000) checkVerification();
};
window.setInterval(() => {
  if (!document.hidden && !verifyView.hidden) updateResendButton();
}, 1000);
window.setInterval(checkWhenVisible, 5000);
window.addEventListener("focus", checkWhenVisible);
document.addEventListener("visibilitychange", checkWhenVisible);

byId("verify-signout").addEventListener("click", async () => {
  await signOut(auth);
  verifyView.hidden = true;
  formsView.hidden = false;
  showForm("login");
});

onAuthStateChanged(auth, (user) => {
  if (isAllowedUser(user) && !checkingVerification) {
    window.location.replace("/");
    return;
  }
  if (user) showVerification(user);
  else if (new URLSearchParams(location.search).get("mode") === "register") showForm("register");
});
