/* =============================================================
   MINI DREAMS — HOME (catalog.js)
   Categorías, filtros, búsqueda y grid de tarjetas. Las tarjetas
   enlazan a la página individual del producto (producto.html).
   ============================================================= */
(function () {
  "use strict";
  var MD = window.MD; if (!MD) return;
  var $ = MD.$, $$ = MD.$$, esc = MD.esc;

  var activeFilter = "all";
  var searchTerm = "";

  function catIcon() {
    return '<svg class="cat__ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20.5S3.5 14.8 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 5.9-8.5 11.6-8.5 11.6z"/></svg>';
  }

  function renderCategories() {
    var grid = $("#catGrid"); if (!grid) return;
    grid.innerHTML = MD.CATEGORIES.map(function (c) {
      return '<button class="cat" data-cat="' + c.id + '" style="--cat-accent:' + c.accent + '">' +
        catIcon() +
        '<span class="cat__name">' + esc(c.name) + '</span>' +
        '<span class="cat__blurb">' + esc(c.blurb) + '</span>' +
        '<span class="cat__go">Ver <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '</button>';
    }).join("");
    $$(".cat", grid).forEach(function (b) {
      b.addEventListener("click", function () {
        applyFilter(b.getAttribute("data-cat"));
        var c = $("#catalogo"); if (c) c.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function renderFilters() {
    var wrap = $("#filters"); if (!wrap) return;
    var items = [{ id: "all", name: "Todos" }].concat(MD.CATEGORIES.map(function (c) { return { id: c.id, name: c.name }; }));
    wrap.innerHTML = items.map(function (f) {
      return '<button class="filter' + (f.id === activeFilter ? " is-active" : "") + '" role="tab" aria-selected="' + (f.id === activeFilter) + '" data-filter="' + f.id + '">' + esc(f.name) + '</button>';
    }).join("");
    $$(".filter", wrap).forEach(function (b) { b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter")); }); });
  }

  function applyFilter(id) {
    activeFilter = id;
    $$(".filter").forEach(function (b) {
      var on = b.getAttribute("data-filter") === id;
      b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on));
    });
    renderProducts();
  }

  function visible() {
    return MD.PRODUCTS.filter(function (p) {
      var okCat = activeFilter === "all" || p.category === activeFilter;
      var hay = (p.name + " " + (p.descShort || "") + " " + p.category).toLowerCase();
      return okCat && (!searchTerm || hay.indexOf(searchTerm) !== -1);
    });
  }

  function cardFor(p) {
    var buyable = MD.isBuyable(p);
    var href = MD.productUrl(p);
    var tag = p.tag ? '<span class="card__tag">' + esc(p.tag) + '</span>' : "";
    var badge = buyable ? "" : '<span class="card__badge">' + esc(MD.availabilityLabel(p)) + '</span>';
    var price = buyable
      ? '<span class="card__price">' + MD.fmtPrice(p) + '</span>'
      : '<span class="card__price card__price--pending">Precio en preparación</span>';
    // La tarjeta ENTERA es un enlace a la página del producto.
    return '<a class="card" href="' + href + '" aria-label="Ver ' + esc(p.name) + '">' +
      '<span class="card__media">' + tag + badge + MD.imgTag(p.images && p.images.main, p.name) +
        '<span class="card__shade"></span>' +
      '</span>' +
      '<span class="card__body">' +
        '<span class="card__name">' + esc(p.name) + '</span>' +
        price +
        '<span class="card__cta">Ver producto <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '</span>' +
    '</a>';
  }

  function renderProducts() {
    var grid = $("#productGrid"), empty = $("#gridEmpty"); if (!grid) return;
    var list = visible();
    if (!list.length) { grid.innerHTML = ""; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    grid.innerHTML = list.map(cardFor).join("");
  }

  function markNav(id) { $$(".nav a, .mobilenav a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-nav") === id); }); }

  function init() {
    MD.initChrome({ onSearch: function (term) { searchTerm = term; renderProducts(); } });
    renderCategories();
    renderFilters();
    renderProducts();

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        var nav = a.getAttribute("data-nav"); if (nav) markNav(nav);
      });
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
