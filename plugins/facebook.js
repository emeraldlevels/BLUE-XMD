const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "fb",
  alias: ["facebook", "fbdl"],
  desc: "Download Facebook videos",
  category: "download",
  filename: __filename,
  use: "<Facebook URL>",
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    // Check if a URL is provided
    if (!q || !q.startsWith("http")) {
      return reply("*`Need a valid Facebook URL`*\n\nExample: `.fb https://www.facebook.com/...`", {
        contextInfo: {
          mentionedJid: [`${m.sender.split('@')[0]}@s.whatsapp.net`], 
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401559573199@newsletter',
            newsletterName: 'BrenaldMedia Hub 🫟',
            serverMessageId: 143
          }            
        }
      });
    }

    // Add a loading react
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    // Fetch video URL from the API
    const apiUrl = `https://www.velyn.biz.id/api/downloader/facebookdl?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    // Check if the API response is valid
    if (!data.status || !data.data || !data.data.url) {
      return reply("❌ Failed to fetch the video. Please try another link.", {
        contextInfo: {
          mentionedJid: [`${m.sender.split('@')[0]}@s.whatsapp.net`], 
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401559573199@newsletter',
            newsletterName: 'BrenaldMedia Hub 🫟',
            serverMessageId: 143
          }            
        }
      });
    }

    // Send the video to the user
    const videoUrl = data.data.url;
    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: "📥 *Facebook Video Downloaded*\n\n- Powered By BrenaldMedia ✅",
      contextInfo: {
        mentionedJid: [`${m.sender.split('@')[0]}@s.whatsapp.net`], 
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401559573199@newsletter',
          newsletterName: 'BrenaldMedia Hub 🫟',
          serverMessageId: 143
        }            
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    reply("❌ Error fetching the video. Please try again.", {
      contextInfo: {
        mentionedJid: [`${m.sender.split('@')[0]}@s.whatsapp.net`], 
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401559573199@newsletter',
          newsletterName: 'BrenaldMedia Hub 🫟',
          serverMessageId: 143
        }            
      }
    });
  }
});