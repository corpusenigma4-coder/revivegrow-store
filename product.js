/* =============================================================
   MINI DREAMS — PÁGINA DE PRODUCTO (product.js)
   Lee ?slug= de la URL y pinta la ficha completa. Galería con
   zoom, selector de tallas, cantidad, carrito y relacionados.
   Compatible con recarga y atrás/adelante del navegador.
   ============================================================= */
(function () {
  "use strict";
  var MD = window.MD; if (!MD) return;
  var $ = MD.$, $$ = MD.$$, esc = MD.esc;

  function getSlug() {
    var m = /[?&]slug=([^&]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var state = { product: null, images: [], activeImg: 0, size: null, qty: 1 };

  function galleryImages(p) {
    if (p.gallerySprite) return p.gallerySprite.labels.map(function (_,i) { return p.gallerySprite.src+"#view-"+i; });
    var im = p.images || {}, out = [];
    [im.main, im.front, im.side, im.back].forEach(function (s) { if (s) out.push(s); });
    (im.details || []).forEach(function (s) { if (s) out.push(s); });
    out = out.filter(function (v, i) { return out.indexOf(v) === i; });
    if (!out.length) out = [MD.PLACEHOLDER];
    return out;
  }

  function renderNotFound() {
    var root = $("#productRoot");
    root.innerHTML =
      '<div class="pp-notfound">' +
        '<h1>Producto no encontrado</h1>' +
        '<p>El enlace puede estar incompleto o el producto ya no está disponible.</p>' +
        '<a class="btn btn--primary" href="index.html#catalogo">Ver el catálogo</a>' +
      '</div>';
    document.title = "Producto no encontrado — Mini Dreams";
  }

  function render() {
    var p = state.product, root = $("#productRoot");
    var buyable = MD.isBuyable(p);
    state.images = galleryImages(p);
    var firstCat = MD.catsOf(p)[0];
    var cat = firstCat ? MD.getCollection(firstCat) : null;

    document.title = p.name + " — Mini Dreams";

    /* --- Galería --- */
    var thumbs = state.images.map(function(src,i) {
      var caption=p.gallerySprite ? p.gallerySprite.labels[i] : "Imagen "+(i+1);
      var position=p.gallerySprite ? ' style="object-position:'+(25*i)+'% center"' : "";
      var thumbImg=p.gallerySprite
        ? '<img src="'+esc(p.gallerySprite.src)+'" alt="'+esc(caption)+'"'+position+' loading="lazy">'
        : MD.imgTag(src,caption);
      return '<button class="gallery__thumb'+(i===0?' is-active':'')+'" data-thumb="'+i+'" aria-label="Ver '+esc(caption)+'" aria-pressed="'+(i===0)+'">'+thumbImg+'</button>';
    }).join("");

    var gallery =
      '<div class="gallery">' +
        '<div class="gallery__main">' +
          (p.gallerySprite ? '<img class="gallery__img gallery__img--sprite" src="'+esc(p.gallerySprite.src)+'" style="object-position:0% center" alt="'+esc(p.name)+'" fetchpriority="high">' : MD.imgTag(state.images[0],p.name,"gallery__img")) +
          '<button class="gallery__zoom" id="galZoom" aria-label="Ampliar imagen"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.2-3.2M11 8v6M8 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
          (buyable ? "" : '<span class="gallery__badge">' + esc(MD.availabilityLabel(p)) + '</span>') +
          (p.previewArt ? '<span class="gallery__concept">Ilustración conceptual · no es una foto real</span>' : "") +
        '</div>' +
        (state.images.length > 1 ? '<div class="gallery__thumbs">' + thumbs + '</div>' : '') +
      '</div>';

    /* --- Precio / disponibilidad --- */
    var priceHtml = buyable
      ? '<p class="pp-price">' + MD.fmtPrice(p) + (p.__dev ? ' <small>precio de prueba</small>' : '') + '</p>'
      : '<p class="pp-price pp-price--pending">Precio en preparación</p>';
    var availHtml = '<p class="pp-avail pp-avail--' + (buyable ? "ok" : "pending") + '">' +
      '<span class="dot"></span>' + esc(MD.availabilityLabel(p)) + '</p>';

    /* --- Descripción --- */
    var descLong = p.descLong ? esc(p.descLong) : "<em>Descripción en preparación.</em>";

    /* --- Tallas --- */
    var sizesBlock;
    if (buyable) {
      var sizeBtns = (p.sizes || []).map(function (s) {
        var out = s.available === true || s.stock > 0;
        return '<button class="size' + (out ? "" : " is-out") + '" data-size="' + esc(s.label) + '"' +
          (out ? "" : ' disabled aria-disabled="true"') + '>' + esc(s.label) + (out ? "" : '<span class="size__x">agotada</span>') + '</button>';
      }).join("");
      sizesBlock =
        '<div class="pp-field">' +
          '<div class="pp-field__head"><label>Talla</label><button type="button" class="pp-guide-link" id="sizeGuideBtn">Guía de tallas</button></div>' +
          '<div class="sizes" id="sizes" role="group" aria-label="Elegir talla">' + sizeBtns + '</div>' +
          '<p class="pp-size-hint" id="sizeHint">Elige una talla para continuar.</p>' +
        '</div>' +
        '<div class="pp-field">' +
          '<label>Cantidad</label>' +
          '<div class="qty" id="qty"><button type="button" data-q="-1" aria-label="Menos">−</button><span id="qtyVal">1</span><button type="button" data-q="1" aria-label="Más">+</button></div>' +
        '</div>' +
        '<div class="pp-actions">' +
          '<button class="btn btn--primary btn--block btn--lg" id="addBtn" disabled aria-disabled="true">Añadir al carrito</button>' +
          '<p class="pp-checkoutnote">Elige tu talla y prepara el carrito. El pago en línea estará disponible próximamente.</p>' +
        '</div>';
    } else {
      sizesBlock =
        '<div class="pp-pending">Este producto todavía está en preparación. Pronto publicaremos su precio, tallas y fotografías reales.</div>' +
        '<div class="pp-actions"><button class="btn btn--primary btn--block btn--lg" disabled aria-disabled="true">No disponible todavía</button></div>';
    }

    var devNote = p.__dev ? '<p class="pp-dev">⚠️ Vista previa con <b>datos de desarrollo</b> (no reales) para probar la compra.</p>' : "";

    var finePrint=p.color ? '<div class="pp-attributes"><span>Color <strong>'+esc(p.color)+'</strong></span><span>Unisex</span><span>Abrigadito</span></div>' : "";
    var highlights=(p.materialHighlights||[]).map(function(h){return '<div class="pp-feature"><span class="pp-feature__mark" aria-hidden="true">✳</span><div><strong>'+esc(h.title)+'</strong><p>'+esc(h.detail)+'</p></div></div>';}).join("");
    var sizeRows=(p.sizes||[]).map(function(t){return '<tr><th scope="row">'+esc(t.label)+'</th><td>'+esc(t.height||"—")+'</td><td>'+esc(t.weight||"—")+'</td></tr>';}).join("");
    var guide='<div class="sizeguide"><p>'+esc(p.sizeGuide||"Usa la estatura como referencia.")+'</p><div class="sizeguide__scroll"><table><thead><tr><th>Edad aproximada</th><th>Estatura</th><th>Peso</th></tr></thead><tbody>'+sizeRows+'</tbody></table></div></div>';
    var shipping=p.shipping ? '<div class="pp-fulfillment"><div><span aria-hidden="true">✈</span><section><strong>Envíos a todo el mundo</strong><p>'+esc(p.shippingTime)+'</p></section></div><div><span aria-hidden="true">↺</span><section><strong>90 días de devolución</strong><p>'+esc(p.returns)+'</p></section></div></div>' : "";
    var info =
      '<div class="pp-info">' +
        '<nav class="pp-crumbs" aria-label="miga de pan"><a href="index.html">Inicio</a> › <a href="index.html#catalogo">Catálogo</a>' + (cat ? ' › <span>' + esc(cat.name) + '</span>' : '') + '</nav>' +
        (p.tag ? '<span class="pp-tag">' + esc(p.tag) + '</span>' : '') +
        '<h1 class="pp-name">' + esc(p.name) + '</h1>' +
        priceHtml + availHtml + devNote + finePrint +
        '<p class="pp-desc">' + descLong + '</p>' +
        (highlights?'<div class="pp-highlights">'+highlights+'</div>':"") +
        sizesBlock +
        shipping +
        '<div class="pp-meta">' +
        '<details class="pp-acc" id="sizeGuideAcc"><summary>Guía de tallas</summary>'+guide+'</details>' +
        '<details class="pp-acc"><summary>Material y cuidados</summary><p>'+esc(p.materials||"En preparación")+'</p><p>'+esc(p.care||"En preparación")+'</p></details>' +
        '<details class="pp-acc"><summary>Envíos y devoluciones</summary><p>'+esc(p.shipping||"")+' '+esc(p.shippingTime||"")+'</p><p>'+esc(p.returns||"")+'</p><p>¿Necesitas ayuda? <a href="mailto:corpusenigma4@gmail.com">Contáctanos</a>.</p></details>' +
        '</div>' +
      '</div>';

    root.innerHTML = '<div class="pp-layout">' + gallery + info + '</div>' + relatedBlock(p);

    wireGallery();
    if (buyable) wireBuying(p);
    wireRelated();
  }

  function relatedBlock(p) {
    var myCats = MD.catsOf(p);
    // Primero: productos que comparten alguna colección.
    var rel = MD.PRODUCTS.filter(function (r) { if (r.published === false) return false;
      if (r.id === p.id) return false;
      return MD.catsOf(r).some(function (c) { return myCats.indexOf(c) !== -1; });
    });
    // Rellenar hasta 4 con el resto del catálogo.
    if (rel.length < 4) {
      MD.PRODUCTS.forEach(function (r) { if (r.published !== false && r.id !== p.id && rel.indexOf(r) === -1) rel.push(r); });
    }
    rel = rel.slice(0, 4);
    if (!rel.length) return "";
    var cards = rel.map(function (r) {
      var price = MD.isBuyable(r) ? MD.fmtPrice(r) : "En preparación";
      return '<a class="rel-card" href="' + MD.productUrl(r) + '">' +
        '<span class="rel-card__media">' + MD.imgTag(r.images && r.images.main, r.name) + '</span>' +
        '<span class="rel-card__name">' + esc(r.name) + '</span>' +
        '<span class="rel-card__price">' + esc(price) + '</span>' +
      '</a>';
    }).join("");
    return '<section class="related2"><h2>También te pueden encantar</h2><div class="related2__grid">' + cards + '</div></section>';
  }

  /* ---------- Galería + zoom ---------- */
  function wireGallery() {
    var mainImg = $(".gallery__img");
    $$(".gallery__thumb").forEach(function (t) {
      t.addEventListener("click", function () {
        var i = parseInt(t.getAttribute("data-thumb"), 10);
        state.activeImg = i;
        if (mainImg) { if (state.product.gallerySprite) {mainImg.style.objectPosition=(25*i)+"% center";mainImg.alt=state.product.name+" — "+state.product.gallerySprite.labels[i];} else mainImg.src=state.images[i] || MD.PLACEHOLDER; }
        $$(".gallery__thumb").forEach(function (x) { x.classList.remove("is-active"); });
        t.classList.add("is-active");
        $(".gallery__thumb").forEach(function(x){x.setAttribute("aria-pressed",String(x===t));});
      });
    });
    function zoom() { if (mainImg) openLightbox(mainImg.src, state.product.name, state.product.gallerySprite ? state.activeImg : null); }
    var zb = $("#galZoom"); if (zb) zb.addEventListener("click", zoom);
    if (mainImg) { mainImg.style.cursor = "zoom-in"; mainImg.addEventListener("click", zoom); }
  }

  var lb, lbImg;
  function openLightbox(src, alt, spriteIndex) {
    lb = $("#lightbox"); lbImg = $("#lightboxImg");
    if (!lb || !lbImg) return;
    lbImg.src = src; lbImg.alt = alt || "";
    lbImg.classList.toggle("lightbox__sprite",spriteIndex !== null && spriteIndex !== undefined);
    lbImg.style.objectPosition = (spriteIndex !== null && spriteIndex !== undefined ? spriteIndex*25 : 50) + "% center";
    lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
    MD.lockScroll(true);
  }
  function closeLightbox() { if (!lb) return; lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); MD.lockScroll(false); }

  /* ---------- Compra: tallas + cantidad ---------- */
  function wireBuying(p) {
    var addBtn = $("#addBtn"), buyBtn = $("#buyBtn"), hint = $("#sizeHint");
    var qtyVal = $("#qtyVal");

    $$("#sizes .size").forEach(function (b) {
      if (b.disabled) return;
      b.addEventListener("click", function () {
        state.size = b.getAttribute("data-size");
        $$("#sizes .size").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        if (hint) { hint.textContent = "Talla " + state.size + " seleccionada."; hint.classList.add("is-ok"); }
        if (addBtn) { addBtn.disabled = false; addBtn.removeAttribute("aria-disabled"); }
        // "Comprar ahora" permanece bloqueado hasta activar el pago (punto 1 del encargo).
      });
    });

    $$("#qty button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.qty = Math.max(1, state.qty + parseInt(b.getAttribute("data-q"), 10));
        if (qtyVal) qtyVal.textContent = state.qty;
      });
    });

    if (addBtn) addBtn.addEventListener("click", function () {
      if (!state.size) { if (hint) { hint.textContent = "Primero elige una talla."; hint.classList.add("is-err"); } return; }
      var okAdded = MD.addToCart(p.id, state.size, state.qty);
      if (okAdded) { MD.showToast(p.name + " (" + state.size + ") añadido al carrito"); MD.openCart(); }
    });

    if (buyBtn) buyBtn.addEventListener("click", function () {
      // Checkout aún no activo: añade y abre carrito donde se explica el estado del pago.
      if (!state.size) { if (hint) { hint.textContent = "Primero elige una talla."; hint.classList.add("is-err"); } return; }
      MD.addToCart(p.id, state.size, state.qty);
      MD.openCart();
    });

    // Enlace "Guía de tallas" abre el acordeón correspondiente
    var sg = $("#sizeGuideBtn");
    if (sg) sg.addEventListener("click", function () {
      var acc = $("#sizeGuideAcc");
      if (acc) { acc.open = true; acc.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
  }

  function wireRelated() {
    // Las tarjetas relacionadas son <a> normales: navegación nativa a su página.
    var lbClose = $("#lightboxClose");
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    var lbx = $("#lightbox");
    if (lbx) lbx.addEventListener("click", function (e) { if (e.target === lbx) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lbx && lbx.classList.contains("is-open")) closeLightbox();
    });
  }

  function init() {
    MD.initChrome({});
    var slug = getSlug();
    var p = slug ? MD.getBySlug(slug) : null;
    if (!p || p.published === false) { renderNotFound(); return; }
    state.product = p;
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Atrás/adelante entre páginas de producto que compartan documento (por si se navega con history).
  window.addEventListener("popstate", function () {
    var slug = getSlug(); var p = slug ? MD.getBySlug(slug) : null;
    if (p) { state = { product: p, images: [], activeImg: 0, size: null, qty: 1 }; render(); }
  });
})();
