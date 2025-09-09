const { cmd } = require('../command');

// Command to list all pending group join requests
cmd({
    pattern: "requestlist",
    desc: "Shows pending group join requests",
    category: "group",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to view join requests.");
        }

        // Get group metadata which includes pending requests in newer versions
        const metadata = await conn.groupMetadata(from);
        
        // Check if pending requests exist in the metadata
        const pendingRequests = metadata.pendingRequests || [];
        
        if (pendingRequests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests.");
        }

        let text = `📋 *Pending Join Requests (${pendingRequests.length})*\n\n`;
        pendingRequests.forEach((user, i) => {
            text += `${i+1}. @${user.id.split('@')[0]}\n`;
        });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(text, { mentions: pendingRequests.map(u => u.id) });
    } catch (error) {
        console.error("Request list error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to fetch join requests. This feature may not be supported in this version.");
    }
});

// Command to accept a specific join request
cmd({
    pattern: "accept",
    desc: "Accepts a group join request by mentioning the user",
    category: "group",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ *TRACLE* need to be an admin to accept join requests.");
        }

        // Get mentioned users
        const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentionedJids.length === 0) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Please mention the user you want to accept. Example: .accept @user");
        }

        // Try to add the user to the group (this will work if they have requested to join)
        for (const jid of mentionedJids) {
            try {
                await conn.groupParticipantsUpdate(from, [jid], "add");
            } catch (addError) {
                console.error("Error adding user:", addError);
                // If add fails, try to approve their request (if this method exists)
                try {
                    // This method may not exist in all Baileys versions
                    if (conn.groupRequestParticipantsUpdate) {
                        await conn.groupRequestParticipantsUpdate(from, [jid], "approve");
                    }
                } catch (approveError) {
                    console.error("Error approving request:", approveError);
                    await conn.sendMessage(from, {
                        react: { text: '❌', key: m.key }
                    });
                    return reply(`❌ Failed to accept @${jid.split('@')[0]}. They may not have a pending request.`, { mentions: [jid] });
                }
            }
        }

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(`✅ Successfully accepted ${mentionedJids.length} user(s).`, { mentions: mentionedJids });
    } catch (error) {
        console.error("Accept error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to accept join request.");
    }
});

// Command to reject a specific join request
cmd({
    pattern: "reject",
    desc: "Rejects a group join request by mentioning the user",
    category: "group",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ *TRACLE* need to be an admin to reject join requests.");
        }

        // Get mentioned users
        const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentionedJids.length === 0) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Please mention the user you want to reject. Example: .reject @user");
        }

        // Try to reject their request (if this method exists)
        for (const jid of mentionedJids) {
            try {
                // This method may not exist in all Baileys versions
                if (conn.groupRequestParticipantsUpdate) {
                    await conn.groupRequestParticipantsUpdate(from, [jid], "reject");
                } else {
                    // Fallback: just send a message that we can't reject
                    await conn.sendMessage(from, {
                        react: { text: '❌', key: m.key }
                    });
                    return reply("❌ Reject functionality is not supported in this version.");
                }
            } catch (rejectError) {
                console.error("Error rejecting request:", rejectError);
                await conn.sendMessage(from, {
                    react: { text: '❌', key: m.key }
                });
                return reply(`❌ Failed to reject @${jid.split('@')[0]}.`, { mentions: [jid] });
            }
        }

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(`✅ Successfully rejected ${mentionedJids.length} user(s).`, { mentions: mentionedJids });
    } catch (error) {
        console.error("Reject error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to reject join request.");
    }
});

// Alternative approach using group invitation
cmd({
    pattern: "invite",
    desc: "Generate group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }

        // Generate group invite link
        const inviteCode = await conn.groupInviteCode(from);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(`🔗 *Group Invite Link:*\n${inviteLink}\n\nShare this link with people you want to join the group.`);
    } catch (error) {
        console.error("Invite error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to generate invite link.");
    }
});