(() => {
  "use strict";
  const content = window.VideoPhysEditContent;
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".site-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const dropdown = document.querySelector(".nav-dropdown");

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
    nav.querySelectorAll('a[href^="#"]').forEach(link => {
      const target = document.getElementById(link.hash.slice(1));
      if (target) observer.observe(target);
    });
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
