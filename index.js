#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

let changed = 0
let proc = null
let runs = 0
let dir = process.cwd()
let watch = null
let start = 2
let clear = false

for (start; start < process.argv.length; start++) {
  const a = process.argv[start]
  if (a[0] !== '-') break

  if (a === '--clear' || a === '-c') {
    clear = true
    continue
  }

  let w = arg('--watch') || arg('-w')

  if (!w) {
    w = arg('-cw')
    if (w) clear = true
    else continue
  }

  if (!watch) watch = []
  watch.push(w)

  function arg (name) {
    if (a === name) return process.argv[++start]
    if (a.startsWith(name + '=')) return a.slice(name.length + 1)
    return null
  }
}

if (!process.argv[start]) {
  console.error('Usage: macmon [-c -w=./] <command> ...args')
  process.exit(1)
}

if (!watch) {
  for (const arg of process.argv.slice(start)) {
    if (!fs.existsSync(arg)) continue

    // check if we should watch a parent dir instead by checking if ../ or ../../ is an ancestor
    // to the file arg
    const filename = path.resolve(fs.realpathSync(arg))
    const changeTo = check(dir, filename, '.') || check(dir, filename, '..') || check(dir, filename, '../..')

    if (changeTo) {
      dir = changeTo
      break
    }
  }
}

run()
if (!watch) watch = [dir]
for (const w of watch) fs.watch(w, { recursive: true }, onchange)

function onchange () {
  changed++
  run()
}

function run () {
  if (proc) return proc.kill('SIGINT')
  runs++
  const prefix = '[macmon #' + runs.toString().padStart(4, '0') + ']'
  const change = changed
  if (clear) clearScreen()
  console.error(prefix, 'spawning ' + process.argv.slice(start).join(' '))
  proc = spawn(process.argv[start], process.argv.slice(start + 1), {
    stdio: 'inherit'
  })
  proc.on('exit', (code) => {
    console.error(prefix, 'process exited with ' + code)
    proc = null
    if (changed !== change) return run()
  })
}

function check (dir, file, change) {
  const changed = path.join(dir, change)
  const rel = path.relative(changed, file)
  return rel.includes('../') ? false : changed
}

function clearScreen () {
  process.stdout.moveCursor(-1000, -1000)
  process.stdout.clearScreenDown()
}
