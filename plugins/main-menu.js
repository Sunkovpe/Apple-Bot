import fs from 'fs'
import { join } from 'path'

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor((ms % 3600000) / 60000)
  let s = Math.floor((ms % 60000) / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

let handler = async (m, { conn, usedPrefix }) => {
  try {
    let nombreBot = global.namebot || 'APPLE BOT'
    let imgBot = 'https://files.catbox.moe/iomah1.jpg'
    let mainImg = './storage/img/menu.jpg'
    const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
    const tipo = botActual === '+573206534465'.replace(/\D/g, '') ? 'Principal Bot' : 'Sub Bot'
    
    
    if (tipo === 'Sub Bot') {
      const configGlobalPath = join('./Serbot', botActual, 'config.json')
      if (fs.existsSync(configGlobalPath)) {
        const globalConfig = JSON.parse(fs.readFileSync(configGlobalPath, 'utf8'))
        if (globalConfig.img) {
          mainImg = globalConfig.img
        }
        if (globalConfig.name) {
          nombreBot = globalConfig.name
        }
      }
    }
    
   
    const createOwnerIds = (number) => {
      const cleanNumber = number.replace(/[^0-9]/g, '')
      return [
        cleanNumber + '@s.whatsapp.net',
        cleanNumber + '@lid'
      ]
    }

    const allOwnerIds = [
      conn.decodeJid(conn.user.id),
      ...global.owner.flatMap(([number]) => createOwnerIds(number)),
      ...(global.ownerLid || []).flatMap(([number]) => createOwnerIds(number))
    ]

    const isROwner = allOwnerIds.includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
    const _user = global.db.data?.users?.[m.sender]
    const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || _user?.prem == true

    
    let isRAdmin = false
    let isAdmin = false
    let isGroupCreator = false
    if (m.isGroup) {
      try {
        const groupMetadata = conn.chats[m.chat]?.metadata || await conn.groupMetadata(m.chat).catch(_ => null)
        if (groupMetadata) {
          const participants = groupMetadata.participants || []
          const user = participants.find(u => conn.decodeJid(u.id) === m.sender) || {}
          isRAdmin = user?.admin == 'superadmin' || false
          isAdmin = isRAdmin || user?.admin == 'admin' || false
          
         
          isGroupCreator = groupMetadata.owner === m.sender || 
                          groupMetadata.subjectOwner === m.sender ||
                          user?.admin === 'superadmin'
        }
      } catch (error) {
        console.error('Error obteniendo metadata del grupo:', error)
      }
    }

  
    let userRole = '👤 Miembro'
    
    if (isROwner || isOwner) {
     
      if (isGroupCreator) {
        userRole = '👑 Creador del Bot y Grupo'
      } else if (isRAdmin || isAdmin) {
        userRole = '👑 Creador del Bot y Admin'
      } else {
        userRole = '👑 Creador del Bot'
      }
    } else if (isMods) {
      
      if (isGroupCreator) {
        userRole = 'Moderador del Bot y Creador'
      } else if (isRAdmin || isAdmin) {
        userRole = 'Moderador del Bot y Admin'
      } else {
        userRole = 'Moderador del Bot'
      }
    } else if (isGroupCreator) {
      userRole = '👑 Creador del Grupo'
    } else if (isRAdmin || isAdmin) {
      userRole = '𖢠 Admin del Grupo'
    }
    
    let botUptime = 0
    if (conn.startTime) {
      botUptime = Date.now() - conn.startTime
    }
    let botFormatUptime = clockString(botUptime)
    
   
    let totalf = Object.values(global.plugins).filter(v => v.help && v.tags).length
    
    
    const memoryUsage = process.memoryUsage()
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)

    const text = `

*BOT:* ${global.namebot}
*Owner:* ${global.owner[0][1]}

*ADM - Comandos de Grupo*

*#tag* - Mencionar a todos
*#bot* - Activar/desactivar bot
*#close* - Cerrar grupo
*#demote* - Descender admin
*#promote* - Ascender admin
*#add* - Invitar usuario
*#kick* - Expulsar usuario
*#warn* - Advertir
*#delwarn* - Quitar advertencia
*#warnings* - Ver advertencias
*#setdesc* - Cambiar descripcion grupo
*#photogp* - Cambiar imagen grupo
*#namegp* - Cambiar nombre grupo
*#nota* - Agregar nota
*#delnota* - Eliminar nota
*#vernotas* - Ver notas
*#clear* - Limpiar chat
*#delete* - Eliminar mensaje
*#open* - Abrir grupo
*#soloadmin* - Solo admins
*#grupo* - Grupo on/off

*ANTI - Comandos Anti*

*#antiaudio* - Anti audio on/off
*#antiimg* - Anti imagen on/off
*#antivideo* - Anti video on/off
*#antisticker* - Anti sticker on/off
*#antilink* - Anti enlace on/off
*#anticontact* - Anti contacto on/off
*#antidocument* - Anti documento on/off
*#antimention* - Anti mencion on/off
*#antispam* - Anti spam on/off
*#anticaracter* - Anti caracter on/off

*OWNER - Comandos de Creador*

*#addplugin* - Agregar plugin
*#nameplugins* - Nombre plugins
*#replugin* - Recargar plugin
*#restart* - Reiniciar bot
*#subme* - Sub bot
*#update* - Actualizar
*#verplugin* - Ver plugin

*SET - Configuraciones*

*#autoread* - Auto leer on/off
*#botimg* - Imagen bot
*#botname* - Nombre bot

*UTIL - Utilidades*

*#getid* - Obtener ID
*#google* - Buscar en Google
*#timer* - Temporizador

`.trim()

    
//    const externalAdReply = {
//      title: `✦ ${nombreBot} | WhatsApp Bot\n`,
//      body: `𝗖𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗱𝗲 ${nombreBot} By @Sunkovv`,
//      thumbnailUrl: imgBot,
//      mediaType: 1,
//      showAdAttribution: true,
//      renderLargerThumbnail: true
//    }

    await conn.sendFile(m.chat, mainImg, 'thumbnail.jpg', text, m, null, { 
      contextInfo: {
        ...rcanal.contextInfo,
        mentionedJid: [m.sender],
//        externalAdReply: externalAdReply
      }
    })

  } catch (e) {
    console.error('Error en menú:', e)
    conn.sendMessage(m.chat, {
      text: 'Hubo un error al mostrar el menú.',
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
    throw e
  }
}

handler.command = ['menu', 'help', 'menú']
export default handler







