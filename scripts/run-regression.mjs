import { existsSync, readdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const testsDir = join(repoRoot, 'tests')
const runtimeRoot = join(repoRoot, '.facadeflow-runtime', 'regression')
const viteBin = join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js')

const testFiles = readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.ts'))
  .sort((a, b) => a.localeCompare(b))

if (testFiles.length === 0) {
  console.error('No tests/*.test.ts files found.')
  process.exit(1)
}

if (!existsSync(viteBin)) {
  console.error('Vite is not installed. Run npm ci before npm run test:regression.')
  process.exit(1)
}

rmSync(runtimeRoot, { recursive: true, force: true })

console.log(`FacadeFlow full regression: ${testFiles.length} test files`)
console.log('Each test file is bundled and executed in isolation.')

for (const [index, name] of testFiles.entries()) {
  const sourceFile = join(testsDir, name)
  const testBase = basename(name, '.ts')
  const outDir = join(runtimeRoot, testBase)
  const outputFile = join(outDir, `${testBase}.js`)

  console.log(`\n[${index + 1}/${testFiles.length}] ${name}`)

  const build = spawnSync(
    process.execPath,
    [viteBin, 'build', '--ssr', sourceFile, '--outDir', outDir, '--emptyOutDir'],
    { cwd: repoRoot, stdio: 'inherit' },
  )

  if (build.error) {
    console.error(build.error)
    process.exit(1)
  }
  if (build.status !== 0) process.exit(build.status ?? 1)

  const test = spawnSync(process.execPath, ['--test', outputFile], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (test.error) {
    console.error(test.error)
    process.exit(1)
  }
  if (test.status !== 0) process.exit(test.status ?? 1)
}

console.log(`\nFacadeFlow full regression PASS: ${testFiles.length}/${testFiles.length} files.`)
