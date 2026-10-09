import makeWASocket, { useMultiFileAuthState, Browsers, DisconnectReason } from "@whiskeysockets/baileys"
import express from "express"
import pino from "pino"

const app = express()
const PORT = process.env.PORT || 3000

// Keep Render alive
app.get('/', (req, res) => {
  res.send('Thuso Rolex Chatbot is Live ✅')
})
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  
  const sock = makeWASocket({ 
    auth: state, 
    browser: Browsers.macOS("Desktop"),
    logger: pino({ level: "silent" })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    console.log("Connection:", update)
    
    if(qr){
      console.log("QR CODE:", qr)
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnecting:', shouldReconnect)
      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp!')
    }
  })

  // Pairing code if you want to use phone number
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER
    if (phoneNumber) {
      setTimeout(async () => {
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`PAIRING CODE FOR ${phoneNumber}: ${code}`)
      }, 3000)
    }
  }

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if(!msg.message || msg.key.fromMe) return
      const jid = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""

      console.log(`Message from ${jid}: ${text}`)
      
      // Your anti-link / anti-hack logic here
      if(text){
        await sock.sendMessage(jid, { text: `Thuso Rolex: Received -> ${text}` })
      }
    } catch(e) {
      console.log("Error in messages:", e)
    }
  })
}

startBot()
