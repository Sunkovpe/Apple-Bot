let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
  try {
    if (!m.isGroup) {
      return conn.sendMessage(m.chat, {
        text: '《✧》Este comando solo funciona en grupos.',
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
    if (!isAdmin) {
      return conn.sendMessage(m.chat, {
        text: '《✧》Solo los administradores pueden usar este comando.',
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
    const action = args[0]?.toLowerCase()
    
    if (!global.db.data.soloAdmin) global.db.data.soloAdmin = {}
    
    if (action === 'on') {
      global.db.data.soloAdmin[m.chat] = true
      
      let txt = `Solo-admins activado

Estado: Activado
Modo: Solo Administradores
Restricción: Comandos bloqueados
Acceso: Admins del Grupo + Owners
Usuario: @${m.sender.split('@')[0]}

> APPLE BOT`
      
      return conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
    } else if (action === 'off') {
      global.db.data.soloAdmin[m.chat] = false
      
      let txt = `Solo-admins desactivado

Estado: Desactivado
Modo: Todos los Miembros
Acceso: Libre para Todos
Usuario: @${m.sender.split('@')[0]}

> APPLE BOT`
      
      return conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
    } else {
      let txt = `Solo-admins

Uso: ${usedPrefix + command} on/off

Ejemplo:
${usedPrefix + command} on
${usedPrefix + command} off

Descripción:
Restringe el bot solo a admins y owners
del grupo cuando está activado

> APPLE BOT`
      
      return conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
  } catch (e) {
    console.error(e)
    return conn.sendMessage(m.chat, {
      text: '《✧》Ocurrió un error al procesar el comando.',
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }
}

handler.command = ['soladmin', 'soloadmin', 'onlyadmin', 'adminonly']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler







