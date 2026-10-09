/* =========================================================
   JACKSON'S SWEETS
   MAIN WEBSITE JAVASCRIPT
========================================================= */


/* =========================================================
   SAFE HTML OUTPUT
========================================================= */

function escapePublicHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   PROTECTED PUBLIC FORM SUBMISSIONS
========================================================= */

const TURNSTILE_SITE_KEY =
    "0x4AAAAAAFR3PjNtTstlMtIN";

const PUBLIC_FORM_ENDPOINT =
    "https://mlahgbznunnuhrcohvpb.supabase.co/functions/v1/submit-public-form";


const turnstileWidgets =
    new Map();

let turnstileLoadPromise =
    null;


/* =========================================================
   LOAD CLOUDFLARE TURNSTILE
========================================================= */

function loadTurnstileScript() {

    if (
        window.turnstile &&
        typeof window.turnstile.render ===
            "function"
    ) {

        return Promise.resolve();

    }


    if (turnstileLoadPromise) {

        return turnstileLoadPromise;

    }


    turnstileLoadPromise =
        new Promise(
            (resolve, reject) => {

                const existingScript =
                    document.querySelector(
                        'script[data-jacksons-turnstile="true"]'
                    );


                if (existingScript) {

                    const waitForTurnstile =
                        setInterval(
                            () => {

                                if (
                                    window.turnstile &&
                                    typeof window.turnstile.render ===
                                        "function"
                                ) {

                                    clearInterval(
                                        waitForTurnstile
                                    );

                                    resolve();

                                }

                            },
                            100
                        );


                    setTimeout(
                        () => {

                            clearInterval(
                                waitForTurnstile
                            );


                            if (
                                !window.turnstile ||
                                typeof window.turnstile.render !==
                                    "function"
                            ) {

                                reject(
                                    new Error(
                                        "Turnstile failed to load."
                                    )
                                );

                            }

                        },
                        10000
                    );


                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

                script.async =
                    true;

                script.defer =
                    true;

                script.dataset.jacksonsTurnstile =
                    "true";


                script.onload =
                    () => {

                        const waitForTurnstile =
                            setInterval(
                                () => {

                                    if (
                                        window.turnstile &&
                                        typeof window.turnstile.render ===
                                            "function"
                                    ) {

                                        clearInterval(
                                            waitForTurnstile
                                        );

                                        resolve();

                                    }

                                },
                                100
                            );

                    };


                script.onerror =
                    () => {

                        reject(
                            new Error(
                                "Turnstile failed to load."
                            )
                        );

                    };


                document.head.appendChild(
                    script
                );

            }
        );


    return turnstileLoadPromise;

}



/* =========================================================
   CREATE TURNSTILE WIDGET FOR FORM
========================================================= */

async function setupTurnstileForForm(
    form
) {

    if (!form) {

        return null;

    }


    await loadTurnstileScript();


    if (
        turnstileWidgets.has(
            form
        )
    ) {

        return turnstileWidgets.get(
            form
        );

    }


    let container =
        form.querySelector(
            ".jacksons-turnstile"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "jacksons-turnstile";


        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );


        if (submitButton) {

            submitButton.parentNode.insertBefore(
                container,
                submitButton
            );

        } else {

            form.appendChild(
                container
            );

        }

    }


    const widgetId =
        window.turnstile.render(
            container,
            {

                sitekey:
                    TURNSTILE_SITE_KEY,

                theme:
                    "auto"

            }
        );


    turnstileWidgets.set(
        form,
        widgetId
    );


    return widgetId;

}



/* =========================================================
   GET TURNSTILE TOKEN
========================================================= */

function getTurnstileToken(
    form
) {

    if (
        !window.turnstile ||
        !turnstileWidgets.has(
            form
        )
    ) {

        return "";

    }


    return (
        window.turnstile.getResponse(
            turnstileWidgets.get(
                form
            )
        ) || ""
    );

}



/* =========================================================
   RESET TURNSTILE
========================================================= */

function resetTurnstile(
    form
) {

    if (
        !window.turnstile ||
        !turnstileWidgets.has(
            form
        )
    ) {

        return;

    }


    window.turnstile.reset(
        turnstileWidgets.get(
            form
        )
    );

}



/* =========================================================
   SEND PROTECTED FORM TO SUPABASE EDGE FUNCTION
========================================================= */

async function submitProtectedForm(
    form,
    formData
) {

    await setupTurnstileForForm(
        form
    );


    const token =
        getTurnstileToken(
            form
        );


    if (!token) {

        throw new Error(
            "Please complete the security check before submitting."
        );

    }


    formData.set(
        "turnstile_token",
        token
    );


    let response;


    try {

        response =
            await fetch(
                PUBLIC_FORM_ENDPOINT,
                {

                    method:
                        "POST",

                    body:
                        formData

                }
            );

    } catch (error) {

        resetTurnstile(
            form
        );


        throw new Error(
            "Unable to connect. Please check your internet connection and try again."
        );

    }


    let result =
        {};


    try {

        result =
            await response.json();

    } catch (error) {

        result =
            {};

    }


    if (!response.ok) {

        resetTurnstile(
            form
        );


        throw new Error(
            result.error ||
            "Unable to submit right now. Please try again."
        );

    }


    resetTurnstile(
        form
    );


    return result;

}



/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton =
    document.getElementById(
        "menuButton"
    );

const mainNav =
    document.getElementById(
        "mainNav"
    );


if (
    menuButton &&
    mainNav
) {

    menuButton.addEventListener(
        "click",
        () => {

            mainNav.classList.toggle(
                "active"
            );

        }
    );

}


if (mainNav) {

    const navLinks =
        mainNav.querySelectorAll(
            "a"
        );


    navLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    mainNav.classList.remove(
                        "active"
                    );

                }
            );

        }
    );

}



/* =========================================================
   LIGHTBOX
========================================================= */

const lightbox =
    document.getElementById(
        "lightbox"
    );

const lightboxImage =
    document.getElementById(
        "lightboxImage"
    );

const lightboxClose =
    document.getElementById(
        "lightboxClose"
    );


function closeLightbox() {

    if (!lightbox) {

        return;

    }


    lightbox.classList.remove(
        "active"
    );

}


if (
    lightboxClose &&
    lightbox
) {

    lightboxClose.addEventListener(
        "click",
        closeLightbox
    );

}


if (lightbox) {

    lightbox.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );

}



/* =========================================================
   CUSTOM ORDER FORM
========================================================= */

const orderForm =
    document.getElementById(
        "orderForm"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const eventDateInput =
    document.getElementById(
        "eventDate"
    );


function setMinimumEventDate() {

    if (!eventDateInput) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    eventDateInput.min =
        `${year}-${month}-${day}`;

}


setMinimumEventDate();



/* =========================================================
   SUBMIT CUSTOM ORDER
========================================================= */

if (orderForm) {

    setupTurnstileForForm(
        orderForm
    ).catch(
        error => {

            console.error(
                "Turnstile setup error:",
                error
            );

        }
    );


    orderForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !orderForm
                    .checkValidity()
            ) {

                orderForm.reportValidity();

                return;

            }


            const customerName =
                document
                    .getElementById(
                        "customerName"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "phone"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "email"
                    )
                    .value
                    .trim();


            const eventDate =
                document
                    .getElementById(
                        "eventDate"
                    )
                    .value;


            const eventType =
                document
                    .getElementById(
                        "eventType"
                    )
                    .value;


            const quantity =
                Number(
                    document
                        .getElementById(
                            "quantity"
                        )
                        .value
                );


            const flavor =
                document
                    .getElementById(
                        "flavor"
                    )
                    .value;


            const theme =
                document
                    .getElementById(
                        "theme"
                    )
                    .value
                    .trim();


            const orderDetails =
                document
                    .getElementById(
                        "message"
                    )
                    .value
                    .trim();


            const pickupNotes =
                document
                    .getElementById(
                        "pickupNotes"
                    )
                    .value
                    .trim();


            const inspirationInput =
                document.getElementById(
                    "inspirationImage"
                );


            const inspirationFile =
                inspirationInput &&
                inspirationInput.files.length
                    ? inspirationInput.files[0]
                    : null;


            /* =============================================
               VALIDATE OPTIONAL IMAGE
            ============================================= */

            if (inspirationFile) {

                if (
                    !inspirationFile.type
                        .startsWith(
                            "image/"
                        )
                ) {

                    if (formMessage) {

                        formMessage.textContent =
                            "Please upload a valid image file.";

                    }


                    return;

                }


                const maxFileSize =
                    10 *
                    1024 *
                    1024;


                if (
                    inspirationFile.size >
                    maxFileSize
                ) {

                    if (formMessage) {

                        formMessage.textContent =
                            "The inspiration image must be smaller than 10 MB.";

                    }


                    return;

                }

            }


            if (formMessage) {

                formMessage.textContent =
                    "Submitting your order request...";

            }


            try {

                const formData =
                    new FormData();


                formData.set(
                    "type",
                    "custom_order"
                );


                formData.set(
                    "customer_name",
                    customerName
                );


                formData.set(
                    "phone",
                    phone
                );


                formData.set(
                    "email",
                    email
                );


                formData.set(
                    "event_date",
                    eventDate
                );


                formData.set(
                    "event_type",
                    eventType
                );


                formData.set(
                    "quantity",
                    String(
                        quantity
                    )
                );


                formData.set(
                    "flavor",
                    flavor
                );


                formData.set(
                    "theme",
                    theme
                );


                formData.set(
                    "order_details",
                    orderDetails
                );


                formData.set(
                    "pickup_notes",
                    pickupNotes
                );


                if (inspirationFile) {

                    formData.set(
                        "image",
                        inspirationFile
                    );

                }


                await submitProtectedForm(
                    orderForm,
                    formData
                );


                if (formMessage) {

                    formMessage.textContent =
                        "Your order request has been submitted successfully.";

                }


                orderForm.reset();


                setMinimumEventDate();

            } catch (error) {

                console.error(
                    "Order submission error:",
                    error
                );


                if (formMessage) {

                    formMessage.textContent =
                        error.message ||
                        "Something went wrong submitting your request.";

                }

            }

        }
    );

}



/* =========================================================
   PREORDER MODAL
========================================================= */

const preorderModal =
    document.getElementById(
        "preorderModal"
    );

const preorderModalClose =
    document.getElementById(
        "preorderModalClose"
    );

const preorderProductName =
    document.getElementById(
        "preorderProductName"
    );

const preorderProductPrice =
    document.getElementById(
        "preorderProductPrice"
    );

const preorderQuantity =
    document.getElementById(
        "preorderQuantity"
    );

const preorderTotal =
    document.getElementById(
        "preorderTotal"
    );

const preorderForm =
    document.getElementById(
        "preorderForm"
    );

const preorderMessage =
    document.getElementById(
        "preorderMessage"
    );


let selectedPreorderPrice =
    0;



/* =========================================================
   PREORDER TOTAL
========================================================= */

function updatePreorderTotal() {

    if (
        !preorderQuantity ||
        !preorderTotal
    ) {

        return;

    }


    const quantity =
        Math.max(
            1,
            Number(
                preorderQuantity.value
            ) || 1
        );


    const total =
        selectedPreorderPrice *
        quantity;


    preorderTotal.textContent =
        `$${total.toFixed(2)}`;

}


if (preorderQuantity) {

    preorderQuantity.addEventListener(
        "input",
        updatePreorderTotal
    );

}



/* =========================================================
   OPEN PREORDER MODAL
========================================================= */

function openPreorderModal(
    button
) {

    if (!button) {

        return;

    }


    const productName =
        button.dataset.product;


    const productId =
        button.dataset.productId;


    const price =
        Number(
            button.dataset.price
        );


    selectedPreorderPrice =
        price;


    if (preorderProductName) {

        preorderProductName.textContent =
            productName;

    }


    if (preorderProductPrice) {

        preorderProductPrice.textContent =
            price.toFixed(2);

    }


    if (preorderQuantity) {

        preorderQuantity.value =
            1;

    }


    if (preorderForm) {

        preorderForm.dataset.productId =
            productId || "";


        preorderForm.dataset.productName =
            productName || "";

    }


    if (preorderMessage) {

        preorderMessage.textContent =
            "";

    }


    updatePreorderTotal();


    if (preorderModal) {

        preorderModal.classList.add(
            "active"
        );

    }

}



/* =========================================================
   CLOSE PREORDER MODAL
========================================================= */

function closePreorderModal() {

    if (!preorderModal) {

        return;

    }


    preorderModal.classList.remove(
        "active"
    );

}


if (
    preorderModalClose &&
    preorderModal
) {

    preorderModalClose.addEventListener(
        "click",
        closePreorderModal
    );

}


if (preorderModal) {

    preorderModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                preorderModal
            ) {

                closePreorderModal();

            }

        }
    );

}



/* =========================================================
   SETUP PREORDER BUTTONS
========================================================= */

function setupPublicPreorderButtons() {

    const buttons =
        document.querySelectorAll(
            ".preorder-button"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.listenerAdded ===
                "true"
            ) {

                return;

            }


            button.dataset.listenerAdded =
                "true";


            button.addEventListener(
                "click",
                () => {

                    openPreorderModal(
                        button
                    );

                }
            );

        }
    );

}



/* =========================================================
   SUBMIT PREORDER
========================================================= */

if (preorderForm) {

    setupTurnstileForForm(
        preorderForm
    ).catch(
        error => {

            console.error(
                "Turnstile setup error:",
                error
            );

        }
    );


    preorderForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !preorderForm
                    .checkValidity()
            ) {

                preorderForm.reportValidity();

                return;

            }


            const customerName =
                document
                    .getElementById(
                        "preorderName"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "preorderPhone"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "preorderEmail"
                    )
                    .value
                    .trim();


            const quantity =
                Math.max(
                    1,
                    Number(
                        document
                            .getElementById(
                                "preorderQuantity"
                            )
                            .value
                    )
                );


            const productId =
                preorderForm.dataset
                    .productId ||
                null;


            const productName =
                preorderForm.dataset
                    .productName;


            if (
                !productId ||
                !productName
            ) {

                if (preorderMessage) {

                    preorderMessage.textContent =
                        "Please select a preorder product.";

                }


                return;

            }


            if (preorderMessage) {

                preorderMessage.textContent =
                    "Submitting preorder...";

            }


            try {

                const formData =
                    new FormData();


                formData.set(
                    "type",
                    "preorder"
                );


                formData.set(
                    "product_id",
                    String(
                        productId
                    )
                );


                formData.set(
                    "customer_name",
                    customerName
                );


                formData.set(
                    "phone",
                    phone
                );


                formData.set(
                    "email",
                    email
                );


                formData.set(
                    "quantity",
                    String(
                        quantity
                    )
                );


                const result =
                    await submitProtectedForm(
                        preorderForm,
                        formData
                    );


                if (preorderMessage) {

                    const total =
                        Number(
                            result.total_price
                        );


                    preorderMessage.textContent =
                        Number.isFinite(
                            total
                        )
                            ? `Your preorder request has been submitted successfully. Total: $${total.toFixed(2)}.`
                            : "Your preorder request has been submitted successfully.";

                }


                preorderForm.reset();


                if (preorderQuantity) {

                    preorderQuantity.value =
                        1;

                }


                updatePreorderTotal();

            } catch (error) {

                console.error(
                    "Preorder submission error:",
                    error
                );


                if (preorderMessage) {

                    preorderMessage.textContent =
                        error.message ||
                        "Something went wrong submitting your preorder.";

                }

            }

        }
    );

}



/* =========================================================
   PUBLIC PREORDERS
========================================================= */

const publicPreorderGrid =
    document.getElementById(
        "publicPreorderGrid"
    );


async function loadPublicPreorders() {

    if (!publicPreorderGrid) {

        return;

    }


    publicPreorderGrid.innerHTML =
        "<p>Loading preorders...</p>";


    try {

        const {
            data: products,
            error
        } =
            await supabaseClient
                .from(
                    "preorder_products"
                )
                .select(
                    "*"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                error
            );


            publicPreorderGrid.innerHTML =
                "<p>Unable to load preorders.</p>";


            return;

        }


        const safeProducts =
            products || [];


        if (
            !safeProducts.length
        ) {

            publicPreorderGrid.innerHTML = `
                <div class="empty-dashboard-message">
                    No preorders are available right now.
                </div>
            `;


            return;

        }


        publicPreorderGrid.innerHTML =
            safeProducts
                .map(
                    product => {

                        const image =
                            product.image_url
                                ? escapePublicHTML(
                                    product.image_url
                                )
                                : "assets/images/logo.png";


                        const name =
                            escapePublicHTML(
                                product.name
                            );


                        const description =
                            escapePublicHTML(
                                product.description ||
                                ""
                            );


                        const badge =
                            escapePublicHTML(
                                product.badge ||
                                ""
                            );


                        const quantityDescription =
                            escapePublicHTML(
                                product.quantity_description ||
                                "See details"
                            );


                        const deadline =
                            escapePublicHTML(
                                product.order_deadline ||
                                "While Available"
                            );


                        const pickup =
                            escapePublicHTML(
                                product.pickup_details ||
                                "Scheduled Pickup"
                            );


                        const price =
                            Number(
                                product.price
                            );


                        return `
                            <article class="preorder-card">

                                <div class="preorder-image">

                                    <img
                                        src="${image}"
                                        alt="${name}"
                                    >

                                    ${
                                        badge
                                            ? `
                                                <span class="preorder-badge">
                                                    ${badge}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div class="preorder-content">

                                    <p class="preorder-small">
                                        Limited preorder
                                    </p>


                                    <h2>
                                        ${name}
                                    </h2>


                                    <p class="preorder-description">
                                        ${description}
                                    </p>


                                    <div class="preorder-details">

                                        <div>

                                            <span>
                                                Price
                                            </span>

                                            <strong>
                                                $${price.toFixed(2)}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Quantity
                                            </span>

                                            <strong>
                                                ${quantityDescription}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Order By
                                            </span>

                                            <strong>
                                                ${deadline}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Pickup
                                            </span>

                                            <strong>
                                                ${pickup}
                                            </strong>

                                        </div>

                                    </div>


                                    <button
                                        class="button primary-button preorder-button"
                                        type="button"
                                        data-product="${name}"
                                        data-product-id="${product.id}"
                                        data-price="${price}"
                                    >
                                        Preorder Now
                                    </button>

                                </div>

                            </article>
                        `;

                    }
                )
                .join(
                    ""
                );


        setupPublicPreorderButtons();

    } catch (error) {

        console.error(
            error
        );


        publicPreorderGrid.innerHTML =
            "<p>Unable to load preorders.</p>";

    }

}


loadPublicPreorders();



/* =========================================================
   PUBLIC GALLERY
========================================================= */

const publicGalleryGrid =
    document.getElementById(
        "publicGalleryGrid"
    );


async function loadPublicGallery() {

    if (!publicGalleryGrid) {

        return;

    }


    publicGalleryGrid.innerHTML =
        "<p>Loading gallery...</p>";


    try {

        const {
            data: items,
            error
        } =
            await supabaseClient
                .from(
                    "gallery_items"
                )
                .select(
                    "*"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                error
            );


            publicGalleryGrid.innerHTML =
                "<p>Unable to load gallery.</p>";


            return;

        }


        const safeItems =
            items || [];


        if (
            !safeItems.length
        ) {

            publicGalleryGrid.innerHTML = `
                <div class="empty-dashboard-message">
                    No gallery items are available yet.
                </div>
            `;


            return;

        }


        publicGalleryGrid.innerHTML =
            safeItems
                .map(
                    item => {

                        const category =
                            escapePublicHTML(
                                item.category
                            );


                        const imageUrl =
                            escapePublicHTML(
                                item.image_url
                            );


                        const title =
                            escapePublicHTML(
                                item.title ||
                                "Jackson's Sweets gallery item"
                            );


                        return `
                            <div
                                class="gallery-item"
                                data-category="${category}"
                            >

                                <img
                                    src="${imageUrl}"
                                    alt="${title}"
                                >

                            </div>
                        `;

                    }
                )
                .join(
                    ""
                );


        setupDynamicGallery();

    } catch (error) {

        console.error(
            error
        );


        publicGalleryGrid.innerHTML =
            "<p>Unable to load gallery.</p>";

    }

}


loadPublicGallery();



/* =========================================================
   GALLERY FILTERS / LIGHTBOX
========================================================= */

function setupDynamicGallery() {

    const galleryItems =
        document.querySelectorAll(
            ".gallery-item"
        );


    galleryItems.forEach(
        item => {

            if (
                item.dataset.lightboxReady ===
                "true"
            ) {

                return;

            }


            item.dataset.lightboxReady =
                "true";


            item.addEventListener(
                "click",
                () => {

                    if (
                        !lightbox ||
                        !lightboxImage
                    ) {

                        return;

                    }


                    const image =
                        item.querySelector(
                            "img"
                        );


                    if (!image) {

                        return;

                    }


                    lightboxImage.src =
                        image.src;


                    lightboxImage.alt =
                        image.alt;


                    lightbox.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    const filterButtons =
        document.querySelectorAll(
            ".filter-button"
        );


    filterButtons.forEach(
        button => {

            if (
                button.dataset.filterReady ===
                "true"
            ) {

                return;

            }


            button.dataset.filterReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    const filter =
                        button.dataset.filter;


                    filterButtons.forEach(
                        currentButton => {

                            currentButton
                                .classList
                                .remove(
                                    "active-filter"
                                );

                        }
                    );


                    button.classList.add(
                        "active-filter"
                    );


                    document
                        .querySelectorAll(
                            ".gallery-item"
                        )
                        .forEach(
                            item => {

                                const category =
                                    item.dataset.category;


                                if (
                                    filter ===
                                        "all" ||
                                    category ===
                                        filter
                                ) {

                                    item.classList.remove(
                                        "hidden"
                                    );

                                } else {

                                    item.classList.add(
                                        "hidden"
                                    );

                                }

                            }
                        );

                }
            );

        }
    );

}



/* =========================================================
   REVIEW MODAL
========================================================= */

const openReviewForm =
    document.getElementById(
        "openReviewForm"
    );

const reviewModal =
    document.getElementById(
        "reviewModal"
    );

const reviewModalClose =
    document.getElementById(
        "reviewModalClose"
    );

const reviewForm =
    document.getElementById(
        "reviewForm"
    );

const reviewMessage =
    document.getElementById(
        "reviewMessage"
    );


function closeReviewModal() {

    if (!reviewModal) {

        return;

    }


    reviewModal.classList.remove(
        "active"
    );

}


if (
    openReviewForm &&
    reviewModal
) {

    openReviewForm.addEventListener(
        "click",
        () => {

            if (reviewMessage) {

                reviewMessage.textContent =
                    "";

            }


            reviewModal.classList.add(
                "active"
            );

        }
    );

}


if (
    reviewModalClose &&
    reviewModal
) {

    reviewModalClose.addEventListener(
        "click",
        closeReviewModal
    );

}


if (reviewModal) {

    reviewModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                reviewModal
            ) {

                closeReviewModal();

            }

        }
    );

}



/* =========================================================
   SUBMIT REVIEW
========================================================= */

if (reviewForm) {

    setupTurnstileForForm(
        reviewForm
    ).catch(
        error => {

            console.error(
                "Turnstile setup error:",
                error
            );

        }
    );


    reviewForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !reviewForm
                    .checkValidity()
            ) {

                reviewForm.reportValidity();

                return;

            }


            const customerName =
                document
                    .getElementById(
                        "reviewName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "reviewEmail"
                    )
                    .value
                    .trim();


            const rating =
                Number(
                    document
                        .getElementById(
                            "reviewRating"
                        )
                        .value
                );


            const reviewText =
                document
                    .getElementById(
                        "reviewText"
                    )
                    .value
                    .trim();


            const reviewPhotoInput =
                document.getElementById(
                    "reviewPhoto"
                );


            const reviewPhotoFile =
                reviewPhotoInput &&
                reviewPhotoInput.files.length
                    ? reviewPhotoInput.files[0]
                    : null;


            /* =============================================
               VALIDATE RATING
            ============================================= */

            if (
                rating < 1 ||
                rating > 5
            ) {

                if (reviewMessage) {

                    reviewMessage.textContent =
                        "Please select a rating between 1 and 5.";

                }


                return;

            }


            /* =============================================
               VALIDATE PHOTO
            ============================================= */

            if (reviewPhotoFile) {

                if (
                    !reviewPhotoFile.type
                        .startsWith(
                            "image/"
                        )
                ) {

                    if (reviewMessage) {

                        reviewMessage.textContent =
                            "Please upload a valid image file.";

                    }


                    return;

                }


                const maxReviewPhotoSize =
                    10 *
                    1024 *
                    1024;


                if (
                    reviewPhotoFile.size >
                    maxReviewPhotoSize
                ) {

                    if (reviewMessage) {

                        reviewMessage.textContent =
                            "The review photo must be smaller than 10 MB.";

                    }


                    return;

                }

            }


            if (reviewMessage) {

                reviewMessage.textContent =
                    "Submitting your review...";

            }


            try {

                const formData =
                    new FormData();


                formData.set(
                    "type",
                    "review"
                );


                formData.set(
                    "customer_name",
                    customerName
                );


                formData.set(
                    "email",
                    email
                );


                formData.set(
                    "rating",
                    String(
                        rating
                    )
                );


                formData.set(
                    "review_text",
                    reviewText
                );


                if (reviewPhotoFile) {

                    formData.set(
                        "image",
                        reviewPhotoFile
                    );

                }


                await submitProtectedForm(
                    reviewForm,
                    formData
                );


                if (reviewMessage) {

                    reviewMessage.textContent =
                        "Thank you. Your review was submitted and is waiting for approval.";

                }


                reviewForm.reset();

            } catch (error) {

                console.error(
                    "Review submission error:",
                    error
                );


                if (reviewMessage) {

                    reviewMessage.textContent =
                        error.message ||
                        "Something went wrong submitting your review.";

                }

            }

        }
    );

}



/* =========================================================
   PUBLIC REVIEWS
========================================================= */

const publicReviewsGrid =
    document.getElementById(
        "publicReviewsGrid"
    );


async function loadPublicReviews() {

    if (!publicReviewsGrid) {

        return;

    }


    publicReviewsGrid.innerHTML =
        "<p>Loading reviews...</p>";


    try {

        const {
            data: reviews,
            error
        } =
            await supabaseClient
                .from(
                    "reviews"
                )
                .select(
                    "*"
                )
                .eq(
                    "approved",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                error
            );


            publicReviewsGrid.innerHTML =
                "<p>Unable to load reviews.</p>";


            return;

        }


        const safeReviews =
            reviews || [];


        if (
            !safeReviews.length
        ) {

            publicReviewsGrid.innerHTML = `
                <p>
                    No reviews have been published yet.
                </p>
            `;


            return;

        }


        publicReviewsGrid.innerHTML =
            safeReviews
                .map(
                    review => {

                        const rating =
                            Math.max(
                                1,
                                Math.min(
                                    5,
                                    Number(
                                        review.rating
                                    )
                                )
                            );


                        const stars =
                            "★".repeat(
                                rating
                            ) +
                            "☆".repeat(
                                5 -
                                rating
                            );


                        const customerName =
                            escapePublicHTML(
                                review.customer_name
                            );


                        const reviewText =
                            escapePublicHTML(
                                review.review_text
                            );


                        const reviewPhoto =
                            review.photo_url
                                ? `
                                    <img
                                        src="${escapePublicHTML(
                                            review.photo_url
                                        )}"
                                        alt="Customer review photo"
                                        class="review-photo"
                                    >
                                `
                                : "";


                        return `
                            <article
                                class="customer-review-card"
                            >

                                ${reviewPhoto}


                                <div class="review-stars">
                                    ${stars}
                                </div>


                                <p>
                                    “${reviewText}”
                                </p>


                                <div class="review-author">

                                    <strong>
                                        ${customerName}
                                    </strong>

                                    <span>
                                        Verified Customer Review
                                    </span>

                                </div>

                            </article>
                        `;

                    }
                )
                .join(
                    ""
                );

    } catch (error) {

        console.error(
            error
        );


        publicReviewsGrid.innerHTML =
            "<p>Unable to load reviews.</p>";

    }

}


loadPublicReviews();



/* =========================================================
   CONTACT FORM
========================================================= */

const contactForm =
    document.getElementById(
        "contactForm"
    );

const contactMessageResult =
    document.getElementById(
        "contactMessageResult"
    );


if (contactForm) {

    setupTurnstileForForm(
        contactForm
    ).catch(
        error => {

            console.error(
                "Turnstile setup error:",
                error
            );

        }
    );


    contactForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !contactForm
                    .checkValidity()
            ) {

                contactForm.reportValidity();

                return;

            }


            const customerName =
                document
                    .getElementById(
                        "contactName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "contactEmail"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "contactPhone"
                    )
                    .value
                    .trim();


            const subject =
                document
                    .getElementById(
                        "contactSubject"
                    )
                    .value;


            const message =
                document
                    .getElementById(
                        "contactMessage"
                    )
                    .value
                    .trim();


            if (
                contactMessageResult
            ) {

                contactMessageResult.textContent =
                    "Sending your message...";

            }


            try {

                const formData =
                    new FormData();


                formData.set(
                    "type",
                    "contact"
                );


                formData.set(
                    "customer_name",
                    customerName
                );


                formData.set(
                    "email",
                    email
                );


                formData.set(
                    "phone",
                    phone
                );


                formData.set(
                    "subject",
                    subject
                );


                formData.set(
                    "message",
                    message
                );


                await submitProtectedForm(
                    contactForm,
                    formData
                );


                if (
                    contactMessageResult
                ) {

                    contactMessageResult.textContent =
                        "Your message has been sent successfully.";

                }


                contactForm.reset();

            } catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );


                if (
                    contactMessageResult
                ) {

                    contactMessageResult.textContent =
                        error.message ||
                        "Something went wrong sending your message.";

                }

            }

        }
    );

}



/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        closeLightbox();


        closePreorderModal();


        closeReviewModal();

    }
);



/* =========================================================
   INITIALIZE STATIC PREORDER BUTTONS
========================================================= */

setupPublicPreorderButtons();