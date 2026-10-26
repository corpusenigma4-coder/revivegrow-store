/* Mini Dreams — tiny progressive enhancements, no external runtime. */
(function(){
 "use strict";
 function $(s,r){return (r||document).querySelector(s)}
 function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
 function init(){
   var menu=$("#mobileNav"), burger=$("#burger"), search=$("#searchInput"), go=$(".searchbar__go");
   if(menu&&burger){
     $$(".mobilenav a",menu).forEach(function(link){
       link.addEventListener("click",function(){
         if(!menu.hidden)burger.click();
       });
     });
   }
   if(search&&go){
     function updateGo(){
       var q=search.value.trim();
       var onHome=document.body.dataset.view==="home";
       go.href=(onHome?"":"index.html")+(q?"?q="+encodeURIComponent(q):"")+"#catalogo";
     }
     search.addEventListener("input",updateGo);
     updateGo();
   }
   var filters=$("#filters");
   if(filters){
     filters.addEventListener("keydown",function(e){
       if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft"&&e.key!=="Home"&&e.key!=="End")return;
       var tabs=$$('[role="tab"]',filters);
       var i=tabs.indexOf(document.activeElement);
       if(!tabs.length)return;
       var n=e.key==="Home"?0:e.key==="End"?tabs.length-1:(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
       e.preventDefault();
       tabs[n].focus();
       tabs[n].click();
     });
   }
   var stamp=$(".hero__stamp");
   if(stamp)stamp.setAttribute("aria-hidden","true");
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
 else init();
})();