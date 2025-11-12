import fs from 'fs'
import { join } from 'path'

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  if (!isOwner) {
    return m.reply('*[❗] Solo los dueños pueden usar este comando.*')
  }

  
  if (!args[0]) {
    try {
      const pluginsDir = './plugins'
      const files = fs.readdirSync(pluginsDir)
      const jsFiles = files.filter(file => file.endsWith('.js'))
      
      if (jsFiles.length === 0) {
        return m.reply('*[❗] No se encontraron plugins en el directorio.*')
      }

      let txt = `Plugins disponibles

`
      
      jsFiles.forEach((file, index) => {
        const filePath = join(pluginsDir, file)
        const stats = fs.statSync(filePath)
        const size = (stats.size / 1024).toFixed(2) 
        
        txt += `${index + 1}. ${file}\n`
        txt += `   • Tamaño: ${size} KB\n`
        if (index < jsFiles.length - 1) txt += `\n`
      })
      
      txt += `
Total: ${jsFiles.length} plugins
Para renombrar: ${usedPrefix}nameplugins archivo.js > nuevonombre.js

> APPLE BOT`

      await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
          ...rcanal.contextInfo
        }
      }, { quoted: m })

    } catch (error) {
      console.error('Error listando plugins:', error)
      m.reply('*[❗] Error al listar los plugins.*')
    }
    return
  }

  
  let input = args.join(' ')
  
 
  if (!input.includes('>')) {
    return m.reply(`*[❗] Uso correcto:*
${usedPrefix}nameplugins archivo.js > nuevonombre.js

*Ejemplo:*
${usedPrefix}nameplugins test.js > nuevo-test.js`)
  }

  
  let parts = input.split('>')
  if (parts.length !== 2) {
    return m.reply('*[❗] Formato inválido. Usa: archivo.js > nuevonombre.js*')
  }

  let oldFileName = parts[0].trim()
  let newFileName = parts[1].trim()

  
  if (!oldFileName.endsWith('.js')) {
    oldFileName += '.js'
  }
  if (!newFileName.endsWith('.js')) {
    newFileName += '.js'
  }

  
  if (!/^[a-zA-Z0-9-_]+\.js$/.test(oldFileName)) {
    return m.reply('*[❗] Nombre del archivo original inválido. Solo letras, números, guiones y guiones bajos.*')
  }
  if (!/^[a-zA-Z0-9-_]+\.js$/.test(newFileName)) {
    return m.reply('*[❗] Nuevo nombre de archivo inválido. Solo letras, números, guiones y guiones bajos.*')
  }

  const oldPath = join('./plugins', oldFileName)
  const newPath = join('./plugins', newFileName)

  
  if (!fs.existsSync(oldPath)) {
    return m.reply(`*[❗] El archivo ${oldFileName} no existe.*\n\nUsa ${usedPrefix}nameplugins para ver todos los plugins disponibles.`)
  }

  
  if (fs.existsSync(newPath)) {
    return m.reply(`*[❗] El archivo ${newFileName} ya existe.*`)
  }

  try {
   
    fs.renameSync(oldPath, newPath)
    
    let txt = `Plugin renombrado

Archivo original: ${oldFileName}
Nuevo nombre: ${newFileName}
Estado: Renombrado exitosamente
Comando anterior: .${oldFileName.replace('.js', '')}
Nuevo comando: .${newFileName.replace('.js', '')}
Recarga: El plugin se cargará automáticamente

> APPLE BOT`

    await conn.sendMessage(m.chat, {
      text: txt,
      contextInfo: {
        ...rcanal.contextInfo
      }
    }, { quoted: m })

  } catch (error) {
    console.error('Error renombrando plugin:', error)
    m.reply(`*[❗] Error al renombrar el plugin: ${error.message}*`)
  }
}

handler.help = ['#nameplugins\n→ Listar todos los plugins', '#nameplugins archivo.js > nuevonombre.js\n→ Renombrar un plugin']
handler.tags = ['owner']
handler.command = ['nameplugins', 'renameplugin', 'renombrarplugin']

export default handler 







