const { cmd } = require("../command");

cmd({
  pattern: "vv",
  alias: ["viewonce", 'retrive'],
  react: '🐳',
  desc: "Retrieve view once messages",
  category: "tools",
  filename: __filename
}, async (client, message, args, { from, quoted, reply }) => {
  try {
    if (!message.quoted) {
      return reply("*🍁 Please reply to a view once message!*", {
        contextInfo: {
          mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401559573199@newsletter',
            newsletterName: 'BrenaldMedia',
            serverMessageId: 143
          }            
        }
      });
    }

    const buffer = await message.quoted.download();
    const mtype = message.quoted.mtype;

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: message.quoted.text || '',
          mimetype: message.quoted.mimetype || "image/jpeg",
          contextInfo: {
            mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363401559573199@newsletter',
              newsletterName: 'BrenaldMedia',
              serverMessageId: 143
            }            
          }
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: message.quoted.text || '',
          mimetype: message.quoted.mimetype || "video/mp4",
          contextInfo: {
            mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363401559573199@newsletter',
              newsletterName: 'BrenaldMedia',
              serverMessageId: 143
            }            
          }
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: message.quoted.mimetype || "audio/mp4",
          ptt: message.quoted.ptt || false,
          contextInfo: {
            mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363401559573199@newsletter',
              newsletterName: 'BrenaldMedia',
              serverMessageId: 143
            }            
          }
        };
        break;
      default:
        return reply("❌ Only image, video, and audio messages are supported", {
          contextInfo: {
            mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363401559573199@newsletter',
              newsletterName: 'BrenaldMedia',
              serverMessageId: 143
            }            
          }
        });
    }

    await client.sendMessage(from, messageContent, { quoted: message });
    
    reply("✅ View once message retrieved successfully!", {
      contextInfo: {
        mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401559573199@newsletter',
          newsletterName: 'BrenaldMedia',
          serverMessageId: 143
        }            
      }
    });

  } catch (error) {
    console.error("vv Error:", error);
    reply("❌ Error fetching view once message:\n" + error.message, {
      contextInfo: {
        mentionedJid: [`${message.sender.split('@')[0]}@s.whatsapp.net`], 
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401559573199@newsletter',
          newsletterName: 'BrenaldMedia',
          serverMessageId: 143
        }            
      }
    });
  }
});