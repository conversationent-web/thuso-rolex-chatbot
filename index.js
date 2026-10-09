import makeWASocket, { useMultiFileAuthState, Browsers, DisconnectReason } from "@whiskeysockets/baileys"
import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Thuso Rolex Bot Live ✅'))
app.listen(process.env.PORT || 3000)

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
    if(connection==='open') console.log("✅ BOT CONNECTED!")
    if(connection==='close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut){
      startBot()
    }
  })

  if(!state.creds.registered){
    let num = (process.env.PHONE_NUMBER || "").replace(/[^0-9]/g,'')
    if(num){
      setTimeout(async ()=>{
        try{
          let code = await sock.requestPairingCode(num)
          console.log(`\nPAIRING CODE FOR ${num}: ${code}\n`)
        }catch(e){
          console.log("Pairing failed:", e.message)
        }
      }, 5000)
    } else {
      console.log("Set PHONE_NUMBER in Render env vars! e.g. 27632456638")
    }
  }
}

startBot()
