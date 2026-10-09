import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers, DisconnectReason } = baileys

import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Thuso Rolex Bot Live ✅'))
app.listen(process.env.PORT || 10000, ()=> console.log("Server listening"))

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    browser: Browsers.ubuntu("Chrome")
  })

  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (u)=>{
    const {connection, lastDisconnect} = u
    console.log("Connection:", connection)
    if(connection==='open') console.log("✅ CONNECTED!")
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
          console.log(`PAIRING CODE: ${code} FOR ${num}`)
        }catch(e){ console.log(e.message) }
      }, 5000)
    }
  }
}
startBot()
