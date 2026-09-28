(() => {
  "use strict";
  const content = window.VideoPhysEditContent;
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".site-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const dropdown = document.querySelector(".nav-dropdown");

  const placeholder = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "placeholder-content";
    wrapper.innerHTML = '<svg viewBox="0 0 36 36" fill="none" stroke-width="1.3" aria-hidden="true"><rect x="4" y="7" width="28" height="22" rx="3"/><path d="M10 7v22M26 7v22M4 13h6M4 23h6M26 13h6M26 23h6"/><path d="m16 14 6 4-6 4z"/></svg>';
    const label = document.createElement("span");
    label.textContent = "Video coming soon";
    wrapper.append(label);
    return wrapper;
  };

  function renderMedia(container, path) {
    container.querySelectorAll("video").forEach(video => video.pause());
    container.replaceChildren();
    if (!path) {
      container.append(placeholder());
      return;
    }
    const video = document.createElement("video");
    video.src = path;
    video.controls = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", container.getAttribute("aria-label").replace(" placeholder", ""));
    container.append(video);
  }

  document.querySelectorAll("[data-media]").forEach(slot => {
    const path = slot.dataset.media.split(".").reduce((value, key) => value?.[key], content);
    renderMedia(slot, path);
  });

  for (const key of ["paper", "arxiv"]) {
    if (!content[key]) continue;
    const current = document.querySelector(`[data-resource="${key}"]`);
    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = content[key];
    link.dataset.resource = key;
    link.innerHTML = current.innerHTML;
    link.querySelector("small")?.remove();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    current.replaceWith(link);
  }
  if (content.authors.length) {
    const authors = document.querySelector("#authors");
    authors.hidden = false;
    content.authors.forEach(author => {
      const element = document.createElement(author.url ? "a" : "span");
      element.textContent = author.name;
      if (author.url) { element.href = author.url; element.target = "_blank"; element.rel = "noopener noreferrer"; }
      if (author.affiliation) { const mark = document.createElement("sup"); mark.textContent = author.affiliation; element.append(mark); }
      authors.append(element);
    });
  }
  if (content.affiliations.length) {
    const affiliations = document.querySelector("#affiliations");
    affiliations.hidden = false;
    affiliations.textContent = content.affiliations.join(" · ");
  }

  document.querySelectorAll("[data-comparison]").forEach(grid => {
    if (["synthetic", "real", "removal"].includes(grid.dataset.comparison)) return;
    content.comparisons[grid.dataset.comparison].forEach(method => {
      const figure = document.createElement("figure");
      figure.className = "media-column" + (method.role ? ` is-${method.role}` : "");
      const caption = document.createElement("figcaption");
      caption.textContent = method.name;
      const slot = document.createElement("div");
      slot.className = "media-slot";
      slot.setAttribute("aria-label", `${method.name} video placeholder`);
      renderMedia(slot, method.video);
      figure.append(caption, slot);
      grid.append(figure);
    });
  });

  function closeMenu() {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    closeMenu();
    dropdown.open = false;
  }));
  document.addEventListener("click", event => {
    if (!dropdown.contains(event.target)) dropdown.open = false;
    if (!header.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeMenu(); dropdown.open = false; }
  });
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      nav.querySelectorAll("a").forEach(link => {
        if (link.hash === `#${visible.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
  }

  if (content.bibtex) {
    document.querySelector("#citation-pending").hidden = true;
    const code = document.querySelector("#citation-code");
    code.hidden = false;
    code.querySelector("code").textContent = content.bibtex;
    const copy = document.querySelector("#copy-citation");
    copy.disabled = false;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(content.bibtex);
        document.querySelector("#copy-status").textContent = "Citation copied.";
        copy.textContent = "Copied";
        setTimeout(() => { copy.textContent = "Copy"; }, 1800);
      } catch {
        document.querySelector("#copy-status").textContent = "Please select and copy the citation below.";
      }
    });
  }
})();
