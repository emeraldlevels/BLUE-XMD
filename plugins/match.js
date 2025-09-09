const { cmd } = require("../command");

// Command for random boy selection
cmd({
  pattern: "boy",
  alias: ["randomboy", "handsome"],
  desc: "Randomly selects a boy from the group",
  react: "👦",
  category: "fun",
  filename: __filename
}, async (conn, mek, store, { isGroup, groupMetadata, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const participants = groupMetadata.participants;
    
    // Filter out bot and get random participant
    const eligible = participants.filter(p => !p.id.includes(conn.user.id.split('@')[0]));
    
    if (eligible.length < 1) return reply("❌ No eligible participants found!");

    const randomUser = eligible[Math.floor(Math.random() * eligible.length)];
    
    await conn.sendMessage(
      mek.chat,
      { 
        text: `👦 *Here is your boy!* \n\n@${randomUser.id.split('@')[0]} is your handsome boy! 😎`, 
        mentions: [randomUser.id] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("Error in .boy command:", error);
    reply(`❌ Error: ${error.message}`);
  }
});

// Command for random girl selection
cmd({
  pattern: "girl",
  alias: ["randomgirl", "beautiful"],
  desc: "Randomly selects a girl from the group",
  react: "👧",
  category: "fun",
  filename: __filename
}, async (conn, mek, store, { isGroup, groupMetadata, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    const participants = groupMetadata.participants;
    
    // Filter out bot and get random participant
    const eligible = participants.filter(p => !p.id.includes(conn.user.id.split('@')[0]));
    
    if (eligible.length < 1) return reply("❌ No eligible participants found!");

    const randomUser = eligible[Math.floor(Math.random() * eligible.length)];
    
    await conn.sendMessage(
      mek.chat,
      { 
        text: `👧 *Here is your girl!* \n\n@${randomUser.id.split('@')[0]} is your beautiful girl! 💖`, 
        mentions: [randomUser.id] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("Error in .girl command:", error);
    reply(`❌ Error: ${error.message}`);
  }
});
