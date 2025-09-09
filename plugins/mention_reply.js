const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "mention",
  alias: ["mentions", "mentionreply"],
  desc: "Bot mention reply settings",
  category: "utility",
  react: "🔊",
  filename: __filename
}, async (conn, mek, m, { from, reply, isGroup }) => {
  try {
    if (!isGroup) {
      return reply("❌ This command only works in groups.", {
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

    // Voice clips array is now empty (MP4 URLs removed)
    const voiceClips = [
      // MP4 URLs have been removed as requested
    ];

    // Check if there are any voice clips available
    if (voiceClips.length === 0) {
      return reply("🔇 No voice responses are currently available.", {
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

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    const thumbnailRes = await axios.get(config.MENU_IMAGE_URL || "https://files.catbox.moe/4zbgw2.png", {
      responseType: 'arraybuffer'
    });
    const thumbnailBuffer = Buffer.from(thumbnailRes.data, 'binary');

    await conn.sendMessage(from, {
      audio: { url: randomClip },
      mimetype: 'audio/mp4',
      ptt: true,
      waveform: [99, 0, 99, 0, 99],
      caption: "🔊 *Mention Response*\n\n> Powered by BrenaldMedia",
      contextInfo: {
        mentionedJid: [`${m.sender.split('@')[0]}@s.whatsapp.net`], 
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401559573199@newsletter',
          newsletterName: 'BrenaldMedia Hub 🫟',
          serverMessageId: 143
        },
        externalAdReply: {
          title: config.BOT_NAME || "TRACLE 🥀",
          body: config.DESCRIPTION || "POWERED BY BrenaldMedia 💗",
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnail: thumbnailBuffer,
          mediaUrl: "https://files.catbox.moe/4zbgw2.png",
          sourceUrl: "https://whatsapp.com/channel/0029VbBPPXV3WHTTNAWOGf0m",
          showAdAttribution: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error("Mention command error:", e);
    reply(`❌ Error: ${e.message}`, {
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