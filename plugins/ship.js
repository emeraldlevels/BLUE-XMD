const axios = require("axios");
const fetch = require("node-fetch");
const { sleep } = require('../lib/functions');
const { cmd, commands } = require("../command");
const config = require("../config");

cmd({
  pattern: "ship",
  alias: ["match", "love"],
  desc: "Randomly pairs the command user with another group member.",
  react: "❤️",
  category: "fun",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, groupMetadata, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.", {
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

    const botNumber = conn.user.id; // Get bot's number
    const participants = groupMetadata.participants.map(user => user.id);
    
    // Filter out the command sender and the bot from potential pairs
    const availablePairs = participants.filter(user => 
      user !== sender && user !== botNumber
    );

    if (availablePairs.length === 0) {
      return reply("❌ Not enough participants to create a pair (need at least 2 users besides yourself and the bot).", {
        contextInfo: {
          mentionedJid: [sender],
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

    // Select a random user from available pairs
    const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];

    const message = `💘 *Match Found!* 💘\n❤️ @${sender.split("@")[0]} + @${randomPair.split("@")[0]}\n💖 Congratulations! 🎉\n\n> Powered by BrenaldMedia`;

    await conn.sendMessage(from, {
      text: message,
      contextInfo: {
        mentionedJid: [sender, randomPair],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363401559573199@newsletter",
          newsletterName: "BrenaldMedia Hub 🫟",
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error("❌ Error in ship command:", error);
    reply("⚠️ An error occurred while processing the command. Please try again.", {
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