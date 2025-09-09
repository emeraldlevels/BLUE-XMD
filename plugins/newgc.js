//---------------------------------------------------------------------------
//           TRACLE  
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------------------------------------

const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

cmd({
  pattern: "newgc",
  category: "group",
  desc: "Create a new group and add participants.",
  filename: __filename,
  react: "👥"
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, reply }) => {
  try {
    if (!body || !body.includes(';')) {
      return reply(`📝 *HOW TO CREATE A GROUP*\n\nUsage: ${prefix}newgc group_name;number1,number2,...\n\n📋 *Examples:*\n• ${prefix}newgc Family Group;1234567890,0987654321\n• ${prefix}newgc Work Team;1112223333\n• ${prefix}newgc Friends Chat;5551234567,5557654321`);
    }

    const parts = body.split(";");
    const groupName = parts[0].trim();
    const numbersString = parts[1].trim();
    
    if (!groupName) {
      return reply("❌ Please provide a group name!\nExample: .newgc My Family Group;1234567890");
    }

    if (!numbersString) {
      return reply("❌ Please provide at least one phone number!\nExample: .newgc My Group;1234567890");
    }

    // Validate and format phone numbers
    const participantNumbers = numbersString.split(",")
      .map(number => {
        let cleanNumber = number.trim().replace(/[^0-9]/g, '');
        
        // Add country code if not provided (assuming default country code)
        if (cleanNumber.length === 10) {
          cleanNumber = '234' + cleanNumber; // Default Nigeria country code
        }
        
        return `${cleanNumber}@s.whatsapp.net`;
      })
      .filter(number => number.length > 15); // Basic validation

    if (participantNumbers.length === 0) {
      return reply("❌ No valid phone numbers found!\nPlease provide numbers like: 8125101930 or 2348125101930");
    }

    // Add the bot itself to participants
    participantNumbers.push(conn.user.id);

    // Create the group
    const group = await conn.groupCreate(groupName, participantNumbers);
    
    // Get invite link
    const inviteLink = await conn.groupInviteCode(group.gid);
    
    // Send welcome message to the new group
    await conn.sendMessage(group.gid, { 
      text: `🎉 *Welcome to ${groupName}!*\n\nThis group was created using TRACLE Bot.\n\nInvite link: https://chat.whatsapp.com/${inviteLink}` 
    });

    // Send success message to user
    reply(`✅ *Group Created Successfully!*\n\n🏷️ *Name:* ${groupName}\n👥 *Members:* ${participantNumbers.length}\n🔗 *Invite Link:* https://chat.whatsapp.com/${inviteLink}\n\n📌 *Note:* The bot has been added to the group as admin.`);

  } catch (e) {
    console.error('Group creation error:', e);
    
    // Specific error handling
    if (e.message.includes('401')) {
      return reply("❌ Authorization error! Make sure the bot has proper permissions.");
    } else if (e.message.includes('409')) {
      return reply("❌ Conflict error! You may have reached the group creation limit.");
    } else if (e.message.includes('500')) {
      return reply("❌ Server error! Please try again later.");
    } else if (e.message.includes('not authorized')) {
      return reply("❌ Bot is not authorized to create groups!");
    }
    
    return reply(`❌ *Error creating group:*\n${e.message}\n\n💡 *Make sure:*\n• Numbers are valid WhatsApp numbers\n• You have group creation permissions\n• Numbers include country code (e.g., 2348125101930)`);
  }
});

// Alternative simpler group creation command
cmd({
  pattern: "creategroup",
  alias: ["makegroup", "cg"],
  category: "group",
  desc: "Create a simple group with the bot",
  filename: __filename,
  react: "🆕"
}, async (conn, mek, m, { from, reply }) => {
  try {
    const text = m.text || '';
    const groupName = text.replace(/\.creategroup\s?/i, '').trim();
    
    if (!groupName) {
      return reply(`🏷️ *CREATE SIMPLE GROUP*\n\nUsage: ${prefix}creategroup Group Name\n\nExample: ${prefix}creategroup My Family Chat`);
    }

    // Create group with just the bot first
    const group = await conn.groupCreate(groupName, [conn.user.id]);
    
    // Get invite link
    const inviteLink = await conn.groupInviteCode(group.gid);
    
    // Send success message
    reply(`✅ *Group Created!*\n\n🏷️ *Name:* ${groupName}\n🔗 *Invite Link:* https://chat.whatsapp.com/${inviteLink}\n\n📌 You can now add people using the invite link!`);

  } catch (e) {
    console.error('Simple group creation error:', e);
    reply(`❌ Failed to create group: ${e.message}`);
  }
});

// Group invite command
cmd({
  pattern: "invitelink",
  alias: ["link", "invite"],
  category: "group",
  desc: "Get group invite link",
  filename: __filename,
  react: "🔗"
}, async (conn, mek, m, { from, isGroup, reply }) => {
  try {
    if (!isGroup) return reply("❌ This command only works in groups!");

    const inviteLink = await conn.groupInviteCode(from);
    reply(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${inviteLink}\n\n📌 Share this link to add people to the group.`);
    
  } catch (e) {
    console.error('Invite link error:', e);
    reply("❌ Failed to get invite link. Make sure I'm an admin!");
  }
});

// Group info command
cmd({
  pattern: "groupinfo",
  alias: ["ginfo", "group"],
  category: "group",
  desc: "Get group information",
  filename: __filename,
  react: "ℹ️"
}, async (conn, mek, m, { from, isGroup, groupMetadata, reply }) => {
  try {
    if (!isGroup) return reply("❌ This command only works in groups!");

    const metadata = await conn.groupMetadata(from);
    const participants = metadata.participants;
    const admins = participants.filter(p => p.admin).map(p => p.id);
    
    const groupInfo = `🏷️ *Group Name:* ${metadata.subject}\n\n👥 *Participants:* ${participants.length}\n👑 *Admins:* ${admins.length}\n🔒 *Group Type:* ${metadata.restrict ? 'Restricted' : 'Open'}\n🔐 *Announcement:* ${metadata.announce ? 'Enabled' : 'Disabled'}\n📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n\n🆔 *Group ID:* ${metadata.id}`;

    reply(groupInfo);
    
  } catch (e) {
    console.error('Group info error:', e);
    reply("❌ Failed to get group information.");
  }
});