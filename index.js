#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')

let changed = 0
let proc = null
let runs = 0

if (!process.argv[2]) {
  console.error('Usage: macmon <command> ...args')
  process.exit(1)
}

run()

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

fs.watch('.', { recursive: true }, function () {
  changed++
  run()
})
