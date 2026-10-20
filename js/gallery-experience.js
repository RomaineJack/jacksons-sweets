/* Jackson's Sweets gallery filters and accessible photo viewer. */
(function () {
  const uploaded = document.getElementById("publicGalleryGrid");
  const curated = document.getElementById("curatedGalleryGrid");
  if (!uploaded || !curated) return;
  const labels = {custom:"Custom Orders",events:"Events",holiday:"Holidays",flavors:"Flavors",wedding:"Weddings"};
  const filterButtons = [...document.querySelectorAll(".gallery-filters .filter-button")];
  let activeFilter = "all", current = null, previousFocus = null;
  const cards = () => [...uploaded.querySelectorAll(".gallery-item"),...curated.querySelectorAll(".gallery-item")];
  function decorate() {
    cards().forEach(card => {
      if (card.dataset.galleryReady) return;
      const image = card.querySelector("img");
      if (!image) return;
      const title = (image.alt || "Custom Cakesicle Creation").trim();
      if (!card.querySelector(".gallery-card-body")) {
        const body = document.createElement("div");
        body.className = "gallery-card-body";
        const category = document.createElement("span");
        category.className = "gallery-card-category";
        category.textContent = labels[card.dataset.category] || "Our Creations";
        const heading = document.createElement("h3");
        heading.className = "gallery-card-title"; heading.textContent = title;
        body.append(category,heading);
        card.append(body);
      }
      card.tabIndex = 0;
      card.setAttribute("role","button");
      card.setAttribute("aria-label","View " + title);
      image.loading = "lazy";
      card.dataset.galleryReady = "true";
    });
  }
  const visible = () => cards().filter(card => !card.classList.contains("hidden"));
  function applyFilter() {
    cards().forEach(card => card.classList.toggle("hidden",activeFilter!=="all" && card.dataset.category!==activeFilter));
    filterButtons.forEach(btn => {
      let selected = btn.dataset.filter===activeFilter;
      btn.classList.toggle("active-filter",selected);btn.setAttribute("aria-pressed",String(selected));
    });
    status.textContent = visible().length ? "" : "No photos in this category yet.";
  }
  const status=document.createElement("p");
  status.className="gallery-empty-note";status.setAttribute("aria-live","polite");
  curated.after(status);
  const oldLightbox=document.getElementById("lightbox");
  if(oldLightbox) oldLightbox.remove();
  const dialog=document.createElement("div");
  dialog.className="portfolio-viewer";
  dialog.setAttribute("role","dialog");
  dialog.setAttribute("aria-modal","true");
  dialog.setAttribute("aria-label","Cakesicle gallery photo viewer");
  dialog.innerHTML=`<div class="portfolio-viewer-panel">
    <div class="portfolio-viewer-toolbar"><div class="portfolio-viewer-count"></div><button type="button" class="portfolio-viewer-close" aria-label="Close gallery">×</button></div>
    <div class="portfolio-viewer-stage"><button type="button" class="portfolio-viewer-arrow portfolio-viewer-prev" aria-label="Previous photo">‹</button><img class="portfolio-viewer-image" alt=""><button type="button" class="portfolio-viewer-arrow portfolio-viewer-next" aria-label="Next photo">›</button></div>
    <div class="portfolio-viewer-details"><strong class="portfolio-viewer-title"></strong><span class="portfolio-viewer-category"></span></div>
    <div class="portfolio-viewer-thumbnails" aria-label="Photo thumbnails"></div>
  </div>`;
  document.body.append(dialog);
  const image=dialog.querySelector(".portfolio-viewer-image");
  const thumbnails=dialog.querySelector(".portfolio-viewer-thumbnails");
  const title=dialog.querySelector(".portfolio-viewer-title");
  const category=dialog.querySelector(".portfolio-viewer-category");
  const count=dialog.querySelector(".portfolio-viewer-count");
  const prev=dialog.querySelector(".portfolio-viewer-prev");
  const next=dialog.querySelector(".portfolio-viewer-next");
  function showCard(card) {
    if(!card) return;
    current=card;
    const img=card.querySelector("img");
    image.src=img.currentSrc||img.src;
    image.alt=img.alt||"Cakesicle photo";
    title.textContent=card.querySelector(".gallery-card-title")?.textContent||image.alt;
    category.textContent=card.querySelector(".gallery-card-category")?.textContent||"Our Creations";
    const items=visible();
    count.textContent=(items.indexOf(card)+1)+" / "+items.length;
    thumbnails.replaceChildren();
    items.forEach((item,i)=>{
      const thumb=document.createElement("button");
      thumb.type="button";thumb.className="portfolio-viewer-thumb";
      thumb.setAttribute("aria-label","View photo "+(i+1));
      thumb.setAttribute("aria-current",String(item===card));
      const small=document.createElement("img");
      small.src=item.querySelector("img").src;small.alt="";small.loading="lazy";
      thumb.append(small);thumb.addEventListener("click",()=>showCard(item));
      thumbnails.append(thumb);
      if(item===card) requestAnimationFrame(()=>thumb.scrollIntoView({block:"nearest",inline:"nearest"}));
    });
    prev.hidden=next.hidden=items.length<2;
  }
  function open(card) {
    previousFocus=document.activeElement;
    showCard(card);dialog.classList.add("active");document.body.style.overflow="hidden";
    dialog.querySelector(".portfolio-viewer-close").focus();
  }
  function close() {
    dialog.classList.remove("active");document.body.style.overflow="";
    image.removeAttribute("src");
    previousFocus?.focus?.();current=null;
  }
  function move(offset) {
    const items=visible();if(!items.length)return;
    showCard(items[(items.indexOf(current)+offset+items.length)%items.length]);
  }
  dialog.querySelector(".portfolio-viewer-close").addEventListener("click",close);
  prev.addEventListener("click",()=>move(-1));next.addEventListener("click",()=>move(1));
  dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
  document.addEventListener("keydown",e=>{
    if(!dialog.classList.contains("active"))return;
    if(e.key==="Escape"){e.preventDefault();close();}
    else if(e.key==="ArrowLeft"){e.preventDefault();move(-1);}
    else if(e.key==="ArrowRight"){e.preventDefault();move(1);}
    else if(e.key==="Tab"){
      const focusable=[...dialog.querySelectorAll("button:not([hidden])")];
      let index=focusable.indexOf(document.activeElement);
      if(e.shiftKey && index<=0){e.preventDefault();focusable[focusable.length-1]?.focus();}
      else if(!e.shiftKey && index===focusable.length-1){e.preventDefault();focusable[0]?.focus();}
    }
  });
  document.addEventListener("click",e=>{
    const card=e.target.closest?.(".gallery-item");
    if(card && (uploaded.contains(card)||curated.contains(card)))open(card);
  });
  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ")return;
    const card=e.target.closest?.(".gallery-item");
    if(card && (uploaded.contains(card)||curated.contains(card))&&!dialog.classList.contains("active")){
      e.preventDefault();open(card);
    }
  });
  filterButtons.forEach(btn=>btn.addEventListener("click",()=>{activeFilter=btn.dataset.filter||"all";applyFilter();}));
  function refresh(){decorate();applyFilter();}
  document.addEventListener("jacksons:gallery-updated",refresh);
  new MutationObserver(refresh).observe(uploaded,{childList:true});
  refresh();
})();
