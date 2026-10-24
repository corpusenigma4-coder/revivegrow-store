/* =============================================================
   MINI DREAMS — NÚCLEO COMPARTIDO (store.js)
   Usado por la home (index) y la página de producto (producto.html).
   Expone window.MD con helpers de producto + carrito + UI común.
   Sin librerías externas.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.MINI_DREAMS_DATA || { COLLECTIONS: [], PRODUCTS: [] };
  var COLLECTIONS = DATA.COLLECTIONS || [];
  var PRODUCTS = DATA.PRODUCTS;
  var PLACEHOLDER = "assets/ui/placeholder.svg";
  var CART_KEY = "miniDreams.cart.v2";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* ---------- Helpers de producto ---------- */
  function getProduct(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function getBySlug(slug) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].slug === slug) return PRODUCTS[i]; return null; }
  function getCollection(id) { for (var i = 0; i < COLLECTIONS.length; i++) if (COLLECTIONS[i].id === id) return COLLECTIONS[i]; return null; }
  function catsOf(p) { return Array.isArray(p && p.categories) ? p.categories : []; }
  /* "todo" (o vacío) => todos los productos; cualquier otro id => filtra por colección. */
  function productInCollection(p, id) { return !id || id === "todo" || catsOf(p).indexOf(id) !== -1; }
  function productsInCollection(id) { return PRODUCTS.filter(function (p) { return productInCollection(p, id); }); }

  function inStockSizes(p) { return (p.sizes || []).filter(function (s) { return s && s.stock > 0; }); }
  function hasAnyStock(p) { return inStockSizes(p).length > 0; }
  function isBuyable(p) { return !!p && p.availability === "in-stock" && typeof p.price === "number" && hasAnyStock(p); }
  function sizeInStock(p, label) { var s = (p.sizes || []).filter(function (x) { return x.label === label; })[0]; return !!(s && s.stock > 0); }

  function fmtPrice(p) { return "$" + Number(p.price).toFixed(2) + " " + (p.currency || "USD"); }
  function availabilityLabel(p) {
    if (isBuyable(p)) return "Disponible";
    if (p.availability === "coming-soon") return "Próximamente";
    return "En preparación";
  }

  function productUrl(p) { return "producto.html?slug=" + encodeURIComponent(p.slug); }

  /* Imagen con fallback neutro garantizado. prefix = ruta relativa (""/".."). */
  function imgTag(src, alt, cls) {
    var safe = src && String(src).trim() ? src : PLACEHOLDER;
    return '<img src="' + esc(safe) + '" alt="' + esc(alt || "") + '" class="' + (cls || "") +
      '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'" />';
  }

  /* =============================================================
     CARRITO (persistente, variantes producto+talla)
     ============================================================= */
  var cart = loadCart();

  function loadCart() {
    try { var a = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} notify(); }
  function lineKey(id, size) { return id + "::" + (size || "-"); }

  /* Depura líneas inválidas (producto inexistente, no comprable, talla sin stock). */
  function sanitize() {
    cart = cart.filter(function (l) {
      var p = getProduct(l.id);
      return p && isBuyable(p) && sizeInStock(p, l.size);
    });
  }

  function addToCart(id, size, qty) {
    var p = getProduct(id);
    if (!p || !isBuyable(p) || !size || !sizeInStock(p, size)) return false;
    qty = Math.max(1, qty || 1);
    var key = lineKey(id, size), ex = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].key === key) { ex = cart[i]; break; }
    if (ex) ex.qty += qty; else cart.push({ key: key, id: id, size: size, qty: qty });
    saveCart();
    return true;
  }
  function removeLine(key) { cart = cart.filter(function (l) { return l.key !== key; }); saveCart(); }
  function changeQty(key, delta) {
    for (var i = 0; i < cart.length; i++) if (cart[i].key === key) { cart[i].qty = Math.max(1, cart[i].qty + delta); break; }
    saveCart();
  }
  function totals() {
    sanitize();
    var sub = 0, count = 0;
    cart.forEach(function (l) { var p = getProduct(l.id); if (p) sub += p.price * l.qty; count += l.qty; });
    return { sub: sub, count: count };
  }

  /* Observadores para que cada página re-renderice al cambiar el carrito. */
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  /* =============================================================
     UI COMÚN: header, menú móvil, búsqueda, carrito lateral, toast
     ============================================================= */
  function updateCartCount() {
    var el = $("#cartCount"); if (!el) return;
    var c = totals().count;
    if (c > 0) { el.textContent = c; el.hidden = false; } else { el.hidden = true; }
  }

  function renderCart() {
    var body = $("#cartBody"), foot = $("#cartFoot");
    if (!body || !foot) return;
    sanitize();

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20.5S3.5 14.8 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 5.9-8.5 11.6-8.5 11.6z"/></svg>' +
          '<p>Tu carrito está vacío.<br/>¡Hay cositas muy tiernas esperándote!</p>' +
          '<a class="btn btn--primary" href="index.html#catalogo">Explorar colección</a>' +
        '</div>';
      foot.innerHTML = "";
      return;
    }

    body.innerHTML = cart.map(function (l) {
      var p = getProduct(l.id), line = p.price * l.qty;
      return '<div class="citem">' +
        '<a class="citem__imglink" href="' + productUrl(p) + '">' + imgTag(p.images && p.images.main, p.name, "citem__img") + '</a>' +
        '<div class="citem__mid">' +
          '<a class="citem__name" href="' + productUrl(p) + '">' + esc(p.name) + '</a>' +
          '<div class="citem__meta">Talla: ' + esc(l.size) + '</div>' +
          '<div class="citem__price">$' + line.toFixed(2) + '</div>' +
          '<div class="qty qty--sm"><button data-dec="' + l.key + '" aria-label="Menos">−</button><span>' + l.qty + '</span><button data-inc="' + l.key + '" aria-label="Más">+</button></div>' +
        '</div>' +
        '<button class="citem__remove" data-remove="' + l.key + '" aria-label="Quitar">' +
          '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");

    var t = totals();
    foot.innerHTML =
      '<div class="cart__row"><span>Subtotal</span><span>$' + t.sub.toFixed(2) + ' USD</span></div>' +
      '<div class="cart__row cart__row--total"><span>Total</span><span>$' + t.sub.toFixed(2) + ' USD</span></div>' +
      '<div id="cartPay"></div>' +
      '<p class="cart__note" id="cartNote">El pago en línea se está preparando. Esta es una previsualización: no se cobra nada.</p>';

    $$("[data-remove]", body).forEach(function (b) { b.addEventListener("click", function () { removeLine(b.getAttribute("data-remove")); }); });
    $$("[data-inc]", body).forEach(function (b) { b.addEventListener("click", function () { changeQty(b.getAttribute("data-inc"), 1); }); });
    $$("[data-dec]", body).forEach(function (b) { b.addEventListener("click", function () { changeQty(b.getAttribute("data-dec"), -1); }); });

    if (window.MD_PAYPAL && typeof window.MD_PAYPAL.mount === "function") window.MD_PAYPAL.mount(t);
  }

  /* ---------- Paneles ---------- */
  var cartDrawer, overlay, mobileNav, burger, searchBar, searchToggle, searchInput;

  function showOverlay() { if (overlay) { overlay.hidden = false; requestAnimationFrame(function () { overlay.classList.add("is-open"); }); } }
  function anyLayerOpen() {
    return (cartDrawer && cartDrawer.classList.contains("is-open")) || (mobileNav && !mobileNav.hidden);
  }
  function maybeHideOverlay() {
    if (anyLayerOpen()) return;
    if (overlay) { overlay.classList.remove("is-open"); setTimeout(function () { overlay.hidden = true; }, 250); }
    lockScroll(false);
  }
  function lockScroll(on) { document.body.classList.toggle("no-scroll", !!on); }

  function openCart() { if (!cartDrawer) return; renderCart(); cartDrawer.classList.add("is-open"); cartDrawer.setAttribute("aria-hidden", "false"); showOverlay(); lockScroll(true); }
  function closeCart() { if (!cartDrawer) return; cartDrawer.classList.remove("is-open"); cartDrawer.setAttribute("aria-hidden", "true"); maybeHideOverlay(); }

  function toggleMobileNav(force) {
    if (!mobileNav || !burger) return;
    var open = typeof force === "boolean" ? force : mobileNav.hidden;
    mobileNav.hidden = !open;
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (open) showOverlay(); else maybeHideOverlay();
  }
  function toggleSearch(force) {
    if (!searchBar || !searchToggle) return;
    var open = typeof force === "boolean" ? force : searchBar.hidden;
    searchBar.hidden = !open;
    searchToggle.setAttribute("aria-expanded", String(open));
    if (open && searchInput) searchInput.focus();
  }

  var toastTimer;
  function showToast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(function () { t.classList.add("is-show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-show"); setTimeout(function () { t.hidden = true; }, 260); }, 2300);
  }

  /* ---------- Inicialización de la UI común (en toda página) ---------- */
  function initChrome(opts) {
    opts = opts || {};
    cartDrawer = $("#cartDrawer"); overlay = $("#overlay");
    mobileNav = $("#mobileNav"); burger = $("#burger");
    searchBar = $("#searchBar"); searchToggle = $("#searchToggle"); searchInput = $("#searchInput");

    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

    if (burger) burger.addEventListener("click", function () { toggleMobileNav(); });
    if (searchToggle) searchToggle.addEventListener("click", function () { toggleSearch(); });
    if ($("#cartToggle")) $("#cartToggle").addEventListener("click", openCart);
    if ($("#cartClose")) $("#cartClose").addEventListener("click", closeCart);

    if (overlay) overlay.addEventListener("click", function () {
      closeCart();
      if (mobileNav && !mobileNav.hidden) toggleMobileNav(false);
      maybeHideOverlay();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (cartDrawer && cartDrawer.classList.contains("is-open")) return closeCart();
      if (mobileNav && !mobileNav.hidden) { toggleMobileNav(false); }
    });

    // Búsqueda: en la home filtra en vivo; en otras páginas redirige a la home con término.
    if (searchInput) {
      if (opts.onSearch) {
        searchInput.addEventListener("input", function () { opts.onSearch(this.value.trim().toLowerCase()); });
      } else {
        searchInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { var q = this.value.trim(); window.location.href = "index.html#catalogo" + (q ? "" : ""); }
        });
      }
    }

    onChange(function () { updateCartCount(); if (cartDrawer && cartDrawer.classList.contains("is-open")) renderCart(); });
    updateCartCount();
  }

  /* ---------- API pública ---------- */
  window.MD = {
    COLLECTIONS: COLLECTIONS, PRODUCTS: PRODUCTS, PLACEHOLDER: PLACEHOLDER,
    $: $, $$: $$, esc: esc, imgTag: imgTag,
    getProduct: getProduct, getBySlug: getBySlug,
    getCollection: getCollection, catsOf: catsOf,
    productInCollection: productInCollection, productsInCollection: productsInCollection,
    inStockSizes: inStockSizes, hasAnyStock: hasAnyStock, isBuyable: isBuyable, sizeInStock: sizeInStock,
    fmtPrice: fmtPrice, availabilityLabel: availabilityLabel, productUrl: productUrl,
    addToCart: addToCart, removeLine: removeLine, changeQty: changeQty, totals: totals,
    getCart: function () { return cart.slice(); }, onChange: onChange,
    openCart: openCart, closeCart: closeCart, renderCart: renderCart,
    showToast: showToast, initChrome: initChrome, lockScroll: lockScroll
  };
})();
