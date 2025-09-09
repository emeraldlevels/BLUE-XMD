const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "wattpad",
    alias: ["wpsearch", "wps"],
    desc: "Search Wattpad stories by keyword.",
    category: "search",
    react: "📚",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("❎ Please provide a search term.\n\nExample: `.wattpad love`");
        }

        await reply(`🔍 Searching Wattpad for: *${query}* ...`);

        const url = `https://api.princetechn.com/api/search/wattpad?apikey=prince&query=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 15000 });

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            return reply("❌ No Wattpad stories found for your search.");
        }

        const results = response.data.results.slice(0, 5); // show top 5 results
        let text = `📚 *Wattpad Search Results for "${query}"*\n\n`;

        results.forEach((item, i) => {
            text += `*${i + 1}. ${item.tittle}*
👀 Reads: ${item.reads}
❤️ Likes: ${item.likes}
🔗 [Read Story](${item.link})

`;
        });

        // send first result as image + caption
        await conn.sendMessage(from, {
            image: { url: results[0].thumbnail },
            caption: text
        }, { quoted: mek });

    } catch (e) {
        console.error("[WattpadSearch] Error:", e.response?.data || e.message);
        reply(`⚠️ Error fetching Wattpad results.\nDebug: ${e.message || String(e)}`);
    }
});
