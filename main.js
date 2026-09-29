/* ===== ReviveGrow store logic ===== */
const CDN = "https://cdn.shopify.com/s/files/1/0749/5234/3703/files/";
const IMAGES = [
  "01_ReviveGrow_Hero.jpg?v=1790574236",
  "02_ReviveGrow_Retractable_Handle.jpg?v=1790574236",
  "03_ReviveGrow_Features.jpg?v=1790574236",
  "04_ReviveGrow_Filtration.jpg?v=1790574236",
  "05_ReviveGrow_Tabletop_Design.jpg?v=1790574236",
  "06_ReviveGrow_Water_Tank.jpg?v=1790574236"
].map(f => CDN + f + "&width=1000");

const VARIANTS = {
  pro:   { name: "ReviveGrow™ Pro 1L + free gift",   price: 29.99, was: 60, img: IMAGES[0] },
  super: { name: "ReviveGrow™ Super 2L + free gift", price: 44.99, was: 60, img: IMAGES[4] }
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
    im.src = src.replace("width=1000","width=200");
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
  const p = VARIANTS[state.variant].price;
  if ($("#atcPrice")) $("#atcPrice").textContent = gbp(p);
  if ($("#stickyPrice")) $("#stickyPrice").textContent = gbp(p);
}
$$('input[name="variant"]').forEach(r => r.addEventListener("change", e => {
  state.variant = e.target.value;
  $("#mainImg").src = VARIANTS[state.variant].img;
  $$(".gallery__thumbs img").forEach(t => t.classList.remove("is-active"));
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

/* ---------- Sticky mobile bar ---------- */
(function stickybar(){
  const bar = $("#stickybar");
  const hero = $(".hero");
  if (!bar || !hero) return;
  window.addEventListener("scroll", () => {
    const past = hero.getBoundingClientRect().bottom < 0;
    bar.classList.toggle("show", past);
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
["#ctaBuy","#openCartTop","#guaranteeBuy","#stickyBuy"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("click", () => { addToCart(); });
});

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

  const lineItem = `<div class="line-item">
      <img src="${item.img}" alt="${item.name}" />
      <div class="line-item__info"><b>${item.name}</b><span>Qty: ${item.qty}</span></div>
      <div class="line-item__price">${gbp(item.price*item.qty)}</div>
    </div>`;

  if (checkoutStep === 0){
    title.textContent = "Your basket";
    body.innerHTML = steps + lineItem + summary +
      `<p class="trust-line">🔒 Secure checkout · Free UK shipping · 90-day guarantee</p>`;
    foot.innerHTML = `<button class="btn btn--primary btn--block btn--lg" id="toDetails">Checkout — ${gbp(t.total)}</button>`;
    $("#toDetails").addEventListener("click", () => { checkoutStep = 1; renderDrawer(); });
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
      <div class="paypal-mock">
        <div class="testbadge">TEST MODE — no real payment taken</div>
        <button class="pp-btn" id="ppBtn">Pay ${gbp(t.total)} with PayPal</button>
        <p class="pp-note">Secure checkout. When your live PayPal Business account is connected,
        this button will process real payments in GBP. Card payments (Visa / Mastercard) are handled through PayPal.</p>
      </div>`;
    foot.innerHTML = `<button class="btn btn--ghost btn--block" id="backDetails">Back to details</button>`;
    $("#backDetails").addEventListener("click", () => { checkoutStep = 1; renderDrawer(); });
    $("#ppBtn").addEventListener("click", () => {
      const btn = $("#ppBtn");
      btn.textContent = "Processing…"; btn.disabled = true;
      setTimeout(() => { checkoutStep = 3; renderDrawer(); }, 1100);
    });
  }
  else if (checkoutStep === 3){
    const orderNo = "RG" + Math.floor(100000 + Math.random()*900000);
    title.textContent = "Order confirmed";
    body.innerHTML = `<div class="success">
      <div class="success__ico">✓</div>
      <h3>Thank you, ${order.customer?.first || "friend"}!</h3>
      <p style="color:var(--muted)">Your test order <b>#${orderNo}</b> has been placed.<br>
      A confirmation would be sent to <b>${order.customer?.email || ""}</b>.</p>
      <p style="color:var(--muted);font-size:.85rem;margin-top:14px">
      This was a test transaction — no payment was taken. Connect your PayPal Business account to go live.</p>
    </div>`;
    foot.innerHTML = `<button class="btn btn--primary btn--block" data-close>Continue shopping</button>`;
    foot.querySelector("[data-close]").addEventListener("click", closeDrawer);
  }
}
