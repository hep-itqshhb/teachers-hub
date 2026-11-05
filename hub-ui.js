(() => {
  const loader = () => {
    const mark = document.createElement("span");
    mark.className = "hub-loader";
    mark.setAttribute("aria-hidden", "true");
    const letter = document.createElement("span");
    letter.className = "hub-loader-mark";
    letter.textContent = "T";
    mark.append(letter);
    return mark;
  };
  window.hubUI = { loader };

  // Observe existing request states; this never starts or delays a request.
  const decorate = () => {
    document.querySelectorAll("button[aria-busy]").forEach((button) => {
      if (button.getAttribute("aria-busy") === "true") {
        if (!button.querySelector(".hub-loader")) button.prepend(loader());
      } else button.querySelector(".hub-loader")?.remove();
    });
    document.querySelectorAll(".content-loading").forEach((line) => {
      if (!line.querySelector(".hub-loader")) {
        line.classList.add("hub-loading-line");
        line.prepend(loader());
      }
    });
  };
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; decorate(); });
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
  decorate();

  const shortcuts = [...document.querySelectorAll(".section-shortcuts a")];
  if (shortcuts.length && "IntersectionObserver" in window) {
    const observed = new Map();
    const navigation = new IntersectionObserver((entries) => {
      entries.forEach((entry) => observed.set(entry.target.id, entry.isIntersecting));
      const current = shortcuts.find((link) => observed.get(link.hash.slice(1)));
      shortcuts.forEach((link) => {
        if (link === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-100px 0px -45% 0px" });
    shortcuts.forEach((link) => {
      const target = document.querySelector(link.hash);
      if (target) navigation.observe(target);
    });
  }
})();
