{
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, jidNormalizedUser } = require('@whiskeysockets/baileys')
const { state, saveState } = useSingleFileAuthState('./session.json')
const fs = require('fs')

const OWNER = '+96171378430'
let eliteUsers = [OWNER]

let groupSettings = {}
const sections = [
  'fun','group','tools','owner','anime','games','images','quotes','poll','trivia',
  'moderation','music','funfacts','reminders','ranks','memes','roles','jokes','random','stats'
]

const loadSettings = () => {
  if(fs.existsSync('groupSettings.json')) {
    groupSettings = JSON.parse(fs.readFileSync('groupSettings.json'))
  } else {
    groupSettings = {}
  }
}

const saveSettings = () => {
  fs.writeFileSync('groupSettings.json', JSON.stringify(groupSettings,null,2))
}

const isElite = (jid) => eliteUsers.includes(jidNormalizedUser(jid))

const startBot = async () => {
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false // مهم: false على Render
  })

  const store = makeInMemoryStore({})
  store.bind(sock.ev)

  sock.ev.on('creds.update', saveState)

  loadSettings()

  console.log('Shadow Bot جاهز للعمل 😎')

  sock.ev.on('messages.upsert', async m => {
    const message = m.messages[0]
    if(!message.message || message.key.fromMe) return
    const chatId = message.key.remoteJid
    const sender = jidNormalizedUser(message.key.participant || message.key.remoteJid)
    const text = message.message.conversation || (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || ''

    if(!groupSettings[chatId]){
      groupSettings[chatId] = { active:true, welcome:true, goodbye:true, sections:{} }
      sections.forEach(sec=>groupSettings[chatId].sections[sec]=true)
      saveSettings()
    }

    // ---------- أوامر عامة ----------
    if(text === '.أوامر'){
      const availableSections = sections.filter(sec => groupSettings[chatId].sections[sec])
      const list = availableSections.map((sec, i) => `${i+1}. ${sec}`).join('\n')
      return sock.sendMessage(chatId, { text: `📋 الخانات المتوفرة:\n${list}\n\nلتفتح خانة معينة: اكتب .أوامر <اسم الخانة>` })
    }

    if(text.startsWith('.نخبة') && sender===OWNER){
      const args = text.split(' ')
      if(args[1]==='+'){
        eliteUsers.push(args[2])
        return sock.sendMessage(chatId,{text:`✅ تم إضافة ${args[2]} للنخبة`})
      } else if(args[1]==='-'){
        eliteUsers = eliteUsers.filter(u=>u!==args[2])
        return sock.sendMessage(chatId,{text:`✅ تم إزالة ${args[2]} من النخبة`})
      }
    }

    if(isElite(sender)){
      if(text==='.تشغيل'){ groupSettings[chatId].active=true; saveSettings(); return sock.sendMessage(chatId,{text:'✅ البوت مفعل!'}) }
      if(text==='.إيقاف'){ groupSettings[chatId].active=false; saveSettings(); return sock.sendMessage(chatId,{text:'⛔ البوت متوقف!'}) }
      if(text==='.ريستارت'){ sock.sendMessage(chatId,{text:'🔄 جاري إعادة تشغيل البوت...'}); process.exit(1) }
      if(text==='.حالة'){ return sock.sendMessage(chatId,{text: groupSettings[chatId].active?'✅ البوت مفعل':'⛔ البوت متوقف'}) }
      if(text.startsWith('.قائمة نخبة')){ return sock.sendMessage(chatId,{text: '👑 نخبة البوت:\n'+eliteUsers.join('\n')}) }
    }

    if(!groupSettings[chatId].active)
}
