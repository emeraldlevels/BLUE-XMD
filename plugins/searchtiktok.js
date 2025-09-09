const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "tiktoksearch",
    alias: ["ttsearch", "searchtiktok"],
    desc: "Search TikTok videos by keyword",
    category: "tiktok",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("❎ Please provide a search term.\n\n📌 Example: `.tiktoksearch Brenaldmedia`");
        }

        await reply(`🔍 Searching TikTok for: *${query}* ...`);

        const api = `https://api.princetechn.com/api/search/tiktoksearch?apikey=prince&query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(api, { timeout: 20000 });

        if (!data || !data.results) {
            return reply("⚠️ No results found.");
        }

        const res = data.results;

        let caption = `🎵 *TikTok Search Result*\n\n`;
        caption += `📌 *Title:* ${res.title}\n`;
        caption += `🎬 *Cover:* ${res.cover}\n`;
        caption += `🖼️ *Origin Cover:* ${res.origin_cover}\n`;
        caption += `🎶 *Music:* ${res.music}\n\n`;
        caption += `📥 *Download Links:*\n`;
        caption += `▫️ No Watermark: ${res.no_watermark}\n`;
        caption += `▫️ Watermark: ${res.watermark}\n`;

        // Send video (no watermark) with caption
        await conn.sendMessage(
            from,
            {
                video: { url: res.no_watermark },
                caption: caption,
                mimetype: "video/mp4",
                fileName: "tiktok_video.mp4"
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("[TikTokSearch] Error:", e.response?.data || e.message);
        reply(`⚠️ Error: ${e.message}`);
    }
});
