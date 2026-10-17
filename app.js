(() => {
  const actionIcons = {
    external: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 3h6v6M17 3l-8 8"/><path d="M15 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    unavailable: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4M10 13.5h.01"/></svg>'
  };

  const labels = {
    disiplin: "Buka borang laporan kes disiplin",
    hafazan: "Buka borang kemajuan hafazan Al-Quran",
    akademik: "Buka borang kemajuan akademik",
    aktiviti: "Buka borang laporan aktiviti pelajar",
    kalendar: "Buka kalendar aktiviti Institut",
    bpp: "Buka laman web Bahagian Pembangunan Pelajar"
  };

  const safeExternalUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  };

  document.querySelectorAll("[data-service]").forEach((card) => {
    const service = card.dataset.service;
    const slot = card.querySelector("[data-action]");
    const serviceState = HUB_CONFIG?.serviceStatus?.[service] || { status: "active", note: "" };
    const status = document.createElement("div");
    status.className = `service-meta service-meta--${serviceState.status}`;
    const statusLabel = serviceState.status === "maintenance" ? "Penyelenggaraan" : serviceState.status === "closed" ? "Ditutup" : "Aktif";
    status.innerHTML = `<span class="service-status"><span aria-hidden="true"></span>${statusLabel}</span>${serviceState.note ? `<span class="service-note">${serviceState.note}</span>` : ""}`;
    card.insertBefore(status, slot);

    const url = serviceState.status === "active" ? safeExternalUrl(HUB_CONFIG?.links?.[service]) : null;
    if (url) {
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${labels[service]} (dibuka pada tab baharu)`);
      link.innerHTML = `Buka Pautan ${actionIcons.external}`;
      slot.append(link);
      return;
    }

    const state = document.createElement("span");
    state.className = "unavailable";
    const unavailableLabel = serviceState.status === "maintenance" ? "Pautan sedang diselenggara" : serviceState.status === "closed" ? "Pautan ditutup" : "Pautan belum tersedia";
    state.setAttribute("aria-label", unavailableLabel);
    state.innerHTML = `${actionIcons.unavailable}<span>${unavailableLabel}</span>`;
    slot.append(state);
  });

  const footerBpp = document.querySelector("[data-footer-bpp]");
  const bppUrl = safeExternalUrl(HUB_CONFIG?.links?.bpp);
  if (bppUrl) footerBpp.href = bppUrl;
  else footerBpp.hidden = true;

  document.getElementById("current-year").textContent = new Date().getFullYear();
  document.title = `${HUB_CONFIG.siteName.replace(/^ITQSHHB\s+/, "")} | ITQSHHB`;
})();

