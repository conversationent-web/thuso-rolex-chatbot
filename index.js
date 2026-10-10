import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers } = baileys
import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Bot Live ✅ Check Logs for code'))
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
    console.log("Conn:", u.connection)
    if(u.connection==='open') console.log("✅ LINKED!")
    if(u.connection==='close') setTimeout(()=>startBot(), 5000)
  })

  if(!state.creds.registered){
    let num = (process.env.PHONE_NUMBER || "27632456638").replace(/[^0-9]/g,'')
    setTimeout(async ()=>{
      try{
        let code = await sock.requestPairingCode(num)
        console.log(`\n=== CODE: ${code} FOR ${num} ===\n`)
      }catch(e){ console.log("Fail:", e.message) }
    }, 9000)
  }
}
startBot()
