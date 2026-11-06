(() => {
  const actionIcons = {
    external: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 3h6v6M17 3l-8 8"/><path d="M15 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>'
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
  const dialog = document.getElementById("service-dialog");
  const serviceInfo = {
    disiplin: { title: "Laporan Kes Disiplin", description: "Laporkan salah laku pelajar melalui borang ini untuk perhatian dan tindakan pihak Hal Ehwal Pelajar." },
    hafazan: { title: "Kemajuan Hafazan Al-Quran", description: "Catat perkembangan hafazan, bacaan dan perkara berkaitan Al-Quran seseorang pelajar melalui borang ini." },
    akademik: { title: "Kemajuan Akademik", description: "Sampaikan laporan tentang perkembangan, pencapaian atau keperluan sokongan akademik seseorang pelajar." },
    aktiviti: { title: "Laporan Aktiviti Pelajar", description: "Borang laporan terperinci bagi aktiviti yang dianjurkan, untuk diisi oleh Ketua Bahagian (HOD) atau penganjur aktiviti." },
    kalendar: { title: "Kalendar Aktiviti", description: "Semak kalendar aktiviti Institut dalam satu paparan." },
    bpp: { title: "Bahagian Pembangunan Pelajar", description: "Akses maklumat, aktiviti, pengumuman dan sumber rasmi Bahagian Pembangunan Pelajar." }
  };
  let settings = {};
  let activeService = null;
  let serviceTrigger = null;
  const recordClick = (service) => {
    window.hubContentStore?.recordClick(service)?.catch(() => {});
  };

  const renderServiceDialog = (service) => {
    const info = serviceInfo[service];
    const t = window.hubLanguage?.t || ((ms) => ms);
    const fallback = HUB_CONFIG?.serviceStatus?.[service] || { status: "active", note: "" };
    const setting = settings[service] || { url: HUB_CONFIG?.links?.[service] || "", ...fallback };
    const stateName = ["active", "maintenance", "closed"].includes(setting.status) ? setting.status : "closed";
    const english = {
      disiplin: ["Discipline Case Report", "Report student misconduct using this form for the attention and action of Student Affairs."],
      hafazan: ["Quran Memorisation Progress", "Record a student's Quran memorisation and recitation progress using this form."],
      akademik: ["Academic Progress", "Report a student's progress, achievement, or academic support needs."],
      aktiviti: ["Student Activity Report", "A detailed report form for activities, to be completed by the Head of Department (HOD) or activity organiser."],
      kalendar: ["Activity Calendar", "View the institute activity calendar in one place."],
      bpp: ["Student Development Division", "Access official information, activities, notices, and resources from the Student Development Division."]
    }[service];
    document.getElementById("service-dialog-title").textContent = t(info.title, english[0]);
    document.getElementById("service-dialog-description").textContent = t(info.description, english[1]);
    document.getElementById("service-dialog-icon").src = `icons/${service}.svg?v=1`;
    const meta = document.getElementById("service-dialog-meta");
    const status = document.createElement("span");
    status.className = "service-status";
    status.textContent = t(stateName === "maintenance" ? "Penyelenggaraan" : stateName === "closed" ? "Ditutup" : "Aktif", stateName === "maintenance" ? "Maintenance" : stateName === "closed" ? "Closed" : "Active");
    meta.className = `service-dialog-meta service-meta--${stateName}`;
    meta.replaceChildren(status);
    if (setting.note) {
      const note = document.createElement("span");
      note.textContent = setting.note;
      meta.append(note);
    }
    const slot = document.getElementById("service-dialog-action");
    const focusedAction = slot.contains(document.activeElement);
    slot.replaceChildren();
    const url = stateName === "active" ? safeExternalUrl(setting.url) : null;
    document.getElementById("service-new-tab-note").hidden = !url;
    if (url) {
      const link = document.createElement("a");
      link.className = "service-outbound primary-action";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${t(labels[service], { disiplin: "Open discipline case report form", hafazan: "Open Quran memorisation progress form", akademik: "Open academic progress form", aktiviti: "Open student activity report form", kalendar: "Open institute activity calendar", bpp: "Open Student Development Division website" }[service])} (${t("dibuka pada tab baharu", "opens in a new tab")})`);
      const action = t(service === "kalendar" ? "Lihat kalendar" : service === "bpp" ? "Buka laman BPP" : "Buka borang", service === "kalendar" ? "View calendar" : service === "bpp" ? "Open BPP website" : "Open form");
      link.innerHTML = `${action} ${actionIcons.external}`;
      link.addEventListener("click", () => recordClick(service));
      slot.append(link);
      if (focusedAction) link.focus();
    } else {
      const state = document.createElement("p");
      state.className = "service-unavailable";
      state.textContent = t(stateName === "maintenance" ? "Pautan sedang diselenggara." : stateName === "closed" ? "Pautan ditutup." : "Pautan belum tersedia.", stateName === "maintenance" ? "This link is under maintenance." : stateName === "closed" ? "This link is closed." : "This link is unavailable.");
      slot.append(state);
      if (focusedAction) dialog.querySelector(".service-dialog-close").focus();
    }
  };

  document.querySelectorAll("[data-service]").forEach((button) => button.addEventListener("click", () => {
    activeService = button.dataset.service;
    serviceTrigger = button;
    dialog.querySelector(".service-help").open = false;
    renderServiceDialog(activeService);
    dialog.showModal();
  }));
  document.addEventListener("hub-language-change", () => { if (dialog.open && activeService) renderServiceDialog(activeService); });
  dialog.addEventListener("close", () => {
    activeService = null;
    serviceTrigger?.focus();
  });

  const renderServices = (savedLinks = {}) => {
    settings = savedLinks;
    if (dialog.open && activeService) renderServiceDialog(activeService);

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

  renderServices();
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

