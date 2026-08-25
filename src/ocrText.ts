export function normalizeOcrText(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()
}
