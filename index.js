import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers, DisconnectReason } = baileys

import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Thuso Rolex Bot Live ✅'))
app.listen(process.env.PORT || 3000, ()=> console.log("Server listening on port 10000"))

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (u)=>{
    const {connection, lastDisconnect} = u
    console.log("Connection:", connection)
    if(connection==='open') console.log("✅ BOT CONNECTED - Thuso Rolex Online!")
    if(connection==='close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut){
      startBot()
    }
  })

  if(!state.creds.registered){
    let num = (process.env.PHONE_NUMBER || "").replace(/[^0-9]/g,'')
    if(num){
      setTimeout(async ()=>{
        try{
          let code = await baileys.default ? await sock.requestPairingCode(num) : await sock.requestPairingCode(num)
          console.log(`\n====================`)
          console.log(`PAIRING CODE: ${code}`)
          console.log(`FOR NUMBER: ${num}`)
          console.log(`====================\n`)
        }catch(e){
          console.log("Pairing failed:", e.message)
        }
      }, 6000)
    }
  }
}

startBot()
