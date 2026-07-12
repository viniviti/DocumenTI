/* ==========================================================================
   DocumenTI — script principal
   Responsável por: montar o menu e as seções a partir de data.js,
   busca em tempo real com destaque de termo, nav ativa por scroll,
   menu mobile e botão "voltar ao topo".
   ========================================================================== */
(() => {
  "use strict";

  const navList = document.getElementById("navList");
  const root = document.getElementById("categoriesRoot");
  const searchInput = document.getElementById("searchInput");
  const heroStats = document.getElementById("heroStats");
  const emptyState = document.getElementById("resultsEmpty");
  const clearSearchBtn = document.getElementById("clearSearch");
  const navToggle = document.getElementById("navToggle");
  const navContainer = document.getElementById("navContainer");
  const backToTop = document.getElementById("backToTop");

  const TOTAL = TOOLS.length;

  /* ---------------------------------------------------------------------
     1) Monta o menu de navegação a partir de CATEGORIES
     --------------------------------------------------------------------- */
  const navFragment = document.createDocumentFragment();
  CATEGORIES.forEach((cat) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${cat.id}`;
    a.className = "nav-link";
    a.dataset.cat = cat.id;
    a.style.setProperty("--nav-dot", cat.color);
    a.innerHTML = `<span class="nav-dot" style="color:${cat.color}"></span>${cat.label}`;
    li.appendChild(a);
    navFragment.appendChild(li);
  });
  navList.appendChild(navFragment);

  /* ---------------------------------------------------------------------
     2) Monta as seções + cards a partir de TOOLS, agrupados por categoria
     --------------------------------------------------------------------- */
  function buildSections() {
    const sectionsFragment = document.createDocumentFragment();

    CATEGORIES.forEach((cat) => {
      const items = TOOLS.filter((t) => t.cat === cat.id);
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "category-section";
      section.id = cat.id;
      section.style.setProperty("--cat-color", cat.color);

      const heading = document.createElement("div");
      heading.className = "category-heading";
      heading.innerHTML = `
        <h2><span class="category-dot" style="--cat-color:${cat.color}"></span>${cat.label}</h2>
        <span class="category-count">${items.length} itens</span>
        <span class="category-line"></span>
      `;

      const grid = document.createElement("div");
      grid.className = "grid";

      items.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "card";
        card.style.setProperty("--cat-color", cat.color);
        card.style.animationDelay = `${Math.min(index, 10) * 0.03}s`;
        card.dataset.name = item.name.toLowerCase();
        card.dataset.desc = item.desc.toLowerCase();

        const h3 = document.createElement("h3");
        h3.className = "card-name";
        h3.textContent = item.name;

        const p = document.createElement("p");
        p.className = "card-desc";
        p.textContent = item.desc;

        const link = document.createElement("a");
        link.className = "card-link";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Ver documentação";
        link.setAttribute("aria-label", `Abrir documentação oficial de ${item.name}`);

        card.append(h3, p, link);
        grid.appendChild(card);
      });

      section.append(heading, grid);
      sectionsFragment.appendChild(section);
    });

    root.appendChild(sectionsFragment);
  }

  buildSections();
  heroStats.textContent = `${TOTAL} tecnologias catalogadas em ${CATEGORIES.length} categorias`;

  /* ---------------------------------------------------------------------
     3) Busca em tempo real (nome + descrição), com destaque do termo
     --------------------------------------------------------------------- */
  const allCards = Array.from(document.querySelectorAll(".card"));
  const allSections = Array.from(document.querySelectorAll(".category-section"));

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(el, term) {
    const original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    if (!term) {
      el.textContent = original;
      return;
    }
    const re = new RegExp(`(${escapeRegExp(term)})`, "ig");
    el.innerHTML = original.replace(re, "<mark>$1</mark>");
  }

  let debounceId;
  function runSearch() {
    const term = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    allCards.forEach((card) => {
      const matches = !term || card.dataset.name.includes(term) || card.dataset.desc.includes(term);
      card.hidden = !matches;
      if (matches) visibleCount++;

      const nameEl = card.querySelector(".card-name");
      const descEl = card.querySelector(".card-desc");
      highlight(nameEl, term);
      highlight(descEl, term);
    });

    allSections.forEach((section) => {
      const visibleInSection = section.querySelectorAll(".card:not([hidden])").length;
      section.hidden = visibleInSection === 0;
      const count = section.querySelector(".category-count");
      if (count) {
        count.textContent = term ? `${visibleInSection} de ${section.querySelectorAll(".card").length}` : `${section.querySelectorAll(".card").length} itens`;
      }
    });

    emptyState.hidden = visibleCount !== 0;
    heroStats.textContent = term
      ? `${visibleCount} resultado${visibleCount === 1 ? "" : "s"} para "${searchInput.value.trim()}"`
      : `${TOTAL} tecnologias catalogadas em ${CATEGORIES.length} categorias`;
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(runSearch, 120);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    runSearch();
    searchInput.focus();
  });

  /* ---------------------------------------------------------------------
     4) Menu dropdown inteligente (um único botão, serve desktop e mobile)
     --------------------------------------------------------------------- */
  function closeNav() {
    navContainer.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function openNav() {
    navContainer.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
  }

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navContainer.classList.contains("is-open");
    if (isOpen) closeNav(); else openNav();
  });

  // Scroll suave até a seção, compensando a altura do header fixo
  function smoothScrollTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    const headerOffset = document.querySelector(".site-header").offsetHeight + 18;
    const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  navList.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (!link) return;
    e.preventDefault();
    smoothScrollTo(link.getAttribute("href"));
    closeNav();
  });

  document.addEventListener("click", (e) => {
    if (!navContainer.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  const brandLink = document.querySelector(".brand");
  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
     5) Nav ativa conforme scroll (IntersectionObserver)
     --------------------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.cat === id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  allSections.forEach((section) => observer.observe(section));

  /* ---------------------------------------------------------------------
     6) Botão "voltar ao topo"
     --------------------------------------------------------------------- */
  window.addEventListener(
    "scroll",
    () => {
      backToTop.hidden = window.scrollY < 600;
    },
    { passive: true }
  );

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
