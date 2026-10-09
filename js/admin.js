/* =========================================================
   JACKSON'S SWEETS
   OWNER DASHBOARD / ADMIN
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

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


function formatDate(value) {

    if (!value) {
        return "Not provided";
    }

    return new Date(value)
        .toLocaleDateString();
}


async function getCurrentSession() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return null;
    }


    return data.session;
}


async function isAdmin(userId) {

    if (!userId) {
        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Admin check error:",
            error
        );

        return false;
    }


    return Boolean(data);
}



/* =========================================================
   OWNER LOGIN
========================================================= */

const loginForm =
    document.getElementById(
        "loginForm"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            if (loginMessage) {

                loginMessage.textContent =
                    "Signing in...";

            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({
                        email,
                        password
                    });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (loginMessage) {

                    loginMessage.textContent =
                        "Unable to sign in. Check your email and password.";

                }

                return;
            }


            const user =
                data.user;


            const admin =
                await isAdmin(
                    user.id
                );


            if (!admin) {

                await supabaseClient
                    .auth
                    .signOut();


                if (loginMessage) {

                    loginMessage.textContent =
                        "This account does not have owner access.";

                }

                return;
            }


            window.location.href =
                "dashboard.html";

        }
    );

}



/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

const dashboardWrapper =
    document.getElementById(
        "dashboardWrapper"
    );

const dashboardLoading =
    document.getElementById(
        "dashboardLoading"
    );

const ownerEmail =
    document.getElementById(
        "ownerEmail"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );



/* =========================================================
   DASHBOARD PROTECTION
========================================================= */

async function protectDashboard() {

    if (!dashboardWrapper) {
        return false;
    }


    const session =
        await getCurrentSession();


    if (!session) {

        window.location.href =
            "login.html";

        return false;
    }


    const admin =
        await isAdmin(
            session.user.id
        );


    if (!admin) {

        await supabaseClient
            .auth
            .signOut();


        window.location.href =
            "login.html";

        return false;
    }


    if (ownerEmail) {

        ownerEmail.textContent =
            `Signed in as ${session.user.email}`;

    }


    if (dashboardLoading) {

        dashboardLoading.hidden =
            true;

    }


    dashboardWrapper.hidden =
        false;


    return true;
}



/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "login.html";

        }
    );

}



/* =========================================================
   CUSTOM ORDERS
========================================================= */

const ordersList =
    document.getElementById(
        "ordersList"
    );

const orderCount =
    document.getElementById(
        "orderCount"
    );


async function loadCustomOrders() {

    if (!ordersList) {
        return;
    }


    ordersList.innerHTML =
        "<p>Loading orders...</p>";


    const {
        data: orders,
        error
    } =
        await supabaseClient
            .from("custom_orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Custom order load error:",
            error
        );


        ordersList.innerHTML =
            "<p>Unable to load orders.</p>";

        return;
    }


    const safeOrders =
        orders || [];


    if (orderCount) {

        orderCount.textContent =
            safeOrders.filter(
                order =>
                    order.status === "new"
            ).length;

    }


    if (!safeOrders.length) {

        ordersList.innerHTML = `
            <div class="empty-dashboard-message">
                No custom orders yet.
            </div>
        `;

        return;
    }


    ordersList.innerHTML =
        safeOrders
            .map(order => {

                const submittedDate =
                    formatDate(
                        order.created_at
                    );


                const eventDate =
                    order.event_date
                        ? new Date(
                            `${order.event_date}T00:00:00`
                        )
                            .toLocaleDateString()
                        : "Not provided";


                return `
                    <article
                        class="order-card"
                        data-order-id="${order.id}"
                    >

                        <div class="order-card-top">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        order.customer_name
                                    )}
                                </h3>

                                <div class="order-card-date">
                                    Submitted ${submittedDate}
                                </div>

                            </div>


                            <span class="order-status">
                                ${escapeHTML(
                                    order.status
                                )}
                            </span>

                        </div>


                        <div class="order-details-grid">

                            <div class="order-detail">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.phone
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Email
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.email
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Event Date
                                </span>

                                <strong>
                                    ${eventDate}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Event Type
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.event_type
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Quantity
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.quantity
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Flavor
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.flavor
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Theme
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.theme
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="order-notes">

                            <h4>
                                Order Details
                            </h4>

                            <p>
                                ${escapeHTML(
                                    order.order_details
                                )}
                            </p>

                        </div>


                        ${
                            order.pickup_notes
                                ? `
                                    <div class="order-notes">

                                        <h4>
                                            Pickup / Delivery Notes
                                        </h4>

                                        <p>
                                            ${escapeHTML(
                                                order.pickup_notes
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                        }


                        ${
                            order.inspiration_image_url
                                ? `
                                    <div class="order-notes">

                                        <h4>
                                            Inspiration Image
                                        </h4>

                                        <a
                                            href="${escapeHTML(
                                                order.inspiration_image_url
                                            )}"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            View Image
                                        </a>

                                    </div>
                                `
                                : ""
                        }


                        <div class="order-actions">

                            <select
                                class="order-status-select"
                                data-order-id="${order.id}"
                            >

                                <option
                                    value="new"
                                    ${
                                        order.status ===
                                        "new"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    New
                                </option>

                                <option
                                    value="contacted"
                                    ${
                                        order.status ===
                                        "contacted"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Contacted
                                </option>

                                <option
                                    value="confirmed"
                                    ${
                                        order.status ===
                                        "confirmed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Confirmed
                                </option>

                                <option
                                    value="completed"
                                    ${
                                        order.status ===
                                        "completed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Completed
                                </option>

                                <option
                                    value="declined"
                                    ${
                                        order.status ===
                                        "declined"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Declined
                                </option>

                            </select>


                            <button
                                class="order-delete-button"
                                data-order-id="${order.id}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupOrderActions();
}


function setupOrderActions() {

    document
        .querySelectorAll(
            ".order-status-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async () => {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "custom_orders"
                            )
                            .update({
                                status:
                                    select.value
                            })
                            .eq(
                                "id",
                                select.dataset.orderId
                            );


                    if (error) {

                        console.error(
                            "Order status update error:",
                            error
                        );

                        alert(
                            "Unable to update order status."
                        );

                        return;
                    }


                    await loadCustomOrders();

                }
            );

        });


    document
        .querySelectorAll(
            ".order-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "Delete this custom order?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "custom_orders"
                            )
                            .delete()
                            .eq(
                                "id",
                                button.dataset.orderId
                            );


                    if (error) {

                        console.error(
                            "Order delete error:",
                            error
                        );

                        alert(
                            "Unable to delete order."
                        );

                        return;
                    }


                    await loadCustomOrders();

                }
            );

        });

}



/* =========================================================
   PREORDER PRODUCT ELEMENTS
========================================================= */

const dashboardPreorderProducts =
    document.getElementById(
        "dashboardPreorderProducts"
    );

const openPreorderProductForm =
    document.getElementById(
        "openPreorderProductForm"
    );

const preorderProductModal =
    document.getElementById(
        "preorderProductModal"
    );

const closePreorderProductModal =
    document.getElementById(
        "closePreorderProductModal"
    );

const preorderProductForm =
    document.getElementById(
        "preorderProductForm"
    );

const preorderProductMessage =
    document.getElementById(
        "preorderProductMessage"
    );



/* =========================================================
   PREORDER PRODUCT MODAL
========================================================= */

if (
    openPreorderProductForm &&
    preorderProductModal
) {

    openPreorderProductForm
        .addEventListener(
            "click",
            () => {

                if (
                    preorderProductMessage
                ) {

                    preorderProductMessage
                        .textContent =
                        "";

                }


                preorderProductModal
                    .classList
                    .add("active");

            }
        );

}


if (
    closePreorderProductModal &&
    preorderProductModal
) {

    closePreorderProductModal
        .addEventListener(
            "click",
            () => {

                preorderProductModal
                    .classList
                    .remove("active");

            }
        );

}


if (preorderProductModal) {

    preorderProductModal
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    preorderProductModal
                ) {

                    preorderProductModal
                        .classList
                        .remove("active");

                }

            }
        );

}



/* =========================================================
   CREATE PREORDER PRODUCT
   + IMAGE UPLOAD
========================================================= */

if (preorderProductForm) {

    preorderProductForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !preorderProductForm
                    .checkValidity()
            ) {

                preorderProductForm
                    .reportValidity();

                return;
            }


            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "productDescription"
                    )
                    .value
                    .trim();


            const price =
                Number(
                    document
                        .getElementById(
                            "productPrice"
                        )
                        .value
                );


            const quantityDescription =
                document
                    .getElementById(
                        "productQuantityDescription"
                    )
                    .value
                    .trim();


            const deadline =
                document
                    .getElementById(
                        "productDeadline"
                    )
                    .value
                    .trim();


            const pickup =
                document
                    .getElementById(
                        "productPickup"
                    )
                    .value
                    .trim();


            const badge =
                document
                    .getElementById(
                        "productBadge"
                    )
                    .value
                    .trim();


            const imageInput =
                document.getElementById(
                    "productImage"
                );


            if (!imageInput) {

                if (
                    preorderProductMessage
                ) {

                    preorderProductMessage
                        .textContent =
                        "Product image field is missing.";

                }

                return;
            }


            const imageFile =
                imageInput.files[0];


            if (!imageFile) {

                if (
                    preorderProductMessage
                ) {

                    preorderProductMessage
                        .textContent =
                        "Please select a product image.";

                }

                return;
            }


            if (
                !imageFile.type
                    .startsWith("image/")
            ) {

                preorderProductMessage
                    .textContent =
                    "Please select an image file.";

                return;
            }


            if (
                preorderProductMessage
            ) {

                preorderProductMessage
                    .textContent =
                    "Uploading image...";

            }


            const extension =
                imageFile.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${crypto.randomUUID()}.${extension}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from(
                        "preorder-images"
                    )
                    .upload(
                        fileName,
                        imageFile,
                        {
                            cacheControl:
                                "3600",
                            upsert:
                                false,
                            contentType:
                                imageFile.type
                        }
                    );


            if (uploadError) {

                console.error(
                    "Preorder image upload error:",
                    uploadError
                );


                preorderProductMessage
                    .textContent =
                    "Unable to upload image.";

                return;
            }


            const {
                data: urlData
            } =
                supabaseClient
                    .storage
                    .from(
                        "preorder-images"
                    )
                    .getPublicUrl(
                        fileName
                    );


            const imageUrl =
                urlData.publicUrl;


            preorderProductMessage
                .textContent =
                "Saving preorder...";


            const {
                error: databaseError
            } =
                await supabaseClient
                    .from(
                        "preorder_products"
                    )
                    .insert([
                        {
                            name,
                            description,
                            price,
                            quantity_description:
                                quantityDescription,
                            order_deadline:
                                deadline || null,
                            pickup_details:
                                pickup || null,
                            image_url:
                                imageUrl,
                            badge:
                                badge || null,
                            active:
                                true
                        }
                    ]);


            if (databaseError) {

                console.error(
                    "Preorder save error:",
                    databaseError
                );


                await supabaseClient
                    .storage
                    .from(
                        "preorder-images"
                    )
                    .remove([
                        fileName
                    ]);


                preorderProductMessage
                    .textContent =
                    "Unable to save preorder.";

                return;
            }


            preorderProductMessage
                .textContent =
                "Preorder added successfully.";


            preorderProductForm
                .reset();


            await loadPreorderProducts();


            setTimeout(
                () => {

                    preorderProductModal
                        .classList
                        .remove(
                            "active"
                        );

                },
                500
            );

        }
    );

}



/* =========================================================
   LOAD PREORDER PRODUCTS
========================================================= */

async function loadPreorderProducts() {

    if (
        !dashboardPreorderProducts
    ) {
        return;
    }


    dashboardPreorderProducts
        .innerHTML =
        "<p>Loading preorder products...</p>";


    const {
        data: products,
        error
    } =
        await supabaseClient
            .from(
                "preorder_products"
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Preorder products load error:",
            error
        );


        dashboardPreorderProducts
            .innerHTML =
            "<p>Unable to load preorder products.</p>";

        return;
    }


    const safeProducts =
        products || [];


    if (!safeProducts.length) {

        dashboardPreorderProducts
            .innerHTML = `
                <div class="empty-dashboard-message">
                    No preorder products yet.
                </div>
            `;

        return;
    }


    dashboardPreorderProducts
        .innerHTML =
        safeProducts
            .map(product => {

                const image =
                    product.image_url
                        ? `
                            <img
                                src="${escapeHTML(
                                    product.image_url
                                )}"
                                alt="${escapeHTML(
                                    product.name
                                )}"
                            >
                        `
                        : `
                            <div
                                class="dashboard-preorder-no-image"
                            >
                                No Image
                            </div>
                        `;


                return `
                    <article
                        class="dashboard-preorder-card"
                    >

                        ${image}


                        <div>

                            <h3>
                                ${escapeHTML(
                                    product.name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    product.description
                                )}
                            </p>

                            <div
                                class="dashboard-preorder-meta"
                            >

                                $${Number(
                                    product.price
                                ).toFixed(2)}

                                •

                                ${escapeHTML(
                                    product.quantity_description
                                )}

                                •

                                ${
                                    product.active
                                        ? "Active"
                                        : "Hidden"
                                }

                            </div>

                        </div>


                        <div
                            class="dashboard-preorder-actions"
                        >

                            <button
                                class="preorder-toggle-button"
                                data-id="${product.id}"
                                data-active="${product.active}"
                                type="button"
                            >
                                ${
                                    product.active
                                        ? "Hide"
                                        : "Show"
                                }
                            </button>


                            <button
                                class="preorder-delete-dashboard"
                                data-id="${product.id}"
                                data-image-url="${escapeHTML(
                                    product.image_url || ""
                                )}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupPreorderProductActions();
}



/* =========================================================
   PREORDER PRODUCT ACTIONS
========================================================= */

function setupPreorderProductActions() {

    document
        .querySelectorAll(
            ".preorder-toggle-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const currentActive =
                        button.dataset.active ===
                        "true";


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "preorder_products"
                            )
                            .update({
                                active:
                                    !currentActive
                            })
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Preorder visibility error:",
                            error
                        );

                        alert(
                            "Unable to update product."
                        );

                        return;
                    }


                    await loadPreorderProducts();

                }
            );

        });



    document
        .querySelectorAll(
            ".preorder-delete-dashboard"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const imageUrl =
                        button.dataset.imageUrl;


                    const confirmed =
                        window.confirm(
                            "Delete this preorder product?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "preorder_products"
                            )
                            .delete()
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Preorder product delete error:",
                            error
                        );

                        alert(
                            "Unable to delete product."
                        );

                        return;
                    }


                    if (imageUrl) {

                        try {

                            const fileName =
                                decodeURIComponent(
                                    imageUrl
                                        .split("/")
                                        .pop()
                                        .split("?")[0]
                                );


                            const {
                                error:
                                    storageError
                            } =
                                await supabaseClient
                                    .storage
                                    .from(
                                        "preorder-images"
                                    )
                                    .remove([
                                        fileName
                                    ]);


                            if (storageError) {

                                console.error(
                                    "Preorder image delete error:",
                                    storageError
                                );

                            }

                        } catch (
                            storageError
                        ) {

                            console.error(
                                "Preorder storage cleanup error:",
                                storageError
                            );

                        }

                    }


                    await loadPreorderProducts();

                }
            );

        });

}



/* =========================================================
   PREORDER CUSTOMER REQUESTS
========================================================= */

const preorderOrdersList =
    document.getElementById(
        "preorderOrdersList"
    );

const preorderCount =
    document.getElementById(
        "preorderCount"
    );


async function loadPreorderOrders() {

    if (!preorderOrdersList) {
        return;
    }


    preorderOrdersList.innerHTML =
        "<p>Loading preorder requests...</p>";


    const {
        data: orders,
        error
    } =
        await supabaseClient
            .from(
                "preorder_orders"
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Preorder request load error:",
            error
        );


        preorderOrdersList
            .innerHTML =
            "<p>Unable to load preorder requests.</p>";

        return;
    }


    const safeOrders =
        orders || [];


    if (preorderCount) {

        preorderCount.textContent =
            safeOrders.filter(
                order =>
                    order.status === "new"
            ).length;

    }


    if (!safeOrders.length) {

        preorderOrdersList.innerHTML = `
            <div class="empty-dashboard-message">
                No preorder requests yet.
            </div>
        `;

        return;
    }


    preorderOrdersList.innerHTML =
        safeOrders
            .map(order => {

                const submittedDate =
                    formatDate(
                        order.created_at
                    );


                return `
                    <article
                        class="order-card"
                    >

                        <div
                            class="order-card-top"
                        >

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        order.customer_name
                                    )}
                                </h3>

                                <div
                                    class="order-card-date"
                                >
                                    Submitted
                                    ${submittedDate}
                                </div>

                            </div>


                            <span
                                class="order-status"
                            >
                                ${escapeHTML(
                                    order.status
                                )}
                            </span>

                        </div>


                        <div
                            class="order-details-grid"
                        >

                            <div
                                class="order-detail"
                            >

                                <span>
                                    Product
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.product_name
                                    )}
                                </strong>

                            </div>


                            <div
                                class="order-detail"
                            >

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.phone
                                    )}
                                </strong>

                            </div>


                            <div
                                class="order-detail"
                            >

                                <span>
                                    Email
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.email
                                    )}
                                </strong>

                            </div>


                            <div
                                class="order-detail"
                            >

                                <span>
                                    Quantity
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        order.quantity
                                    )}
                                </strong>

                            </div>


                            <div
                                class="order-detail"
                            >

                                <span>
                                    Unit Price
                                </span>

                                <strong>
                                    $${Number(
                                        order.unit_price
                                    ).toFixed(2)}
                                </strong>

                            </div>


                            <div
                                class="order-detail"
                            >

                                <span>
                                    Total
                                </span>

                                <strong>
                                    $${Number(
                                        order.total_price
                                    ).toFixed(2)}
                                </strong>

                            </div>

                        </div>


                        <div
                            class="order-actions"
                        >

                            <select
                                class="preorder-order-status"
                                data-id="${order.id}"
                            >

                                <option
                                    value="new"
                                    ${
                                        order.status ===
                                        "new"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    New
                                </option>

                                <option
                                    value="contacted"
                                    ${
                                        order.status ===
                                        "contacted"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Contacted
                                </option>

                                <option
                                    value="confirmed"
                                    ${
                                        order.status ===
                                        "confirmed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Confirmed
                                </option>

                                <option
                                    value="completed"
                                    ${
                                        order.status ===
                                        "completed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Completed
                                </option>

                                <option
                                    value="cancelled"
                                    ${
                                        order.status ===
                                        "cancelled"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Cancelled
                                </option>

                            </select>


                            <button
                                class="
                                    order-delete-button
                                    preorder-order-delete
                                "
                                data-id="${order.id}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupPreorderOrderActions();
}


function setupPreorderOrderActions() {

    document
        .querySelectorAll(
            ".preorder-order-status"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async () => {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "preorder_orders"
                            )
                            .update({
                                status:
                                    select.value
                            })
                            .eq(
                                "id",
                                select.dataset.id
                            );


                    if (error) {

                        console.error(
                            "Preorder request update error:",
                            error
                        );

                        alert(
                            "Unable to update preorder."
                        );

                        return;
                    }


                    await loadPreorderOrders();

                }
            );

        });



    document
        .querySelectorAll(
            ".preorder-order-delete"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "Delete this preorder request?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "preorder_orders"
                            )
                            .delete()
                            .eq(
                                "id",
                                button.dataset.id
                            );


                    if (error) {

                        console.error(
                            "Preorder request delete error:",
                            error
                        );

                        alert(
                            "Unable to delete preorder request."
                        );

                        return;
                    }


                    await loadPreorderOrders();

                }
            );

        });

}



/* =========================================================
   DASHBOARD GALLERY
========================================================= */

const dashboardGalleryGrid =
    document.getElementById(
        "dashboardGalleryGrid"
    );

const openGalleryForm =
    document.getElementById(
        "openGalleryForm"
    );

const galleryModal =
    document.getElementById(
        "galleryModal"
    );

const closeGalleryModal =
    document.getElementById(
        "closeGalleryModal"
    );

const galleryForm =
    document.getElementById(
        "galleryForm"
    );

const galleryMessage =
    document.getElementById(
        "galleryMessage"
    );


if (
    openGalleryForm &&
    galleryModal
) {

    openGalleryForm.addEventListener(
        "click",
        () => {

            if (galleryMessage) {

                galleryMessage.textContent =
                    "";

            }


            galleryModal
                .classList
                .add("active");

        }
    );

}


if (
    closeGalleryModal &&
    galleryModal
) {

    closeGalleryModal
        .addEventListener(
            "click",
            () => {

                galleryModal
                    .classList
                    .remove("active");

            }
        );

}


if (galleryModal) {

    galleryModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                galleryModal
            ) {

                galleryModal
                    .classList
                    .remove("active");

            }

        }
    );

}



/* =========================================================
   UPLOAD GALLERY ITEM
========================================================= */

if (galleryForm) {

    galleryForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                document
                    .getElementById(
                        "galleryTitle"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "galleryCategory"
                    )
                    .value;


            const description =
                document
                    .getElementById(
                        "galleryDescription"
                    )
                    .value
                    .trim();


            const featured =
                document
                    .getElementById(
                        "galleryFeatured"
                    )
                    .checked;


            const fileInput =
                document
                    .getElementById(
                        "galleryImage"
                    );


            const file =
                fileInput.files[0];


            if (!file) {

                galleryMessage.textContent =
                    "Please choose an image.";

                return;
            }


            if (
                !file.type
                    .startsWith("image/")
            ) {

                galleryMessage.textContent =
                    "Please select an image file.";

                return;
            }


            galleryMessage.textContent =
                "Uploading image...";


            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${crypto.randomUUID()}.${extension}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from(
                        "gallery-images"
                    )
                    .upload(
                        fileName,
                        file,
                        {
                            cacheControl:
                                "3600",
                            upsert:
                                false,
                            contentType:
                                file.type
                        }
                    );


            if (uploadError) {

                console.error(
                    "Gallery upload error:",
                    uploadError
                );


                galleryMessage.textContent =
                    "Unable to upload image.";

                return;
            }


            const {
                data: publicUrlData
            } =
                supabaseClient
                    .storage
                    .from(
                        "gallery-images"
                    )
                    .getPublicUrl(
                        fileName
                    );


            const imageUrl =
                publicUrlData.publicUrl;


            const {
                error: databaseError
            } =
                await supabaseClient
                    .from(
                        "gallery_items"
                    )
                    .insert([
                        {
                            title:
                                title || null,
                            category,
                            image_url:
                                imageUrl,
                            description:
                                description ||
                                null,
                            featured
                        }
                    ]);


            if (databaseError) {

                console.error(
                    "Gallery save error:",
                    databaseError
                );


                await supabaseClient
                    .storage
                    .from(
                        "gallery-images"
                    )
                    .remove([
                        fileName
                    ]);


                galleryMessage.textContent =
                    "Unable to save gallery item.";

                return;
            }


            galleryMessage.textContent =
                "Gallery item uploaded.";


            galleryForm.reset();


            await loadDashboardGallery();


            setTimeout(
                () => {

                    galleryModal
                        .classList
                        .remove("active");

                },
                500
            );

        }
    );

}



/* =========================================================
   LOAD GALLERY
========================================================= */

async function loadDashboardGallery() {

    if (!dashboardGalleryGrid) {
        return;
    }


    dashboardGalleryGrid.innerHTML =
        "<p>Loading gallery...</p>";


    const {
        data: items,
        error
    } =
        await supabaseClient
            .from(
                "gallery_items"
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Gallery load error:",
            error
        );


        dashboardGalleryGrid
            .innerHTML =
            "<p>Unable to load gallery.</p>";

        return;
    }


    const safeItems =
        items || [];


    if (!safeItems.length) {

        dashboardGalleryGrid
            .innerHTML = `
                <div class="empty-dashboard-message">
                    No gallery items yet.
                </div>
            `;

        return;
    }


    dashboardGalleryGrid.innerHTML =
        safeItems
            .map(item => {

                return `
                    <article
                        class="dashboard-gallery-card"
                    >

                        <img
                            src="${escapeHTML(
                                item.image_url
                            )}"
                            alt="${escapeHTML(
                                item.title ||
                                "Jackson's Sweets gallery image"
                            )}"
                        >


                        <div
                            class="
                                dashboard-gallery-card-content
                            "
                        >

                            <span
                                class="
                                    gallery-category-label
                                "
                            >
                                ${escapeHTML(
                                    item.category
                                )}
                            </span>


                            <h3>
                                ${escapeHTML(
                                    item.title ||
                                    "Gallery Item"
                                )}
                            </h3>


                            ${
                                item.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                item.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }


                            <div
                                class="
                                    gallery-dashboard-actions
                                "
                            >

                                <button
                                    class="
                                        gallery-feature-button
                                    "
                                    data-id="${item.id}"
                                    data-featured="${item.featured}"
                                    type="button"
                                >
                                    ${
                                        item.featured
                                            ? "Unfeature"
                                            : "Feature"
                                    }
                                </button>


                                <button
                                    class="
                                        gallery-delete-button
                                    "
                                    data-id="${item.id}"
                                    data-url="${escapeHTML(
                                        item.image_url
                                    )}"
                                    type="button"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupGalleryActions();
}



/* =========================================================
   GALLERY ACTIONS
========================================================= */

function setupGalleryActions() {

    document
        .querySelectorAll(
            ".gallery-feature-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const featured =
                        button.dataset.featured ===
                        "true";


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "gallery_items"
                            )
                            .update({
                                featured:
                                    !featured
                            })
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Gallery feature error:",
                            error
                        );

                        alert(
                            "Unable to update gallery item."
                        );

                        return;
                    }


                    await loadDashboardGallery();

                }
            );

        });



    document
        .querySelectorAll(
            ".gallery-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "Delete this gallery item?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const id =
                        button.dataset.id;


                    const imageUrl =
                        button.dataset.url;


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "gallery_items"
                            )
                            .delete()
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Gallery delete error:",
                            error
                        );

                        alert(
                            "Unable to delete gallery item."
                        );

                        return;
                    }


                    if (imageUrl) {

                        const fileName =
                            decodeURIComponent(
                                imageUrl
                                    .split("/")
                                    .pop()
                                    .split("?")[0]
                            );


                        const {
                            error:
                                storageError
                        } =
                            await supabaseClient
                                .storage
                                .from(
                                    "gallery-images"
                                )
                                .remove([
                                    fileName
                                ]);


                        if (storageError) {

                            console.error(
                                "Gallery storage delete error:",
                                storageError
                            );

                        }

                    }


                    await loadDashboardGallery();

                }
            );

        });

}



/* =========================================================
   REVIEWS
========================================================= */

const dashboardReviewsList =
    document.getElementById(
        "dashboardReviewsList"
    );

const reviewCount =
    document.getElementById(
        "reviewCount"
    );


async function loadDashboardReviews() {

    if (!dashboardReviewsList) {
        return;
    }


    dashboardReviewsList.innerHTML =
        "<p>Loading reviews...</p>";


    const {
        data: reviews,
        error
    } =
        await supabaseClient
            .from("reviews")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Reviews load error:",
            error
        );


        dashboardReviewsList
            .innerHTML =
            "<p>Unable to load reviews.</p>";

        return;
    }


    const safeReviews =
        reviews || [];


    if (reviewCount) {

        reviewCount.textContent =
            safeReviews.filter(
                review =>
                    review.approved === false
            ).length;

    }


    if (!safeReviews.length) {

        dashboardReviewsList
            .innerHTML = `
                <div class="empty-dashboard-message">
                    No reviews submitted yet.
                </div>
            `;

        return;
    }


    dashboardReviewsList.innerHTML =
        safeReviews
            .map(review => {

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
                    "★".repeat(rating) +
                    "☆".repeat(
                        5 - rating
                    );


                return `
                    <article
                        class="dashboard-review-card"
                    >

                        <div
                            class="dashboard-review-top"
                        >

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        review.customer_name
                                    )}
                                </h3>

                                <div
                                    class="
                                        dashboard-review-email
                                    "
                                >
                                    ${escapeHTML(
                                        review.email
                                    )}
                                </div>

                            </div>


                            <div
                                class="
                                    dashboard-review-stars
                                "
                            >
                                ${stars}
                            </div>

                        </div>


                        <div
                            class="
                                dashboard-review-status
                            "
                        >

                            <span
                                class="
                                    review-status-badge
                                    ${
                                        review.approved
                                            ? "review-status-approved"
                                            : "review-status-pending"
                                    }
                                "
                            >
                                ${
                                    review.approved
                                        ? "Approved"
                                        : "Pending"
                                }
                            </span>


                            ${
                                review.featured
                                    ? `
                                        <span
                                            class="
                                                review-status-badge
                                                review-status-featured
                                            "
                                        >
                                            Featured
                                        </span>
                                    `
                                    : ""
                            }

                        </div>


                        ${
                            review.photo_url
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            review.photo_url
                                        )}"
                                        alt="Customer review"
                                        class="dashboard-review-photo"
                                    >
                                `
                                : ""
                        }


                        <p
                            class="
                                dashboard-review-text
                            "
                        >
                            ${escapeHTML(
                                review.review_text
                            )}
                        </p>


                        <div
                            class="
                                dashboard-review-actions
                            "
                        >

                            <button
                                class="
                                    review-approve-button
                                "
                                data-id="${review.id}"
                                data-approved="${review.approved}"
                                type="button"
                            >
                                ${
                                    review.approved
                                        ? "Unapprove"
                                        : "Approve"
                                }
                            </button>


                            <button
                                class="
                                    review-feature-button
                                "
                                data-id="${review.id}"
                                data-featured="${review.featured}"
                                type="button"
                            >
                                ${
                                    review.featured
                                        ? "Unfeature"
                                        : "Feature"
                                }
                            </button>


                            <button
                                class="
                                    review-delete-button
                                "
                                data-id="${review.id}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupReviewActions();
}



/* =========================================================
   REVIEW ACTIONS
========================================================= */

function setupReviewActions() {

    document
        .querySelectorAll(
            ".review-approve-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const approved =
                        button.dataset.approved ===
                        "true";


                    const {
                        error
                    } =
                        await supabaseClient
                            .from("reviews")
                            .update({
                                approved:
                                    !approved
                            })
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Review approval error:",
                            error
                        );

                        alert(
                            "Unable to update review."
                        );

                        return;
                    }


                    await loadDashboardReviews();

                }
            );

        });



    document
        .querySelectorAll(
            ".review-feature-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const featured =
                        button.dataset.featured ===
                        "true";


                    const {
                        error
                    } =
                        await supabaseClient
                            .from("reviews")
                            .update({
                                featured:
                                    !featured
                            })
                            .eq(
                                "id",
                                id
                            );


                    if (error) {

                        console.error(
                            "Review feature error:",
                            error
                        );

                        alert(
                            "Unable to update featured status."
                        );

                        return;
                    }


                    await loadDashboardReviews();

                }
            );

        });



    document
        .querySelectorAll(
            ".review-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "Delete this review?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from("reviews")
                            .delete()
                            .eq(
                                "id",
                                button.dataset.id
                            );


                    if (error) {

                        console.error(
                            "Review delete error:",
                            error
                        );

                        alert(
                            "Unable to delete review."
                        );

                        return;
                    }


                    await loadDashboardReviews();

                }
            );

        });

}



/* =========================================================
   CONTACT MESSAGES
========================================================= */

const dashboardMessagesList =
    document.getElementById(
        "dashboardMessagesList"
    );

const messageCount =
    document.getElementById(
        "messageCount"
    );


async function loadDashboardMessages() {

    if (!dashboardMessagesList) {
        return;
    }


    dashboardMessagesList.innerHTML =
        "<p>Loading messages...</p>";


    const {
        data: messages,
        error
    } =
        await supabaseClient
            .from(
                "contact_messages"
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Messages load error:",
            error
        );


        dashboardMessagesList
            .innerHTML =
            "<p>Unable to load messages.</p>";

        return;
    }


    const safeMessages =
        messages || [];


    if (messageCount) {

        messageCount.textContent =
            safeMessages.filter(
                message =>
                    message.status === "new"
            ).length;

    }


    if (!safeMessages.length) {

        dashboardMessagesList
            .innerHTML = `
                <div class="empty-dashboard-message">
                    No messages yet.
                </div>
            `;

        return;
    }


    dashboardMessagesList.innerHTML =
        safeMessages
            .map(message => {

                const submittedDate =
                    formatDate(
                        message.created_at
                    );


                return `
                    <article
                        class="
                            dashboard-message-card
                        "
                    >

                        <div
                            class="
                                dashboard-message-top
                            "
                        >

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        message.customer_name
                                    )}
                                </h3>


                                <div
                                    class="
                                        dashboard-message-contact
                                    "
                                >

                                    ${escapeHTML(
                                        message.email
                                    )}

                                    ${
                                        message.phone
                                            ? `
                                                •
                                                ${escapeHTML(
                                                    message.phone
                                                )}
                                            `
                                            : ""
                                    }

                                </div>

                            </div>


                            <div
                                class="order-card-date"
                            >
                                ${submittedDate}
                            </div>

                        </div>


                        <span
                            class="
                                dashboard-message-subject
                            "
                        >
                            ${escapeHTML(
                                message.subject
                            )}
                        </span>


                        <p
                            class="
                                dashboard-message-text
                            "
                        >
                            ${escapeHTML(
                                message.message
                            )}
                        </p>


                        <div
                            class="
                                dashboard-message-actions
                            "
                        >

                            <select
                                class="
                                    message-status-select
                                "
                                data-id="${message.id}"
                            >

                                <option
                                    value="new"
                                    ${
                                        message.status ===
                                        "new"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    New
                                </option>

                                <option
                                    value="read"
                                    ${
                                        message.status ===
                                        "read"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Read
                                </option>

                                <option
                                    value="handled"
                                    ${
                                        message.status ===
                                        "handled"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Handled
                                </option>

                            </select>


                            <button
                                class="
                                    message-delete-button
                                "
                                data-id="${message.id}"
                                type="button"
                            >
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");


    setupMessageActions();
}



/* =========================================================
   MESSAGE ACTIONS
========================================================= */

function setupMessageActions() {

    document
        .querySelectorAll(
            ".message-status-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async () => {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "contact_messages"
                            )
                            .update({
                                status:
                                    select.value
                            })
                            .eq(
                                "id",
                                select.dataset.id
                            );


                    if (error) {

                        console.error(
                            "Message update error:",
                            error
                        );

                        alert(
                            "Unable to update message."
                        );

                        return;
                    }


                    await loadDashboardMessages();

                }
            );

        });



    document
        .querySelectorAll(
            ".message-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "Delete this message?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "contact_messages"
                            )
                            .delete()
                            .eq(
                                "id",
                                button.dataset.id
                            );


                    if (error) {

                        console.error(
                            "Message delete error:",
                            error
                        );

                        alert(
                            "Unable to delete message."
                        );

                        return;
                    }


                    await loadDashboardMessages();

                }
            );

        });

}



/* =========================================================
   OWNER DASHBOARD NAVIGATION
========================================================= */

const dashboardNavLinks =
    document.querySelectorAll(
        ".dashboard-nav-link"
    );

const dashboardViews =
    document.querySelectorAll(
        ".dashboard-view"
    );


function showDashboardSection(
    sectionName
) {

    dashboardViews.forEach(
        view => {

            if (
                view.dataset
                    .dashboardSection ===
                sectionName
            ) {

                view.classList.add(
                    "dashboard-view-active"
                );

            } else {

                view.classList.remove(
                    "dashboard-view-active"
                );

            }

        }
    );


    dashboardNavLinks.forEach(
        button => {

            if (
                button.dataset.section ===
                sectionName
            ) {

                button.classList.add(
                    "active"
                );

            } else {

                button.classList.remove(
                    "active"
                );

            }

        }
    );

}


dashboardNavLinks.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const sectionName =
                    button.dataset.section;


                if (!sectionName) {
                    return;
                }


                showDashboardSection(
                    sectionName
                );

            }
        );

    }
);



/* =========================================================
   LOAD OWNER DASHBOARD
========================================================= */

async function initializeDashboard() {

    if (!dashboardWrapper) {
        return;
    }


    const allowed =
        await protectDashboard();


    if (!allowed) {
        return;
    }


    showDashboardSection(
        "overview"
    );


    await Promise.all([
        loadCustomOrders(),
        loadPreorderProducts(),
        loadPreorderOrders(),
        loadDashboardGallery(),
        loadDashboardReviews(),
        loadDashboardMessages()
    ]);

}


initializeDashboard();