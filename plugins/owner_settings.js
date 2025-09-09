const { cmd ,commands } = require('../command');
const { exec } = require('child_process');
const config = require('../config');
const {sleep} = require('../lib/functions')
// 1. Shutdown Bot
cmd({
    pattern: "shutdown",
    desc: "Shutdown the bot.",
    category: "owner",
    react: "🛑",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    reply("🛑 Shutting down...").then(() => process.exit());
});

// 2. Broadcast Message to All Groups
cmd({
    pattern: "broadcast",
    desc: "Broadcast a message to all groups.",
    category: "owner",
    react: "📢",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, args, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (args.length === 0) return reply("📢 Please provide a message to broadcast.");
    const message = args.join(' ');
    const groups = Object.keys(await conn.groupFetchAllParticipating());
    for (const groupId of groups) {
        await conn.sendMessage(groupId, { text: message }, { quoted: mek });
    }
    reply("📢 Message broadcasted to all groups.");
});

// 3. Set Profile Picture
cmd({
    pattern: "setpp",
    desc: "Set bot profile picture.",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!quoted || !quoted.message.imageMessage) return reply("❌ Please reply to an image.");
    try {
        const media = await conn.downloadMediaMessage(quoted);
        await conn.updateProfilePicture(conn.user.jid, { url: media });
        reply("🖼️ Profile picture updated successfully!");
    } catch (error) {
        reply(`❌ Error updating profile picture: ${error.message}`);
    }
});


cmd({
    pattern: "clearchat",
    desc: "Clear all chats from the bot.",
    category: "owner",
    react: "🧹",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    try {
        let chats = [];
        
        // Try different methods based on common WhatsApp library structures
        if (conn.chats && typeof conn.chats.all === 'function') {
            chats = conn.chats.all();
        } else if (Array.isArray(conn.chats)) {
            chats = conn.chats;
        } else if (conn.chats && typeof conn.chats === 'object') {
            chats = Object.values(conn.chats);
        } else {
            return reply("❌ Could not access chats list");
        }
        
        let clearedCount = 0;
        for (const chat of chats) {
            try {
                if (chat && chat.jid) {
                    await conn.modifyChat(chat.jid, 'delete');
                    clearedCount++;
                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (chatError) {
                console.log(`Failed to clear chat ${chat?.jid}:`, chatError);
            }
        }
        
        reply(`🧹 Cleared ${clearedCount} chats successfully!`);
    } catch (error) {
        reply(`❌ Error clearing chats: ${error.message}`);
    }
});

// 8. Group JIDs List
cmd({
    pattern: "gjid",
    desc: "Get the list of JIDs for all groups the bot is part of.",
    category: "owner",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    const groups = await conn.groupFetchAllParticipating();
    const groupJids = Object.keys(groups).join('\n');
    reply(`📝 *Group JIDs:*\n\n${groupJids}`);
});


// 9. Execute Shell Command

cmd({
  pattern: "exec",
  desc: "Execute a shell command.",
  category: "owner",
  react: "💻",
  filename: __filename
}, async (conn, mek, m, { from, isOwner, args, reply }) => {
  try {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!args || args.length === 0) return reply("💻 Please provide a command to execute.");

    const command = args.join(' ');

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        return reply(`❌ *Error:* ${error.message}`);
      }
      if (stderr) {
        return reply(`⚠️ *Stderr:*\n\`\`\`${stderr}\`\`\``);
      }
      if (stdout) {
        return reply(`✅ *Output:*\n\`\`\`${stdout}\`\`\``);
      } else {
        return reply("✅ Command executed, but no output.");
      }
    });

  } catch (e) {
    console.error("Exec command error:", e);
    reply("❌ Failed to execute command.");

  }

// 10. delete 

cmd({
pattern: "delete",
react: "❌",
alias: ["del"],
desc: "delete message",
category: "group",
use: '.del',
filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants,  isItzcp, groupAdmins, isBotAdmins, isAdmins, reply}) => {
if (!isOwner ||  !isAdmins) return;
try{
if (!m.quoted) return reply(mg.notextfordel);
const key = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id,
            participant: m.quoted.sender
        }
        await conn.sendMessage(m.chat, { delete: key })
} catch(e) {
console.log(e);
reply('successful..👨‍💻✅')
} 
})


});
