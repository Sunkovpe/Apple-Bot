let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return conn.sendMessage(m.chat, {
    text: '《✧》Este comando solo puede ser usado en grupos.',
    contextInfo: { ...rcanal.contextInfo }
  }, { quoted: m })


  const newDesc = args.join(' ').trim()

  if (!newDesc) {
    return conn.sendMessage(m.chat, {
      text: `《✧》Debes indicar la nueva descripción del grupo.\n\n*Ejemplos:*\n- ${usedPrefix + command} Bienvenidos a KIYOMI MD\n- ${usedPrefix + command} Reglas: Respeto, no spam, no links`,
      contextInfo: { ...rcanal.contextInfo }
    }, { quoted: m })
  }

  try {
    const metadata = await conn.groupMetadata(m.chat)
    const oldDesc = (metadata && metadata.desc) ? metadata.desc : 'Sin descripción'

    await conn.groupUpdateDescription(m.chat, newDesc)

    return conn.sendMessage(m.chat, {
      text: `Descripción actualizada

Antes: ${oldDesc.substring(0, 300)}${oldDesc.length > 300 ? '…' : ''}
Ahora: ${newDesc}
Por: @${m.sender.split('@')[0]}

> APPLE BOT`,
      contextInfo: { ...rcanal.contextInfo, mentionedJid: [m.sender] }
    }, { quoted: m })
  } catch (e) {
    console.error('Error cambiando descripción del grupo:', e)
    return conn.sendMessage(m.chat, {
      text: '《✧》No se pudo cambiar la descripción del grupo. Asegúrate de que el bot sea administrador.',
      contextInfo: { ...rcanal.contextInfo }
    }, { quoted: m })
  }
}

handler.command = ['desgp']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler







