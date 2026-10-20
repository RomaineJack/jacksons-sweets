/* Jackson's Sweets gallery presentation and navigation. */
(function () {
    const dynamicGrid = document.getElementById("publicGalleryGrid");
    const curatedGrid = document.getElementById("curatedGalleryGrid");
    if (!dynamicGrid || !curatedGrid) return;

    const labels = {
        custom: "Custom Orders", events: "Events", holiday: "Holidays",
        flavors: "Flavors", wedding: "Weddings"
    };
    const buttons = Array.from(document.querySelectorAll(".gallery-filters .filter-button"));
    let activeFilter = "all";
    let activeImage = null;

    function cards() {
        return Array.from(document.querySelectorAll("#publicGalleryGrid .gallery-item, #curatedGalleryGrid .gallery-item"));
    }
    function decorate() {
        cards().forEach(card => {
            if (card.dataset.portfolioReady === "true") return;
            const img = card.querySelector("img");
            if (!img) return;
            const title = (img.alt || "Custom cakesicle creation").trim();
            const body = document.createElement("div");
            body.className = "gallery-card-body";
            const category = document.createElement("span");
            category.className = "gallery-card-category";
            category.textContent = labels[card.dataset.category] || "Our Creations";
            const heading = document.createElement("h3");
            heading.className = "gallery-card-title";
            heading.textContent = title;
            body.append(category, heading);
            card.appendChild(body);
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", "Enlarge " + title);
            img.loading = "lazy";
            card.dataset.portfolioReady = "true";
        });
    }
    function filter() {
        cards().forEach(card => {
            card.classList.toggle("hidden", activeFilter !== "all" && card.dataset.category !== activeFilter);
        });
        buttons.forEach(button => {
            const selected = button.dataset.filter === activeFilter;
            button.classList.toggle("active-filter", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
        const status = document.getElementById("galleryFilterStatus");
        if (status) {
            const visible = cards().filter(card => !card.classList.contains("hidden")).length;
            status.textContent = visible ? "" : "No photos in this category yet.";
        }
    }
    function visibleImages() {
        return cards().filter(card => !card.classList.contains("hidden")).map(card => card.querySelector("img")).filter(Boolean);
    }

    const status = document.createElement("p");
    status.id = "galleryFilterStatus";
    status.className = "gallery-empty-note";
    status.setAttribute("aria-live", "polite");
    curatedGrid.insertAdjacentElement("afterend", status);

    const lightbox = document.getElementById("lightbox");
    const bigImage = document.getElementById("lightboxImage");
    if (lightbox && bigImage) {
        const caption = document.createElement("div");
        caption.className = "gallery-experience-caption";
        const prev = document.createElement("button");
        const next = document.createElement("button");
        prev.type = next.type = "button";
        prev.className = "gallery-experience-nav gallery-experience-prev";
        next.className = "gallery-experience-nav gallery-experience-next";
        prev.textContent = "‹"; next.textContent = "›";
        prev.setAttribute("aria-label", "Previous photo");
        next.setAttribute("aria-label", "Next photo");
        lightbox.append(prev, next, caption);
        function show(img) {
            if (!img) return;
            activeImage = img;
            bigImage.src = img.currentSrc || img.src;
            bigImage.alt = img.alt || "Cakesicle photo";
            caption.textContent = img.alt || "Jackson's Sweets creation";
            lightbox.classList.add("active", "gallery-experience-open");
            document.body.style.overflow = "hidden";
            const many = visibleImages().length > 1;
            prev.hidden = next.hidden = !many;
        }
        function navigate(direction) {
            const images = visibleImages();
            const at = images.indexOf(activeImage);
            if (!images.length) return;
            show(images[(at + direction + images.length) % images.length]);
        }
        prev.addEventListener("click", event => { event.stopPropagation(); navigate(-1); });
        next.addEventListener("click", event => { event.stopPropagation(); navigate(1); });
        document.addEventListener("keydown", event => {
            if (!lightbox.classList.contains("active")) return;
            if (event.key === "ArrowLeft") navigate(-1);
            if (event.key === "ArrowRight") navigate(1);
        });
        document.addEventListener("click", event => {
            const image = event.target.closest && event.target.closest(".gallery-item img");
            if (image && (dynamicGrid.contains(image) || curatedGrid.contains(image))) show(image);
        });
        document.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const card = event.target.closest && event.target.closest(".gallery-item");
            if (!card || !(dynamicGrid.contains(card) || curatedGrid.contains(card))) return;
            event.preventDefault();
            show(card.querySelector("img"));
        });
        lightbox.addEventListener("click", () => {
            if (!lightbox.classList.contains("active")) {
                activeImage = null;
                lightbox.classList.remove("gallery-experience-open");
            }
        });
    }
    buttons.forEach(button => button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";
        filter();
    }));
    function refresh() { decorate(); filter(); }
    document.addEventListener("jacksons:gallery-updated", refresh);
    refresh();
})();
