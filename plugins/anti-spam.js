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
    
    
    const action = args[0]?.toLowerCase()
    
    if (!global.db.data.antiSpam) global.db.data.antiSpam = {}
    
    if (action === 'on') {
      global.db.data.antiSpam[m.chat] = true
      
      let txt = `Anti-spam activado

Estado: Activado
Acción: Eliminar + Expulsar
Límite: 3 mensajes en 2 segundos
Excepción: Administradores
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
      global.db.data.antiSpam[m.chat] = false
      
      let txt = `Anti-spam desactivado

Estado: Desactivado
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
      return conn.sendMessage(m.chat, {
        text: `Debes especificar una acción.

Ejemplo: ${usedPrefix}antispam on
Ejemplo: ${usedPrefix}antispam off`,
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
  } catch (e) {
    console.error('Error en antispam:', e)
    return conn.sendMessage(m.chat, {
      text: 'Ocurrió un error al configurar el anti-spam.',
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }
}

handler.command = ['antispam']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler 








