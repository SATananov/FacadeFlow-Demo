import { spawn } from 'node:child_process'
import { constants as fsConstants } from 'node:fs'
import { access, readFile, realpath, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'

const HOST = '127.0.0.1'
const NO_OPEN = process.argv.includes('--no-open')
const PORTS = Array.from({ length: 8 }, (_, index) => 4173 + index)
const DIST_DIRECTORY = path.resolve(process.cwd(), 'dist')
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.gif', 'image/gif'], ['.webp', 'image/webp'],
  ['.wasm', 'application/wasm'], ['.gz', 'application/gzip'], ['.pdf', 'application/pdf'], ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'], ['.woff2', 'font/woff2'], ['.txt', 'text/plain; charset=utf-8'],
])

let distRoot
try {
  await access(path.join(DIST_DIRECTORY, 'index.html'), fsConstants.R_OK)
  distRoot = await realpath(DIST_DIRECTORY)
} catch {
  console.error('ГРЕШКА: Липсва готова dist/index.html. Първо изпълнете "npm run build".')
  process.exit(1)
}

const securityHeaders = (isIndex = false) => ({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  ...(isIndex ? { 'Cache-Control': 'no-store' } : {}),
})

function decodeRequestPath(rawUrl = '/') {
  const rawPath = rawUrl.split(/[?#]/, 1)[0] || '/'
  let decoded = rawPath
  for (let index = 0; index < 3; index += 1) {
    const next = decodeURIComponent(decoded)
    if (next === decoded) break
    decoded = next
  }
  if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some((segment) => segment === '..')) throw new Error('UNSAFE_PATH')
  return decoded
}

async function containedFile(requestPath) {
  const candidate = path.resolve(distRoot, requestPath.replace(/^\/+/, ''))
  if (candidate !== distRoot && !candidate.startsWith(`${distRoot}${path.sep}`)) throw new Error('UNSAFE_PATH')
  try {
    const info = await stat(candidate)
    if (!info.isFile()) return null
    const resolved = await realpath(candidate)
    if (resolved !== distRoot && !resolved.startsWith(`${distRoot}${path.sep}`)) throw new Error('UNSAFE_PATH')
    return resolved
  } catch (error) {
    if (error instanceof Error && error.message === 'UNSAFE_PATH') throw error
    return null
  }
}

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, { ...securityHeaders(), 'Content-Type': 'text/plain; charset=utf-8', ...headers })
  response.end(body)
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { send(response, 405, 'Методът не е разрешен.', { Allow: 'GET, HEAD' }); return }
  try {
    const requestPath = decodeRequestPath(request.url)
    const staticPath = requestPath === '/' ? '/index.html' : requestPath
    let filePath = await containedFile(staticPath)
    let isIndex = staticPath === '/index.html'
    if (!filePath) {
      const looksLikeAsset = path.posix.extname(requestPath) !== '' || requestPath === '/assets' || requestPath.startsWith('/assets/') || requestPath === '/ocr' || requestPath.startsWith('/ocr/')
      if (looksLikeAsset) { send(response, 404, 'Файлът не е намерен.'); return }
      filePath = path.join(distRoot, 'index.html'); isIndex = true
    }
    const content = await readFile(filePath)
    response.writeHead(200, { ...securityHeaders(isIndex), 'Content-Type': mimeTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream', 'Content-Length': content.byteLength })
    response.end(request.method === 'HEAD' ? undefined : content)
  } catch (error) {
    if (error instanceof URIError || (error instanceof Error && error.message === 'UNSAFE_PATH')) send(response, 400, 'Невалиден или опасен път.')
    else { console.error('Локална грешка при четене на статичен файл.'); send(response, 500, 'Локална грешка на статичния сървър.') }
  }
})

async function listenOnAvailablePort() {
  for (const port of PORTS) {
    const result = await new Promise((resolve) => {
      const onError = (error) => { server.off('listening', onListening); resolve(error) }
      const onListening = () => { server.off('error', onError); resolve(null) }
      server.once('error', onError); server.once('listening', onListening); server.listen(port, HOST)
    })
    if (!result) return port
    if (result.code !== 'EADDRINUSE' && result.code !== 'EACCES') throw result
  }
  return null
}

function openBrowser(url) {
  if (process.platform !== 'win32') { console.log(`Браузър: отворете ръчно ${url}`); return }
  try {
    const child = spawn('cmd.exe', ['/d', '/s', '/c', 'start', '""', url], { detached: true, stdio: 'ignore', windowsHide: true })
    child.once('error', () => console.warn(`Браузърът не се отвори автоматично. Отворете ръчно ${url}`))
    child.unref(); console.log('Браузър: изпратена е една заявка към браузъра по подразбиране.')
  } catch { console.warn(`Браузърът не се отвори автоматично. Отворете ръчно ${url}`) }
}

let selectedPort
try { selectedPort = await listenOnAvailablePort() } catch (error) { console.error(`ГРЕШКА: Сървърът не стартира: ${error instanceof Error ? error.message : String(error)}`); process.exit(1) }
if (!selectedPort) { console.error('ГРЕШКА: Всички локални портове 4173–4180 са заети. Освободете локален порт и опитайте отново.'); process.exit(1) }

const url = `http://${HOST}:${selectedPort}/`
console.log('\nFacadeFlow Demo — ЛОКАЛНО ПРИЛОЖЕНИЕ')
console.log(`Адрес: ${HOST}\nПорт: ${selectedPort}\nURL: ${url}`)
console.log('Този терминал трябва да остане отворен. Ctrl+C или затваряне на терминала спира приложението.\n')
console.log(`FACADEFLOW_READY ${JSON.stringify({ host: HOST, port: selectedPort, url })}`)
if (!NO_OPEN) openBrowser(url)

let stopping = false
function stop(signal) {
  if (stopping) return
  stopping = true; console.log(`\nПолучен ${signal}. FacadeFlow Demo се спира…`)
  server.close(() => { console.log('Локалният сървър е спрян.'); process.exit(0) })
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGINT', () => stop('Ctrl+C'))
process.on('SIGTERM', () => stop('SIGTERM'))
process.on('message', (message) => { if (message && typeof message === 'object' && message.type === 'shutdown') stop('parent IPC') })
