import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile, readFileSync, existsSync } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'

// import { handleAIModes } from './lib/eventHandlers.js'
import { handleAntiSystems } from './lib/antiHandlers.js'

const { proto, areJidsSameUser } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))

export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
if (!chatUpdate) return
this.pushMessage(chatUpdate.messages).catch(console.error)
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return
if (global.db.data == null) await global.loadDatabase()

try {
m = smsg(this, m) || m
if (!m) return
if (m.messageStubType) return
m.exp = 0
m.limit = false

try {  
  let user = global.db.data.users[m.sender] ||= {}  
  if (!isNumber(user.exp)) user.exp = 0  
  if (!isNumber(user.limit)) user.limit = 10  
  if (!('registered' in user)) user.registered = false  
  if (!user.registered) {  

    user.registered = true
    user.name = m.name || m.pushName || 'Usuario'
    user.regTime = Date.now()
    user.age = -1
    user.level = 0
    user.coins = 100 
    user.exp = 0
    user.genre = 'No establecido'
    user.birth = 'No registrado'
    user.desc = 'Sin descripción'
    user.favourite = 'No establecido'
    user.partner = ''
    user.banned = false
    user.prem = false
    
    console.log(`✅ Usuario registrado automáticamente: ${m.sender} (${user.name})`)
    

  }  
  if (!('banned' in user)) user.banned = false  
  if (!isNumber(user.level)) user.level = 0  
  if (!isNumber(user.coins)) user.coins = 0  

  let chat = global.db.data.chats[m.chat] ||= {}  
  if (!('isBanned' in chat)) chat.isBanned = false  
  if (!('bienvenida' in chat)) chat.bienvenida = true  
  if (!('antiLink' in chat)) chat.antiLink = false  
  if (!('onlyLatinos' in chat)) chat.onlyLatinos = false  
  if (!('nsfw' in chat)) chat.nsfw = false  
  if (!isNumber(chat.expired)) chat.expired = 0  

  let settings = global.db.data.settings[this.user.jid] ||= {}  
  if (!('self' in settings)) settings.self = false  
  if (!('autoread' in settings)) settings.autoread = true 
  if (!('autoread' in opts)) opts.autoread = true 
  
  
  if (global.db.data.notes && global.db.data.notes[m.chat]) {
    const now = Date.now()
    const originalLength = global.db.data.notes[m.chat].length
    global.db.data.notes[m.chat] = global.db.data.notes[m.chat].filter(note => note.expiresAt > now)
    const cleanedLength = global.db.data.notes[m.chat].length
    if (originalLength > cleanedLength) {
      console.log(`[NOTAS] Se limpiaron ${originalLength - cleanedLength} notas expiradas en ${m.chat}`)
    }
  }
} catch (e) {  
  console.error(e)  
}  

if (opts['nyimak']) return  
if (!m.fromMe && opts['self']) return  
if (opts['swonly'] && m.chat !== 'status@broadcast') return  
if (typeof m.text !== 'string') m.text = ''  

let _user = global.db.data?.users?.[m.sender]  

const createOwnerIds = (number) => {
  const cleanNumber = number.replace(/[^0-9]/g, '')
  return [
    cleanNumber + '@s.whatsapp.net',
    cleanNumber + '@lid'
  ]
}

const allOwnerIds = [
  conn.decodeJid(global.conn.user.id),
  ...global.owner.flatMap(([number]) => createOwnerIds(number)),
  ...(global.ownerLid || []).flatMap(([number]) => createOwnerIds(number))
]

const isROwner = allOwnerIds.includes(m.sender)
const isOwner = isROwner || m.fromMe  
const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)  
const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || _user?.prem == true  

if (opts['queque'] && m.text && !(isMods || isPrems)) {  
  let queque = this.msgqueque, time = 1000 * 5  
  const previousID = queque[queque.length - 1]  
  queque.push(m.id || m.key.id)  
  setInterval(async function () {  
    if (queque.indexOf(previousID) === -1) clearInterval(this)  
    await delay(time)  
  }, time)  
}  

if (m.isBaileys) return  
m.exp += Math.ceil(Math.random() * 10)  

const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}  
const participants = (m.isGroup ? groupMetadata.participants : []) || []  


const extractNumber = (jid) => {
  if (!jid) return ''
  try {
    const decoded = conn.decodeJid ? conn.decodeJid(jid) : jid
    return decoded.split('@')[0].replace(/[^0-9]/g, '')
  } catch (e) {
    return String(jid).split('@')[0].replace(/[^0-9]/g, '')
  }
}


const normalizeJid = async (jid, groupChatId = null) => {
  if (!jid) return null
  try {
 
    if (typeof jid === 'string' && jid.endsWith('@lid') && groupChatId && m.isGroup) {
      try {
        
        if (String.prototype.resolveLidToRealJid) {
          const resolved = await jid.resolveLidToRealJid(groupChatId, this)
          if (resolved && !resolved.endsWith('@lid')) {
            return resolved
          }
        }
      } catch (e) {
      
      }
    }
    
    return conn.decodeJid ? conn.decodeJid(jid) : jid
  } catch (e) {
    return jid
  }
}


const compareJids = async (jid1, jid2, groupChatId = null) => {
  if (!jid1 || !jid2) return false
  
  try {
  
    const normalized1 = await normalizeJid(jid1, groupChatId)
    const normalized2 = await normalizeJid(jid2, groupChatId)
    
    
    if (normalized1 === normalized2) return true
    
    
    if (areJidsSameUser) {
      if (areJidsSameUser(normalized1, normalized2)) return true

      if (areJidsSameUser(jid1, jid2)) return true
    }
    
    
    const num1 = extractNumber(normalized1 || jid1)
    const num2 = extractNumber(normalized2 || jid2)
    if (num1 && num2 && num1 === num2 && num1 !== '') return true
    
    return false
  } catch (e) {
   
    const num1 = extractNumber(jid1)
    const num2 = extractNumber(jid2)
    return num1 && num2 && num1 === num2 && num1 !== ''
  }
}

let user = {}
if (m.isGroup) {
  for (const participant of participants) {
  
    const participantIds = [participant.id, participant.jid].filter(Boolean)
    
    for (const participantId of participantIds) {
      if (!participantId) continue
      
    
      const isMatch = await compareJids(participantId, m.sender, m.chat)
      if (isMatch) {
        user = participant
        break
      }
    }
    
    if (user && Object.keys(user).length > 0) break
  }
  
  if (!user || Object.keys(user).length === 0) {
    const senderNumber = extractNumber(m.sender)
    user = participants.find(u => {
      const participantIds = [u.id, u.jid].filter(Boolean)
      for (const participantId of participantIds) {
        const userIdNumber = extractNumber(participantId)
        if (userIdNumber === senderNumber && userIdNumber !== '') return true
      }
      return false
    }) || {}
  }
}  

const bot = (m.isGroup ? participants.find(u => {
  const botIdNumber = extractNumber(this.user.jid)
  const userIdNumber = extractNumber(u.id || u.jid || '')
  return userIdNumber === botIdNumber && userIdNumber !== ''
}) : {}) || {}  

const isRAdmin = user?.admin == 'superadmin' || false  
const isAdmin = isRAdmin || user?.admin == 'admin' || false  
const isBotAdmin = bot?.admin || false  

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')  

global.idcanal = '120363401364931622@newsletter'  
global.namecanal = '𓆩 APPLE BOT 𓆪'  
global.rcanal = {  
  contextInfo: {  
    isForwarded: true,  
    forwardedNewsletterMessageInfo: {  
      newsletterJid: idcanal,  
      serverMessageId: 100,  
      newsletterName: namecanal  
    }  
  }  
}  

let usedPrefix = '.'  


let commandExecuted = false


const processedPlugins = []
for (let name in global.plugins) {
  let plugin = global.plugins[name]
  if (!plugin || plugin.disabled) continue
  
 
  let normalizedPlugin = {
    name: name,
    handler: plugin.handler || plugin,
    command: plugin.command || [],
    tags: plugin.tags || [],
    help: plugin.help || [],
    all: plugin.all,
    customPrefix: plugin.customPrefix
  }
  
  
  if (typeof normalizedPlugin.command === 'string') {
    normalizedPlugin.command = [normalizedPlugin.command]
  }
  
  
  if (normalizedPlugin.command instanceof RegExp) {
    normalizedPlugin.command = [normalizedPlugin.command.source]
  }
  
  processedPlugins.push(normalizedPlugin)
}

// const sessionPlugins = ['xnxx.js', 'hentai.js', 'xvideos.js']

// for (let plugin of processedPlugins) {
//   if (plugin.handler && typeof plugin.handler.before === 'function' && sessionPlugins.includes(plugin.name)) {
//     try {
//       await plugin.handler.before.call(this, m, {
//         conn: this,
//         participants,
//         groupMetadata,
//         user,
//         bot,
//         isROwner,
//         isOwner,
//         isRAdmin,
//         isAdmin,
//         isBotAdmin,
//         isPrems,
//         chatUpdate,
//         __dirname: ___dirname,
//         __filename
//       })
      
//       if (m.commandExecuted) break
//     } catch (e) {
//       console.error(`Error en handler.before de ${plugin.name}:`, e)
//     }
//   }
// }

for (let plugin of processedPlugins) {
  const __filename = join(___dirname, plugin.name)

  
  if (typeof plugin.all === 'function') {
    try {
      await plugin.all.call(this, m, {
        conn: this,
        participants,
        groupMetadata,
        user,
        bot,
        isROwner,
        isOwner,
        isRAdmin,
        isAdmin,
        isBotAdmin,
        isPrems,
        chatUpdate,
        __dirname: ___dirname,
        __filename
      })
    } catch (e) {
      console.error(`Error en plugin.all de ${plugin.name}:`, e)
    }
  }

  
  if (!opts['restrict']) {
    if (plugin.tags && plugin.tags.includes('admin')) continue
  }

  
  const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
  
  let match = (_prefix instanceof RegExp ?
    [[_prefix.exec(m.text), _prefix]] :
    Array.isArray(_prefix) ?
      _prefix.map(p => {
        let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
        return [re.exec(m.text), re]
      }) :
      typeof _prefix === 'string' ?
        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
        [[[], new RegExp]]
  ).find(p => p[1] && p[0])

  if (!match) continue

  const prefixMatch = match[0]
  const noPrefix = m.text.slice(prefixMatch[0].length).trim()
  const [commandText, ...args] = noPrefix.split(/\s+/)
  const command = commandText?.toLowerCase()

 
  const isMatchCommand = plugin.command && plugin.command.some(cmd => {
    if (typeof cmd === 'string') {
      return command === cmd.toLowerCase()
    } else if (cmd instanceof RegExp) {
      return cmd.test(command)
    }
    return false
  })

  if (isMatchCommand) {
    
    
    const allowedPrivateCommands = ['qr', 'code', 'setbotname', 'setbotimg', 'setautoread']
    if (!m.isGroup && !allowedPrivateCommands.includes(command) && !isOwner) {
      return 
    }
    
    if (m.isGroup && global.db.data.botGroups && global.db.data.botGroups[m.chat] === false) {
      const alwaysAllowedCommands = ['grupo']
      if (!alwaysAllowedCommands.includes(command) && !isOwner) {
        return m.reply(`*[🪐] El bot está desactivado en este grupo.*\n\n> Pídele a un administrador que lo active.`)
      }
    }
    
    commandExecuted = true
    try {
      await plugin.handler.call(this, m, {
        match,
        conn: this,
        participants,
        groupMetadata,
        user,
        bot,
        isROwner,
        isOwner,
        isRAdmin,
        isAdmin,
        isBotAdmin,
        isPrems,
        chatUpdate,
        __dirname: ___dirname,
        __filename,
        usedPrefix: prefixMatch[0],
        command,
        args,
        text: args.join(' ').trim()
      })
      m.plugin = plugin.name
      m.command = command
      m.args = args
    } catch (e) {
      m.error = e
      console.error(`Error ejecutando plugin ${plugin.name}:`, e)
    }
  }
}



if (m.text && !commandExecuted && global.db.data.adivinanzasActivas && global.db.data.adivinanzasActivas[m.chat]) {
  const adivinanzaActiva = global.db.data.adivinanzasActivas[m.chat]
  
  
  if (adivinanzaActiva.activa && !adivinanzaActiva.respondida) {
    const tiempoTranscurrido = Date.now() - adivinanzaActiva.timestamp
    const tiempoLimite = 60 * 1000 
    
    
    if (tiempoTranscurrido > tiempoLimite) {
      adivinanzaActiva.activa = false
      adivinanzaActiva.respondida = true
      
      await this.sendMessage(m.chat, {
        text: `Tiempo agotado
Respuesta: ${adivinanzaActiva.respuesta}
Nadie acertó

Usa .adivinanza para una nueva`,
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
      
      return
    }
    
  
    const respuestaUsuario = m.text.toLowerCase().trim()
    if (respuestaUsuario === adivinanzaActiva.respuesta) {
     
      adivinanzaActiva.activa = false
      adivinanzaActiva.respondida = true
      adivinanzaActiva.ganador = m.sender
      
    
      let user = global.db.data.users[m.sender]
      if (!user) global.db.data.users[m.sender] = {}
      
      const premio = 30
      user.coins = (user.coins || 0) + premio
      
      await this.sendMessage(m.chat, {
        text: `¡Acierto!

Ganador: @${m.sender.split('@')[0]}
Respuesta: ${adivinanzaActiva.respuesta}
Premio: +${premio} coins
Total: ${user.coins} coins

¡Felicitaciones!`,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
      return
    }
  }
}


  // Sistemas anti-spam, anti-link y restricciones
  await handleAntiSystems(m, this, isAdmin, isOwner, isRAdmin, isBotAdmin, isPrems, commandExecuted)

global.dfail = (type, m, conn) => {  
  const msg = {  
    rowner: `Hola, este comando solo puede ser utilizado por el Creador de la Bot.`,  
    owner: `Hola, este comando solo puede ser utilizado por el Creador de la Bot y Sub Bots.`,  
    mods: `Hola, este comando solo puede ser utilizado por los Moderadores de la Bot.`,  
    premium: `Hola, este comando solo puede ser utilizado por Usuarios Premium.`,  
    group: `Hola, este comando solo puede ser utilizado en Grupos.`,  
    private: `Hola, este comando solo puede ser utilizado en mi Chat Privado.`,  
    admin: `Hola, este comando solo puede ser utilizado por los Administradores del Grupo.`,  
    botAdmin: `Hola, la bot debe ser Administradora para ejecutar este Comando.`,  
    unreg: `Hola, para usar este comando debes estar Registrado.`,  
    restrict: `Hola, esta característica está deshabilitada.`  
  }[type]  
  if (msg) return conn.reply(m.chat, msg, m, rcanal)  
}

} catch (e) {
console.error(e)
} finally {
if (opts['queque'] && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
}

let user, stats = global.db.data.stats  
if (m) {  
  if (m.sender && (user = global.db.data.users[m.sender])) {  
    user.exp += m.exp  
    user.limit -= m.limit * 1  
  }  

  let stat  
  if (m.plugin) {  
    let now = +new Date  
    stat = stats[m.plugin] ||= {  
      total: 0,  
      success: 0,  
      last: 0,  
      lastSuccess: 0  
    }  
    stat.total += 1  
    stat.last = now  
    if (m.error == null) {  
      stat.success += 1  
      stat.lastSuccess = now  
    }  
  }  
}  

try {  
  if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)  
} catch (e) {  
  console.log(m, m.quoted, e)  
}  

const settingsREAD = global.db.data.settings[this.user.jid] || {}


const isSubBot = this.user.jid !== global.conn.user.jid
let shouldAutoRead = true

if (isSubBot) {
  try {
    const botNumber = this.user.jid.split('@')[0].replace(/\D/g, '')
    const configPath = `./Serbot/${botNumber}/config.json`
    
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
     
      if (config.autoRead === false) {
        shouldAutoRead = false
      }
    }
  } catch (error) {
   
    console.error('Error leyendo configuración de auto-leer:', error)
  }
}

if (shouldAutoRead) {
  try {
    await this.readMessages([m.key])
    
    if (m.isGroup) {
      await this.readMessages([m.key], { readEphemeral: true })
    }
  } catch (e) {
    console.error('Error al marcar como leído:', e)
  }

  
  // await handleAIModes(m, this)

}

}
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizó 'handler.js'"))
if (global.reloadHandler) console.log(await global.reloadHandler())
})
