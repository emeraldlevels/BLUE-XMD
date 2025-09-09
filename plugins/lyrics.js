const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "lyrics",
    alias: ["songlyrics", "lyric"],
    desc: "Fetch lyrics of a song ",
    category: "music",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("❎ Please provide a song name.\n\nExample: `.lyrics Dynasty by MIIA`");
        }

        await reply(`🎵 Searching lyrics for: *${query}* ...`);

        const url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 15000 });

        if (!response.data || !response.data.result) {
            return reply("❌ No lyrics found for your search.");
        }

        const result = response.data.result;

        let caption = `🎶 *${result.title}*  
👤 *Artist*: ${result.artist}  
🔗 [View on Genius](${result.link})  

📑 *Lyrics*:  
${result.lyrics.slice(0, 2000)}...  
\n> © Powered by Brenaldmedia `;

        await conn.sendMessage(from, {
            image: { url: result.image },
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.error("[LyricsSearch] Error:", e.response?.data || e.message);
        reply(`⚠️ Error fetching lyrics.\nDebug: ${e.message || String(e)}`);
    }
});
