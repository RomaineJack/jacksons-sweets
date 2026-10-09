/* =========================================================
   JACKSON'S SWEETS
   HOMEPAGE APPROVED REVIEWS
========================================================= */

const homepageReviewsGrid = document.getElementById("homepageReviewsGrid");

function escapeHomepageReviewHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getHomepageReviewFirstName(value) {
    const fullName = String(value || "Customer").trim();
    return fullName ? fullName.split(/\s+/)[0] : "Customer";
}

async function loadHomepageReviews() {
    if (!homepageReviewsGrid || typeof supabaseClient === "undefined") {
        return;
    }

    homepageReviewsGrid.innerHTML = "<p>Loading reviews...</p>";

    try {
        const { data: reviews, error } = await supabaseClient
            .from("reviews")
            .select("*")
            .eq("approved", true)
            .order("created_at", { ascending: false })
            .limit(3);

        if (error) {
            throw error;
        }

        const approvedReviews = reviews || [];

        if (!approvedReviews.length) {
            homepageReviewsGrid.innerHTML = `
                <p>No approved reviews have been published yet.</p>
            `;
            return;
        }

        homepageReviewsGrid.innerHTML = approvedReviews
            .map(review => {
                const rating = Math.max(
                    1,
                    Math.min(5, Number(review.rating) || 5)
                );

                const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
                const reviewText = escapeHomepageReviewHTML(review.review_text);
                const customerName = escapeHomepageReviewHTML(
                    getHomepageReviewFirstName(review.customer_name)
                );

                return `
                    <article class="review-card">
                        <div class="stars" aria-label="${rating} out of 5 stars">${stars}</div>
                        <p>“${reviewText}”</p>
                        <strong>${customerName}</strong>
                    </article>
                `;
            })
            .join("");
    } catch (error) {
        console.error("Homepage reviews error:", error);
        homepageReviewsGrid.innerHTML = `
            <p>Reviews are temporarily unavailable.</p>
        `;
    }
}

loadHomepageReviews();
