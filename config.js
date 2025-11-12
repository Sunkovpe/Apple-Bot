import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  ['51957715814', 'X Ventas', true],
]


global.ownerLid = [
  ['77206885785728', 'X Ventas', true],
]

global.sessions = 'Sessions'
global.bot = 'Serbot' 
global.AFBots = true

global.packname = 'APPLE BOT'
global.namebot = 'APPLE BOT'
global.author = 'X Ventas'


global.canal = 'https://whatsapp.com/channel/0029VbAfIxz9WtC9yM4R5g2x'

global.ch = {
ch1: '120363401364931622@newsletter',
}

global.mods =   []
global.prems = []

global.multiplier = 69 
global.maxwarn = '2'

global.APIs = {
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
