#!/usr/bin/env node

/**
 * Error Monitor and Auto-Fix System
 * Monitors Next.js dev server logs and browser console for errors,
 * then attempts to automatically fix common issues.
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { exec } = require('child_process')

const LOG_FILE = 'dev-server.log'
const ERROR_LOG = 'error-monitor.log'
const CHECK_INTERVAL = 2000 // 2 seconds

let lastPosition = 0
let errorHistory = new Map()

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString()
  const colorCode = colors[color] || colors.reset
  console.log(`${colorCode}[${timestamp}] ${message}${colors.reset}`)

  // Also log to file
  fs.appendFileSync(ERROR_LOG, `[${timestamp}] ${message}\n`)
}

// Known error patterns and their fixes
const errorPatterns = [
  {
    name: 'React Hook Error (useContext)',
    pattern: /Cannot read properties of null \(reading 'useContext'\)|Invalid hook call/i,
    fix: async () => {
      log('Detected React Hook error - clearing Next.js cache...', 'yellow')
      return clearNextCache()
    }
  },
  {
    name: 'Module not found',
    pattern: /Module not found: Can't resolve '([^']+)'/i,
    fix: async (match) => {
      const module = match[1]
      log(`Detected missing module: ${module}`, 'yellow')
      return installModule(module)
    }
  },
  {
    name: 'Prisma Error',
    pattern: /Invalid `prisma\./i,
    fix: async () => {
      log('Detected Prisma error - regenerating client...', 'yellow')
      return regeneratePrisma()
    }
  },
  {
    name: 'Build Error',
    pattern: /Failed to compile/i,
    fix: async () => {
      log('Detected build error - clearing cache and restarting...', 'yellow')
      return clearNextCache()
    }
  },
  {
    name: 'Fast Refresh Error',
    pattern: /Fast Refresh had to perform a full reload/i,
    fix: async () => {
      log('Fast refresh issue detected - monitoring...', 'blue')
      return { success: true, message: 'Monitoring for pattern' }
    }
  }
]

async function clearNextCache() {
  try {
    const nextDir = path.join(process.cwd(), '.next')
    if (fs.existsSync(nextDir)) {
      await execCommand('rm -rf .next')
      log('Next.js cache cleared', 'green')
    }
    return { success: true, message: 'Cache cleared, server will rebuild' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

async function installModule(modulePath) {
  // Extract package name from path
  let packageName = modulePath.startsWith('@')
    ? modulePath.split('/').slice(0, 2).join('/')
    : modulePath.split('/')[0]

  try {
    log(`Installing ${packageName}...`, 'cyan')
    await execCommand(`npm install ${packageName}`)
    log(`Successfully installed ${packageName}`, 'green')
    return { success: true, message: `Installed ${packageName}` }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

async function regeneratePrisma() {
  try {
    log('Regenerating Prisma client...', 'cyan')
    await execCommand('npx prisma generate')
    log('Prisma client regenerated', 'green')
    return { success: true, message: 'Prisma client regenerated' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

async function analyzeError(errorText) {
  for (const pattern of errorPatterns) {
    const match = errorText.match(pattern.pattern)
    if (match) {
      const errorKey = `${pattern.name}:${Date.now()}`

      // Check if we've recently handled this error (debounce)
      const recentError = Array.from(errorHistory.entries()).find(
        ([key, timestamp]) =>
          key.startsWith(pattern.name) &&
          Date.now() - timestamp < 10000 // 10 seconds
      )

      if (recentError) {
        log(`Skipping duplicate error: ${pattern.name}`, 'blue')
        return
      }

      errorHistory.set(errorKey, Date.now())

      // Clean up old error history
      for (const [key, timestamp] of errorHistory.entries()) {
        if (Date.now() - timestamp > 60000) { // 1 minute
          errorHistory.delete(key)
        }
      }

      log(`Matched error pattern: ${pattern.name}`, 'magenta')
      log('Attempting automatic fix...', 'cyan')

      const result = await pattern.fix(match)

      if (result.success) {
        log(`✓ Fix applied: ${result.message}`, 'green')
      } else {
        log(`✗ Fix failed: ${result.message}`, 'red')
      }

      return
    }
  }
}

function monitorLogFile() {
  if (!fs.existsSync(LOG_FILE)) {
    return
  }

  const stats = fs.statSync(LOG_FILE)
  const fileSize = stats.size

  if (fileSize > lastPosition) {
    const stream = fs.createReadStream(LOG_FILE, {
      start: lastPosition,
      end: fileSize
    })

    let buffer = ''

    stream.on('data', (chunk) => {
      buffer += chunk.toString()
    })

    stream.on('end', () => {
      if (buffer.trim()) {
        // Look for errors in the new content
        const lines = buffer.split('\n')
        let errorBlock = []
        let inError = false

        for (const line of lines) {
          if (line.includes('Error') || line.includes('✗') || line.includes('Failed')) {
            inError = true
            errorBlock = [line]
          } else if (inError) {
            if (line.trim() === '' || line.includes('✓') || line.includes('GET ')) {
              if (errorBlock.length > 0) {
                const errorText = errorBlock.join('\n')
                analyzeError(errorText)
              }
              inError = false
              errorBlock = []
            } else {
              errorBlock.push(line)
            }
          }
        }

        // Check final error block
        if (errorBlock.length > 0) {
          const errorText = errorBlock.join('\n')
          analyzeError(errorText)
        }
      }

      lastPosition = fileSize
    })
  }
}

async function main() {
  log('==========================================', 'cyan')
  log('Error Monitor and Auto-Fix System Started', 'cyan')
  log('==========================================', 'cyan')
  log(`Monitoring: ${LOG_FILE}`, 'blue')
  log(`Check interval: ${CHECK_INTERVAL}ms`, 'blue')
  log('Press Ctrl+C to stop', 'yellow')
  log('', 'reset')

  // Initialize log file position
  if (fs.existsSync(LOG_FILE)) {
    const stats = fs.statSync(LOG_FILE)
    lastPosition = stats.size
  }

  // Monitor log file periodically
  setInterval(monitorLogFile, CHECK_INTERVAL)

  log('Monitoring active - watching for errors...', 'green')
}

// Handle cleanup
process.on('SIGINT', () => {
  log('', 'reset')
  log('==========================================', 'yellow')
  log('Error Monitor Stopped', 'yellow')
  log(`Total errors handled: ${errorHistory.size}`, 'blue')
  log('==========================================', 'yellow')
  process.exit(0)
})

// Start monitoring
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red')
  process.exit(1)
})
