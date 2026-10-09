import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys"
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
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    syncFullHistory: false
  })

  // Pairing code - IMPORTANT FIX
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER
    if (phoneNumber) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        let cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
        console.log(`Requesting pairing code for ${cleanNumber}...`)
        let code = await sock.requestPairingCode(cleanNumber)
        console.log(`\n=====================================`)
        console.log(`PAIRING CODE: ${code}`)
        console.log(`NUMBER: ${cleanNumber}`)
        console.log(`=====================================\n`)
        console.log(`Go to WhatsApp > Linked Devices > Link with phone number`)
      } catch(e) {
        console.log("Pairing failed:", e.message)
      }
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log("✅ BOT CONNECTED - Thuso Rolex is Online!")
    }
    if (connection === 'close') {
      let reason = lastDisconnect?.error?.output?.statusCode
      if (reason!== DisconnectReason.loggedOut) {
        console.log("Reconnecting...")
        startBot()
      }
    }
  })

  // --- YOUR BOT FEATURES HERE ---
  // Add your anti-link, anti-porn, language code below this line
  sock.ev.on('messages.upsert', async (m) => {
    // Your existing bot logic
    console.log("New message", m.messages[0]?.key?.remoteJid)
  })
}

startBot()
