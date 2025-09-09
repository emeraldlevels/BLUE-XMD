const { cmd } = require('../command');

function normalizeJid(user) {
  if (!user) return null;
  user = String(user).trim();
  if (user.includes('@')) return user.replace('@c.us', '@s.whatsapp.net');
  const digits = user.replace(/\D/g, '');
  return digits ? digits + '@s.whatsapp.net' : null;
}

// ====== ADD MEMBER ======
cmd({
  pattern: "add",
  alias: ["invite", "a"],
  desc: "Add member(s) to the group (admin only)",
  category: "admin",
  react: "➕",
  filename: __filename
}, async (conn, m, { from, q, isGroup, reply, react, isCreator }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");

    const metadata = await conn.groupMetadata(from).catch(() => null);
    if (!metadata) return reply("❌ Failed to fetch group metadata.");

    const admins = metadata.participants
      .filter(p => p.admin !== undefined)
      .map(p => p.id);

    const botJid = conn.user.id;

    if (!isCreator && !admins.includes(m.sender))
      return reply("❌ Only group admins or bot owner can use this command.");

    if (!admins.includes(botJid))
      return reply("❌ I must be admin to add members.");

    let targets = [];

    if (m.quoted) {
      const qjid = m.quoted.sender || m.quoted.key?.participant;
      const n = normalizeJid(qjid);
      if (n) targets.push(n);
    }

    if (m.mentionedJid?.length) {
      targets.push(...m.mentionedJid.map(normalizeJid).filter(Boolean));
    }

    if (q) {
      for (let p of q.split(/[ ,]+/)) {
        const n = normalizeJid(p);
        if (n) targets.push(n);
      }
    }

    targets = [...new Set(targets)];
    if (!targets.length) return reply("❌ Provide a number or mention someone.\nExample: `.add 2348012345678`");

    await conn.groupParticipantsUpdate(from, targets, "add");
    return reply(`✅ Invited: ${targets.map(t => `@${t.split('@')[0]}`).join(', ')}`, { mentions: targets });

  } catch (err) {
    console.error("Add error:", err);
    reply("❌ Failed to add member(s). They may have privacy settings preventing it.");
  }
});

// ====== REMOVE MEMBER ======
cmd({
  pattern: "remove",
  alias: ["kick", "k"],
  desc: "Remove member(s) from the group (admin only)",
  category: "admin",
  react: "❌",
  filename: __filename
}, async (conn, m, { from, q, isGroup, reply, react, isCreator }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");

    const metadata = await conn.groupMetadata(from).catch(() => null);
    if (!metadata) return reply("❌ Failed to fetch group metadata.");

    const admins = metadata.participants
      .filter(p => p.admin !== undefined)
      .map(p => p.id);

    const botJid = conn.user.id;

    if (!isCreator && !admins.includes(m.sender))
      return reply("❌ Only group admins or bot owner can use this command.");

    if (!admins.includes(botJid))
      return reply("❌ I must be admin to remove members.");

    let targets = [];

    if (m.quoted) {
      const qjid = m.quoted.sender || m.quoted.key?.participant;
      const n = normalizeJid(qjid);
      if (n) targets.push(n);
    }

    if (m.mentionedJid?.length) {
      targets.push(...m.mentionedJid.map(normalizeJid).filter(Boolean));
    }

    if (q) {
      for (let p of q.split(/[ ,]+/)) {
        const n = normalizeJid(p);
        if (n) targets.push(n);
      }
    }

    targets = [...new Set(targets)];
    if (!targets.length) return reply("❌ Provide a number or mention someone.\nExample: `.remove @user`");

    const adminTargets = targets.filter(t => admins.includes(t));
    if (adminTargets.length && !isCreator)
      return reply("❌ You cannot remove other admins. Only bot owner can.");

    await conn.groupParticipantsUpdate(from, targets, "remove");
    return reply(`✅ Removed: ${targets.map(t => `@${t.split('@')[0]}`).join(', ')}`, { mentions: targets });

  } catch (err) {
    console.error("Remove error:", err);
    reply("❌ Failed to remove member(s).");
  }
});
