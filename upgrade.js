(() => {
  const calendarIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 9h17M8 13h2M14 13h2M8 17h2M14 17h2"/></svg>';
  const bruneiDate = new Intl.DateTimeFormat("ms-BN", {
    timeZone: "Asia/Brunei",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  };

  const activeItem = (item) => {
    if (item.status && item.status !== "active") return false;
    const expiry = item.expiresAt ? parseDate(item.expiresAt) : null;
    return !expiry || expiry.getTime() >= Date.now();
  };

  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char === '"') {
        if (quoted && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(field.trim());
        field = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        field = "";
      } else field += char;
    }
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
    const [headers = [], ...records] = rows;
    return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
  };

  const loadContent = async () => {
    const fallback = {
      importantDates: [...(HUB_CONFIG.importantDates || [])],
      announcements: [...(HUB_CONFIG.announcements || [])]
    };
    const feedUrl = safeUrl(HUB_CONFIG.contentFeedUrl);
    if (!feedUrl) return fallback;
    try {
      const response = await fetch(feedUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Feed unavailable");
      const rows = parseCsv(await response.text());
      const importantDates = rows.filter((item) => item.type === "date");
      const announcements = rows.filter((item) => item.type === "announcement");
      return {
        importantDates: importantDates.length ? importantDates : fallback.importantDates,
        announcements: announcements.length ? announcements : fallback.announcements
      };
    } catch {
      return fallback;
    }
  };

  const renderDates = (items) => {
    const container = document.getElementById("important-dates-grid");
    container.replaceChildren();
    const upcoming = items
      .filter(activeItem)
      .map((item) => ({ ...item, parsedDate: parseDate(item.date) }))
      .filter((item) => item.parsedDate && item.parsedDate.getTime() >= Date.now())
      .sort((left, right) => left.parsedDate - right.parsedDate);
    if (!upcoming.length) {
      const empty = document.createElement("p");
      empty.className = "content-empty";
      empty.textContent = "Tiada tarikh penting yang aktif pada masa ini.";
      container.append(empty);
      return;
    }
    upcoming.forEach((item) => {
      const card = document.createElement("article");
      card.className = "important-date-card";
      const top = document.createElement("div");
      top.className = "card-top";
      const icon = document.createElement("span");
      icon.className = "icon-wrap";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = calendarIcon;
      top.append(icon);
      const title = document.createElement("h3");
      title.textContent = item.title;
      const deadline = document.createElement("div");
      deadline.className = "important-date-deadline";
      const label = document.createElement("p");
      label.className = "important-date-label";
      label.textContent = item.label || "Tarikh";
      const value = document.createElement("p");
      value.className = "important-date-value";
      const time = document.createElement("time");
      time.dateTime = item.date;
      time.textContent = bruneiDate.format(item.parsedDate);
      value.append(time);
      deadline.append(label, value);
      card.append(top, title, deadline);
      container.append(card);
    });
  };

  const renderAnnouncements = (items) => {
    const container = document.getElementById("announcements-list");
    container.replaceChildren();
    const visible = items.filter(activeItem).sort((left, right) => (parseDate(right.date)?.getTime() || 0) - (parseDate(left.date)?.getTime() || 0));
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "content-empty";
      empty.textContent = "Tiada pengumuman baharu pada masa ini.";
      container.append(empty);
      return;
    }
    visible.forEach((item) => {
      const card = document.createElement("article");
      card.className = "announcement-card";
      const meta = document.createElement("p");
      meta.className = "announcement-date";
      const date = parseDate(item.date);
      meta.textContent = date ? bruneiDate.format(date) : "Makluman";
      const title = document.createElement("h3");
      title.textContent = item.title;
      const summary = document.createElement("p");
      summary.textContent = item.summary;
      card.append(meta, title, summary);
      const url = safeUrl(item.link);
      if (url) {
        const link = document.createElement("a");
        link.className = "announcement-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.linkLabel || "Baca selanjutnya";
        card.append(link);
      }
      container.append(card);
    });
  };

  const showToast = (message) => {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 4200);
  };

  const copyIssueDetails = async () => {
    const details = [
      "Laporan pautan Teacher's Hub",
      `Halaman: ${location.href}`,
      `Masa: ${new Date().toLocaleString("ms-BN", { timeZone: "Asia/Brunei" })}`,
      `Peranti: ${navigator.userAgent}`,
      "Pautan/masalah: "
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      showToast("Butiran masalah disalin. Hantar melalui saluran rasmi Institut.");
    } catch {
      window.prompt("Salin butiran ini dan hantar melalui saluran rasmi Institut:", details);
    }
  };

  document.getElementById("report-issue")?.addEventListener("click", copyIssueDetails);

  let installPrompt;
  const installButton = document.getElementById("install-app");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton?.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = undefined;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => showToast("Teacher's Hub sudah dipasang pada peranti biskita."));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js"));
  }

  loadContent().then(({ importantDates, announcements }) => {
    renderDates(importantDates);
    renderAnnouncements(announcements);
  });
})();

