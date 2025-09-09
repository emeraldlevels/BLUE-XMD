// plugins/img.js
const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "img",
    alias: ["image", "googleimage", "searchimg"],
    react: "🦋",
    desc: "Search and download images",
    category: "fun",
    use: ".img <keywords>",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ").trim();
        if (!query) {
            return reply("🖼️ Please provide a search query\nExample: .img cute cats");
        }

        // react to command (key emoji)
        try { await conn.sendMessage(from, { react: { text: "🔑", key: m.key } }); } catch (e) { /* ignore */ }

        await reply(`🔍 Searching images for "${query}"...`);

        // API endpoints (Toxxic Tech)
        const apiEndpoints = [
            `https://api-toxxic.zone.id/api/search/unsplash?q=${encodeURIComponent(query)}`,
            `https://api-toxxic.zone.id/api/search/wallpaper?q=${encodeURIComponent(query)}`
        ];

        let response = null;
        let lastError = null;

        // try endpoints until some data is returned
        for (const endpoint of apiEndpoints) {
            try {
                console.log(`[img] Trying endpoint: ${endpoint}`);
                const r = await axios.get(endpoint, { timeout: 10000 });
                if (r && r.data) {
                    response = r;
                    console.log("[img] Got response from endpoint");
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`[img] Endpoint failed: ${endpoint} -> ${err.message}`);
            }
        }

        if (!response || !response.data) {
            console.error("[img] All image APIs failed:", lastError && lastError.message);
            return reply("❌ All image services are currently unavailable. Please try again later.");
        }

        // Helper: try to extract an array from many possible response shapes
        function extractArray(obj) {
            if (!obj) return [];
            if (Array.isArray(obj)) return obj;
            const candidates = ["result", "data", "imageUrls", "images", "photos", "hits", "results"];
            for (const c of candidates) {
                if (Array.isArray(obj[c]) && obj[c].length) return obj[c];
            }
            // fallback: find first array property
            for (const k of Object.keys(obj)) {
                if (Array.isArray(obj[k]) && obj[k].length) return obj[k];
            }
            return [];
        }

        // Helper: map an item -> url string (try many fields)
        function urlFromItem(item) {
            if (!item) return null;
            if (typeof item === "string") return item;
            const tryFields = [
                "url", "image", "original", "src", "link", "download_url", "display_url",
                "previewURL", "largeImageURL", "photo", "photoUrl", "path"
            ];
            // check nested structures commonly used (e.g. Unsplash style)
            if (item.urls) {
                if (item.urls.full) return item.urls.full;
                if (item.urls.regular) return item.urls.regular;
                if (item.urls.small) return item.urls.small;
                if (item.urls.raw) return item.urls.raw;
            }
            if (item.src) {
                if (typeof item.src === "string") return item.src;
                if (item.src.original) return item.src.original;
                if (item.src.large) return item.src.large;
                if (item.src.medium) return item.src.medium;
            }
            for (const f of tryFields) {
                if (item[f]) {
                    if (typeof item[f] === "string") return item[f];
                    // sometimes nested: item[f].url
                    if (item[f].url && typeof item[f].url === "string") return item[f].url;
                }
            }
            // try "image" nested variants
            if (item.image && typeof item.image === "object") {
                if (item.image.url) return item.image.url;
            }
            return null;
        }

        // Build array of candidate items from response.data
        let items = extractArray(response.data);

        // If nothing found in response.data, maybe the API returns a single object with url property
        if ((!items || items.length === 0) && typeof response.data === "object") {
            // try to pull nested arrays
            items = extractArray(response.data.data || response.data.result || response.data);
        }

        // If still nothing, try to treat response.data as array (safe-guard)
        if (!items || items.length === 0) {
            // Last resort: if response.data itself is an object with url field, wrap it
            if (response.data && typeof response.data === "object" && urlFromItem(response.data)) {
                items = [response.data];
            }
        }

        // Convert items -> urls, filter & dedupe
        const urls = [];
        for (const it of items) {
            const u = urlFromItem(it);
            if (u && typeof u === "string") urls.push(u);
        }

        // If some endpoints return object with 'imageUrls' as an array of strings
        if (urls.length === 0 && Array.isArray(response.data.imageUrls)) {
            for (const u of response.data.imageUrls) if (typeof u === "string") urls.push(u);
        }

        // Filter, validate and dedupe
        const validUrls = [...new Set(urls.map(u => (u || "").trim()).filter(u => /^https?:\/\//i.test(u)))];

        if (!validUrls.length) {
            console.warn("[img] No valid image URLs extracted from response");
            return reply("❌ No images found. Try different keywords.");
        }

        // Choose up to 5 random images
        const limit = 5;
        const selected = validUrls.sort(() => 0.5 - Math.random()).slice(0, limit);

        let sentCount = 0;
        for (const imageUrl of selected) {
            try {
                // Download as arraybuffer, then send from memory
                const imageResp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
                const buffer = Buffer.from(imageResp.data);

                await conn.sendMessage(
                    from,
                    {
                        image: buffer,
                        caption: `📷 Result for: ${query}\n> © Powered by BrenaldMedia`
                    },
                    { quoted: mek }
                );

                sentCount++;
                // small delay to reduce flood
                await new Promise(res => setTimeout(res, 1000));
            } catch (imgErr) {
                console.warn(`[img] Failed to download/send image: ${imageUrl} -> ${imgErr.message}`);
                continue; // try next image
            }
        }

        if (sentCount === 0) {
            return reply("❌ Failed to download/send any images. Try again later.");
        }

    } catch (error) {
        console.error("Image Search Error:", error);
        reply(`❌ Error: ${error.message || "Failed to fetch images"}`);
    }
});
