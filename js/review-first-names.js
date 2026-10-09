/* =========================================================
   JACKSON'S SWEETS
   REVIEW NAME PRIVACY
   Show only the customer's first name on public review cards.
========================================================= */

function showFirstNamesOnly(root) {
    if (!root) return;

    root.querySelectorAll(".review-card strong, .customer-review-card strong").forEach(nameElement => {
        const fullName = nameElement.textContent.trim();

        if (!fullName) return;

        const firstName = fullName.split(/\s+/)[0];
        nameElement.textContent = firstName;
    });
}

function watchReviewNames(grid) {
    if (!grid) return;

    showFirstNamesOnly(grid);

    const observer = new MutationObserver(() => {
        showFirstNamesOnly(grid);
    });

    observer.observe(grid, {
        childList: true,
        subtree: true
    });
}

watchReviewNames(document.getElementById("homepageReviewsGrid"));
watchReviewNames(document.getElementById("publicReviewsGrid"));
