(() => {
  const site = HUB_CONFIG?.analytics?.goatcounterSite?.trim();
  const note = document.getElementById("visitor-note");
  const outputs = { today: document.querySelector('[data-visitor-count="today"]'), total: document.querySelector('[data-visitor-count="total"]') };
  if (!site) return;
  let base;
  try { base = new URL(site); if (base.protocol !== "https:") throw new Error("HTTPS required"); }
  catch { note.textContent = "Tetapan kaunter pelawat belum sah."; return; }
  note.textContent = "Angka lawatan dikemas kini secara berkala.";
  const tracker = document.createElement("script"); tracker.src = "https://gc.zgo.at/count.js"; tracker.async = true; tracker.dataset.goatcounter = base.origin + "/count"; document.head.append(tracker);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Brunei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (name) => parts.find((item) => item.type === name)?.value;
  const today = part("year") + "-" + part("month") + "-" + part("day");
  const countUrl = (start, end) => { const url = new URL("/counter/%2F.json", base.origin); if (start) url.searchParams.set("start", start); if (end) url.searchParams.set("end", end); return url; };
  const loadCount = async (key, url) => { try { const response = await fetch(url); if (!response.ok) throw new Error("Counter unavailable"); const data = await response.json(); if (typeof data.count !== "string" && typeof data.count !== "number") throw new Error("Invalid count"); outputs[key].textContent = data.count; } catch { outputs[key].textContent = "—"; note.textContent = "Statistik pelawat belum dapat dimuatkan."; } };
  loadCount("today", countUrl(today, today)); loadCount("total", countUrl());
})();
