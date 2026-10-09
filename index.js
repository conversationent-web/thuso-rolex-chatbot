import baileys from "@whiskeysockets/baileys"
const makeWASocket = baileys.default
const { useMultiFileAuthState, Browsers } = baileys
import express from "express"
import pino from "pino"

const app = express()
app.get('/', (req,res)=> res.send('Bot Live ✅'))
app.listen(process.env.PORT || 10000)

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({level:'silent'}),
    browser: Browsers.ubuntu("Chrome")
  })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u)=>{
    console.log("Conn:", u.connection)
    if(u.connection==='open'){
      console.log("✅✅ WHATSAPP LINKED SUCCESS ✅✅")
    }
    if(u.connection==='close'){
      console.log("Closed, will restart in 5 sec")
      setTimeout(()=>startBot(), 5000)
    }
  })

  if(!state.creds.registered){
    const num = "27632456638" // your number
    console.log("Waiting 10 sec then requesting code for", num)
    setTimeout(async ()=>{
      try{
        const code = await sock.requestPairingCode(num)
        console.log(`\n========================\nPAIR CODE: ${code}\nFOR: ${num}\nUSE WITHIN 30 SEC!\n========================\n`)
      }catch(e){
        console.log("Pair failed:", e.message, "- retrying in 10 sec")
        setTimeout(async ()=>{
          try{
            const code2 = await sock.requestPairingCode(num)
            console.log(`\nCODE RETRY: ${code2}\n`)
          }catch(e2){ console.log("Retry failed:", e2.message) }
        }, 10000)
      }
    }, 10000)
  }
}
startBot()
