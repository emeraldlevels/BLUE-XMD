// lib/antidel.js
const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage } = require('../data'); // make sure loadMessage exists in your data utils
const { getAnti } = require('../data/antidel'); // use the new antidel DB
const config = require('../config');

// ================== HANDLE DELETED TEXT ==================
const DeletedText = async (conn, mek, jid, isGroup, update) => {
    try {
        const messageContent =
            mek.message?.conversation ||
            mek.message?.extendedTextMessage?.text ||
            mek.message?.imageMessage?.caption ||
            mek.message?.videoMessage?.caption ||
            '❓ Unknown content';

        const senderJid = mek.key.participant || mek.key.remoteJid;
        const deleterJid = update.key.participant || update.key.remoteJid;

        const senderNumber = senderJid ? senderJid.split('@')[0] : 'Unknown';
        const deleterNumber = deleterJid ? deleterJid.split('@')[0] : 'Unknown';

        const menuMessage = `
╭───❖ *ANTI-DELETE ALERT* ❖───
│ 🕒 *Time:* ${new Date().toLocaleTimeString('en-GB')}
│ 👥 *Chat:* ${isGroup ? "Group" : "Private"}
│ 👤 *Sender:* @${senderNumber}
│ 🗑️ *Deleted by:* @${deleterNumber}
│
│ 📩 *Recovered Message:*
│  ${messageContent}
╰─────────────────────────❖
        `;

        const mentionedJids = [];
        if (senderJid && senderJid !== 'Unknown') mentionedJids.push(senderJid);
        if (deleterJid && deleterJid !== 'Unknown' && deleterJid !== senderJid) mentionedJids.push(deleterJid);

        await conn.sendMessage(
            jid,
            {
                text: menuMessage,
                contextInfo: mentionedJids.length > 0 ? { mentionedJid: mentionedJids } : undefined,
            },
            { quoted: mek }
        );
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
};

// ================== HANDLE DELETED MEDIA ==================
const DeletedMedia = async (conn, mek, jid, isGroup, update) => {
    try {
        const antideletedmek = structuredClone(mek.message);
        const messageType = Object.keys(antideletedmek)[0];

        const senderJid = mek.key.participant || mek.key.remoteJid;
        const deleterJid = update.key.participant || update.key.remoteJid;

        const senderNumber = senderJid ? senderJid.split('@')[0] : 'Unknown';
        const deleterNumber = deleterJid ? deleterJid.split('@')[0] : 'Unknown';

        if (antideletedmek[messageType]) {
            antideletedmek[messageType].contextInfo = {
                stanzaId: mek.key.id,
                participant: mek.sender,
                quotedMessage: mek.message,
            };
        }

        const captionText = `
╭───❖ *ANTI-DELETE ALERT* ❖───
│ 🕒 *Time:* ${new Date().toLocaleTimeString('en-GB')}
│ 👥 *Chat:* ${isGroup ? "Group" : "Private"}
│ 👤 *Sender:* @${senderNumber}
│ 🗑️ *Deleted by:* @${deleterNumber}
│ 📸 *Media Message Recovered*
╰─────────────────────────❖
        `;

        if (messageType === 'imageMessage' || messageType === 'videoMessage') {
            antideletedmek[messageType].caption = captionText;
            await conn.relayMessage(jid, antideletedmek, {});
        } else {
            await conn.sendMessage(
                jid,
                {
                    text: captionText,
                    contextInfo: {
                        mentionedJid: [senderJid, deleterJid].filter(j => j && j !== 'Unknown'),
                    },
                },
                { quoted: mek }
            );
        }
    } catch (error) {
        console.error('Error in DeletedMedia:', error);
        await conn.sendMessage(
            jid,
            {
                text: `
╭───❖ *ANTI-DELETE ALERT* ❖───
│ ❌ Error recovering media
╰─────────────────────────❖
                `,
            },
            { quoted: mek }
        );
    }
};

// ================== MAIN HANDLER ==================
const AntiDelete = async (conn, updates) => {
    try {
        for (const update of updates) {
            if (update.update && (update.update.messageStubType === 1 || update.update.message === null)) {
                const store = await loadMessage(update.key.id);

                if (store && store.message) {
                    const mek = store.message;
                    const isGroup = isJidGroup(store.jid);
                    const antiDeleteType = isGroup ? 'gc' : 'dm';
                    const antiDeleteStatus = await getAnti(antiDeleteType);

                    if (!antiDeleteStatus) continue; // skip if disabled

                    let jid;
                    if (isGroup) {
                        jid = config.ANTI_DEL_PATH === 'log' ? conn.user.id : store.jid;
                    } else {
                        jid = config.ANTI_DEL_PATH === 'log' ? conn.user.id : update.key.remoteJid;
                    }

                    if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                        await DeletedText(conn, mek, jid, isGroup, update);
                    } else {
                        await DeletedMedia(conn, mek, jid, isGroup, update);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in AntiDelete:', error);
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};
