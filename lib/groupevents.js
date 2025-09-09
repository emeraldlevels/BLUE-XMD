const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (mentionedJids) => ({
    mentionedJid: mentionedJids,
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363401559573199@newsletter',
        newsletterName: config.OWNER_NAME,
        serverMessageId: 143
    }
});

const defaultProfilePics = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        // --- Guard against malformed update ---
        if (!update?.id || !isJidGroup(update.id)) return;
        if (!update?.participants || !Array.isArray(update.participants)) return;

        const metadata = await conn.groupMetadata(update.id).catch(() => null);
        if (!metadata) return;

        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants?.length || 0;

        for (const num of update.participants) {
            const userName = (num?.split("@")[0]) || "Unknown";
            const timestamp = new Date().toLocaleString();

            // Get user's profile picture
            let userPpUrl;
            try {
                userPpUrl = await conn.profilePictureUrl(num, 'image');
            } catch {
                userPpUrl = defaultProfilePics[Math.floor(Math.random() * defaultProfilePics.length)];
            }

            // --- WELCOME ---
            if (update.action === "add" && config.WELCOME) {
                const WelcomeText = `
╭───❖ *WELCOME HOMIE* ❖───
│ 👋 *Hey @${userName}!*
│ 🏠 *Welcome to:* ${metadata.subject}
│ 🔢 *Member #:* ${groupMembersCount}
│ 🕒 *Joined:* ${timestamp}
│ 
│ 📝 *Group Description:*
│ ${desc}
│ 
╰───❖ *Powered by ${config.BOT_NAME}* ❖─
                `.trim();

                await conn.sendMessage(update.id, {
                    image: { url: userPpUrl },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo([num]),
                });
            }

            // --- GOODBYE ---
            else if (update.action === "remove" && config.GOODBYE) {
                const GoodbyeText = `
╭───❖ *FAREWELL HOMIE* ❖───
│ 👋 *Goodbye @${userName}* 😔
│ 🏠 *Left from:* ${metadata.subject}
│ 🕒 *Time:* ${timestamp}
│ 👥 *Members left:* ${groupMembersCount}
│ 
╰───❖ *Powered by ${config.BOT_NAME}* ❖─
                `.trim();

                await conn.sendMessage(update.id, {
                    image: { url: userPpUrl },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo([num]),
                });
            }

            // --- ADMIN EVENTS ---
            else if (update.action === "demote" && config.ADMIN_EVENTS) {
                const demoter = update.author ? update.author.split("@")[0] : "Unknown";
                const AdminText = `
╭───❖ *ADMIN ACTION* ❖───
│ ⚡ *Event:* Admin Demotion
│ 👤 *By:* @${demoter}
│ 👥 *Who:* @${userName}
│ 🕒 *Time:* ${timestamp}
│ 🏠 *Group:* ${metadata.subject}
│ 
╰───❖ *Powered by ${config.BOT_NAME}* ❖─
                `.trim();

                await conn.sendMessage(update.id, {
                    text: AdminText,
                    mentions: [update.author, num].filter(Boolean),
                    contextInfo: getContextInfo([update.author, num].filter(Boolean)),
                });
            }

            else if (update.action === "promote" && config.ADMIN_EVENTS) {
                const promoter = update.author ? update.author.split("@")[0] : "Unknown";
                const AdminText = `
╭───❖ *ADMIN ACTION* ❖───
│ ⚡ *Event:* Admin Promotion
│ 👤 *By:* @${promoter}
│ 👥 *Who:* @${userName}
│ 🕒 *Time:* ${timestamp}
│ 🏠 *Group:* ${metadata.subject}
│ 
│ 🎉 *Congratulations!* New admin
│ 
╰───❖ *Powered by ${config.BOT_NAME}* ❖─
                `.trim();

                await conn.sendMessage(update.id, {
                    text: AdminText,
                    mentions: [update.author, num].filter(Boolean),
                    contextInfo: getContextInfo([update.author, num].filter(Boolean)),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;