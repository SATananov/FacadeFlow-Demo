import path from 'node:path'
import fs from 'node:fs'

const sourcePath = process.argv[2]
const screenshotPath = process.argv[3]
const DWG_SECTION_PADDING_ASSERTION = 28
if (!sourcePath) throw new Error('Provide an ignored local DWG path.')
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const tabs = await (await fetch('http://127.0.0.1:9222/json')).json()
const tab = tabs.find((candidate) => candidate.type === 'page' && candidate.url.startsWith('http://127.0.0.1:'))
if (!tab) throw new Error('No headless browser page is available.')
const socket = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let sequence = 0
const pending = new Map()
socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id); pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result)
}
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value

await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'http://127.0.0.1:4173/' })
await sleep(800)
await evaluate(`[...document.querySelectorAll('button')].find((button) => button.textContent.includes('Импортирай проект'))?.click()`)
await sleep(300)
await evaluate(`[...document.querySelectorAll('button')].find((button) => button.textContent.includes('CAD чертеж'))?.click()`)
await sleep(300)
const documentNode = await send('DOM.getDocument', { depth: -1 })
const input = await send('DOM.querySelector', { nodeId: documentNode.root.nodeId, selector: '.dwg-workspace input[type=file]' })
if (!input.nodeId) throw new Error('DWG input was not found.')
await send('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [path.resolve(sourcePath)] })
for (let attempt = 0; attempt < 60; attempt += 1) { if (await evaluate(`Boolean(document.querySelector('.dwg-canvas-host canvas, .dwg-workspace .field-error'))`)) break; await sleep(500) }
const result = await evaluate(`(() => {
  const canvas = document.querySelector('.dwg-canvas-host canvas')
  const error = document.querySelector('.dwg-workspace .field-error')
  const layers = [...document.querySelectorAll('.dwg-layers input')]
  let variedSamples = 0, pixelHash = 2166136261
  if (canvas) {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    const reference = [pixels[0], pixels[1], pixels[2]]
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] !== reference[0] || pixels[index + 1] !== reference[1] || pixels[index + 2] !== reference[2]) variedSamples += 1
      if (index % 64 === 0) pixelHash = Math.imul(pixelHash ^ pixels[index] ^ (pixels[index + 1] << 8) ^ (pixels[index + 2] << 16), 16777619) >>> 0
    }
  }
  return {
    hasCanvas: Boolean(canvas), canvasWidth: canvas?.width, canvasHeight: canvas?.height, variedSamples, pixelHash,
    layerCount: layers.length,
    objectText: document.querySelector('.dwg-inspection-grid section:first-child')?.innerText ?? '',
    warnings: document.querySelector('.dwg-inspection-grid section:nth-child(2)')?.innerText ?? '',
    bounds: document.querySelector('.dwg-inspection-grid code')?.innerText ?? '',
    internalWarning: (document.querySelector('.dwg-internal-warning')?.innerText ?? '').includes('EXTERNAL DISTRIBUTION NOT APPROVED'),
    layoutStatus: document.querySelector('#dwg-layout-status')?.textContent ?? '',
    layoutOptions: [...document.querySelectorAll('.dwg-toolbar option')].map((option) => ({ text: option.textContent, disabled: option.disabled })),
    error: error?.textContent ?? null,
  }
})()`)
const canvasMetrics = () => evaluate(`(() => { const canvas = document.querySelector('.dwg-canvas-host canvas'); if (!canvas) return null; const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; let varied = 0, hash = 2166136261, minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1, highlightMinX = canvas.width, highlightMinY = canvas.height, highlightMaxX = -1, highlightMaxY = -1, highlightPixels = 0; const rows = new Set(), reference = [pixels[0], pixels[1], pixels[2]]; for (let index = 0; index < pixels.length; index += 4) { const changed = pixels[index] !== reference[0] || pixels[index + 1] !== reference[1] || pixels[index + 2] !== reference[2], pixel = index / 4, x = pixel % canvas.width, y = Math.floor(pixel / canvas.width); if (changed) { varied += 1; rows.add(y); minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } if (pixels[index] < 30 && pixels[index + 1] >= 120 && pixels[index + 1] <= 160 && pixels[index + 2] >= 120 && pixels[index + 2] <= 160) { highlightPixels += 1; highlightMinX = Math.min(highlightMinX, x); highlightMinY = Math.min(highlightMinY, y); highlightMaxX = Math.max(highlightMaxX, x); highlightMaxY = Math.max(highlightMaxY, y); } if (index % 64 === 0) hash = Math.imul(hash ^ pixels[index] ^ (pixels[index + 1] << 8) ^ (pixels[index + 2] << 16), 16777619) >>> 0; } const rowBands = [...rows].sort((a, b) => a - b).reduce((bands, row) => { const last = bands.at(-1); if (!last || row > last.max + 2) bands.push({ min: row, max: row }); else last.max = row; return bands }, []); const rect = canvas.getBoundingClientRect(); return { width: canvas.width, height: canvas.height, varied, hash, rowBands, contentBox: { minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 }, highlightBox: highlightPixels ? { minX: highlightMinX, minY: highlightMinY, maxX: highlightMaxX, maxY: highlightMaxY, pixels: highlightPixels } : null, background: [pixels[0], pixels[1], pixels[2]], rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } }; })()`)
const capture = async (target) => { const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }); fs.writeFileSync(path.resolve(target), Buffer.from(screenshot.data, 'base64')) }
const clickCanvasPixel = async (metrics, pixelX, pixelY) => { const x = metrics.rect.left + pixelX * metrics.rect.width / metrics.width, y = metrics.rect.top + pixelY * metrics.rect.height / metrics.height; await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }) }
const clickToolbar = (label) => evaluate(`[...document.querySelectorAll('.dwg-toolbar button')].find((button) => button.textContent.includes(${JSON.stringify(label)}))?.click()`)
await evaluate(`document.querySelector('.dwg-canvas-host')?.scrollIntoView({ block: 'center' })`); await sleep(150)
await clickToolbar('Покажи целия'); await sleep(150); const fitted = await canvasMetrics()
if (!fitted) throw new Error(`DWG canvas was not available: ${JSON.stringify(result)}`)
const sectionButtons = await evaluate(`[...document.querySelectorAll('.dwg-section-actions button')].filter((button) => button.textContent.startsWith('Секция')).length`)
const sectionBands = fitted.rowBands.filter((band) => band.max - band.min >= 8)
const screenshotBase = screenshotPath ? path.resolve(screenshotPath).replace(/\.png$/i, '') : ''
await clickCanvasPixel(fitted, fitted.contentBox.centerX, (sectionBands[0].min + sectionBands[0].max) / 2); await sleep(250); const focusedFirst = await canvasMetrics()
const firstSelected = await evaluate(`Boolean(document.querySelector('.dwg-section-status'))`)
if (!firstSelected) { const probeX = fitted.rect.left + fitted.contentBox.centerX * fitted.rect.width / fitted.width, probeY = fitted.rect.top + ((sectionBands[0].min + sectionBands[0].max) / 2) * fitted.rect.height / fitted.height, hitElement = await evaluate(`(() => { const element = document.elementFromPoint(${JSON.stringify(probeX)}, ${JSON.stringify(probeY)}); return element ? { tag: element.tagName, className: element.className } : null })()`); throw new Error(`Canvas section click did not select: ${JSON.stringify({ rect: fitted.rect, sectionBands, sectionButtons, hitElement })}`) }
await clickToolbar('Скрий текст'); await sleep(150); const focusedFirstTextHidden = await canvasMetrics(); await clickToolbar('Покажи текст'); await sleep(100)
const focusCenterX = focusedFirst.rect.left + focusedFirst.rect.width / 2, focusCenterY = focusedFirst.rect.top + focusedFirst.rect.height / 2
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: focusCenterX, y: focusCenterY, deltaX: 0, deltaY: -120 }); await sleep(150); const focusedFirstZoomed = await canvasMetrics()
await clickToolbar('Нулирай'); await sleep(150); const focusedFirstReset = await canvasMetrics()
if (screenshotBase) await capture(`${screenshotBase}-section-1.png`)
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(250); const escapeWhole = await canvasMetrics()
await clickCanvasPixel(escapeWhole, fitted.contentBox.centerX, (sectionBands[1].min + sectionBands[1].max) / 2); await sleep(250); const focusedSecond = await canvasMetrics()
const secondSelected = await evaluate(`Boolean(document.querySelector('.dwg-section-status'))`)
if (screenshotBase) await capture(`${screenshotBase}-section-2.png`)
await evaluate(`[...document.querySelectorAll('.dwg-section-actions button')].find((button) => button.textContent.includes('Назад към целия'))?.click()`); await sleep(250); const returnedWhole = await canvasMetrics()
const dragX = returnedWhole.rect.left + returnedWhole.rect.width / 2, dragY = returnedWhole.rect.top + returnedWhole.rect.height / 2
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dragX, y: dragY, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: dragX + 30, y: dragY + 20, button: 'left', buttons: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dragX + 30, y: dragY + 20, button: 'left', clickCount: 1 }); await sleep(150)
const dragDidNotSelect = await evaluate(`!document.querySelector('.dwg-section-status')`)
await clickToolbar('Покажи целия'); await sleep(150)
const centerX = fitted.rect.left + fitted.rect.width / 2, centerY = fitted.rect.top + fitted.rect.height / 2
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: centerX, y: centerY, deltaX: 0, deltaY: -120 }); await sleep(150); const zoomed = await canvasMetrics()
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: centerX, y: centerY, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: centerX + 45, y: centerY + 30, button: 'left', buttons: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: centerX + 45, y: centerY + 30, button: 'left', clickCount: 1 }); await sleep(150); const panned = await canvasMetrics()
await clickToolbar('Нулирай'); await sleep(150); const reset = await canvasMetrics()
await clickToolbar('Тъмен фон'); await sleep(150); const dark = await canvasMetrics(); await clickToolbar('Светъл фон'); await sleep(100)
await clickToolbar('Покажи целия'); await sleep(150); await clickToolbar('Скрий текст'); await sleep(150); const geometryOnly = await canvasMetrics(); await clickToolbar('Покажи текст'); await sleep(100)
const layerToggle = await evaluate(`(() => { const input = document.querySelector('.dwg-layers input'); if (!input) return false; const before = input.checked; input.click(); const changed = before !== input.checked; input.click(); return changed && before === input.checked; })()`)
const originalWidth = reset.width
await evaluate(`document.querySelector('.dwg-view-grid').style.gridTemplateColumns = '500px 250px'`); await sleep(250); const resized = await canvasMetrics(); await evaluate(`document.querySelector('.dwg-view-grid').style.gridTemplateColumns = ''`); await sleep(250)
const geometryCentered = Math.abs(geometryOnly.contentBox.centerX - geometryOnly.width / 2) < geometryOnly.width * 0.08 && Math.abs(geometryOnly.contentBox.centerY - geometryOnly.height / 2) < geometryOnly.height * 0.08
Object.assign(result, { fitVisible: fitted.varied > 0, fitAvoidsDenseTextField: fitted.varied < fitted.width * fitted.height * 0.25, geometryCentered, sectionButtons, detectedVisualBands: sectionBands.length, firstSelected, secondSelected, firstSectionFocused: Boolean(focusedFirst.highlightBox && focusedFirst.highlightBox.minX >= DWG_SECTION_PADDING_ASSERTION && focusedFirst.highlightBox.maxX <= focusedFirst.width - DWG_SECTION_PADDING_ASSERTION), secondSectionFocused: Boolean(focusedSecond.highlightBox && focusedSecond.highlightBox.minX >= DWG_SECTION_PADDING_ASSERTION && focusedSecond.highlightBox.maxX <= focusedSecond.width - DWG_SECTION_PADDING_ASSERTION), textVisibleAfterSectionFit: focusedFirst.hash !== focusedFirstTextHidden.hash, textToggleChanged: focusedFirst.hash !== focusedFirstTextHidden.hash, focusedWheelZoomChanged: focusedFirstZoomed.hash !== focusedFirst.hash, focusedResetRestoresFit: JSON.stringify(focusedFirstReset.highlightBox) === JSON.stringify(focusedFirst.highlightBox), escapeRestoresWhole: JSON.stringify(escapeWhole.contentBox) === JSON.stringify(fitted.contentBox), backRestoresWhole: JSON.stringify(returnedWhole.contentBox) === JSON.stringify(fitted.contentBox), dragDidNotSelect, zoomChanged: zoomed.hash !== fitted.hash, panChanged: panned.hash !== zoomed.hash, resetVisible: reset.varied > 0, resetRestoresFitBox: JSON.stringify(reset.contentBox) === JSON.stringify(fitted.contentBox), interactionBoxes: { fittedWithLod: fitted.contentBox, focusedFirst: focusedFirst.contentBox, focusedFirstHighlight: focusedFirst.highlightBox, focusedSecond: focusedSecond.contentBox, focusedSecondHighlight: focusedSecond.highlightBox, zoomed: zoomed.contentBox, panned: panned.contentBox, resetWithLod: reset.contentBox, geometryOnly: geometryOnly.contentBox }, layerToggle, darkChanged: dark.background.join(',') !== fitted.background.join(','), resizeChangedCanvas: resized.width !== originalWidth, resizeVisible: resized.varied > 0 })
await evaluate(`document.querySelector('.dwg-source-meta button')?.click()`); await sleep(150)
const cleared = await evaluate(`Boolean(document.querySelector('.dwg-workspace input[type=file]')) && !document.querySelector('.dwg-canvas-host canvas')`)
const reloadedDocument = await send('DOM.getDocument', { depth: -1 }), reloadedInput = await send('DOM.querySelector', { nodeId: reloadedDocument.root.nodeId, selector: '.dwg-workspace input[type=file]' })
if (reloadedInput.nodeId) await send('DOM.setFileInputFiles', { nodeId: reloadedInput.nodeId, files: [path.resolve(sourcePath)] })
for (let attempt = 0; attempt < 60; attempt += 1) { if (await evaluate(`Boolean(document.querySelector('.dwg-canvas-host canvas, .dwg-workspace .field-error'))`)) break; await sleep(500) }
const reloadMetrics = await canvasMetrics()
Object.assign(result, { clearSucceeded: cleared, reloadVisible: Boolean(reloadMetrics && reloadMetrics.varied > 0) })
console.log(JSON.stringify(result, null, 2))
if (screenshotPath) {
  await evaluate(`document.querySelector('.dwg-canvas-host')?.scrollIntoView({ block: 'center' })`)
  await sleep(200)
  await capture(screenshotPath)
}
socket.close()
