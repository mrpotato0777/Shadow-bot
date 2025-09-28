// shadowbot-perfect.js
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, jidNormalizedUser } = require('@whiskeysockets/baileys')
const { state, saveState } = useSingleFileAuthState('./session.json')
const fs = require('fs')

const OWNER = '+96171378430' // رقمك كمالك البوت
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
    printQRInTerminal: true
  })

  const store = makeInMemoryStore({})
  store.bind(sock.ev)

  sock.ev.on('creds.update', saveState)

  loadSettings()

  console.log('Shadow Bot Perfect جاهز للعمل 😎')

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

    // ----------------- عرض كل الخانات -----------------
    if(text === '.أوامر'){
      const availableSections = sections.filter(sec => groupSettings[chatId].sections[sec])
      const list = availableSections.map((sec, i) => `${i+1}. ${sec}`).join('\n')
      return sock.sendMessage(chatId, { text: `📋 الخانات المتوفرة:\n${list}\n\nلتفتح خانة معينة: اكتب .أوامر <اسم الخانة>` })
    }

    // ----------------- إدارة النخبة -----------------
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

    // ----------------- أوامر تفعيل/إيقاف/ريستارت -----------------
    if(isElite(sender)){
      if(text==='.تشغيل'){ groupSettings[chatId].active=true; saveSettings(); return sock.sendMessage(chatId,{text:'✅ البوت مفعل!'}) }
      if(text==='.إيقاف'){ groupSettings[chatId].active=false; saveSettings(); return sock.sendMessage(chatId,{text:'⛔ البوت متوقف!'}) }
      if(text==='.ريستارت'){ sock.sendMessage(chatId,{text:'🔄 جاري إعادة تشغيل البوت...'}); process.exit(1) }
      if(text==='.حالة'){ return sock.sendMessage(chatId,{text: groupSettings[chatId].active?'✅ البوت مفعل':'⛔ البوت متوقف'}) }
      if(text.startsWith('.قائمة نخبة')){ return sock.sendMessage(chatId,{text: '👑 نخبة البوت:\n'+eliteUsers.join('\n')}) }
    }

    if(!groupSettings[chatId].active) return

    // ----------------- Fun -----------------
    if(text.startsWith('.أوامر fun') && groupSettings[chatId].sections.fun){
      sock.sendMessage(chatId,{text: `أوامر Fun:
1. .نكت  2. .زوجتي  3. .زواج  4. .GIF ضحك  5. .صورة قطة
6. .صورة كلب  7. .اقتباس  8. .تحدي  9. .إهانة @عضو  10. .طردمزحة @عضو
11. .ميم 12. .تحدي2 13. .لعبة 14. .حقائق 15. .نكت2
16. .GIF مضحك 17. .صورة عشوائية 18. .اختبارات 19. .اقتباس2 20. .أمرعشوائي`})
      return
    }

    if(text.startsWith('.نكت')){
      const jokes=['ليش الكمبيوتر ما يضحك؟ لأنه عنده فيروس 😂','اليوم الشاي تبعك بارد 😝','القطه ضحكت عليك 😹']
      return sock.sendMessage(chatId,{text:jokes[Math.floor(Math.random()*jokes.length)]})
    }

    if(text.startsWith('.زوجتي')){
      const chars=['ناروتو','ساكورا','ساسوكي','غوكو','ناتسو']
      return sock.sendMessage(chatId,{text:`@${message.key.participant} اتزوج مع ${chars[Math.floor(Math.random()*chars.length)]} 😎`})
    }

    if(text.startsWith('.زواج') && chatId.endsWith('@g.us')){
      const participants = Object.keys(store.chats.all()).filter(j=>j.endsWith('@s.whatsapp.net'))
      if(participants.length<2) return
      let pick1 = participants[Math.floor(Math.random()*participants.length)]
      let pick2 = participants[Math.floor(Math.random()*participants.length)]
      while(pick2===pick1) pick2 = participants[Math.floor(Math.random()*participants.length)]
      return sock.sendMessage(chatId,{text:`❤️ ${pick1} اتزوج مع ${pick2} في عالم Shadow Bot!`})
    }

    // ----------------- Group -----------------
    if(text.startsWith('.أوامر group') && groupSettings[chatId].sections.group){
      sock.sendMessage(chatId,{text:`أوامر Group:
1. .ترحيب تشغيل
2. .ترحيب إيقاف
3. .وداع تشغيل
4. .وداع إيقاف
5. .رفع @عضو
6. .خفض @عضو
7. .تنبيه
8. .مسح تنبيه
9. .قائمة الأعضاء
10. .تفعيل كل قسم
11. .إيقاف كل قسم
12. .إرسال رسالة
13. .تحديث المجموعة
14. .حالة المجموعة
15. .إعدادات
16. .إعادة ترتيب الأعضاء
17. .منشن كل الأعضاء
18. .مسح الرسائل
19. .أمر عشوائي
20. .إحصائيات المجموعة`})
      return
    }

    // يمكن إضافة باقي الأقسام بنفس النمط
  })
}

startBot()