let handler = async (m, { conn, args, participants, isAdmin, isBotAdmin, isOwner, isPrems, usedPrefix, command }) => {
  if (!m.isGroup) return conn.sendMessage(m.chat, {
    text: '《✧》Este comando solo puede ser usado en grupos.',
    contextInfo: {
      ...rcanal.contextInfo
    }
  }, { quoted: m })
  
  if (!global.db.data.warnings) global.db.data.warnings = {}
  if (!global.db.data.warnings[m.chat]) global.db.data.warnings[m.chat] = {}

  const groupMetadata = await conn.groupMetadata(m.chat)
  const groupName = groupMetadata.subject

  if (m.mentionedJid && m.mentionedJid.length > 0) {
    const who = m.mentionedJid[0]
    const userWarnings = global.db.data.warnings[m.chat][who]
    
    if (!userWarnings || userWarnings.count === 0) {
      return conn.sendMessage(m.chat, {
        text: `Advertencias de Usuario

Usuario: @${who.split('@')[0]}
Advertencias: 0/3
Estado: Expediente limpio
Grupo: ${groupName}

> APPLE BOT`,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [who]
        }
      }, { quoted: m })
    }

    let warningsText = `Advertencias de Usuario

Usuario: @${who.split('@')[0]}
Advertencias: ${userWarnings.count}/3
`
    
    userWarnings.warnings.forEach((warn, index) => {
      const date = new Date(warn.timestamp).toLocaleDateString('es-ES')
      const adminName = warn.admin.split('@')[0]
      warningsText += `${index + 1}. ${warn.reason}\n`
      warningsText += `   Admin: @${adminName} | ${date}\n`
    })
    
    warningsText += `
Grupo: ${groupName}`
    if (userWarnings.count >= 2) {
      warningsText += `
¡Próxima advertencia = Expulsión!`
    }
    warningsText += `

> APPLE BOT`

    const mentionedUsers = [who, ...userWarnings.warnings.map(w => w.admin)]
    
    return conn.sendMessage(m.chat, {
      text: warningsText,
      contextInfo: {
        ...rcanal.contextInfo,
        mentionedJid: mentionedUsers
      }
    }, { quoted: m })
  }


  const allWarnings = global.db.data.warnings[m.chat]
  const usersWithWarnings = Object.keys(allWarnings).filter(user => allWarnings[user].count > 0)

  if (usersWithWarnings.length === 0) {
    return conn.sendMessage(m.chat, {
      text: `Advertencias del Grupo

Grupo: ${groupName}
Usuarios con advertencias: 0
Estado: Grupo limpio
Nota: No hay usuarios con advertencias activas.

> APPLE BOT`,
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }

  let groupWarningsText = `Advertencias del Grupo

Grupo: ${groupName}
Usuarios con advertencias: ${usersWithWarnings.length}
`

  const mentionedUsers = []
  
  for (let i = 0; i < usersWithWarnings.length; i++) {
    const userId = usersWithWarnings[i]
    const userWarnings = allWarnings[userId]
    const userName = userId.split('@')[0]
    
    mentionedUsers.push(userId)
    
    groupWarningsText += `${i + 1}. @${userName}\n`
    groupWarningsText += `   Advertencias: ${userWarnings.count}/3\n`
    
    if (i < usersWithWarnings.length - 1) {
      groupWarningsText += `\n`
    }
  }
  
  groupWarningsText += `
Comando: ${usedPrefix}warnings @usuario
Para ver detalles de un usuario específico

> APPLE BOT`

  return conn.sendMessage(m.chat, {
    text: groupWarningsText,
    contextInfo: {
      ...rcanal.contextInfo,
      mentionedJid: mentionedUsers
    }
  }, { quoted: m })
}

handler.command = ['warnings', 'advertencias', 'veradvertencias', 'listwarns']
handler.group = true
handler.admin = true

export default handler







