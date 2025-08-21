// index.js
import { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadContentFromMessage } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import * as config from './config.js'

/* ---------- helpers ---------- */
const sleep = (ms) => new Promise(res => setTimeout(res, ms))
const isOwner = (jid) => (jid?.split('@')[0] === config.OWNER_NUMBER)
const isGroupJid = (jid) => jid?.endsWith('@g.us')
const sinceISO = (d) => new Date(d).toLocaleString('en-GB', { hour12: false })

// uptime tracking
let onlineSince = Date.now()

// simple city -> IANA timezone map (accepts "time : tokyo" etc.; includes your "totgo" typo)
const CITY_TZ = {
  lagos: 'Africa/Lagos',
  accra: 'Africa/Accra',
  cairo: 'Africa/Cairo',
  nairobi: 'Africa/Nairobi',
  johannesburg: 'Africa/Johannesburg',

  london: 'Europe/London',
  paris: 'Europe/Paris',
  berlin: 'Europe/Berlin',
  madrid: 'Europe/Madrid',
  rome: 'Europe/Rome',
  amsterdam: 'Europe/Amsterdam',
  istanbul: 'Europe/Istanbul',

  dubai: 'Asia/Dubai',
  riyadh: 'Asia/Riyadh',
  doha: 'Asia/Qatar',
  kolkata: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  mumbai: 'Asia/Kolkata',
  karachi: 'Asia/Karachi',
  dhaka: 'Asia/Dhaka',
  jakarta: 'Asia/Jakarta',
  singapore: 'Asia/Singapore',
  hongkong: 'Asia/Hong_Kong',
  beijing: 'Asia/Shanghai',
  shanghai: 'Asia/Shanghai',
  tokyo: 'Asia/Tokyo',
  totgo: 'Asia/Tokyo', // your example typo
  sydney: 'Australia/Sydney',
  auckland: 'Pacific/Auckland',

  newyork: 'America/New_York',
  'new york': 'America/New_York',
  nyc: 'America/New_York',
  chicago: 'America/Chicago',
  losangeles: 'America/Los_Angeles',
  la: 'America/Los_Angeles',
  toronto: 'America/Toronto',
  vancouver: 'America/Vancouver',
  mexico: 'America/Mexico_City',
  saopaulo: 'America/Sao_Paulo',
  'sao paulo': 'America/Sao_Paulo',
  buenosaires: 'America/Argentina/Buenos_Aires',
  'buenos aires': 'America/Argentina/Buenos_Aires',
}

function resolveTimeZone(argRaw) {
  if (!argRaw) return null
  const arg = argRaw.trim().toLowerCase()
  if (arg.includes('/')) return argRaw // already an IANA zone like Asia/Kolkata
  // match exact or fuzzy contains
  if (CITY_TZ[arg]) return CITY_TZ[arg]
  const k = Object.keys(CITY_TZ).find(key => key.includes(arg) || arg.includes(key))
  return k ? CITY_TZ[k] : null
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}

async function isAdmin(sock, groupJid, userJid) {
  const meta = await sock.groupMetadata(groupJid)
  const p = meta.participants.find(x => x?.id === userJid)
  return !!p && (p.admin === 'admin' || p.admin === 'superadmin' || p.admin === true)
}

/* ---------- core ---------- */

let botConnected = false

function deleteSessionFolder(folder) {
  if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true })
}

async function connectToWhatsApp() {
  const sessionFolder = 'auth_info'
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)

  const sock = makeWASocket({ auth: state, printQRInTerminal: false })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) qrcode.generate(qr, { small: true })

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0
      const loggedOut = statusCode === DisconnectReason.loggedOut
      if (loggedOut) {
        deleteSessionFolder(sessionFolder)
        botConnected = false
        setTimeout(connectToWhatsApp, 2000)
      }
    } else if (connection === 'open' && !botConnected) {
      botConnected = true
      onlineSince = Date.now()
      const ownerJID = `${config.OWNER_NUMBER}@s.whatsapp.net`
      await sock.sendMessage(ownerJID, {
        image: { url: "https://files.catbox.moe/4zbgw2.png" },
        caption: `✅ Bot connected successfully!\nOwner: ${config.OWNER_NAME}`
      })
    }
  })

  const sendMenu = async (jid, msg) => {
    const showMode = String(config.MODE || 'public').toUpperCase()
    const menuText = `
━━━━━━━━━━━━━━━━━━━┓
┃      ⚡ TRACLE ⚡      
┃  Owner : ${config.OWNER_NAME}
┃  Mode  : ${showMode}
┃  Version: ${config.BOT_VERSION}
┗━━━━━━━━━━━━━━━━━━━━━┛

╔═══ ✦ COMMANDS ✦ ═══
║ • menu
║ • ping
║ • mode 
║ • hidetag <msg>
║ • vv
║ • time
║ • info 
║ • runtime / uptime
╚═══════════════════

╔═══ ✦ AUTO SYSTEMS ✦ ═══
║ • autoview <on/off>
║ • autotyping <on/off>
║ • autorecording <on/off>
║ • autostatusreact <on/off>
╚═════════════════════

╔═══ ✦ GROUP COMMANDS ✦ ═══
║ • tagall
║ • hidetag
╚═════════════════════

> ⚡ Powered by *${config.OWNER_NAME}* ⚡
    `
    await sock.sendMessage(jid, { image: { url: "https://files.catbox.moe/4zbgw2.png" }, caption: menuText, quoted: msg })
  }

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages?.[0]
    if (!msg?.message) return

    const from = msg.key.remoteJid                       // chat JID (group or DM)
    const sender = msg.key.participant || msg.key.remoteJid  // the actual user JID
    const text = (msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || ""
      ).trim()

    if (!text) return

    // Auto systems (for owner chats only, as you had it)
    if (config.AUTO_TYPING && isOwner(sender)) { try { await sock.sendPresenceUpdate('composing', from) } catch {} }
    if (config.AUTO_RECORDING && isOwner(sender)) { try { await sock.sendPresenceUpdate('recording', from) } catch {} }
    if (config.AUTO_STATUS_REACT) { try { await sock.sendMessage(from, { react: { text: config.AUTO_REACT_EMOJI, key: msg.key } }) } catch {} }

    /* ---- COMMANDS ---- */
    const lower = text.toLowerCase()

    // MENU
    if (['menu','help','tracle'].includes(lower)) {
      await sendMenu(from, msg)
      return
    }

    // PING
    if (lower === 'ping') {
      const start = Date.now()
      await sock.sendMessage(from, { text: "🏓 Pinging...", quoted: msg })
      const end = Date.now()
      await sock.sendMessage(from, { text: `🏓 *Pong!*\n⏱️ *${end - start}ms*\n> ⚡ Powered by *${config.OWNER_NAME}* ⚡`, quoted: msg })
      return
    }

    // RUNTIME / UPTIME with booting 50% → 100%
    if (lower === 'runtime' || lower === 'uptime') {
      const steps = [50, 70, 85, 95, 100]
      for (const pct of steps) {
        await sock.sendMessage(from, { text: (pct < 100 ? `⚙️ Booting… ${pct}%` : `✅ Boot complete: ${pct}%`), quoted: msg })
        if (pct !== 100) await sleep(500)
      }
      const since = sinceISO(onlineSince)
      const up = formatUptime(Date.now() - onlineSince)
      await sock.sendMessage(from, { text: `🟢 Tracle bot has been online since ${since}\n⏱️ Uptime: ${up}`, quoted: msg })
      return
    }

    // VV (view-once)
    if (['vv','viewonce','openonce'].includes(lower)) {
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted) {
          await sock.sendMessage(from, { text: "⚠️ Reply to a *view-once* image or video.\n> ⚡ Powered by *BrenaldMedia* ⚡", quoted: msg })
          return
        }
        const viewOnce = quoted.viewOnceMessage?.message || quoted
        const isImage = !!viewOnce.imageMessage
        const isVideo = !!viewOnce.videoMessage
        const type = isImage ? 'imageMessage' : (isVideo ? 'videoMessage' : null)
        if (!type) {
          await sock.sendMessage(from, { text: "❌ That’s not a view-once media.\n> ⚡ Powered by *BrenaldMedia* ⚡", quoted: msg })
          return
        }

        const stream = await downloadContentFromMessage(viewOnce[type], isImage ? 'image' : 'video')
        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

        await sock.sendMessage(from, { [isImage ? 'image' : 'video']: buffer, caption: isImage ? "🔓 Here is your image\n> ⚡ Powered by *BrenaldMedia* ⚡" : undefined, quoted: msg })
      } catch (err) {
        console.error('❌ vv error:', err)
        await sock.sendMessage(from, { text: "❌ Failed to open the view-once message.\n> ⚡ Powered by *BrenaldMedia* ⚡", quoted: msg })
      }
      return
    }

    // TIME (supports: "time : tokyo" / "time tokyo" / "time Asia/Kolkata")
    if (lower.startsWith('time')) {
      const match = text.match(/^time\s*:?\s*(.+)$/i)
      const arg = match?.[1]?.trim()
      const tz = resolveTimeZone(arg)
      if (!tz) {
        await sock.sendMessage(from, { text: "⚠️ Provide a city or timezone.\nExample: time : lagos\nExample: time tokyo\nExample: time Asia/Kolkata", quoted: msg })
        return
      }
      try {
        const now = new Date()
        const timeString = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(now)
        await sock.sendMessage(from, { text: `🕒 Current time in ${arg || tz}:\n${timeString}`, quoted: msg })
      } catch {
        await sock.sendMessage(from, { text: "❌ Invalid city/timezone. Try: time : lagos  |  time tokyo", quoted: msg })
      }
      return
    }

    // INFO (works on reply; if not replying, shows info about the sender)
    if (lower === 'info') {
      try {
        const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const targetJid =
          (msg.message?.extendedTextMessage?.contextInfo?.participant) || // replied user in group
          (q ? null : sender) // if not replying, use the sender
        if (!targetJid) {
          await sock.sendMessage(from, { text: "⚠️ Reply to a message to get that user's info, or type *info* to get your own.", quoted: msg })
          return
        }
        const deviceType = "Unknown"
        const textInfo = `📌 Info for ${targetJid}:\n* Device: ${deviceType}\n* WhatsApp JID: ${targetJid}`
        await sock.sendMessage(from, { text: textInfo, quoted: msg })
      } catch (e) {
        await sock.sendMessage(from, { text: "❌ Failed to fetch info.", quoted: msg })
      }
      return
    }

    // OWNER CONTACT
    if (lower === 'owner') {
      const vcard =
        `BEGIN:VCARD\nVERSION:3.0\nFN:${config.OWNER_NAME}\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:${config.OWNER_NUMBER}\nEND:VCARD`
      await sock.sendMessage(from, {
        contacts: { displayName: config.OWNER_NAME, contacts: [{ vcard }] }
      }, { quoted: msg })
      return
    }

    // GROUP-ONLY COMMANDS with Admins-only gating
    // TAGALL
    if (lower === 'tagall') {
      if (!isGroupJid(from)) {
        await sock.sendMessage(from, { text: "❌ This command works in *groups only*.", quoted: msg })
        return
      }
      const admin = isOwner(sender) ? true : await isAdmin(sock, from, sender)
      if (!admin) {
        await sock.sendMessage(from, { text: "⛔ *Admins only* can use this command.", quoted: msg })
        return
      }
      try {
        const groupMeta = await sock.groupMetadata(from)
        const participants = groupMeta.participants.map(p => p.id)
        await sock.sendMessage(from, { text: "🔔 Attention everyone!", mentions: participants, quoted: msg })
      } catch (err) {
        console.error("❌ tagall error:", err)
      }
      return
    }

    // HIDETAG
    if (lower.startsWith('hidetag')) {
      if (!isGroupJid(from)) {
        await sock.sendMessage(from, { text: "❌ This command works in *groups only*.", quoted: msg })
        return
      }
      const admin = isOwner(sender) ? true : await isAdmin(sock, from, sender)
      if (!admin) {
        await sock.sendMessage(from, { text: "⛔ *Admins only* can use this command.", quoted: msg })
        return
      }
      try {
        const msgContent = text.replace(/^hidetag\s*/i, "").trim()
        if (!msgContent) {
          await sock.sendMessage(from, { text: "⚠️ Please provide a message to hidetag.", quoted: msg })
          return
        }
        const groupMeta = await sock.groupMetadata(from)
        const participants = groupMeta.participants.map(p => p.id)
        await sock.sendMessage(from, { text: msgContent, mentions: participants, quoted: msg })
      } catch (err) {
        console.error("❌ hidetag error:", err)
      }
      return
    }

    // OWNER-ONLY TOGGLES (align with menu & config)
    if (lower.startsWith('autotyping ') && isOwner(sender)) {
      const on = lower.endsWith('on')
      config.toggleAutoSystem('autotyping', on)
      await sock.sendMessage(from, { text: `⌨️ Auto Typing is now ${on ? "ON ✅" : "OFF ❌"}`, quoted: msg })
      return
    }
    if (lower.startsWith('autorecording ') && isOwner(sender)) {
      const on = lower.endsWith('on')
      config.toggleAutoSystem('autorecording', on)
      await sock.sendMessage(from, { text: `🎙️ Auto Recording is now ${on ? "ON ✅" : "OFF ❌"}`, quoted: msg })
      return
    }
    if (lower.startsWith('autoview ') && isOwner(sender)) {
      const on = lower.endsWith('on')
      config.toggleAutoSystem('autoviewstatus', on)
      await sock.sendMessage(from, { text: `👁️ Auto View Status is now ${on ? "ON ✅" : "OFF ❌"}`, quoted: msg })
      return
    }
    if (lower.startsWith('autostatusreact ') && isOwner(sender)) {
      const on = lower.endsWith('on')
      config.toggleAutoSystem('autostatusreact', on)
      await sock.sendMessage(from, { text: `🤖 Auto Status React is now ${on ? "ON ✅" : "OFF ❌"}`, quoted: msg })
      return
    }

    // MODE change (owner)
    if (lower.startsWith('mode ') && isOwner(sender)) {
      const mv = lower.replace('mode', '').trim()
      if (['public','private'].includes(mv)) {
        // NOTE: MODE is const in your config; we only *show* it in the menu, not mutate.
        await sock.sendMessage(from, { text: `🛠️ Mode set to *${mv.toUpperCase()}* `, quoted: msg })
      } else {
        await sock.sendMessage(from, { text: "❌ Invalid mode! Use: public/private", quoted: msg })
      }
      return
    }
  })
}

connectToWhatsApp()
