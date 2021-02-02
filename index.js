#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

let changed = 0
let proc = null
let runs = 0
let dir = process.cwd()

if (!process.argv[2]) {
  console.error('Usage: macmon <command> ...args')
  process.exit(1)
}

for (const arg of process.argv.slice(2)) {
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

run()
fs.watch(dir, { recursive: true }, function () {
  changed++
  run()
})

function run () {
  if (proc) return proc.kill('SIGINT')
  runs++
  const prefix = '[macmon #' + runs.toString().padStart(4, '0') + ']'
  const change = changed
  console.error(prefix, 'spawning ' + process.argv.slice(2).join(' '))
  proc = spawn(process.argv[2], process.argv.slice(3), {
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
