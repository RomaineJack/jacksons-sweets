/* =========================================================
   JACKSON'S SWEETS
   UNIVERSAL IMAGE LIGHTBOX
   Opens all public site images except the logo.
========================================================= */

(function () {
    let lightbox = document.getElementById("lightbox");
    let lightboxImage = document.getElementById("lightboxImage");
    let lightboxClose = document.getElementById("lightboxClose");

    function createLightbox() {
        if (lightbox && lightboxImage && lightboxClose) {
            return;
        }

        lightbox = document.createElement("div");
        lightbox.id = "lightbox";
        lightbox.className = "lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.setAttribute("aria-label", "Expanded image");

        lightboxClose = document.createElement("button");
        lightboxClose.id = "lightboxClose";
        lightboxClose.className = "lightbox-close";
        lightboxClose.type = "button";
        lightboxClose.setAttribute("aria-label", "Close image");
        lightboxClose.textContent = "×";

        lightboxImage = document.createElement("img");
        lightboxImage.id = "lightboxImage";
        lightboxImage.alt = "";

        lightbox.appendChild(lightboxClose);
        lightbox.appendChild(lightboxImage);
        document.body.appendChild(lightbox);
    }

    function closeLightbox() {
        if (!lightbox) return;

        lightbox.classList.remove("active");
        document.body.style.overflow = "";

        if (lightboxImage) {
            lightboxImage.src = "";
            lightboxImage.alt = "";
        }
    }

    function openLightbox(image) {
        createLightbox();

        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || "Expanded image";
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    createLightbox();

    document.addEventListener("click", function (event) {
        const image = event.target.closest("img");

        if (!image) return;

        // Keep the Jackson's Sweets logo acting only as a home link.
        if (
            image.classList.contains("logo") ||
            image.closest(".logo-link") ||
            image.id === "lightboxImage"
        ) {
            return;
        }

        openLightbox(image);
    });

    document.addEventListener("mouseover", function (event) {
        const image = event.target.closest("img");

        if (
            !image ||
            image.classList.contains("logo") ||
            image.closest(".logo-link") ||
            image.id === "lightboxImage"
        ) {
            return;
        }

        image.style.cursor = "zoom-in";
    });

    lightboxClose.addEventListener("click", function (event) {
        event.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && lightbox.classList.contains("active")) {
            closeLightbox();
        }
    });
})();
