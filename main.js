/* ===== ReviveGrow store logic ===== */
const CDN = "https://cdn.shopify.com/s/files/1/0749/5234/3703/files/";
const GIFT_IMG = "https://i.imgur.com/Cxs3KuV.jpeg";
// Gallery: gift/bonus image first (best converter), then real product views
const IMAGES = [
  GIFT_IMG,
  ...[
    "01_ReviveGrow_Hero.jpg?v=1790574236",
    "02_ReviveGrow_Retractable_Handle.jpg?v=1790574236",
    "03_ReviveGrow_Features.jpg?v=1790574236",
    "04_ReviveGrow_Filtration.jpg?v=1790574236",
    "05_ReviveGrow_Tabletop_Design.jpg?v=1790574236",
    "06_ReviveGrow_Water_Tank.jpg?v=1790574236"
  ].map(f => CDN + f + "&width=1000")
];

const VARIANTS = {
  pro:   { name: "ReviveGrow™ Pro 1L + 3 free absorbers",         price: 29.99, was: 60, img: "https://i.imgur.com/dhqEt1m.jpeg" },
  super: { name: "ReviveGrow™ Super 2L Premium + 3 free absorbers", price: 44.99, was: 94, img: "https://i.imgur.com/YF7On4W.jpeg" }
};
const gbp = n => "£" + n.toFixed(2);
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const STAR_FULL = "★", STAR_EMPTY = "☆";

/* ---------- Star rating helper (4.9 -> 5 filled visual) ---------- */
function starStr(n){ return STAR_FULL.repeat(n) + STAR_EMPTY.repeat(5 - n); }
if ($("#heroStars")) $("#heroStars").textContent = STAR_FULL.repeat(5);
if ($("#summaryStars")) $("#summaryStars").textContent = STAR_FULL.repeat(5);

/* ---------- Gallery ---------- */
(function gallery(){
  const thumbs = $("#thumbs");
  const main = $("#mainImg");
  IMAGES.forEach((src, i) => {
    const im = document.createElement("img");
    im.src = src.includes("cdn.shopify") ? src.replace("width=1000","width=200") : src;
    im.alt = "ReviveGrow view " + (i+1);
    if (i === 0) im.classList.add("is-active");
    im.addEventListener("click", () => {
      main.src = src;
      $$(".gallery__thumbs img").forEach(t => t.classList.remove("is-active"));
      im.classList.add("is-active");
    });
    thumbs.appendChild(im);
  });
})();

/* ---------- Variant + qty + price sync ---------- */
let state = { variant: "pro", qty: 1 };
function syncPrices(){
  const v = VARIANTS[state.variant];
  if ($("#atcPrice")) $("#atcPrice").textContent = gbp(v.price);
  if ($("#stickyPrice")) $("#stickyPrice").textContent = gbp(v.price);
  const sWas = document.querySelector(".stickybar__info s");
  if (sWas) sWas.textContent = gbp(v.was);
}
$$('input[name="variant"]').forEach(r => r.addEventListener("change", e => {
  state.variant = e.target.value;
  // keep the gift/bonus hero image as the main visual; just sync pricing
  syncPrices();
}));
$$(".qty button").forEach(b => b.addEventListener("click", () => {
  const d = +b.dataset.q;
  state.qty = Math.max(1, Math.min(10, state.qty + d));
  $("#qty").value = state.qty;
}));
syncPrices();

/* ---------- Live viewing counter (social proof) ---------- */
(function liveViewers(){
  const el = $("#viewing");
  if (!el) return;
  setInterval(() => {
    const base = 28 + Math.floor(Math.random() * 12);
    el.textContent = base;
  }, 4000);
})();

/* ---------- Reviews ---------- */
(function reviews(){
  const list = $("#reviewList");
  const REV = window.REVIEWS || [];
  const SHOW = 6, STEP = 6;
  const initials = name => name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  REV.forEach((rv, i) => {
    const el = document.createElement("div");
    el.className = "review" + (i >= SHOW ? " is-hidden" : "");
    el.innerHTML = `
      <div class="review__top">
        <span class="review__stars">${starStr(rv.r)}</span>
        <span class="review__verified">Verified</span>
      </div>
      <p class="review__title">${rv.t}</p>
      <p class="review__text">${rv.x}</p>
      <div class="review__who">
        <span class="review__ava">${initials(rv.n)}</span>
        <span class="review__name"><b>${rv.n}</b><span>${rv.loc}, UK</span></span>
      </div>`;
    list.appendChild(el);
  });
  const btn = $("#moreReviews");
  if (REV.length <= SHOW) { if(btn) btn.style.display = "none"; }
  else {
    btn.textContent = `See more reviews (${REV.length - SHOW} left)`;
    btn.addEventListener("click", () => {
      const hidden = $$(".review.is-hidden");
      for (let i = 0; i < STEP && i < hidden.length; i++) hidden[i].classList.remove("is-hidden");
      const remaining = $$(".review.is-hidden").length;
      btn.textContent = remaining ? `See more reviews (${remaining} left)` : "That's all our reviews — thank you!";
      if (!remaining) btn.disabled = true;
    });
  }

  // rating distribution bars
  const bars = $("#ratingBars");
  if (bars){
    const dist = [
      {s:5, pct:91}, {s:4, pct:7}, {s:3, pct:1}, {s:2, pct:1}, {s:1, pct:0}
    ];
    bars.innerHTML = dist.map(d => `
      <div class="rbar">
        <span class="rbar__label">${d.s} ★</span>
        <span class="rbar__track"><span class="rbar__fill" style="width:${d.pct}%"></span></span>
        <span class="rbar__pct">${d.pct}%</span>
      </div>`).join("");
  }
})();

/* ---------- FAQ ---------- */
(function faq(){
  const list = $("#faqList");
  (window.FAQS || []).forEach(f => {
    const item = document.createElement("div");
    item.className = "faq__item";
    item.innerHTML = `<button class="faq__q">${f.q}<span>+</span></button><div class="faq__a"><p>${f.a}</p></div>`;
    const q = item.querySelector(".faq__q");
    const a = item.querySelector(".faq__a");
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    });
    list.appendChild(item);
  });
})();

/* ---------- Before/After slider ---------- */
(function compare(){
  const slider = $("#slider");
  const before = $("#beforeWrap");
  const handle = $("#handle");
  if (!slider) return;
  const set = v => { before.style.width = v + "%"; handle.style.left = v + "%"; };
  slider.addEventListener("input", e => set(e.target.value));
  set(50);
})();

/* ---------- Sticky bottom bar ---------- */
(function stickybar(){
  const bar = $("#stickybar");
  const anchor = $("#addToCart"); // main buy CTA in the hero
  if (!bar || !anchor) return;
  document.body.classList.add("has-sticky");
  function update(){
    // show the sticky bar once the hero's Add-to-basket button scrolls out of view
    const r = anchor.getBoundingClientRect();
    const outOfView = r.bottom < 10 || r.top > window.innerHeight;
    bar.classList.toggle("show", outOfView);
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
  // clicking the sticky CTA scrolls to the variant selector so they can choose & buy
  $("#stickyBuy").addEventListener("click", () => {
    const target = document.querySelector("#variants") || document.querySelector("#top");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // briefly highlight the variants to draw the eye
    const v = document.querySelector("#variants");
    if (v){
      v.classList.add("flash");
      setTimeout(() => v.classList.remove("flash"), 1400);
    }
  });
})();

/* ---------- How-it-works videos (chained autoplay + tap to play + sound) ---------- */
(function videos(){
  const grid = $("#videoGrid");
  if (!grid) return;
  const cards = [...grid.querySelectorAll(".vcard")];
  const vids = cards.map(c => c.querySelector("video"));
  let current = 0;
  let started = false;

  function setActive(i){
    cards.forEach((c, idx) => c.classList.toggle("is-active", idx === i));
  }
  function markPlaying(i, playing){
    cards[i].classList.toggle("is-playing", playing);
  }

  function play(i){
    current = i;
    setActive(i);
    // pause the others
    vids.forEach((v, idx) => { if (idx !== i){ v.pause(); markPlaying(idx, false); } });
    const v = vids[i];
    v.currentTime = 0;
    const p = v.play();
    if (p && p.catch) p.catch(() => { markPlaying(i, false); });
  }

  // chain: when one ends, play the next (loop back to first after the last)
  vids.forEach((v, i) => {
    v.addEventListener("play",  () => markPlaying(i, true));
    v.addEventListener("pause", () => markPlaying(i, false));
    v.addEventListener("ended", () => {
      markPlaying(i, false);
      const next = (i + 1) % vids.length;
      play(next);
    });
    // tap the video to (re)play just that one
    v.addEventListener("click", (e) => {
      // ignore clicks on the mute button (handled separately)
      if (e.target.closest(".vcard__mute")) return;
      if (v.paused) play(i); else { v.pause(); }
    });
  });

  // mute / unmute per card (keeps others muted so only one sound plays)
  cards.forEach((card, i) => {
    const btn = card.querySelector(".vcard__mute");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const v = vids[i];
      const willUnmute = v.muted;
      // mute all first so only one has sound
      vids.forEach((vv, idx) => {
        vv.muted = true;
        cards[idx].querySelector(".vcard__mute use").setAttribute("href", "#i-muted");
      });
      if (willUnmute){
        v.muted = false;
        btn.querySelector("use").setAttribute("href", "#i-sound2");
        if (v.paused) play(i);
      }
    });
  });

  // start chain (muted autoplay) when the section scrolls into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting && !started){
        started = true;
        play(0);
      }
    });
  }, { threshold: 0.4 });
  io.observe(grid);
})();

/* ---------- Contact form ---------- */
(function contact(){
  const form = $("#contactForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#c_name").value.trim();
    const email = $("#c_email").value.trim();
    const msg = $("#c_msg").value.trim();
    if (!name || !email.includes("@") || !msg){
      $("#contactNote").textContent = "Please fill in all fields with a valid email.";
      $("#contactNote").style.color = "#b4353a";
      return;
    }
    // Open user's email client pre-filled to our support address
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(`${msg}\n\nFrom: ${name} (${email})`);
    window.location.href = `mailto:corpusenigma4@gmail.com?subject=${subject}&body=${body}`;
    $("#contactNote").style.color = "var(--brand)";
    $("#contactNote").textContent = "Opening your email app… if nothing happens, email us at corpusenigma4@gmail.com";
    form.reset();
  });
})();

/* ---------- Cart / Checkout ---------- */
const drawer = $("#cartDrawer");
let checkoutStep = 0;
let order = {};

function openDrawer(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); }
function closeDrawer(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); }
$$("[data-close]").forEach(el => el.addEventListener("click", closeDrawer));

function currentItem(){
  const v = VARIANTS[state.variant];
  return { ...v, qty: state.qty, key: state.variant };
}
function totals(item){
  const sub = item.price * item.qty;
  return { sub, shipping: 0, total: sub };
}
function addToCart(){
  order.item = currentItem();
  checkoutStep = 0;
  renderDrawer();
  openDrawer();
}
$("#addToCart").addEventListener("click", addToCart);
["#ctaBuy","#guaranteeBuy"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("click", () => { addToCart(); });
});

/* ---------- PayPal live buttons ---------- */
function renderPayPalButtons(amount){
  const mount = $("#paypal-buttons");
  const fallback = $("#ppFallback");
  if (!mount) return;

  // If the SDK failed to load (network/blocked/invalid id), show a graceful message
  if (typeof paypal === "undefined" || !paypal.Buttons){
    fallback.innerHTML = "Secure PayPal checkout could not load right now. Please refresh, or email us at <a href='mailto:corpusenigma4@gmail.com'>corpusenigma4@gmail.com</a> and we'll help you complete your order.";
    return;
  }

  try {
    paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },

      createOrder: function(data, actions){
        return actions.order.create({
          purchase_units: [{
            description: order.item.name,
            amount: {
              currency_code: "GBP",
              value: amount.toFixed(2)
            }
          }],
          application_context: { shipping_preference: "NO_SHIPPING" }
        });
      },

      onApprove: function(data, actions){
        return actions.order.capture().then(function(details){
          order.paypal = {
            id: (details && details.id) || data.orderID,
            payer: details && details.payer
          };
          checkoutStep = 3;
          renderDrawer();
        });
      },

      onError: function(err){
        console.error("PayPal error:", err);
        fallback.innerHTML = "There was a problem starting the payment. Please try again, or email <a href='mailto:corpusenigma4@gmail.com'>corpusenigma4@gmail.com</a>.";
      }
    }).render("#paypal-buttons").catch(function(e){
      console.error("PayPal render failed:", e);
      fallback.innerHTML = "Secure PayPal checkout could not load. Please refresh or contact corpusenigma4@gmail.com.";
    });
  } catch(e){
    console.error(e);
    fallback.textContent = "Secure checkout could not load. Please refresh the page.";
  }
}

function renderDrawer(){
  const item = order.item;
  const t = totals(item);
  const title = $("#drawerTitle");
  const body = $("#drawerBody");
  const foot = $("#drawerFoot");

  const steps = `<div class="steps">
    <div class="${checkoutStep>=0?'on':''}"></div>
    <div class="${checkoutStep>=1?'on':''}"></div>
    <div class="${checkoutStep>=2?'on':''}"></div></div>`;

  const summary = `<div class="summary">
    <div class="summary__row"><span>Subtotal</span><span>${gbp(t.sub)}</span></div>
    <div class="summary__row"><span>Shipping</span><span>FREE</span></div>
    <div class="summary__row summary__row--total"><span>Total</span><span>${gbp(t.total)}</span></div>
  </div>`;

  // static line item (used on details/payment steps)
  const lineItem = `<div class="line-item">
      <img src="${item.img}" alt="${item.name}" />
      <div class="line-item__info"><b>${item.name}</b><span>Qty: ${item.qty}</span></div>
      <div class="line-item__price">${gbp(item.price*item.qty)}</div>
    </div>`;

  if (checkoutStep === 0){
    title.textContent = "Your basket";
    // editable line item with quantity stepper
    const editItem = `<div class="line-item">
        <img src="${item.img}" alt="${item.name}" />
        <div class="line-item__info">
          <b>${item.name}</b>
          <span>${gbp(item.price)} each</span>
          <div class="qty qty--sm" id="cartQty">
            <button type="button" data-cq="-1" aria-label="Remove one">&minus;</button>
            <input type="text" value="${item.qty}" readonly aria-label="Quantity" />
            <button type="button" data-cq="1" aria-label="Add one">+</button>
          </div>
        </div>
        <div class="line-item__price">${gbp(item.price*item.qty)}</div>
      </div>`;
    body.innerHTML = steps + editItem + summary +
      `<p class="trust-line"><svg class="i" style="width:1em;height:1em;vertical-align:-.12em"><use href="#i-lock"/></svg> Secure checkout · Free UK shipping · 90-day guarantee</p>`;
    foot.innerHTML = `<button class="btn btn--primary btn--block btn--lg" id="toDetails">Continue — ${gbp(t.total)}</button>`;
    $("#toDetails").addEventListener("click", () => { checkoutStep = 1; renderDrawer(); });
    // quantity stepper updates the order and re-renders totals
    $("#cartQty").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const d = +b.dataset.cq;
      order.item.qty = Math.max(1, Math.min(10, order.item.qty + d));
      state.qty = order.item.qty;
      const qEl = $("#qty"); if (qEl) qEl.value = state.qty;
      renderDrawer();
    }));
  }
  else if (checkoutStep === 1){
    title.textContent = "Your details";
    body.innerHTML = steps + `
      <p class="form-title">Contact &amp; delivery address</p>
      <div class="field"><label>Email</label><input id="f_email" type="email" placeholder="you@email.co.uk" required></div>
      <div class="field-row">
        <div class="field"><label>First name</label><input id="f_first" placeholder="Jane"></div>
        <div class="field"><label>Last name</label><input id="f_last" placeholder="Smith"></div>
      </div>
      <div class="field"><label>Address</label><input id="f_addr" placeholder="12 High Street"></div>
      <div class="field-row">
        <div class="field"><label>Town / City</label><input id="f_city" placeholder="Manchester"></div>
        <div class="field"><label>Postcode</label><input id="f_post" placeholder="M1 2AB"></div>
      </div>
      <div class="field"><label>Country</label><input value="United Kingdom" readonly></div>
      <div class="field"><label>Phone (optional)</label><input id="f_phone" placeholder="07123 456789"></div>
      ${summary}`;
    foot.innerHTML = `<button class="btn btn--primary btn--block btn--lg" id="toPay">Continue to payment</button>
      <button class="btn btn--ghost btn--block" id="backBasket" style="margin-top:8px">Back to basket</button>`;
    $("#backBasket").addEventListener("click", () => { checkoutStep = 0; renderDrawer(); });
    $("#toPay").addEventListener("click", () => {
      const email = $("#f_email").value.trim();
      const first = $("#f_first").value.trim();
      const post = $("#f_post").value.trim();
      if (!email || !email.includes("@") || !first || !post){
        alert("Please fill in your email, first name and postcode to continue.");
        return;
      }
      order.customer = {
        email, first, last: $("#f_last").value.trim(),
        addr: $("#f_addr").value.trim(), city: $("#f_city").value.trim(),
        post, phone: $("#f_phone").value.trim()
      };
      checkoutStep = 2; renderDrawer();
    });
  }
  else if (checkoutStep === 2){
    title.textContent = "Payment";
    body.innerHTML = steps + lineItem + summary + `
      <div class="paypal-live">
        <p class="pp-secure"><svg class="i"><use href="#i-lock"/></svg> Pay securely with PayPal, Visa or Mastercard</p>
        <div id="paypal-buttons"></div>
        <p class="pp-fallback" id="ppFallback"></p>
      </div>`;
    foot.innerHTML = `<button class="btn btn--ghost btn--block" id="backDetails">Back to details</button>`;
    $("#backDetails").addEventListener("click", () => { checkoutStep = 1; renderDrawer(); });
    renderPayPalButtons(t.total);
  }
  else if (checkoutStep === 3){
    const orderNo = order.paypal?.id || ("RG" + Math.floor(100000 + Math.random()*900000));
    const payerName = order.paypal?.payer?.name?.given_name || order.customer?.first || "friend";
    title.textContent = "Order confirmed";
    body.innerHTML = `<div class="success">
      <div class="success__ico">✓</div>
      <h3>Thank you, ${payerName}!</h3>
      <p style="color:var(--muted)">Your payment was successful and your order <b>#${orderNo}</b> has been placed.<br>
      A confirmation will be sent to <b>${order.customer?.email || (order.paypal?.payer?.email_address || "")}</b>.</p>
      <p style="color:var(--muted);font-size:.85rem;margin-top:14px">
      We'll dispatch your ReviveGrow&trade; soon. Estimated UK delivery is 3&ndash;5 working days.</p>
    </div>`;
    foot.innerHTML = `<button class="btn btn--primary btn--block" data-close>Continue shopping</button>`;
    foot.querySelector("[data-close]").addEventListener("click", closeDrawer);
  }
}
