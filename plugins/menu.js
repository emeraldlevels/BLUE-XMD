const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');
const os = require('os');

// Calculate total commands
const totalCommands = Object.keys(commands).length;

cmd({
    pattern: "menu",
    alias: ["allmenu", "help", "m"],
    desc: "Show complete interactive menu",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363401559573199@newsletter',
                newsletterName: config.OWNER_NAME,
                serverMessageId: 143
            }
        };

        // Create the complete menu content
        const completeMenu = `╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *${config.OWNER_NAME}*
┃★│ 🤖 Baileys : *Multi Device*
┃★│ 💻 Type : *NodeJs*
┃★│ 📜 Total Commands: ${totalCommands}
┃★│ 🚀 Platform : *${os.hostname()}* 
┃★│ ⚙️ Mode : *[${config.MODE}]*
┃★│ 🔣 Prefix : *[${config.PREFIX}]*
┃★│ 🏷️ Version : *1.0.0*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *📥 DOWNLOAD MENU* 〕━━┈⊷
┃◈│ • facebook [url]
┃◈│ • mediafire [url]
┃◈│ • tiktok [url]
┃◈│ • twitter [url]
┃◈│ • Insta [url]
┃◈│ • Ig2 [url]
┃◈│ • apk [app]
┃◈│ • img [query]
┃◈│ • tt2 [url]
┃◈│ • pins [url]
┃◈│ • apk2 [app]
┃◈│ • fb2 [url]
┃◈│ • gdrive [url]
┃◈│ • pinterest [url]
┃◈│ • lyric
┃◈│ • spotify
┃◈│ • play [song]
┃◈│ • play2-10 [song]
┃◈│ • audio [url]
┃◈│ • video [url]
┃◈│ • video [Name]
┃◈│ • video2-10 [url]
┃◈│ • ytmp3 [url]
┃◈│ • ytmp4 [url]
┃◈│ • song [name]
┃◈│ • darama [name]
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *👥 GROUP MENU* 〕━━┈⊷
┃◈│ • grouplink
┃◈│ • kickall
┃◈│ • add @user
┃◈│ • remove @user
┃◈│ • kick @user
┃◈│ • promote @user
┃◈│ • demote @user
┃◈│ • dismiss 
┃◈│ • revoke
┃◈│ • lockgc 
┃◈│ • opengroup
┃◈│ • closegroup
┃◈│ • unlockgc
┃◈│ • poll
┃◈│ • requestlist 
┃◈│ • acceptall
┃◈│ • rejectall
┃◈│ • updategroupdisc
┃◈│ • updategname
┃◈│ • ginfo
┃◈│ • endgroup
┃◈│ • removeadmins
┃◈│ • deletelink
┃◈│ • antilink
┃◈│ • kicklink 
┃◈│ • groupsprivacy
┃◈│ • tag @user
┃◈│ • hidetag [msg]
┃◈│ • tagall
┃◈│ • tagadmins
┃◈│ • invite
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *😄 FUN MENU* 〕━━┈⊷
┃◈│ • shapar
┃◈│ • rate @user
┃◈│ • insult @user
┃◈│ • hack @user
┃◈│ • ship @user1 @user2
┃◈│ • character
┃◈│ • pickup
┃◈│ • joke
┃◈│ • truth
┃◈│ • dare
┃◈│ • match
┃◈│ • rcolor 
┃◈│ • quote 
┃◈│ • ringtone 
┃◈│ • screenshot 
┃◈│ • pickupline
┃◈│ • compatibility 
┃◈│ • aura 
┃◈│ • roast 
┃◈│ • 8ball 
┃◈│ • compliment 
┃◈│ • lovetest 
┃◈│ • emoji 
┃◈│ • flirt
┃◈│ • marriage 
┃◈│ • boy
┃◈│ • girl
┃◈│ • roll
┃◈│ • coinflip
┃◈│ • flip
┃◈│ • pick
┃◈│ • 3dcomic
┃◈│ • dragonball
┃◈│ • deadpool
┃◈│ • blackpink
┃◈│ • neonlight
┃◈│ • cat
┃◈│ • sadgirl
┃◈│ • pornhub
┃◈│ • naruto
┃◈│ • thor
┃◈│ • america
┃◈│ • eraser
┃◈│ • 3dpaper
┃◈│ • glossysilver
┃◈│ • futuristic
┃◈│ • clouds
┃◈│ • sans
┃◈│ • galaxy
┃◈│ • sunset
┃◈│ • nigeria
┃◈│ • devilwings
┃◈│ • hacker
┃◈│ • luxury
┃◈│ • boom
┃◈│ • zodiac
┃◈│ • angelwings
┃◈│ • bulb
┃◈│ • tatoo
┃◈│ • castle
┃◈│ • frozen
┃◈│ • paint
┃◈│ • birthday
┃◈│ • typography
┃◈│ • bear
┃◈│ • valorant
┃◈│ • nikal
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *👑 OWNER MENU* 〕━━┈⊷
┃◈│ • block @user
┃◈│ • unblock @user
┃◈│ • fullpp [img]
┃◈│ • setpp [img]
┃◈│ • restart
┃◈│ • shutdown
┃◈│ • updatecmd
┃◈│ • newversion 
┃◈│ • exec 
┃◈│ • clearmem 
┃◈│ • gjid
┃◈│ • mention
┃◈│ • imgscan
┃◈│ • jid @user
┃◈│ • cjid [channel]
┃◈│ • listcmd
┃◈│ • autorecording
┃◈│ • autotyping
┃◈│ • antidelete 
┃◈│ • autostatusreact
┃◈│ • alwaysonline
┃◈│ • autostatusview
┃◈│ • autovoice
┃◈│ • antibad
┃◈│ • autosticker
┃◈│ • autoreply
┃◈│ • autoreact
┃◈│ • autoread
┃◈│ • statusreply
┃◈│ • .newgc Work Team;234xx
┃◈│ • clearchats
┃◈│ • send
┃◈│ • broadcast
┃◈│ • delete /del
┃◈│ • left
┃◈│ • join
┃◈│ • Presence 
┃◈│ • privacy  
┃◈│ • admin-events
┃◈│ • person
┃◈│ • repeat
┃◈│ • save 
┃◈│ • repo
┃◈│ • setreact
┃◈│ • setbank
┃◈│ • setaccountname
┃◈│ • setbanknum
┃◈│ • setcommunity 
┃◈│ • setwebsite
┃◈│ • setdiscord 
┃◈│ • settwitter 
┃◈│ • setinstagram 
┃◈│ • settiktok 
┃◈│ • setyoutube 
┃◈│ • setrepo 
┃◈│ • setownername 
┃◈│ • setownernum 
┃◈│ • setchannel 
┃◈│ • forward
┃◈│ • setprefix
┃◈│ • setmode 
┃◈│ • blocklist
┃◈│ • getbio
┃◈│ • setppall
┃◈│ • setonline
┃◈│ • setmyname 
┃◈│ • updatebio
┃◈│ • getprivacy
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *🤖 AI MENU* 〕━━┈⊷
┃◈│ • ai [query]
┃◈│ • gpt3 [query]
┃◈│ • gpt2 [query]
┃◈│ • gptmini [query]
┃◈│ • gpt [query]
┃◈│ • meta [query]
┃◈│ • tai [ *NEW* ] 🔥
┃◈│ • imagine [text]
┃◈│ • imagine2 [text] 
┃◈│ • imagine3 [text] 
┃◈│ • blackbox [query]
┃◈│ • luma [query]
┃◈│ • dj [query]
┃◈│ • tracle [query]
┃◈│ • aivoice  
┃◈│ • fluxai
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *🎎 ANIME MENU* 〕━━┈⊷
┃◈│ • fack
┃◈│ • dog
┃◈│ • awoo
┃◈│ • garl
┃◈│ • waifu
┃◈│ • neko
┃◈│ • megnumin
┃◈│ • maid
┃◈│ • loli
┃◈│ • animegirl
┃◈│ • animegirl1-5
┃◈│ • anime1-5
┃◈│ • foxgirl
┃◈│ • naruto
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *🔄 CONVERT MENU* 〕━━┈⊷
┃◈│ • sticker [img]
┃◈│ • sticker2 [img]
┃◈│ • emojimix 😎+😂
┃◈│ • take [name,text]
┃◈│ • tomp3 [video]
┃◈│ • fancy [text]
┃◈│ • tts [text]
┃◈│ • trt [text]
┃◈│ • trtr 
┃◈│ • base64 [text]
┃◈│ • unbase64 [text]
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *📌 OTHER MENU* 〕━━┈⊷
┃◈│ • time
┃◈│ • date
┃◈│ • count [num]
┃◈│ • calculate [expr]
┃◈│ • countx
┃◈│ • langs
┃◈│ • flip
┃◈│ • readmore
┃◈│ • coinflip
┃◈│ • rcolor
┃◈│ • roll
┃◈│ • fact
┃◈│ • take
┃◈│ • attp
┃◈│ • tosticker 
┃◈│ • tempmail 
┃◈│ • logo 
┃◈│ • binary 
┃◈│ • dbinary
┃◈│ • urlencode 
┃◈│ • shorturl
┃◈│ • timenow 
┃◈│ • checkmail 
┃◈│ • toptt 
┃◈│ • topdf 
┃◈│ • couplepp
┃◈│ • tiktokstalk 
┃◈│ • githubstalk
┃◈│ • wstalk /channelstalk
┃◈│ • Igstalk 
┃◈│ • wattpad.
┃◈│ • tempnum
┃◈│ • templist
┃◈│ • otpbox 
┃◈│ • define [word]
┃◈│ • news [query]
┃◈│ • movie [name]
┃◈│ • weather [loc]
┃◈│ • bible
┃◈│ • info
┃◈│ • countryinfo
┃◈│ • gpass (generate password)
┃◈│ • vv
┃◈│ • gitclone 
┃◈│ • tiktoksearch
┃◈│ • npm 
┃◈│ • srepo [search repo]
┃◈│ • report 
┃◈│ • wallpaper 
┃◈│ • story
┃◈│ • ytstalk
┃◈│ • xstalk
┃◈│ • get
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *💞 REACTIONS MENU* 〕━━┈⊷
┃◈│ • cuddle @user
┃◈│ • hug @user
┃◈│ • kiss @user
┃◈│ • lick @user
┃◈│ • pat @user
┃◈│ • bully @user
┃◈│ • bonk @user
┃◈│ • yeet @user
┃◈│ • slap @user
┃◈│ • kill @user
┃◈│ • blush @user
┃◈│ • smile @user
┃◈│ • happy @user
┃◈│ • wink @user
┃◈│ • poke @user
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *🏠 MAIN MENU* 〕━━┈⊷
┃◈│ • ping
┃◈│ • live
┃◈│ • alive
┃◈│ • runtime
┃◈│ • uptime
┃◈│ • repo
┃◈│ • owner 
┃◈│ • support
┃◈│ • aza
┃◈│ • menu
┃◈│ • restart
╰━━━━━━━━━━━━━━━┈⊷

> ${config.DESCRIPTION || 'Powered by Tracle Bot'}`;

        // Function to send menu image with timeout
        const sendMenuImage = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/4zbgw2.png' },
                        caption: completeMenu,
                        contextInfo: contextInfo
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Image send failed, falling back to text');
                return await conn.sendMessage(
                    from,
                    { text: completeMenu, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        };

        // Send menu first
        let sentMsg;
        try {
            // Send menu with 10s timeout
            sentMsg = await Promise.race([
                sendMenuImage(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Menu send timeout')), 10000))
            ]);
        } catch (e) {
            console.log('Menu send error:', e);
            if (!sentMsg) {
                sentMsg = await conn.sendMessage(
                    from,
                    { text: completeMenu, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        }

        // Send audio after menu
        try {
            await conn.sendMessage(
                from,
                { 
                    audio: { url: "https://github.com/Brenaldmedia/Tracle/raw/refs/heads/main/autovoice/menumusic.mp3" },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363401559573199@newsletter',
                            newsletterName: config.OWNER_NAME,
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: mek }
            );
        } catch (audioError) {
            console.log('Audio send failed, but menu was sent successfully:', audioError);
        }

    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
                from,
                { text: `❌ Menu system is currently unavailable. Please try again later.\n\n> ${config.DESCRIPTION}` },
                { quoted: mek }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});