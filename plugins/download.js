const { fetchJson } = require("../lib/functions");
const { downloadTiktok } = require("@mrnima/tiktok-downloader");
const { facebook } = require("@mrnima/facebook-downloader");
const cheerio = require("cheerio");
const { igdl } = require("ruhend-scraper");
const axios = require("axios");
const { cmd, commands } = require('../command');

cmd({
  pattern: "ig2",
  alias: ["insta2", "Instagram2"],
  desc: "To download Instagram videos.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("http")) {
      return reply("❌ Please provide a valid Instagram link.", {
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

    await conn.sendMessage(from, {
      react: { text: "⏳", key: mek.key }
    });

    const response = await axios.get(`https://api.davidcyriltech.my.id/instagram?url=${q}`);
    const data = response.data;

    if (!data || data.status !== 200 || !data.downloadUrl) {
      return reply("⚠️ Failed to fetch Instagram video. Please check the link and try again.", {
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

    await conn.sendMessage(from, {
      video: { url: data.downloadUrl },
      mimetype: "video/mp4",
      caption: "📥 *Instagram Video Downloaded Successfully!*\n\n> Powered by BrenaldMedia",
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
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.", {
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

// twitter-dl

cmd({
  pattern: "twitter",
  alias: ["tweet", "twdl"],
  desc: "Download Twitter videos",
  category: "download",
  filename: __filename
}, async (conn, mek, m, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { 
        text: "❌ Please provide a valid Twitter URL.",
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
    }

    await conn.sendMessage(from, {
      react: { text: '⏳', key: mek.key }
    });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve Twitter video. Please check the link and try again.", {
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

    const { desc, thumb, video_sd, video_hd } = data.result;

    const caption = `╭━━━〔 *TWITTER DOWNLOADER* 〕━━━⊷\n`
      + `┃▸ *Description:* ${desc || "No description"}\n`
      + `╰━━━⪼\n\n`
      + `📹 *Download Options:*\n`
      + `1️⃣  *SD Quality*\n`
      + `2️⃣  *HD Quality*\n`
      + `🎵 *Audio Options:*\n`
      + `3️⃣  *Audio*\n`
      + `4️⃣  *Document*\n`
      + `5️⃣  *Voice*\n\n`
      + `📌 *Reply with the number to download your choice.*\n\n`
      + `> Powered by BrenaldMedia`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption: caption,
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

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, {
          react: { text: '⬇️', key: receivedMsg.key }
        });

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: video_sd },
              caption: "📥 *Downloaded in SD Quality*\n\n> Powered by BrenaldMedia",
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
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: video_hd },
              caption: "📥 *Downloaded in HD Quality*\n\n> Powered by BrenaldMedia",
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
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mpeg",
              caption: "🎵 *Audio Downloaded*\n\n> Powered by BrenaldMedia",
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
            }, { quoted: receivedMsg });
            break;

          case "4":
            await conn.sendMessage(senderID, {
              document: { url: video_sd },
              mimetype: "audio/mpeg",
              fileName: "Twitter_Audio.mp3",
              caption: "📥 *Audio Downloaded as Document*\n\n> Powered by BrenaldMedia",
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
            }, { quoted: receivedMsg });
            break;

          case "5":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mp4",
              ptt: true,
              caption: "🎤 *Voice Message*\n\n> Powered by BrenaldMedia",
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
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, 3, 4, or 5.", {
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
      }
    });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.", {
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

// MediaFire-dl

cmd({
  pattern: "mediafire",
  alias: ["mfire"],
  desc: "To download MediaFire files.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, mek, m, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid MediaFire link.", {
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

    await conn.sendMessage(from, {
      react: { text: "⏳", key: mek.key }
    });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/mfire?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result || !data.result.dl_link) {
      return reply("⚠️ Failed to fetch MediaFire download link. Ensure the link is valid and public.", {
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

    await conn.sendMessage(from, {
      react: { text: "⬆️", key: mek.key }
    });

    const caption = `╭━━━〔 *MEDIAFIRE DOWNLOADER* 〕━━━⊷\n`
      + `┃▸ *File Name:* ${data.result.fileName}\n`
      + `┃▸ *File Type:* ${data.result.fileType}\n`
      + `╰━━━⪼\n\n`
      + `📥 *Downloading your file...*\n\n`
      + `> Powered by BrenaldMedia`;

    await conn.sendMessage(from, {
      document: { url: data.result.dl_link },
      mimetype: data.result.fileType || "application/octet-stream",
      fileName: data.result.fileName || "mediafire_download",
      caption: caption,
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
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.", {
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

// apk-dl

cmd({
  pattern: "apk",
  desc: "Download APK from Aptoide.",
  category: "download",
  filename: __filename
}, async (conn, mek, m, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide an app name to search.", {
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

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.datalist || !data.datalist.list.length) {
      return reply("⚠️ No results found for the given app name.", {
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

    const app = data.datalist.list[0];
    const appSize = (app.size / 1048576).toFixed(2); // Convert bytes to MB

    const caption = `╭━━━〔 *APK Downloader* 〕━━━┈⊷
┃ 📦 *Name:* ${app.name}
┃ 🏋 *Size:* ${appSize} MB
┃ 📦 *Package:* ${app.package}
┃ 📅 *Updated On:* ${app.updated}
┃ 👨‍💻 *Developer:* ${app.developer.name}
╰━━━━━━━━━━━━━━━┈⊷
> 🔗 *Powered By BrenaldMedia*`;

    await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

    await conn.sendMessage(from, {
      document: { url: app.file.path_alt },
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: caption,
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

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the APK. Please try again.", {
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

// G-Drive-DL

cmd({
  pattern: "gdrive",
  desc: "Download Google Drive files.",
  react: "🌐",
  category: "download",
  filename: __filename
}, async (conn, mek, m, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid Google Drive link.", {
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

    await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

    const apiUrl = `https://api.fgmods.xyz/api/downloader/gdrive?url=${q}&apikey=mnp3grlZ`;
    const response = await axios.get(apiUrl);
    const downloadUrl = response.data.result.downloadUrl;

    if (downloadUrl) {
      await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

      await conn.sendMessage(from, {
        document: { url: downloadUrl },
        mimetype: response.data.result.mimetype,
        fileName: response.data.result.fileName,
        caption: "*© Powered By BrenaldMedia*",
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

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } else {
      return reply("⚠️ No download URL found. Please check the link and try again.", {
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
  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the Google Drive file. Please try again.", {
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