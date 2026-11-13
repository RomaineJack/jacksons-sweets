/* Jackson's Sweets homepage featured gallery image. */
(function () {
    const heroImage = document.getElementById("homepageFeaturedImage");
    if (!heroImage || typeof supabaseClient === "undefined") return;

    async function loadFeaturedImage() {
        try {
            const { data, error } = await supabaseClient
                .from("gallery_items")
                .select("image_url,title")
                .eq("featured", true)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) throw error;
            const featured = Array.isArray(data) ? data[0] : null;
            if (!featured || !featured.image_url) return;

            const image = new Image();
            image.onload = function () {
                heroImage.src = featured.image_url;
                heroImage.alt = featured.title
                    ? featured.title + " cakesicles from Jackson's Sweets"
                    : "Featured cakesicles from Jackson's Sweets";
            };
            image.onerror = function () {
                console.warn("Featured image unavailable; keeping the default homepage photo.");
            };
            image.src = featured.image_url;
        } catch (error) {
            console.error("Unable to load featured homepage image:", error);
        }
    }

    loadFeaturedImage();
})();
