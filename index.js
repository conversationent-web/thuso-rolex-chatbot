import makeWASocket, { useMultiFileAuthState, Browsers, DisconnectReason } from "@whiskeysockets/baileys"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  const sock = makeWASocket({ auth: state, browser: Browsers.macOS("Desktop") })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    console.log("Connection:", update)
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if(!msg.message || msg.key.fromMe) return
      const jid = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""
      const lower = text.toLowerCase()
      if(!jid.endsWith('@g.us')) return

      const metadata = await sock.groupMetadata(jid)
      const sender = msg.key.participant
      const senderIsAdmin = metadata.participants.find(p => p.id === sender)?.admin
      const botIsAdmin = metadata.participants.find(p => p.id.includes(sock.user.id.split(':')[0]))?.admin

      if(lower.includes("@thuso") || lower.includes("thuso")) {
         await sock.sendMessage(jid, { text: `Molo! I am Thuso Rolex 🤖\nRules: No links, No status mentions, No porn.` }, { quoted: msg })
      }

      if(!botIsAdmin || senderIsAdmin) return

      const isLink = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg)/i.test(lower)
      const isPorn = ["porn","xxx","onlyfans","nudes","sex video"].some(w => lower.includes(w))
      const mentionCount = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length || 0
      const isStatusTag = mentionCount > 4

      if(isLink || isPorn || isStatusTag) {
        await sock.sendMessage(jid, { delete: msg.key })
        let reason = isLink? "Link not allowed" : isPorn? "Porn not allowed" : "Status tagging not allowed"
        await sock.sendMessage(jid, { text: `🚫 Deleted by Thuso Rolex: ${reason}\n@${sender.split('@')[0]} please follow group rules.`, mentions: [sender] })
      }
    } catch(e){ console.log(e) }
  })

  sock.ev.on('group-participants.update', async (an) => {
    try{
      const groupId = an.id
      const action = an.action
      await sock.sendMessage(groupId, { text: `⚠️ *THUSO SECURITY ALERT*\n\nAction: ${action.toUpperCase()}\nUser: @${an.participants[0].split('@')[0]}\nBy: @${an.author.split('@')[0]}\n\nIf this was hacking, admins please take action! 🛡️`, mentions: [...an.participants, an.author] })
    }catch{}
  })
}
startBot()
