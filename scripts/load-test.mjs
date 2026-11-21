// Lightweight load test against a running dev server.
// Usage: node scripts/load-test.mjs [baseUrl] [requests] [concurrency]
const base = process.argv[2] || 'http://localhost:3200'
const total = Number(process.argv[3] || 200)
const concurrency = Number(process.argv[4] || 20)

function percentile(values, p) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
}

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function login(email, password) {
  // Node fetch drops Set-Cookie on Auth.js' 302; use curl for the login only.
  const jar = join(tmpdir(), `peoplehr-load-${process.pid}.txt`)
  const csrfJson = execFileSync('curl.exe', ['-s', '-c', jar, `${base}/api/auth/csrf`], { encoding: 'utf8' })
  const { csrfToken } = JSON.parse(csrfJson)
  const body = `csrfToken=${encodeURIComponent(csrfToken)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&callbackUrl=${encodeURIComponent(`${base}/dashboard`)}&json=true`
  const bodyFile = join(tmpdir(), `peoplehr-load-body-${process.pid}.txt`)
  writeFileSync(bodyFile, body)
  execFileSync('curl.exe', ['-s', '-b', jar, '-c', jar, '-o', 'NUL', '-X', 'POST',
    `${base}/api/auth/callback/credentials`, '--data', `@${bodyFile}`])

  const lines = readFileSync(jar, 'utf8').split(/\r?\n/)
  const row = lines.find((l) => l.includes('session-token'))
  if (!row) throw new Error('Login failed — no session cookie')
  const parts = row.split('\t')
  const cookie = `authjs.session-token=${parts[parts.length - 1]}`
  const check = JSON.parse(execFileSync('curl.exe', ['-s', '-b', jar, `${base}/api/auth/session`], { encoding: 'utf8' }))
  console.error(`[load] session: ${check?.user?.role || 'anonymous'}`)
  return cookie
}

const cookie = await login('asef.ahmed@northwind.co', 'demo1234')
if (!cookie) throw new Error('Login failed — cannot load test')

const endpoints = [
  '/api/store/employees',
  '/api/store/leave',
  '/api/store/analytics',
  '/api/store/organization',
  '/api/notifications',
  '/api/activity?limit=20',
  '/api/jobs',
  '/dashboard',
]

const latencies = []
const statuses = {}
const errors = []
let completed = 0
let next = 0

async function worker() {
  while (next < total) {
    const i = next++
    const url = base + endpoints[i % endpoints.length]
    const start = performance.now()
    try {
      const res = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' })
      await res.arrayBuffer()
      latencies.push(performance.now() - start)
      statuses[res.status] = (statuses[res.status] || 0) + 1
      if (res.status >= 500) errors.push(`${url} -> ${res.status}`)
    } catch (e) {
      errors.push(`${url} -> ${e.message}`)
    }
    completed++
  }
}

const wallStart = performance.now()
await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()))
const wall = performance.now() - wallStart

console.log(JSON.stringify({
  total,
  concurrency,
  completed,
  wallMs: Math.round(wall),
  requestsPerSecond: Math.round((completed / wall) * 1000),
  latencyMs: {
    p50: Math.round(percentile(latencies, 0.5)),
    p95: Math.round(percentile(latencies, 0.95)),
    p99: Math.round(percentile(latencies, 0.99)),
    max: Math.round(Math.max(...latencies)),
  },
  statuses,
  errors: errors.slice(0, 10),
  errorCount: errors.length,
}, null, 2))

if (errors.length) process.exitCode = 1
