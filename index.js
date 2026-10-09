import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers, DisconnectReason } = baileys
import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Bot Live ✅'))
app.listen(process.env.PORT || 10000, ()=> console.log("Web server up"))

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    browser: Browsers.ubuntu("Chrome")
  })
  sock.ev.on('creds.update', saveCreds)

  let codeRequested = false

  sock.ev.on('connection.update', async (u)=>{
    const { connection, lastDisconnect } = u
    console.log("Connection:", connection)

    if(connection === 'open'){
      console.log("✅ CONNECTED TO WHATSAPP!")
    }

    // ONLY request code when connecting and not yet registered
    if(connection === 'connecting' && !state.creds.registered && !codeRequested){
      codeRequested = true
      let num = (process.env.PHONE_NUMBER||"").replace(/[^0-9]/g,'')
      console.log("Requesting pairing code for:", num)
      
      // retry 3 times with delay
      for(let i=0; i<3; i++){
        try{
          await new Promise(r=>setTimeout(r, 5000))
          if(sock.ws.readyState !== 1) { console.log("Socket not ready, waiting..."); continue; }
          let code = await sock.requestPairingCode(num)
          console.log(`\n========================\nCODE: ${code}\nFOR NUMBER: ${num}\nENTER IN WHATSAPP NOW!\n========================\n`)
          break
        }catch(e){
          console.log(`Attempt ${i+1} failed:`, e.message)
        }
      }
    }

    if(connection==='close'){
      let shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log("Closed, reconnect?", shouldReconnect)
      if(shouldReconnect) setTimeout(()=>startBot(), 3000)
    }
  })
}
startBot()
