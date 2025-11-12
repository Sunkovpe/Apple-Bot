/**
 * Anti Handlers - Sistemas de protección y restricciones
 * Coordinador principal que importa desde la carpeta Antis
 */

import { areJidsSameUser } from '@whiskeysockets/baileys'
import { handleAntiLink } from './Antis/anti-link.js'
import { handleAntiImg } from './Antis/anti-img.js'
import { handleAntiAudio } from './Antis/anti-audio.js'
import { handleAntiVideo } from './Antis/anti-video.js'
import { handleAntiSticker } from './Antis/anti-sticker.js'
import { handleAntiSpam } from './Antis/anti-spam.js'
import { handleAntiContact } from './Antis/anti-contact.js'
import { handleAntiMention } from './Antis/anti-mention.js'
import { handleAntiDocument } from './Antis/anti-document.js'
import { handleAntiCaracter } from './Antis/anti-caracter.js'
import { handleSoloAdmin } from './Antis/solo-admin.js'
import { handleCommandSuggestions } from './Antis/command-suggestions.js'

export async function handleAntiSystems(m, conn, isAdmin, isOwner, isRAdmin, isBotAdmin, isPrems, commandExecuted) {
  const rcanal = global.rcanal || {
    contextInfo: {
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '',
        serverMessageId: 100,
        newsletterName: 'APPLE BOT'
      }
    }
  }

  
  const isOwnBot = (sender) => {
    const cleanSender = sender?.split('@')[0] || sender

    const mainBotJid = conn.user?.jid?.split('@')[0] || conn.user?.id?.split('@')[0]
    if (cleanSender === mainBotJid) return true

    if (global.mainBotJid && cleanSender === global.mainBotJid) return true

    if (global.conns && Array.isArray(global.conns)) {
      return global.conns.some(bot => {
        const botJid = bot.user?.jid?.split('@')[0] || bot.user?.id?.split('@')[0]
        return cleanSender === botJid
      })
    }

    return false
  }

  
  if (isOwnBot(m.sender)) {
    return false
  }

  
  let verifiedIsAdmin = isAdmin
  let verifiedIsRAdmin = isRAdmin
  let verifiedIsOwner = isOwner
  

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
          
          if (typeof jid.resolveLidToRealJid === 'function') {
            const resolved = await jid.resolveLidToRealJid(groupChatId, conn)
            if (resolved && typeof resolved === 'string' && !resolved.endsWith('@lid')) {
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
  

  if (!verifiedIsOwner) {
    try {
      const senderNumber = extractNumber(m.sender)
      const ownerNumbers = [
        ...(global.owner || []).map(v => {
          const num = typeof v === 'string' ? v.replace(/[^0-9]/g, '') : String(v[0] || v).replace(/[^0-9]/g, '')
          return num
        }),
        ...(global.ownerLid || []).map(v => {
          const num = typeof v === 'string' ? v.replace(/[^0-9]/g, '') : String(v[0] || v).replace(/[^0-9]/g, '')
          return num
        })
      ]
      
      if (ownerNumbers.includes(senderNumber)) {
        verifiedIsOwner = true
      }
    } catch (error) {
      console.error('Error verificando owner en antiHandlers:', error)
    }
  }
  
  
  if (!verifiedIsOwner) {
    verifiedIsAdmin = true
    verifiedIsRAdmin = true
  } else if (m.isGroup) {
    
    try {
      const groupMetadata = conn.chats[m.chat]?.metadata || await conn.groupMetadata(m.chat).catch(_ => null)
      if (groupMetadata && groupMetadata.participants) {
        const participants = groupMetadata.participants || []
        
      
        let user = null
        
        
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
          
          if (user) break
        }
        
        if (!user) {
          const senderNumber = extractNumber(m.sender)
          user = participants.find(u => {
            const participantIds = [u.id, u.jid].filter(Boolean)
            for (const participantId of participantIds) {
              const userIdNumber = extractNumber(participantId)
              if (userIdNumber === senderNumber && userIdNumber !== '') return true
            }
            return false
          })
        }
        
        if (user) {
          verifiedIsRAdmin = user?.admin == 'superadmin' || false
          verifiedIsAdmin = verifiedIsRAdmin || user?.admin == 'admin' || false
        }
        
      
        if (isAdmin && !verifiedIsAdmin) {
          verifiedIsAdmin = true
          verifiedIsRAdmin = isRAdmin || false
        }
      } else {
        verifiedIsAdmin = isAdmin
        verifiedIsRAdmin = isRAdmin
      }
    } catch (error) {
    
   
      if (isAdmin) {
        verifiedIsAdmin = true
        verifiedIsRAdmin = isRAdmin || false
      } else {
        verifiedIsAdmin = isAdmin
        verifiedIsRAdmin = isRAdmin
      }
      console.error('Error verificando admin en antiHandlers:', error)
    }
  } else {
    
    verifiedIsAdmin = isAdmin
    verifiedIsRAdmin = isRAdmin
  }

  
  const results = await Promise.allSettled([
    handleAntiLink(m, conn, verifiedIsAdmin, verifiedIsOwner, rcanal),
    handleAntiImg(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiAudio(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiVideo(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiSticker(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiSpam(m, conn, verifiedIsAdmin, verifiedIsOwner, rcanal),
    handleAntiContact(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiMention(m, conn, verifiedIsAdmin, verifiedIsOwner, rcanal),
    handleAntiDocument(m, conn, verifiedIsAdmin, verifiedIsOwner),
    handleAntiCaracter(m, conn, verifiedIsAdmin, verifiedIsOwner, rcanal),
    handleSoloAdmin(m, conn, verifiedIsAdmin, verifiedIsOwner, rcanal),
    handleCommandSuggestions(m, conn, commandExecuted)
  ])

  
  return results.some(result =>
    result.status === 'fulfilled' && result.value === true
  )
}
