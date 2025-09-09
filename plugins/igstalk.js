const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "igstalk",
  alias: ["instastalk"],
  react: "📸",
  desc: "Fetch public Instagram profile details (no API key needed).",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, args, q, reply }) => {
  try {
    if (!q) return reply("❎ Please provide an Instagram username.\n\nExample: .igstalk instagram");

    // Clean username (remove @, spaces, and force lowercase)
    const username = q.replace(/@/g, "").replace(/\s+/g, "").trim().toLowerCase();
    await reply(`🔍 Fetching Instagram profile for *${username}*…`);

    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // New Instagram JSON structure (sometimes v2)
    const user = response.data?.graphql?.user || response.data?.user;

    if (!user) {
      return reply("❌ Failed to fetch account. It may be private or non-existent.");
    }

    const profileInfo = `╭━━〔 *📸 IG Profile* 〕━━┈⊷
┃ 👤 *Username:* ${user.username}
┃ 📛 *Full Name:* ${user.full_name || "None"}
┃ 📝 *Bio:* ${user.biography || "None"}
┃
┃ 👥 *Followers:* ${user.edge_followed_by?.count || 0}
┃ 👤 *Following:* ${user.edge_follow?.count || 0}
┃ 🖼 *Posts:* ${user.edge_owner_to_timeline_media?.count || 0}
┃
┃ 🔒 Private? ${user.is_private ? "Yes 🔒" : "No 🌍"}
┃ ✅ Verified? ${user.is_verified ? "Yes ✅" : "No ❌"}
┃
┃ 🔗 Profile: https://instagram.com/${user.username}
╰━━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by TRACLE`;

    if (user.profile_pic_url_hd) {
      await conn.sendMessage(from, {
        image: { url: user.profile_pic_url_hd },
        caption: profileInfo
      }, { quoted: m });
    } else {
      await conn.sendMessage(from, { text: profileInfo }, { quoted: m });
    }

  } catch (error) {
    console.error("IG stalk error:", error?.response?.status || error.message);
    reply("⚠️ Unable to fetch profile. The account may be private, or Instagram blocked access.");
  }
});
