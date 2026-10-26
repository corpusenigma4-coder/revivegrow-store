"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const home=read("index.html"),detail=read("producto.html"),css=read("styles.css");
function testHTML(name,html){
 assert.match(html,/<!doctype html>/i,name+" doctype");
 assert.match(html,/<html lang="es">/,name+" language");
 assert.match(html,/<meta name="viewport"/,name+" viewport");
 assert.match(html,/<main>[\s\S]*<\/main>/,name+" main");
 assert.match(html,/<footer class="footer">/,name+" footer");
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,name+" duplicated DOM id");
 for(const id of ["burger","searchToggle","searchBar","searchInput","mobileNav","cartToggle","cartCount","overlay","cartDrawer","cartClose","cartBody","cartFoot","toast"]){
  assert.ok(ids.includes(id),name+" missing "+id);
 }
 for(const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)){
  const src=match[1];
  if(/^(?:https?:|mailto:|tel:|#|data:)/i.test(src))continue;
  const relative=src.split(/[?#]/)[0];
  if(!relative)continue;
  assert.ok(fs.existsSync(path.join(root,relative)),name+": missing "+relative);
 }
 assert.ok(html.includes('src="store.js')&&html.includes('src="experience.js'),name+" scripts missing");
}
testHTML("home",home);testHTML("product",detail);
for(const id of ["catalogo","colecciones","filters","productGrid","catGrid","catalogCount"]){
 assert.ok(home.includes('id="'+id+'"'),"missing catalog "+id);
}
assert.ok(home.indexOf('id="catalogo"')<home.indexOf('id="colecciones"'),"catalog must appear first");
assert.ok(detail.includes('id="productRoot"')&&detail.includes('id="lightbox"'),"product details missing");
assert.ok(css.length>15000,"design system truncated");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"CSS braces imbalance");
assert.ok(css.includes("@media(max-width:559px)")&&css.includes("@media(min-width:850px)"),"breakpoint missing");
const context={window:{}};vm.runInNewContext(read("data/products.js"),context,{filename:"data/products.js"});
const data=context.window.MINI_DREAMS_DATA;
assert.ok(data.PRODUCTS.length>=4,"missing products");
assert.ok(data.COLLECTIONS.some(c=>c.id==="halloween")&&data.COLLECTIONS.some(c=>c.id==="navidad"),"categories missing");
const seen=new Set();
for(const p of data.PRODUCTS){
 assert.ok(p.id&&p.slug&&p.name,"incomplete product");
 assert.ok(!seen.has(p.slug),"duplicate slug "+p.slug);seen.add(p.slug);
 assert.ok(p.images.main,"missing main illustration "+p.slug);
 assert.ok(fs.existsSync(path.join(root,p.images.main)),"image missing "+p.images.main);
 assert.ok(p.previewArt || p.galleryLabels,"every image must be a concept or a gallery photo "+p.slug);
 if(!p.__dev)assert.ok(p.price===null||typeof p.price==="number","invalid price "+p.slug);
}
assert.match(read("paypal.js"),/enabled:\s*false/,"PayPal must remain disabled");
assert.ok(home.includes("Bunny Dream") && detail.includes("productRoot"),"featured product missing");
const bunny=data.PRODUCTS.find(p=>p.slug==="conejito");
assert.equal(bunny.price,23.55);
assert.equal(bunny.sizes.length,5);
assert.ok(bunny.sizes.every(s=>s.available===true));
for(const src of [bunny.images.main,bunny.images.front,bunny.images.side,bunny.images.back,...bunny.images.details])assert.ok(fs.existsSync(path.join(root,src)),"high-res image missing "+src);
assert.equal(bunny.galleryLabels.length,5);
assert.ok(data.PRODUCTS.filter(p=>p.published!==false).length===1,"only Bunny Dream should be public");
assert.equal(bunny.returns.includes("90"),true);
console.log("OK: structure, unique IDs, valid links and assets, catalog data, responsive styles, safe PayPal settings.");
