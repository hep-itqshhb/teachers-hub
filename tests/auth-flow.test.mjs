import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createVerificationSender } from "../src/verification-state.mjs";
import { harness } from "./helpers/auth-harness.cjs";

const authSource = fileURLToPath(new URL("../src/auth.js", import.meta.url));
const setup = (extra = {}) => harness(authSource, { createVerificationSender, ...extra });

test("registration and resend cannot issue overlapping verification requests", async () => {
  const h = setup();
  const register = h.submit();
  await h.tick();
  assert.equal(h.calls.send, 1);
  assert.equal(h.get("resend-verification").disabled, true);
  await h.click("resend-verification");
  await h.submit();
  assert.equal(h.calls.create, 1);
  assert.equal(h.calls.send, 1);
  h.pending[0].resolve();
  await register;
  assert.match(h.get("auth-status").textContent, /Permintaan e-mel diterima pada/);
  assert.equal(h.get("resend-verification").disabled, true);
  assert.match(h.get("resend-verification").textContent, /30s/);
});

test("cooldown starts at acceptance, survives sender recreation and is scoped to account", async () => {
  let now = 100000;
  const storage = new Map();
  let sends = 0;
  let complete;
  const config = {
    now: () => now,
    send: async () => { sends++; await new Promise(resolve => { complete = resolve; }); },
    readSentAt: uid => storage.get(uid) || 0,
    writeSentAt: (uid, at) => storage.set(uid, at)
  };
  const first = createVerificationSender(config);
  const pending = first.request({ uid: "a" });
  assert.deepEqual(await first.request({ uid: "a" }), { sent: false, reason: "sending" });
  now += 20000; // Slow first request must not consume the resend cooldown.
  complete();
  await pending;
  const restored = createVerificationSender(config);
  assert.equal(restored.state({ uid: "a" }).remainingMs, 30000);
  assert.equal(restored.state({ uid: "b" }).remainingMs, 0);
  assert.deepEqual(await restored.request({ uid: "a" }), { sent: false, reason: "cooldown" });
  assert.equal(sends, 1);
});

test("failed requests release the lock and leave a retry available", async () => {
  const h = setup();
  const register = h.submit();
  await h.tick();
  h.pending[0].reject({ code: "auth/network-request-failed" });
  await register;
  assert.equal(h.get("resend-verification").disabled, false);
  assert.match(h.get("auth-status").textContent, /E-mel belum dapat dihantar/);
  const resend = h.click("resend-verification");
  await h.tick();
  assert.equal(h.calls.send, 2);
  h.pending[1].resolve();
  await resend;
});

test("resend becomes available after the countdown and sends once", async () => {
  const h = setup();
  const register = h.submit();
  await h.tick();
  h.pending[0].resolve();
  await register;
  h.advance(30000);
  for (const timer of h.timers.values()) if (timer.ms === 1000) timer.fn();
  assert.equal(h.get("resend-verification").disabled, false);
  const resend = h.click("resend-verification");
  await h.tick();
  assert.equal(h.calls.send, 2);
  await h.click("resend-verification");
  assert.equal(h.calls.send, 2);
  h.pending[1].resolve();
  await resend;
});

test("profile failures never prevent the verification request", async () => {
  const h = setup({ profileError: true });
  const register = h.submit();
  await h.tick();
  assert.equal(h.calls.profile, 0);
  assert.equal(h.calls.send, 1);
  h.pending[0].resolve();
  await register;
  assert.equal(h.calls.profile, 1);
});

test("focus checks verification and refreshes the claim before entering the portal", async () => {
  const h = setup();
  const register = h.submit();
  await h.tick();
  h.pending[0].resolve();
  await register;
  h.user.emailVerified = true;
  h.advance(5000);
  h.documentListeners.focus();
  await h.tick();
  assert.equal(h.calls.reload, 1);
  assert.equal(h.calls.tokens, 1);
  assert.deepEqual(h.redirects, ["/"]);
});

test("hidden pages do not poll or overwrite the email confirmation message", async () => {
  const h = setup();
  const register = h.submit();
  await h.tick();
  h.pending[0].resolve();
  await register;
  const message = h.get("auth-status").textContent;
  h.context.document.hidden = true;
  h.advance(10000);
  for (const timer of h.timers.values()) if (timer.ms === 5000) timer.fn();
  await h.tick();
  assert.equal(h.calls.reload, 0);
  assert.equal(h.get("auth-status").textContent, message);
});
