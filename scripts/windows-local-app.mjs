import { spawn } from 'node:child_process'
import { access, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'

const projectRoot = process.cwd()
const runtimeRoot = path.join(projectRoot, '.facadeflow-runtime')
const profileDirectory = path.join(runtimeRoot, `browser-${process.pid}-${Date.now()}`)
const serverScript = path.join(projectRoot, 'scripts', 'local-server.mjs')

const browserCandidates = [
  [process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'],
  [process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'],
  [process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe'],
  [process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'],
  [process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'],
  [process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'],
].filter(([root]) => Boolean(root)).map((parts) => path.join(...parts))

async function findBrowsers() {
  const found = []
  for (const candidate of browserCandidates) {
    try { await access(candidate); found.push(candidate) } catch { /* Continue through fixed known locations. */ }
  }
  return [...new Set(found)]
}

function waitForExit(child) {
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })))
}

async function startManagedBrowser(executables, browserArguments) {
  for (const executable of executables) {
    const child = spawn(executable, browserArguments, { stdio: 'ignore', windowsHide: false })
    browserChild = child
    try {
      await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject) })
      const exitPromise = waitForExit(child)
      const earlyExit = await Promise.race([exitPromise, new Promise((resolve) => setTimeout(() => resolve(null), 8000))])
      if (earlyExit) {
        console.warn(`Browser startup fallback: ${executable} priklyuchi s kod ${earlyExit.code ?? 'unknown'}.`)
        browserChild = null
        await rm(profileDirectory, { recursive: true, force: true }); await mkdir(profileDirectory, { recursive: true })
        continue
      }
      return { child, executable, exitPromise }
    } catch (error) { browserChild = null; console.warn(`Browser startup fallback: ${executable}: ${error instanceof Error ? error.message : String(error)}`) }
  }
  throw new Error('Nikoy poddarzhan browser ne startira v app mode.')
}

let serverChild = null
let browserChild = null
let cleaning = false

async function stopTrackedBrowser() {
  if (browserChild && browserChild.exitCode === null) {
    const exitPromise = waitForExit(browserChild)
    browserChild.kill()
    await Promise.race([exitPromise, new Promise((resolve) => setTimeout(resolve, 2000))])
  }
}

async function cleanup(exitCode = 0) {
  if (cleaning) return
  cleaning = true
  await stopTrackedBrowser()
  if (serverChild && serverChild.exitCode === null && serverChild.connected) serverChild.send({ type: 'shutdown' })
  if (serverChild && serverChild.exitCode === null) {
    await Promise.race([waitForExit(serverChild), new Promise((resolve) => setTimeout(resolve, 2500))])
    if (serverChild.exitCode === null) serverChild.kill()
  }
  try { await rm(runtimeRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) }
  catch (error) { console.warn(`Vnimanie: vremennata runtime papka ne mozha da bade izchistena: ${error instanceof Error ? error.message : String(error)}`) }
  process.exit(exitCode)
}

process.once('SIGINT', () => { void cleanup(0) })
process.once('SIGTERM', () => { void cleanup(0) })

const browserExecutables = await findBrowsers()
if (!browserExecutables.length) {
  console.error('GRESHKA: Ne e nameren Microsoft Edge ili Google Chrome v poznatite lokalni papki.')
  console.error('Izpolzvayte npm run local:serve za rachen browser rezhim.')
  process.exit(1)
}

await mkdir(profileDirectory, { recursive: true })
serverChild = spawn(process.execPath, [serverScript, '--no-open'], { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true })
serverChild.stderr.pipe(process.stderr)

const ready = await new Promise((resolve, reject) => {
  const lines = readline.createInterface({ input: serverChild.stdout })
  const timer = setTimeout(() => reject(new Error('Serverat ne potvrdi gotovnost navreme.')), 15000)
  lines.on('line', (line) => {
    console.log(line)
    if (!line.startsWith('FACADEFLOW_READY ')) return
    try { clearTimeout(timer); resolve(JSON.parse(line.slice('FACADEFLOW_READY '.length))) } catch { reject(new Error('Nevaliden readiness otgovor ot lokalniya server.')) }
  })
  serverChild.once('exit', (code) => reject(new Error(`Lokalniyat server priklyuchi predi start: ${code ?? 'unknown'}.`)))
  serverChild.once('error', reject)
}).catch(async (error) => { console.error(`GRESHKA: ${error.message}`); await cleanup(1) })

if (!ready?.url || !String(ready.url).startsWith('http://127.0.0.1:')) await cleanup(1)
const browserArguments = [`--app=${ready.url}`, `--user-data-dir=${profileDirectory}`, '--no-first-run', '--no-default-browser-check', '--disable-background-mode']
console.log(`Lokalno prilozhenie: ${ready.url}`)

try {
  const managedBrowser = await startManagedBrowser(browserExecutables, browserArguments)
  browserChild = managedBrowser.child
  console.log(`Managed browser: ${managedBrowser.executable}`)
  console.log(`Managed browser PID: ${browserChild.pid}`)
  const result = await managedBrowser.exitPromise
  if (result.code !== 0 && result.code !== null) throw new Error(`Browser processat priklyuchi s kod ${result.code}.`)
  console.log('App prozoretsat e zatvoren. Lokalniyat server se spira.')
  await cleanup(0)
} catch (error) {
  console.error(`GRESHKA: Browser prozoretsat ne startira: ${error instanceof Error ? error.message : String(error)}`)
  await cleanup(1)
}
