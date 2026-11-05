// One email request at a time; the cooldown starts when Firebase accepts it.
export function createVerificationSender({ send, now = Date.now, readSentAt = () => 0, writeSentAt = () => {}, onChange = () => {}, cooldownMs = 30000 }) {
  let sending = false;
  const sentTimes = new Map();

  function state(user) {
    const uid = user?.uid;
    const stored = uid ? Number(readSentAt(uid)) : 0;
    const lastSentAt = Math.max(sentTimes.get(uid) || 0, Number.isFinite(stored) && stored <= now() ? stored : 0);
    return { sending, lastSentAt, remainingMs: lastSentAt ? Math.max(0, lastSentAt + cooldownMs - now()) : 0 };
  }

  async function request(user) {
    const current = state(user);
    if (sending) return { sent: false, reason: "sending" };
    if (current.remainingMs > 0) return { sent: false, reason: "cooldown" };
    sending = true;
    onChange();
    try {
      await send(user);
      const sentAt = now();
      sentTimes.set(user.uid, sentAt);
      writeSentAt(user.uid, sentAt);
      return { sent: true, sentAt };
    } finally {
      sending = false;
      onChange();
    }
  }

  return { state, request };
}
