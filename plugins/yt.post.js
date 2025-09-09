const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ytpost",
    alias: ["ytcommunity", "ytc"],
    desc: "Download a YouTube community post",
    category: "downloader",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a YouTube community post URL.\nExample: `.ytpost <url>`", {
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

        const apiUrl = `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) {
            await react("❌");
            return reply("Failed to fetch the community post. Please check the URL.", {
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

        const post = data.data;
        let caption = `📢 *YouTube Community Post* 📢\n\n` +
                      `📜 *Content:* ${post.content}\n\n` +
                      `> Powered by BrenaldMedia`;

        if (post.images && post.images.length > 0) {
            for (const img of post.images) {
                await conn.sendMessage(from, { 
                    image: { url: img }, 
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
                caption = ""; // Only add caption once, images follow
            }
        } else {
            await conn.sendMessage(from, { 
                text: caption,
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

        await react("✅");
    } catch (e) {
        console.error("Error in ytpost command:", e);
        await react("❌");
        reply("An error occurred while fetching the YouTube community post.", {
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