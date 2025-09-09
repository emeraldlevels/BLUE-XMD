const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "tiktokstalk",
  alias: ["tstalk", "ttstalk"],
  react: "📱",
  desc: "Fetch TikTok user profile details .",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, args, q, reply }) => {
  try {
    if (!q) {
      return reply("❎ Please provide a TikTok username.\n\n*Example:* .tiktokstalk Brenaldmedia");
    }

    const apiUrl = `https://api.princetechn.com/api/stalk/tiktokstalk?apikey=prince&username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.success || !data.result) {
      return reply("❌ User not found or API returned no data.");
    }

    const user = data.result;

    const profileInfo = `╭━━〔 *🎭 TikTok Profile* 〕━━┈⊷
┃ 👤 *Username*: @${user.username}
┃ 📛 *Nickname*: ${user.name || "Unknown"}
┃ ✅ *Verified*: ${user.verified ? "Yes ✅" : "No ❌"}
┃ 🔒 *Private*: ${user.private ? "Yes 🔒" : "No 🌍"}
┃ 📝 *Bio*: ${user.bio || "No bio available."}
┃
┃ 📊 *Statistics*:
┃ 👥 Followers: ${user.followers.toLocaleString()}
┃ 👤 Following: ${user.following.toLocaleString()}
┃ ❤️ Likes: ${user.likes.toLocaleString()}
┃
┃ 🆔 *ID*: ${user.id}
┃ 🔗 *Profile*: https://www.tiktok.com/@${user.username}
╰━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by TRACLE`;

    if (user.avatar) {
      await conn.sendMessage(from, {
        image: { url: user.avatar },
        caption: profileInfo
      }, { quoted: m });
    } else {
      await conn.sendMessage(from, { text: profileInfo }, { quoted: m });
    }

  } catch (error) {
    console.error("❌ Error in TikTok stalk command:", error);
    reply("⚠️ An error occurred while fetching TikTok profile data.");
  }
});
