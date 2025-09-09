const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "tinyurl",
    alias: ["shorturl", "shortlink"],
    desc: "Shorten a long URL into TinyURL",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const longUrl = args[0];
        if (!longUrl) {
            return reply(
                "❎ Please provide a URL to shorten.\n\n📌 Example:\n" +
                "`.tinyurl https://example.com/my-long-url`"
            );
        }

        await reply("⏳ Shortening your link...");

        const api = `https://api.princetechn.com/api/tools/tinyurl?apikey=prince&url=${encodeURIComponent(longUrl)}`;
        const { data } = await axios.get(api);

        if (!data || !data.result) {
            return reply("⚠️ Failed to shorten the URL.");
        }

        await conn.sendMessage(
            from,
            {
                text: `🔗 *URL Shortener Result*\n\n📍 Original: ${longUrl}\n✅ Shortened: ${data.result}`,
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("[TinyURL] Error:", e.message);
        reply(`⚠️ Error: ${e.message}`);
    }
});
