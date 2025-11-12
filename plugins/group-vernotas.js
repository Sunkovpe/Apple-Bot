let handler = async (m, { conn, args, participants, isAdmin, isBotAdmin, isOwner, isPrems, usedPrefix, command }) => {
  if (!m.isGroup) return conn.sendMessage(m.chat, {
    text: '《✧》Este comando solo puede ser usado en grupos.',
    contextInfo: {
      ...rcanal.contextInfo
    }
  }, { quoted: m })

  
  if (!global.db.data.notes) global.db.data.notes = {}
  if (!global.db.data.notes[m.chat]) global.db.data.notes[m.chat] = []

  const groupMetadata = await conn.groupMetadata(m.chat)
  const groupName = groupMetadata.subject

  
  const now = Date.now()
  global.db.data.notes[m.chat] = global.db.data.notes[m.chat].filter(note => note.expiresAt > now)

 
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    const who = m.mentionedJid[0]
    const userNotes = global.db.data.notes[m.chat].filter(note => note.author === who)
    
    if (userNotes.length === 0) {
      return conn.sendMessage(m.chat, {
        text: `Notas de Usuario

Usuario: @${who.split('@')[0]}
Notas: 0
Estado: Sin notas activas
Grupo: ${groupName}

> APPLE BOT`,
        contextInfo: {
          ...rcanal.contextInfo,
          mentionedJid: [who]
        }
      }, { quoted: m })
    }

    let notesText = `Notas de Usuario

Usuario: @${who.split('@')[0]}
Notas: ${userNotes.length}
`
    
    userNotes.forEach((note, index) => {
      const timeLeft = note.expiresAt - now
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000))
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
      
      notesText += `${index + 1}. ${note.content}\n`
      notesText += `   Tiempo restante: ${hoursLeft}h ${minutesLeft}m\n`
    })
    
    notesText += `
Grupo: ${groupName}

> APPLE BOT`

    const mentionedUsers = [who, ...userNotes.map(n => n.author)]
    
    return conn.sendMessage(m.chat, {
      text: notesText,
      contextInfo: {
        ...rcanal.contextInfo,
        mentionedJid: mentionedUsers
      }
    }, { quoted: m })
  }


  const allNotes = global.db.data.notes[m.chat]

  if (allNotes.length === 0) {
    return conn.sendMessage(m.chat, {
      text: `Notas del Grupo

Grupo: ${groupName}
Notas activas: 0
Estado: Sin notas
Nota: No hay notas activas en este grupo.

> APPLE BOT`,
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })
  }

  let groupNotesText = `Notas del Grupo

Grupo: ${groupName}
Notas activas: ${allNotes.length}
`

  const mentionedUsers = []
  
  for (let i = 0; i < allNotes.length; i++) {
    const note = allNotes[i]
    const timeLeft = note.expiresAt - now
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
    
    mentionedUsers.push(note.author)
    
    groupNotesText += `${i + 1}. ${note.content}\n`
    groupNotesText += `   Por: @${note.author.split('@')[0]} | ${hoursLeft}h ${minutesLeft}m\n`
    
    if (i < allNotes.length - 1) {
      groupNotesText += `\n`
    }
  }
  
  groupNotesText += `
Comando: ${usedPrefix}vernotas @usuario
Para ver notas de un usuario específico

> APPLE BOT`

  return conn.sendMessage(m.chat, {
    text: groupNotesText,
    contextInfo: {
      ...rcanal.contextInfo,
      mentionedJid: mentionedUsers
    }
  }, { quoted: m })
}

handler.command = ['vernotas', 'notes', 'vernotas', 'listnotes']
handler.group = true

export default handler







