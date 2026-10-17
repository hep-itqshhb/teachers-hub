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
      return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  };

  const footerBpp = document.querySelector("[data-footer-bpp]");
  const recordClick = (service) => {
    window.hubContentStore?.recordClick(service)?.catch(() => {});
  };

  const renderServices = (savedLinks = {}) => {
    document.querySelectorAll("[data-service]").forEach((card) => {
      const service = card.dataset.service;
      const slot = card.querySelector("[data-action]");
      const fallback = HUB_CONFIG?.serviceStatus?.[service] || { status: "active", note: "" };
      const setting = savedLinks[service] || { url: HUB_CONFIG?.links?.[service] || "", ...fallback };
      const stateName = ["active", "maintenance", "closed"].includes(setting.status) ? setting.status : "closed";
      card.querySelector(".service-meta")?.remove();
      slot.replaceChildren();

      const status = document.createElement("div");
      status.className = `service-meta service-meta--${stateName}`;
      const badge = document.createElement("span");
      badge.className = "service-status";
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      badge.append(dot, document.createTextNode(stateName === "maintenance" ? "Penyelenggaraan" : stateName === "closed" ? "Ditutup" : "Aktif"));
      status.append(badge);
      if (setting.note) {
        const note = document.createElement("span");
        note.className = "service-note";
        note.textContent = setting.note;
        status.append(note);
      }
      card.insertBefore(status, slot);

      const url = stateName === "active" ? safeExternalUrl(setting.url) : null;
      if (url) {
        const link = document.createElement("a");
        link.className = "card-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `${labels[service]} (dibuka pada tab baharu)`);
        link.innerHTML = `Buka Pautan ${actionIcons.external}`;
        link.addEventListener("click", () => recordClick(service));
        slot.append(link);
        return;
      }

      const state = document.createElement("span");
      state.className = "unavailable";
      const unavailableLabel = stateName === "maintenance" ? "Pautan sedang diselenggara" : stateName === "closed" ? "Pautan ditutup" : "Pautan belum tersedia";
      state.setAttribute("aria-label", unavailableLabel);
      state.innerHTML = `${actionIcons.unavailable}<span>${unavailableLabel}</span>`;
      slot.append(state);
    });

    const bpp = savedLinks.bpp || { url: HUB_CONFIG?.links?.bpp || "", ...(HUB_CONFIG?.serviceStatus?.bpp || { status: "active" }) };
    const bppUrl = bpp.status === "active" ? safeExternalUrl(bpp.url) : null;
    if (bppUrl) {
      footerBpp.href = bppUrl;
      footerBpp.hidden = false;
    } else {
      footerBpp.removeAttribute("href");
      footerBpp.hidden = true;
    }
  };

  document.querySelectorAll("[data-action]").forEach((slot) => {
    const loading = document.createElement("span");
    loading.className = "unavailable";
    loading.textContent = "Memuatkan pautan…";
    slot.append(loading);
  });
  footerBpp.addEventListener("click", () => recordClick("bpp"));
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const savedLinks = await window.hubContentStore?.loadLinks();
      renderServices(savedLinks || {});
    } catch {
      // Keep the bundled links available if Firestore is temporarily unreachable.
      renderServices();
    }
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();
  document.title = `${HUB_CONFIG.siteName.replace(/^ITQSHHB\s+/, "")} | ITQSHHB`;
})();

