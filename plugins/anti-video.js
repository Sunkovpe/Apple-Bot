let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
  try {
    if (!m.isGroup) {
      return conn.sendMessage(m.chat, {
        text: 'Este comando solo funciona en grupos.',
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
    
    const action = args[0]?.toLowerCase()
    
    if (!global.db.data.antiVideo) global.db.data.antiVideo = {}
    
    if (action === 'on') {
      global.db.data.antiVideo[m.chat] = true
      
      let txt = `Anti-video activado

Estado: Activado
Acción: Eliminar mensaje
Excepción: Administradores
Usuario: @${m.sender.split('@')[0]}`
      
      return conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
    } else if (action === 'off') {
      global.db.data.antiVideo[m.chat] = false
      
      let txt = `Anti-video desactivado

Estado: Desactivado
Usuario: @${m.sender.split('@')[0]}`
      
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

Ejemplo: ${usedPrefix}antivideo on
Ejemplo: ${usedPrefix}antivideo off`,
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })
    }
    
  } catch (e) {
    console.error('Error en antivideo:', e)
    return conn.sendMessage(m.chat, {
      text: 'Ocurrió un error al configurar el anti-video.',
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }
}

handler.command = ['antivideo']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler 







