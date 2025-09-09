const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd(
  { on: "body" },
  async (conn, mek, m, { body }) => {
    try {
      if (config.AUTO_REPLY === 'true') {
        // Encode the message body into the query param
        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(body)}`;

        // Call the API
        const response = await axios.get(apiUrl);

        // Send the API response back as a reply
        if (response.data && response.data.result) {
          await m.reply(response.data.result);
        } else {
          await m.reply("⚠️ Sorry, I couldn't get a response from the API.");
        }
      }
    } catch (err) {
      console.error('Auto-reply fetch error:', err.message);
      await m.reply("❌ Error fetching reply. Try again later.");
    }
  }
);
