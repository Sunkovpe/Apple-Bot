let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin, isOwner, isPrems }) => {
  if (!m.isGroup) return conn.sendMessage(m.chat, {
    text: '《✧》Este comando solo puede ser usado en grupos.',
    contextInfo: {
      ...rcanal.contextInfo
    }
  }, { quoted: m })



  const newName = args.join(' ').trim()

  if (!newName) {
    return conn.sendMessage(m.chat, {
      text: `《✧》Debes indicar el nuevo nombre del grupo.\n\n*Ejemplos:*\n- ${usedPrefix + command} KIYOMI FAMILIA\n- ${usedPrefix + command} Evento hoy 9PM`,
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }

  if (newName.length > 100) {
    return conn.sendMessage(m.chat, {
      text: `《✧》El nombre es demasiado largo.\n\n*Máximo permitido:* 100 caracteres\n*Tu nombre:* ${newName.length} caracteres` ,
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }

  try {
    const metadata = await conn.groupMetadata(m.chat)
    const oldName = metadata?.subject || 'Sin nombre'

    await conn.groupUpdateSubject(m.chat, newName)

    return conn.sendMessage(m.chat, {
      text: `Nombre actualizado

Antes: ${oldName}
Ahora: ${newName}
Por: @${m.sender.split('@')[0]}

> APPLE BOT`,
      contextInfo: {
        ...rcanal.contextInfo,
        mentionedJid: [m.sender]
      }
    }, { quoted: m })
  } catch (e) {
    console.error('Error cambiando nombre del grupo:', e)
    return conn.sendMessage(m.chat, {
      text: '《✧》No se pudo cambiar el nombre del grupo. Asegúrate de que el bot sea administrador.',
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }
}

handler.command = ['namegp']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler







