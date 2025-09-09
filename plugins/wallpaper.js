const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "wallpaper",
    alias: ["wallpapers", "wallpapersearch"],
    desc: "Search HD wallpapers by keyword",
    category: "search",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("❎ Please provide a wallpaper keyword.\n\n📌 Example: `.wallpaper car, Scenes`");
        }

        await reply(`🔍 Searching wallpapers for: *${query}* ...`);

        const api = `https://api.princetechn.com/api/search/wallpaper?apikey=prince&query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(api, { timeout: 20000 });

        if (!data || !data.results || data.results.length === 0) {
            return reply("⚠️ No wallpapers found.");
        }

        // Limit to 5 wallpapers to avoid spam
        for (let i = 0; i < Math.min(5, data.results.length); i++) {
            const wp = data.results[i];
            let caption = `🖼️ *Wallpaper Result #${i + 1}*\n`;
            caption += `📂 Type: ${wp.type}\n`;
            caption += `🌐 Source: ${wp.source}\n\n`;
            caption += `🔗 Preview: ${wp.image[0]}`;

            await conn.sendMessage(
                from,
                { image: { url: wp.image[0] }, caption },
                { quoted: mek }
            );
        }

    } catch (e) {
        console.error("[WallpaperSearch] Error:", e.response?.data || e.message);
        reply(`⚠️ Error: ${e.message}`);
    }
});
