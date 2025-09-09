const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "wstalk",
    alias: ["channelstalk", "chinfo"],
    desc: "Get WhatsApp channel information (via Toxxic API)",
    category: "utility",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        if (!args || args.length === 0) {
            return reply("❌ Please provide a WhatsApp channel URL\nExample:\n.wstalk https://whatsapp.com/channel/0029VbBbyKp6LwHs43k6Om1V");
        }

        const urlText = args.join(" ").trim();

        if (!/whatsapp\.com\/channel\//i.test(urlText)) {
            return reply("❌ Invalid WhatsApp channel URL. Example:\nhttps://whatsapp.com/channel/0029VbBbyKp6LwHs43k6Om1V");
        }

        await reply("🔍 Fetching channel information...");

        const apiUrl = `https://api-toxxic.zone.id/api/stalker/wachannel?url=${encodeURIComponent(urlText)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });

        const data = response.data?.data;
        if (!data) {
            return reply("❌ Could not fetch channel information right now. Please try again later.");
        }

        // Map actual keys from API
        const channelTitle = data.channelName || "Unknown";
        const channelFollowers = data.followers || "Unknown";
        const channelDesc = data.status 
            ? (typeof data.status === "string" 
                ? data.status.substring(0, 200) + (data.status.length > 200 ? "..." : "") 
                : "No description") 
            : "No description";

        const channelInfo = `╭━━〔 *WHATSAPP CHANNEL INFO* 〕━━┈⊷
┃ ◈ *📢 Title*: ${channelTitle}
┃ ◈ *👥 Followers*: ${channelFollowers}
┃ ◈ *📝 Description*: ${channelDesc}
╰━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by TRACLE`;

        await conn.sendMessage(from, {
            text: channelInfo
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in wstalk command:", e);
        reply(`❌ Error: ${e.response?.data?.message || e.message || "Unknown error occurred"}`);
    }
});
