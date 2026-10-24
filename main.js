/* =============================================================
   MINI DREAMS — LÓGICA DE LA TIENDA (V1 demo, sin checkout real)
   Sin librerías externas. Lee SIEMPRE de window.MINI_DREAMS_DATA.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.MINI_DREAMS_DATA || { CATEGORIES: [], PRODUCTS: [] };
  var CATEGORIES = DATA.CATEGORIES;
  var PRODUCTS = DATA.PRODUCTS;
  var PLACEHOLDER = "assets/ui/placeholder.svg";
  var CART_KEY = "miniDreams.cart.v1";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Utilidades ---------- */
  function isBuyable(p) {
    return p.stockStatus === "available" && typeof p.price === "number" && Array.isArray(p.sizes) && p.sizes.length > 0;
  }
  function priceLabel(p) {
    if (isBuyable(p)) return "$" + p.price.toFixed(2) + " " + (p.currency || "USD");
    return null;
  }
  function stockLabel(p) {
    if (p.stockStatus === "coming-soon") return "Próximamente";
    if (p.stockStatus === "pending") return "Detalles en preparación";
    return "";
  }
  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
    return null;
  }
  function getCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) { if (CATEGORIES[i].id === id) return CATEGORIES[i]; }
    return null;
  }
  /* Imagen con fallback neutro garantizado (nunca rota, nunca de otro producto). */
  function imgTag(src, alt, cls) {
    var safe = src && String(src).trim() ? src : PLACEHOLDER;
    var a = (alt || "").replace(/"/g, "&quot;");
    return '<img src="' + safe + '" alt="' + a + '" class="' + (cls || "") +
      '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'" />';
  }
  function catIcon() {
    return '<svg class="cat__ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20.5S3.5 14.8 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 5.9-8.5 11.6-8.5 11.6z"/></svg>';
  }

  /* =============================================================
     CATEGORÍAS
     ============================================================= */
  function renderCategories() {
    var grid = $("#catGrid");
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(function (c) {
      return '<button class="cat" data-cat="' + c.id + '" style="--cat-accent:' + c.accent + '">' +
        catIcon() +
        '<span class="cat__name">' + c.name + '</span>' +
        '<span class="cat__blurb">' + c.blurb + '</span>' +
        '</button>';
    }).join("");

    $$(".cat", grid).forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-cat"));
        var cat = $("#catalogo");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* =============================================================
     FILTROS + CATÁLOGO
     ============================================================= */
  var activeFilter = "all";
  var searchTerm = "";

  function renderFilters() {
    var wrap = $("#filters");
    if (!wrap) return;
    var items = [{ id: "all", name: "Todos" }].concat(CATEGORIES.map(function (c) { return { id: c.id, name: c.name }; }));
    wrap.innerHTML = items.map(function (f) {
      return '<button class="filter' + (f.id === activeFilter ? " is-active" : "") + '" role="tab" data-filter="' + f.id + '">' + f.name + '</button>';
    }).join("");
    $$(".filter", wrap).forEach(function (btn) {
      btn.addEventListener("click", function () { applyFilter(btn.getAttribute("data-filter")); });
    });
  }

  function applyFilter(id) {
    activeFilter = id;
    $$(".filter").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-filter") === id); });
    renderProducts();
  }

  function visibleProducts() {
    return PRODUCTS.filter(function (p) {
      var okCat = activeFilter === "all" || p.category === activeFilter;
      var okSearch = !searchTerm || (p.name + " " + (p.description || "") + " " + p.category).toLowerCase().indexOf(searchTerm) !== -1;
      return okCat && okSearch;
    });
  }

  function renderProducts() {
    var grid = $("#productGrid");
    var empty = $("#gridEmpty");
    if (!grid) return;
    var list = visibleProducts();

    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    grid.innerHTML = list.map(function (p) {
      var buyable = isBuyable(p);
      var price = buyable
        ? '<span class="card__price">' + priceLabel(p) + '</span>'
        : '<span class="card__price card__price--pending">Precio en preparación</span>';
      var badge = buyable ? "" : '<span class="card__badge">' + stockLabel(p) + '</span>';
      var tag = p.tag ? '<span class="card__tag">' + p.tag + '</span>' : "";
      var actions = '<button class="btn btn--ghost" data-view-product="' + p.id + '">Ver producto</button>';
      if (buyable) {
        actions += '<button class="btn btn--primary" data-quick-add="' + p.id + '">Añadir al carrito</button>';
      }
      return '<article class="card">' +
        '<div class="card__media">' + tag + badge + imgTag(p.images && p.images.main, p.name) + '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__name">' + p.name + '</h3>' + price +
          '<div class="card__actions">' + actions + '</div>' +
        '</div>' +
      '</article>';
    }).join("");

    $$("[data-view-product]", grid).forEach(function (b) {
      b.addEventListener("click", function () { openPDP(b.getAttribute("data-view-product")); });
    });
    $$("[data-quick-add]", grid).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = getProduct(b.getAttribute("data-quick-add"));
        if (p && isBuyable(p)) addToCart(p.id, p.sizes[0], 1);
      });
    });
  }

  /* =============================================================
     PDP (detalle de producto) + galería + lightbox
     ============================================================= */
  var pdp = $("#pdp");
  var pdpBody = $("#pdpBody");

  function galleryImages(p) {
    var imgs = p.images || {};
    var out = [];
    [imgs.main, imgs.front, imgs.side, imgs.back].forEach(function (s) { if (s) out.push(s); });
    (imgs.details || []).forEach(function (s) { if (s) out.push(s); });
    // De-dup
    out = out.filter(function (v, i) { return out.indexOf(v) === i; });
    // Si no hay ninguna imagen real, una sola entrada placeholder.
    if (!out.length) out = [PLACEHOLDER];
    return out;
  }

  function openPDP(id) {
    var p = getProduct(id);
    if (!p || !pdp || !pdpBody) return;
    var buyable = isBuyable(p);
    var imgs = galleryImages(p);

    var priceHtml = buyable
      ? '<p class="pdp__price">' + priceLabel(p) + '</p>'
      : '<p class="pdp__price pdp__price--pending">Precio en preparación · ' + stockLabel(p) + '</p>';

    var thumbs = imgs.map(function (src, i) {
      return '<button class="pdp__thumb' + (i === 0 ? " is-active" : "") + '" data-thumb="' + i + '">' +
        imgTag(src, p.name + " miniatura " + (i + 1)) + '</button>';
    }).join("");

    var descHtml = p.description
      ? '<p class="pdp__desc">' + p.description + '</p>'
      : '<p class="pdp__desc"><em>Descripción en preparación.</em></p>';

    var sizesHtml, buyHtml;
    if (buyable) {
      sizesHtml =
        '<div class="pdp__field"><label>Talla</label><div class="sizes" id="pdpSizes">' +
          p.sizes.map(function (s, i) { return '<button class="size' + (i === 0 ? " is-active" : "") + '" data-size="' + s + '">' + s + '</button>'; }).join("") +
        '</div></div>' +
        '<div class="pdp__field"><label>Cantidad</label>' +
          '<div class="qty" id="pdpQty"><button type="button" data-q="-1" aria-label="Menos">−</button><span id="pdpQtyVal">1</span><button type="button" data-q="1" aria-label="Más">+</button></div>' +
        '</div>';
      buyHtml = '<button class="btn btn--primary btn--block btn--lg" id="pdpAdd">Añadir al carrito</button>';
    } else {
      sizesHtml = '<div class="pdp__pending-msg">Este producto todavía está en preparación. Pronto publicaremos sus tallas, precio y fotografías reales.</div>';
      buyHtml = '<button class="btn btn--primary btn--block btn--lg" disabled aria-disabled="true">No disponible todavía</button>';
    }

    var materials = p.materials ? '<h4>Materiales</h4><p>' + p.materials + '</p>' : '<h4>Materiales</h4><p><em>Información en preparación.</em></p>';
    var care = p.care ? '<h4>Cuidados</h4><p>' + p.care + '</p>' : '<h4>Cuidados</h4><p><em>Información en preparación.</em></p>';

    // Relacionados: misma categoría, distinto id (máx 4)
    var related = PRODUCTS.filter(function (r) { return r.category === p.category && r.id !== p.id; }).slice(0, 4);
    var relatedHtml = related.length
      ? '<div class="related"><h4>También te puede gustar</h4><div class="related__row">' +
          related.map(function (r) {
            return '<button class="related__card" data-view-product="' + r.id + '">' +
              imgTag(r.images && r.images.main, r.name) + '<span>' + r.name + '</span></button>';
          }).join("") +
        '</div></div>'
      : "";

    pdpBody.innerHTML =
      '<div class="pdp__gallery">' +
        '<div class="pdp__main">' + imgTag(imgs[0], p.name, "pdp__mainimg") +
          '<button class="pdp__zoom" id="pdpZoom" aria-label="Ampliar imagen"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.2-3.2M11 8v6M8 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '</div>' +
        '<div class="pdp__thumbs">' + thumbs + '</div>' +
      '</div>' +
      '<div class="pdp__info">' +
        (p.tag ? '<span class="pdp__tag">' + p.tag + '</span>' : "") +
        '<h2 class="pdp__name" id="pdpName">' + p.name + '</h2>' +
        priceHtml + descHtml + sizesHtml + buyHtml +
        '<div class="pdp__meta">' + materials + care + '</div>' +
        relatedHtml +
      '</div>';

    // --- Interacciones de galería ---
    var mainImg = $(".pdp__mainimg", pdpBody);
    $$(".pdp__thumb", pdpBody).forEach(function (t) {
      t.addEventListener("click", function () {
        var idx = parseInt(t.getAttribute("data-thumb"), 10);
        if (mainImg) mainImg.src = imgs[idx] || PLACEHOLDER;
        $$(".pdp__thumb", pdpBody).forEach(function (x) { x.classList.remove("is-active"); });
        t.classList.add("is-active");
      });
    });
    var zoom = $("#pdpZoom", pdpBody);
    function openLB() { if (mainImg) openLightbox(mainImg.src, p.name); }
    if (zoom) zoom.addEventListener("click", openLB);
    if (mainImg) mainImg.addEventListener("click", openLB);

    // --- Talla + cantidad + añadir ---
    if (buyable) {
      var selSize = p.sizes[0];
      $$("#pdpSizes .size", pdpBody).forEach(function (s) {
        s.addEventListener("click", function () {
          selSize = s.getAttribute("data-size");
          $$("#pdpSizes .size", pdpBody).forEach(function (x) { x.classList.remove("is-active"); });
          s.classList.add("is-active");
        });
      });
      var qv = 1, qSpan = $("#pdpQtyVal", pdpBody);
      $$("#pdpQty button", pdpBody).forEach(function (b) {
        b.addEventListener("click", function () {
          qv = Math.max(1, qv + parseInt(b.getAttribute("data-q"), 10));
          if (qSpan) qSpan.textContent = qv;
        });
      });
      var addBtn = $("#pdpAdd", pdpBody);
      if (addBtn) addBtn.addEventListener("click", function () { addToCart(p.id, selSize, qv); });
    }

    // Relacionados abren su propio PDP
    $$("[data-view-product]", pdpBody).forEach(function (b) {
      b.addEventListener("click", function () { openPDP(b.getAttribute("data-view-product")); });
    });

    pdp.classList.add("is-open");
    pdp.setAttribute("aria-hidden", "false");
    lockScroll(true);
  }

  function closePDP() {
    if (!pdp) return;
    pdp.classList.remove("is-open");
    pdp.setAttribute("aria-hidden", "true");
    if (!anyLayerOpen()) lockScroll(false);
  }

  /* ---------- Lightbox ---------- */
  var lightbox = $("#lightbox"), lightboxImg = $("#lightboxImg");
  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src; lightboxImg.alt = alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lockScroll(true);
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (!anyLayerOpen()) lockScroll(false);
  }

  /* =============================================================
     CARRITO (persistente en localStorage)
     ============================================================= */
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function lineKey(id, size) { return id + "::" + (size || "-"); }

  function addToCart(id, size, qty) {
    var p = getProduct(id);
    if (!p || !isBuyable(p)) return;
    qty = Math.max(1, qty || 1);
    var key = lineKey(id, size);
    var existing = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].key === key) { existing = cart[i]; break; } }
    if (existing) { existing.qty += qty; }
    else { cart.push({ key: key, id: id, size: size || null, qty: qty }); }
    saveCart();
    renderCart();
    updateCartCount();
    showToast(p.name + " añadido al carrito");
    openCart();
  }

  function removeLine(key) {
    cart = cart.filter(function (l) { return l.key !== key; });
    saveCart(); renderCart(); updateCartCount();
  }
  function changeQty(key, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        cart[i].qty = Math.max(1, cart[i].qty + delta);
        break;
      }
    }
    saveCart(); renderCart(); updateCartCount();
  }

  function cartTotals() {
    var sub = 0, count = 0;
    cart.forEach(function (l) {
      var p = getProduct(l.id);
      if (p && isBuyable(p)) { sub += p.price * l.qty; }
      count += l.qty;
    });
    return { sub: sub, count: count };
  }

  function updateCartCount() {
    var el = $("#cartCount");
    if (!el) return;
    var c = cartTotals().count;
    if (c > 0) { el.textContent = c; el.hidden = false; }
    else { el.hidden = true; }
  }

  function renderCart() {
    var body = $("#cartBody"), foot = $("#cartFoot");
    if (!body || !foot) return;

    // Depurar líneas cuyo producto ya no existe o dejó de ser comprable
    cart = cart.filter(function (l) { var p = getProduct(l.id); return p && isBuyable(p); });

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20.5S3.5 14.8 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 5.9-8.5 11.6-8.5 11.6z"/></svg>' +
          '<p>Tu carrito está vacío.<br/>¡Hay cositas muy tiernas esperándote!</p>' +
          '<button class="btn btn--primary" id="cartKeep">Explorar colección</button>' +
        '</div>';
      foot.innerHTML = "";
      var keep = $("#cartKeep");
      if (keep) keep.addEventListener("click", function () { closeCart(); var c = $("#catalogo"); if (c) c.scrollIntoView({ behavior: "smooth" }); });
      return;
    }

    body.innerHTML = cart.map(function (l) {
      var p = getProduct(l.id);
      var line = p.price * l.qty;
      return '<div class="citem">' +
        imgTag(p.images && p.images.main, p.name, "citem__img") +
        '<div>' +
          '<div class="citem__name">' + p.name + '</div>' +
          '<div class="citem__meta">Talla: ' + (l.size || "única") + '</div>' +
          '<div class="citem__price">$' + line.toFixed(2) + '</div>' +
        '</div>' +
        '<div class="citem__right">' +
          '<button class="citem__remove" data-remove="' + l.key + '">Quitar</button>' +
          '<div class="qty"><button data-dec="' + l.key + '" aria-label="Menos">−</button><span>' + l.qty + '</span><button data-inc="' + l.key + '" aria-label="Más">+</button></div>' +
        '</div>' +
      '</div>';
    }).join("");

    var t = cartTotals();
    foot.innerHTML =
      '<div class="cart__row"><span>Subtotal</span><span>$' + t.sub.toFixed(2) + ' USD</span></div>' +
      '<div class="cart__row cart__row--total"><span>Total</span><span>$' + t.sub.toFixed(2) + ' USD</span></div>' +
      '<button class="btn btn--primary btn--block btn--lg" disabled aria-disabled="true">Finalizar compra · próximamente</button>' +
      '<p class="cart__note">El pago en línea estará disponible muy pronto. Esta es una versión de demostración.</p>';

    $$("[data-remove]", body).forEach(function (b) { b.addEventListener("click", function () { removeLine(b.getAttribute("data-remove")); }); });
    $$("[data-inc]", body).forEach(function (b) { b.addEventListener("click", function () { changeQty(b.getAttribute("data-inc"), 1); }); });
    $$("[data-dec]", body).forEach(function (b) { b.addEventListener("click", function () { changeQty(b.getAttribute("data-dec"), -1); }); });
  }

  /* ---------- Paneles (carrito / overlay) ---------- */
  var cartDrawer = $("#cartDrawer"), overlay = $("#overlay");

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    showOverlay();
    lockScroll(true);
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    maybeHideOverlay();
  }
  function showOverlay() { if (overlay) { overlay.hidden = false; requestAnimationFrame(function () { overlay.classList.add("is-open"); }); } }
  function anyLayerOpen() {
    return (cartDrawer && cartDrawer.classList.contains("is-open")) ||
           (pdp && pdp.classList.contains("is-open")) ||
           (lightbox && lightbox.classList.contains("is-open")) ||
           (mobileNav && !mobileNav.hidden);
  }
  function maybeHideOverlay() {
    if (anyLayerOpen()) return;
    if (overlay) { overlay.classList.remove("is-open"); setTimeout(function () { overlay.hidden = true; }, 250); }
    lockScroll(false);
  }
  function lockScroll(on) { document.body.classList.toggle("no-scroll", !!on); }

  /* ---------- Toast ---------- */
  var toastTimer;
  function showToast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(function () { t.classList.add("is-show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("is-show");
      setTimeout(function () { t.hidden = true; }, 260);
    }, 2200);
  }

  /* ---------- Menú móvil / búsqueda ---------- */
  var burger = $("#burger"), mobileNav = $("#mobileNav");
  function toggleMobileNav(force) {
    if (!mobileNav || !burger) return;
    var open = typeof force === "boolean" ? force : mobileNav.hidden;
    mobileNav.hidden = !open;
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  }

  var searchToggle = $("#searchToggle"), searchBar = $("#searchBar"), searchInput = $("#searchInput");
  function toggleSearch(force) {
    if (!searchBar || !searchToggle) return;
    var open = typeof force === "boolean" ? force : searchBar.hidden;
    searchBar.hidden = !open;
    searchToggle.setAttribute("aria-expanded", String(open));
    if (open && searchInput) searchInput.focus();
  }

  /* ---------- Navegación activa ---------- */
  function markNav(id) {
    $$(".nav a, .mobilenav a").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === id);
    });
  }

  /* =============================================================
     INICIALIZACIÓN
     ============================================================= */
  function init() {
    // Año del footer
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

    renderCategories();
    renderFilters();
    renderProducts();
    renderCart();
    updateCartCount();

    // Header
    if (burger) burger.addEventListener("click", function () { toggleMobileNav(); if (!mobileNav.hidden) showOverlay(); else maybeHideOverlay(); });
    if (searchToggle) searchToggle.addEventListener("click", function () { toggleSearch(); });
    if ($("#cartToggle")) $("#cartToggle").addEventListener("click", openCart);
    if ($("#cartClose")) $("#cartClose").addEventListener("click", closeCart);

    // Búsqueda en vivo
    if (searchInput) searchInput.addEventListener("input", function () {
      searchTerm = this.value.trim().toLowerCase();
      renderProducts();
    });

    // Overlay cierra la capa superior
    if (overlay) overlay.addEventListener("click", function () {
      closeCart();
      if (mobileNav && !mobileNav.hidden) toggleMobileNav(false);
      maybeHideOverlay();
    });

    // PDP / lightbox cerrar
    $$("[data-pdp-close]").forEach(function (b) { b.addEventListener("click", closePDP); });
    if ($("#lightboxClose")) $("#lightboxClose").addEventListener("click", closeLightbox);
    if (lightbox) lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });

    // Cerrar con Escape
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (lightbox && lightbox.classList.contains("is-open")) return closeLightbox();
      if (pdp && pdp.classList.contains("is-open")) return closePDP();
      if (cartDrawer && cartDrawer.classList.contains("is-open")) return closeCart();
      if (mobileNav && !mobileNav.hidden) { toggleMobileNav(false); maybeHideOverlay(); }
    });

    // Enlaces internos: cerrar menú móvil + marcar activo
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        if (mobileNav && !mobileNav.hidden) { toggleMobileNav(false); maybeHideOverlay(); }
        var nav = a.getAttribute("data-nav");
        if (nav) markNav(nav);
      });
    });

    // Resaltar sección activa al desplazar
    var sections = [
      { id: "top", nav: "home" },
      { id: "colecciones", nav: "colecciones" },
      { id: "catalogo", nav: "catalogo" }
    ].map(function (s) { return { el: document.getElementById(s.id), nav: s.nav }; }).filter(function (s) { return s.el; });

    if ("IntersectionObserver" in window && sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var m = sections.find(function (s) { return s.el === en.target; });
            if (m) markNav(m.nav);
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { io.observe(s.el); });
    }

    markNav("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
