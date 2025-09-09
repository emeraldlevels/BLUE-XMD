const axios = require("axios");
const { cmd, commands } = require("../command");

cmd({
    pattern: "ringtone",
    alias: ["ringtones", "ring"],
    desc: "Get a random ringtone from the API.",
    react: "🎵",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("Please provide a search query! Example: .ringtone alabi", {
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

        const { data } = await axios.get(`https://www.dark-yasiya-api.site/download/ringtone?text=${encodeURIComponent(query)}`);

        if (!data.status || !data.result || data.result.length === 0) {
            return reply("No ringtones found for your query. Please try a different keyword.", {
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

        const randomRingtone = data.result[Math.floor(Math.random() * data.result.length)];

        await conn.sendMessage(
            from,
            {
                audio: { url: randomRingtone.dl_link },
                mimetype: "audio/mpeg",
                fileName: `${randomRingtone.title}.mp3`,
                caption: `🎵 *${randomRingtone.title}*\n\n> Powered by BrenaldMedia`,
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
            },
            { quoted: mek }
        );
    } catch (error) {
        console.error("Error in ringtone command:", error);
        reply("Sorry, something went wrong while fetching the ringtone. Please try again later.", {
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