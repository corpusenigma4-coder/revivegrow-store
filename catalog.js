/* =============================================================
   MINI DREAMS — HOME (catalog.js)
   Catálogo en 3 secciones: Todo | Halloween | Navidad.
   "Todo" es el filtro por defecto (muestra todos los productos).
   Las tarjetas enlazan a la página individual del producto.
   ============================================================= */
(function () {
  "use strict";
  var MD = window.MD; if (!MD) return;
  var $ = MD.$, $$ = MD.$$, esc = MD.esc;

  /* Secciones del catálogo. "todo" es un filtro, no una categoría. */
  var SECTIONS = [{ id: "todo", name: "Todo" }].concat(
    (MD.COLLECTIONS || []).map(function (c) { return { id: c.id, name: c.name }; })
  );

  var activeSection = "todo";   // seleccionada por defecto
  var searchTerm = "";

  /* Acento visual sutil por sección (conserva la identidad premium). */
  var SECTION_ACCENT = {
    todo:      { ink: "var(--c-accent-ink)", soft: "var(--c-pink-soft)" },
    halloween: { ink: "#b5600f",             soft: "var(--c-butter-soft)" },  /* naranja cálido + crema */
    navidad:   { ink: "#9c2b33",             soft: "#F6E2E0" }                 /* rojo cálido + crema */
  };

  /* ----- Tarjetas de colección en la home (Halloween / Navidad) ----- */
  var COLL_THEME = {
    halloween: { bg: "var(--c-butter-soft)",   dot: "rgba(255,217,116,.5)",  ink: "#9a7210" },
    navidad:   { bg: "#F6E2E0",                dot: "rgba(156,43,51,.18)",   ink: "#9c2b33" }
  };

  function collIcon(id) {
    if (id === "navidad") {
      // arbolito
      return '<svg class="cat__ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3l5 7h-3l4 6H7l4-6H8z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 16v5"/></svg>';
    }
    // calabaza / Halloween
    return '<svg class="cat__ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 6c4 0 7 3 7 7s-3 5-7 5-7-2-7-5 3-7 7-7z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 6V3"/></svg>';
  }

  function renderCollectionCards() {
    var grid = $("#catGrid"); if (!grid) return;
    grid.innerHTML = (MD.COLLECTIONS || []).map(function (c) {
      var t = COLL_THEME[c.id] || { bg: "var(--c-pink-soft)", dot: "rgba(255,255,255,.5)", ink: "var(--c-accent-ink)" };
      var style = "--cat-bg:" + t.bg + ";--cat-dot:" + t.dot + ";--cat-ink:" + t.ink;
      var count = MD.productsInCollection(c.id).length;
      var meta = count > 0 ? (count + (count === 1 ? " producto" : " productos")) : "Próximamente";
      return '<button class="cat" data-section="' + c.id + '" style="' + style + '">' +
        collIcon(c.id) +
        '<span class="cat__name">' + esc(c.name) + '</span>' +
        '<span class="cat__blurb">' + esc(c.blurb) + '</span>' +
        '<span class="cat__go">' + esc(meta) + ' <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '</button>';
    }).join("");
    $$(".cat", grid).forEach(function (b) {
      b.addEventListener("click", function () { goToSection(b.getAttribute("data-section")); });
    });
  }

  /* ----- Barra de 3 secciones (Todo | Halloween | Navidad) ----- */
  function renderSectionBar() {
    var wrap = $("#filters"); if (!wrap) return;
    wrap.innerHTML = SECTIONS.map(function (s) {
      var on = s.id === activeSection;
      return '<button class="seg' + (on ? " is-active" : "") + '" role="tab" aria-selected="' + on + '" data-section="' + s.id + '">' + esc(s.name) + '</button>';
    }).join("");
    $$(".seg", wrap).forEach(function (b) { b.addEventListener("click", function () { setSection(b.getAttribute("data-section")); }); });
  }

  function setSection(id) {
    activeSection = id;
    $$(".seg").forEach(function (b) {
      var on = b.getAttribute("data-section") === id;
      b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on));
    });
    // Acento sutil del catálogo según sección
    var a = SECTION_ACCENT[id] || SECTION_ACCENT.todo;
    var sec = $("#catalogo");
    if (sec) { sec.style.setProperty("--sec-ink", a.ink); sec.style.setProperty("--sec-soft", a.soft); }
    renderProducts();
  }

  function goToSection(id) {
    setSection(id);
    var c = $("#catalogo"); if (c) c.scrollIntoView({ behavior: "smooth" });
  }

  function visible() {
    return MD.PRODUCTS.filter(function (p) { if (p.published === false) return false;
      var okSec = MD.productInCollection(p, activeSection);
      var hay = (p.name + " " + (p.descShort || "") + " " + MD.catsOf(p).join(" ")).toLowerCase();
      return okSec && (!searchTerm || hay.indexOf(searchTerm) !== -1);
    });
  }

  function cardFor(p) {
    var buyable = MD.isBuyable(p);
    var href = MD.productUrl(p);
    var tag = p.tag ? '<span class="card__tag">' + esc(p.tag) + '</span>' : "";
    var badge = buyable ? "" : '<span class="card__badge">' + esc(MD.availabilityLabel(p)) + '</span>';
    var price = buyable
      ? '<span class="card__price">' + MD.fmtPrice(p) + (p.__dev ? ' <small>de prueba</small>' : '') + '</span>'
      : '<span class="card__price card__price--pending">Precio en preparación</span>';
    return '<a class="card" href="' + href + '" aria-label="Ver ' + esc(p.name) + '">' +
      '<span class="card__media' + (p.gallerySprite ? " card__media--sprite" : "") + '">' + tag + badge + MD.imgTag(p.images && p.images.main, p.name) +
        '<span class="card__shade"></span>' +
        (p.previewArt ? '<span class="card__concept">Ilustración conceptual</span>' : '') +
      '</span>' +
      '<span class="card__body">' +
        '<span class="card__name">' + esc(p.name) + '</span>' +
        price +
        '<span class="card__cta">Ver producto <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '</span>' +
    '</a>';
  }

  /* Estado vacío atractivo, con mensaje propio de cada sección. */
  function emptyState() {
    var coll = MD.getCollection(activeSection);
    var msg;
    if (searchTerm) msg = "No encontramos productos para tu búsqueda en esta sección.";
    else if (coll && coll.emptyMsg) msg = coll.emptyMsg;
    else msg = "Pronto habrá productos en esta sección.";
    return '<div class="empty-state">' +
      '<span class="empty-state__ico"><svg viewBox="0 0 24 24" width="40" height="40"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 20.5S3.5 14.8 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 5.9-8.5 11.6-8.5 11.6z"/></svg></span>' +
      '<p class="empty-state__msg">' + esc(msg) + '</p>' +
      '<button class="btn btn--ghost" id="emptyAll">Ver todo el catálogo</button>' +
    '</div>';
  }

  function renderProducts() {
    var grid = $("#productGrid"); if (!grid) return;
    var list = visible();
    var count = $("#catalogCount");
    if (count) count.textContent = list.length + (list.length === 1 ? " diseño" : " diseños") + " en esta selección";
    if (!list.length) {
      grid.classList.add("grid--empty");
      grid.innerHTML = emptyState();
      var allBtn = $("#emptyAll");
      if (allBtn) allBtn.addEventListener("click", function () { if (searchTerm && $("#searchInput")) { $("#searchInput").value = ""; searchTerm = ""; } setSection("todo"); });
      return;
    }
    grid.classList.remove("grid--empty");
    grid.innerHTML = list.map(cardFor).join("");
    grid.classList.toggle("grid--single",list.length===1);
  }

  function markNav(id) { $$(".nav a, .mobilenav a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-nav") === id); }); }

  function init() {
    MD.initChrome({ onSearch: function (term) { searchTerm = term; renderProducts(); } });
    renderCollectionCards();
    renderSectionBar();
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get("coleccion");
    setSection(SECTIONS.some(function (section) { return section.id === wanted; }) ? wanted : "todo");
    var q = params.get("q");
    if (q) { searchTerm = q.trim().toLowerCase(); if ($("#searchInput")) $("#searchInput").value = q; renderProducts(); }

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () { var nav = a.getAttribute("data-nav"); if (nav) markNav(nav); });
    });

    var map = [{ id: "top", nav: "home" }, { id: "colecciones", nav: "colecciones" }, { id: "catalogo", nav: "catalogo" }]
      .map(function (s) { return { el: document.getElementById(s.id), nav: s.nav }; }).filter(function (s) { return s.el; });
    if ("IntersectionObserver" in window && map.length) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { var m = map.filter(function (s) { return s.el === en.target; })[0]; if (m) markNav(m.nav); } });
      }, { rootMargin: "-45% 0px -50% 0px" });
      map.forEach(function (s) { io.observe(s.el); });
    }
    markNav("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
