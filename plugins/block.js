const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person (Owner only)",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (conn, m, { reply, q, react }) => {
    const botOwner = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    if (m.sender !== botOwner) {
        await react("❌");
        return reply("Only the bot owner can use this command.");
    }

    let jid;
    if (m.quoted) {
        jid = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        jid = m.mentionedJid[0];
    } else if (q && q.includes("@")) {
        jid = q.replace(/[@\s]/g, '') + "@s.whatsapp.net";
    } else {
        // Default: in DM, block the chat partner
        jid = m.chat;
    }

    try {
        await conn.updateBlockStatus(jid, "block");
        await react("✅");
        await conn.sendMessage(m.chat, {
            text: `🚫 User @${jid.split("@")[0]} has been *blocked*.`,
            mentions: [jid]
        });
    } catch (error) {
        console.error("Block command error:", error);
        await react("❌");
        reply("❌ Failed to block the user.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person (Owner only)",
    category: "owner",
    react: "🔓",
    filename: __filename
},
async (conn, m, { reply, q, react }) => {
    const botOwner = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    if (m.sender !== botOwner) {
        await react("❌");
        return reply("Only the bot owner can use this command.");
    }

    let jid;
    if (m.quoted) {
        jid = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        jid = m.mentionedJid[0];
    } else if (q && q.includes("@")) {
        jid = q.replace(/[@\s]/g, '') + "@s.whatsapp.net";
    } else {
        // Default: in DM, unblock the chat partner
        jid = m.chat;
    }

    try {
        await conn.updateBlockStatus(jid, "unblock");
        await react("✅");
        await conn.sendMessage(m.chat, {
            text: `🔓 User @${jid.split("@")[0]} has been *unblocked*.`,
            mentions: [jid]
        });
    } catch (error) {
        console.error("Unblock command error:", error);
        await react("❌");
        reply("❌ Failed to unblock the user.");
    }
});
