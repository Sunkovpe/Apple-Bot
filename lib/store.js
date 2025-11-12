import { readFileSync, writeFileSync, existsSync } from 'fs'

const { initAuthCreds, BufferJSON, proto } = (await import('@whiskeysockets/baileys')).default
 
function bind(conn) {
    if (!conn.chats) conn.chats = {}
    function updateNameToDb(contacts) {
        if (!contacts) return
        try {
            contacts = contacts.contacts || contacts
            for (const contact of contacts) {
                const id = conn.decodeJid(contact.id)
                if (!id || id === 'status@broadcast') continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { ...contact, id }
                conn.chats[id] = {
                    ...chats,
                    ...({
                        ...contact, id, ...(id.endsWith('@g.us') ?
                            { subject: contact.subject || contact.name || chats.subject || '' } :
                            { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                    } || {})
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)
    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = conn.decodeJid(id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = !readOnly
                if (name) chats[isGroup ? 'subject' : 'name'] = name
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(_ => null)
                    if (name || metadata?.subject) chats.subject = name || metadata.subject
                    if (!metadata) continue
                    chats.metadata = metadata
                }
            }
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        if (!id) return
        id = conn.decodeJid(id)
        if (id === 'status@broadcast') return
        if (!(id in conn.chats)) conn.chats[id] = { id }
        let chats = conn.chats[id]
        chats.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
        if (!groupMetadata) return
        chats.subject = groupMetadata.subject
        chats.metadata = groupMetadata

        try {
            if (global.db.data.bienvenidas && global.db.data.bienvenidas[id]) {
                if (global.db.data.bienvenidas[id] === true) {
                    global.db.data.bienvenidas[id] = {
                        enabled: true,
                        welcomeMsg: '',
                        goodbyeMsg: '',
                        welcomeImg: '',
                        goodbyeImg: ''
                    }
                } else if (global.db.data.bienvenidas[id] === false) {
                    global.db.data.bienvenidas[id] = {
                        enabled: false,
                        welcomeMsg: '',
                        goodbyeMsg: '',
                        welcomeImg: '',
                        goodbyeImg: ''
                    }
                } else if (typeof global.db.data.bienvenidas[id] !== 'object') {
                    global.db.data.bienvenidas[id] = {
                        enabled: false,
                        welcomeMsg: '',
                        goodbyeMsg: '',
                        welcomeImg: '',
                        goodbyeImg: ''
                    }
                }
            }
            
            if (global.db.data.bienvenidas && global.db.data.bienvenidas[id] && global.db.data.bienvenidas[id].enabled === true) {
                for (const participant of participants) {
                    const participantId = conn.decodeJid(participant)
                    
                    if (action === 'add') {
                        const user = await conn.getName(participantId) || 'Usuario'
                        const group = await conn.getName(id) || 'Grupo'
                        const memberCount = groupMetadata.participants.length
                        
                        const now = new Date()
                        const date = now.toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })
                        const time = now.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                        
                        let welcomeMsg = global.db.data.bienvenidas[id].welcomeMsg || 
                            `╭─「 *BIENVENIDO* 」─╮\n` +
                            `│\n` +
                            `╰➺ *Usuario:* @${participantId.split('@')[0]}\n` +
                            `╰➺ *Grupo:* ${group}\n` +
                            `╰➺ *Miembros:* ${memberCount}\n` +
                            `│\n` +
                            `╰➺ *Fecha:* ${date}\n` +
                            `╰➺ *Hora:* ${time}\n` +
                            `│\n` +
                            `╰➺ *Bienvenido al grupo!*\n` +
                            `> APPLE BOT COMMUNITY`
                        
                        welcomeMsg = welcomeMsg
                            .replace(/\${user}/g, user)
                            .replace(/\${participant}/g, `@${participantId.split('@')[0]}`)
                            .replace(/\${group}/g, group)
                            .replace(/\${memberCount}/g, memberCount)
                            .replace(/\${date}/g, date)
                            .replace(/\${time}/g, time)
                        
                        const welcomeImg = global.db.data.bienvenidas[id].welcomeImg
                        
                        if (welcomeImg && welcomeImg.trim() !== '') {
                            try {
                                await conn.sendMessage(id, {
                                    image: { url: welcomeImg },
                                    caption: welcomeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            } catch (imgError) {
                                try {
                                    const pp = await conn.profilePictureUrl(id, 'image')
                                    await conn.sendMessage(id, {
                                        image: { url: pp },
                                        caption: welcomeMsg,
                                        contextInfo: {
                                            mentionedJid: [participantId]
                                        }
                                    })
                                } catch (ppError) {
                                    await conn.sendMessage(id, {
                                        text: welcomeMsg,
                                        contextInfo: {
                                            mentionedJid: [participantId]
                                        }
                                    })
                                }
                            }
                        } else {
                            try {
                                const pp = await conn.profilePictureUrl(id, 'image')
                                await conn.sendMessage(id, {
                                    image: { url: pp },
                                    caption: welcomeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            } catch (ppError) {
                                await conn.sendMessage(id, {
                                    text: welcomeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            }
                        }
                        
                    } else if (action === 'remove') {
                        const user = await conn.getName(participantId) || 'Usuario'
                        const group = await conn.getName(id) || 'Grupo'
                        const memberCount = groupMetadata.participants.length
                        
                        const now = new Date()
                        const date = now.toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })
                        const time = now.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                        
                        let goodbyeMsg = global.db.data.bienvenidas[id].goodbyeMsg || 
                            `╭─「 *ADIOS* 」─╮\n` +
                            `│\n` +
                            `╰➺ *Usuario:* @${participantId.split('@')[0]}\n` +
                            `╰➺ *Grupo:* ${group}\n` +
                            `╰➺ *Miembros:* ${memberCount}\n` +
                            `│\n` +
                            `╰➺ *Fecha:* ${date}\n` +
                            `╰➺ *Hora:* ${time}\n` +
                            `│\n` +
                            `╰➺ *¡Que tengas un buen día!*\n` +
                            `> APPLE BOT COMMUNITY`
                        
                        goodbyeMsg = goodbyeMsg
                            .replace(/\${user}/g, user)
                            .replace(/\${participant}/g, `@${participantId.split('@')[0]}`)
                            .replace(/\${group}/g, group)
                            .replace(/\${memberCount}/g, memberCount)
                            .replace(/\${date}/g, date)
                            .replace(/\${time}/g, time)
                        
                        const goodbyeImg = global.db.data.bienvenidas[id].goodbyeImg
                        
                        if (goodbyeImg && goodbyeImg.trim() !== '') {
                            try {
                                await conn.sendMessage(id, {
                                    image: { url: goodbyeImg },
                                    caption: goodbyeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            } catch (imgError) {
                                try {
                                    const pp = await conn.profilePictureUrl(id, 'image')
                                    await conn.sendMessage(id, {
                                        image: { url: pp },
                                        caption: goodbyeMsg,
                                        contextInfo: {
                                            mentionedJid: [participantId]
                                        }
                                    })
                                } catch (ppError) {
                                    await conn.sendMessage(id, {
                                        text: goodbyeMsg,
                                        contextInfo: {
                                            mentionedJid: [participantId]
                                        }
                                    })
                                }
                            }
                        } else {
                            try {
                                const pp = await conn.profilePictureUrl(id, 'image')
                                await conn.sendMessage(id, {
                                    image: { url: pp },
                                    caption: goodbyeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            } catch (ppError) {
                                await conn.sendMessage(id, {
                                    text: goodbyeMsg,
                                    contextInfo: {
                                        mentionedJid: [participantId]
                                    }
                                })
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error en sistema de bienvenidas:', error)
        }
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                if (!isGroup) continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = true
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chats.metadata = metadata
                if (update.subject || metadata?.subject) chats.subject = update.subject || metadata.subject
            }
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('chats.upsert', function chatsUpsertPushToDb(chatsUpsert) {
        try {
            const { id, name } = chatsUpsert
            if (!id || id === 'status@broadcast') return
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup) conn.insertAllGroup().catch(_ => null)
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        try {
            const sender = Object.keys(presences)[0] || id
            const _sender = conn.decodeJid(sender)
            const presence = presences[sender]['lastKnownPresence'] || 'composing'
            let chats = conn.chats[_sender]
            if (!chats) chats = conn.chats[_sender] = { id: sender }
            chats.presences = presence
            if (id.endsWith('@g.us')) {
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
            }
        } catch (e) {
            console.error(e)
        }
    })
}

const KEY_MAP = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
}

function useSingleFileAuthState(filename, logger) {
    let creds, keys = {}, saveCount = 0
    const saveState = (forceSave) => {
        logger?.trace('saving auth state')
        saveCount++
        if (forceSave || saveCount > 5) {
            writeFileSync(
                filename,
                JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
            )
            saveCount = 0
        }
    }

    if (existsSync(filename)) {
        const result = JSON.parse(
            readFileSync(filename, { encoding: 'utf-8' }),
            BufferJSON.reviver
        )
        creds = result.creds
        keys = result.keys
    } else {
        creds = initAuthCreds()
        keys = {}
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type]
                    return ids.reduce(
                        (dict, id) => {
                            let value = keys[key]?.[id]
                            if (value) {
                                if (type === 'app-state-sync-key') {
                                    value = proto.AppStateSyncKeyData.fromObject(value)
                                }

                                dict[id] = value
                            }

                            return dict
                        }, {}
                    )
                },
                set: (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[_key]
                        keys[key] = keys[key] || {}
                        Object.assign(keys[key], data[_key])
                    }

                    saveState()
                }
            }
        },
        saveState
    }
}
export default {
    bind,
    useSingleFileAuthState
}
