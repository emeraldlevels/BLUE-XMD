const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video without watermark",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) {
            return reply("Please provide a TikTok video link.", {
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
        
        if (!q.includes("tiktok.com")) {
            return reply("Invalid TikTok link.", {
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
        
        reply("Downloading video, please wait...", {
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
        
        const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${q}`;
        const { data } = await axios.get(apiUrl);
        
        if (!data.status || !data.data) {
            return reply("Failed to fetch TikTok video.", {
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
        
        const { title, like, comment, share, author, meta } = data.data;
        const videoUrl = meta.media.find(v => v.type === "video").org;
        
        const caption = `🎵 *TikTok Video* 🎵\n\n` +
                        `👤 *User:* ${author.nickname} (@${author.username})\n` +
                        `📖 *Title:* ${title}\n` +
                        `👍 *Likes:* ${like}\n💬 *Comments:* ${comment}\n🔁 *Shares:* ${share}\n\n` +
                        `> Powered By BrenaldMedia`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
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
        
    } catch (e) {
        console.error("Error in TikTok downloader command:", e);
        reply(`An error occurred: ${e.message}\n\n> Powered By BrenaldMedia`, {
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