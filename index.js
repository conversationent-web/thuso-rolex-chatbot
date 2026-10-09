import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers, DisconnectReason } = baileys
import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Thuso Rolex Bot Live ✅ Use /pair'))
app.listen(process.env.PORT || 10000)

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    browser: Browsers.ubuntu("Chrome")
  })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u)=>{
    console.log("Update:", u)
    if(u.connection==='open') console.log("✅✅ CONNECTED SUCCESS!")
  })

  if(!state.creds.registered){
    let num = (process.env.PHONE_NUMBER||"").replace(/[^0-9]/g,'')
    console.log("Waiting 8 sec to request code for:", num)
    setTimeout(async ()=>{
      try{
        let code = await sock.requestPairingCode(num)
        console.log(`\n====================\nYOUR CODE: ${code}\nFOR: ${num}\nGO LINK NOW! CODE VALID 30 SEC\n====================\n`)
      }catch(e){ console.log("Pair error:", e) }
    }, 8000)
  }
}
startBot()
