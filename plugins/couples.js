const { cmd, commands } = require('../command');
const axios = require('axios');

cmd({
  pattern: "couplepp",
  alias: ["couple", "cpp"],
  react: '💑',
  desc: "Get a male and female couple profile picture.",
  category: "image",
  use: ".couplepp",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    reply("*💑 Fetching couple profile pictures...*");

    const response = await axios.get("https://api.davidcyriltech.my.id/couplepp");
    const data = response.data;

    if (!data || (!data.male && !data.female)) {
      return reply("❌ Failed to fetch couple profile pictures. Please try again later.");
    }

    if (data.male) {
      await conn.sendMessage(from, {
        image: { url: data.male },
        caption: "👨 Male Couple Profile Picture"
      }, { quoted: m });
    }

    if (data.female) {
      await conn.sendMessage(from, {
        image: { url: data.female },
        caption: "👩 Female Couple Profile Picture"
      }, { quoted: m });
    }

  } catch (error) {
    console.error("CouplePP command error:", error.message);
    reply("❌ An error occurred while fetching the couple profile pictures.");
  }
});
