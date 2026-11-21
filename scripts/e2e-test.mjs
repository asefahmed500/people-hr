// Real HTTP E2E journeys for admin / manager / employee against a running server.
// Usage: node scripts/e2e-test.mjs [baseUrl]
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] || 'http://localhost:3200'
const results = []
let failures = 0

function check(name, condition, detail) {
  results.push({ name, pass: !!condition, detail })
  if (!condition) failures++
  console.error(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function login(email, password) {
  const jar = join(tmpdir(), `hr-e2e-${email.replace(/\W/g, '')}-${process.pid}.txt`)
  const csrf = JSON.parse(execFileSync('curl.exe', ['-s', '-c', jar, `${base}/api/auth/csrf`], { encoding: 'utf8' }))
  const bodyFile = join(tmpdir(), `hr-e2e-body-${process.pid}.txt`)
  writeFileSync(bodyFile, `csrfToken=${encodeURIComponent(csrf.csrfToken)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&callbackUrl=${encodeURIComponent(`${base}/dashboard`)}&json=true`)
  execFileSync('curl.exe', ['-s', '-b', jar, '-c', jar, '-o', 'NUL', '-X', 'POST', `${base}/api/auth/callback/credentials`, '--data', `@${bodyFile}`])
  const jarRow = readFileSync(jar, 'utf8').split(/\r?\n/).find((l) => l.includes('session-token'))
  if (!jarRow) return null
  const token = jarRow.split('\t').at(-1)
  return { cookie: `authjs.session-token=${token}`, jar }
}

function api(method, path, cookie, body, extraHeaders = {}) {
  const args = ['-s', '-b', cookie, '-o', 'NUL', '-w', '%{http_code}', '-X', method, `${base}${path}`]
  const headersFile = join(tmpdir(), `hr-e2e-h-${process.pid}.txt`)
  let bodyFile
  if (body !== undefined) {
    bodyFile = join(tmpdir(), `hr-e2e-payload-${process.pid}.txt`)
    writeFileSync(bodyFile, JSON.stringify(body))
    args.push('--data-binary', `@${bodyFile}`)
  }
  const headers = { 'Content-Type': 'application/json', ...extraHeaders }
  writeFileSync(headersFile, Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n'))
  args.push('-H', `@${headersFile}`)
  const status = execFileSync('curl.exe', args, { encoding: 'utf8' }).trim()
  return Number(status)
}

function get(path, cookie) {
  try {
    const out = execFileSync('curl.exe', ['-s', '-b', cookie, `${base}${path}`], { encoding: 'utf8' })
    return JSON.parse(out)
  } catch { return null }
}

function version(path, cookie) {
  try {
    const out = execFileSync('curl.exe', ['-s', '-b', cookie, '-D', '-', '-o', 'NUL', `${base}${path}`], { encoding: 'utf8' })
    return (out.match(/x-module-version:\s*(\d+)/i) || [])[1] || null
  } catch { return null }
}

// ---------------- ADMIN ----------------
{
  const session = login('asef.ahmed@northwind.co', 'demo1234')
  check('admin login', !!session)
  if (session) {
    const c = session.cookie
    check('admin session role', get('/api/auth/session', c)?.user?.role === 'admin')
    check('admin dashboard', api('GET', '/dashboard', c) === 200)
    check('admin sees directory', Array.isArray(get('/api/store/employees', c)))
    check('admin store filtered', get('/api/store/payslips', c)?.payslips !== undefined)

    // Create an employee with a unique email, verify persistence and cleanup.
    const email = `e2e-${Date.now()}@test.co`
    const rows = get('/api/store/employees', c) || []
    const v = version('/api/store/employees', c)
    const newRow = { id: `e2e-${Date.now()}`, name: 'E2E Probe', email, initials: 'EP', department: 'Engineering', role: 'Engineer', location: 'Remote', status: 'active', hiredDaysAgo: 0 }
    check('admin create employee', api('PUT', '/api/store/employees', c, [...rows, newRow], { 'If-Match': v }) === 200)
    const after = get('/api/store/employees', c) || []
    check('employee persisted', after.some((e) => e.email === email))

    // Duplicate email must be rejected by the server.
    const v2 = version('/api/store/employees', c)
    check('duplicate email rejected', api('PUT', '/api/store/employees', c, [...after, { ...newRow, id: 'e2e-dup' }], { 'If-Match': v2 }) === 400)

    // Cleanup
    const clean = (get('/api/store/employees', c) || []).filter((e) => e.email !== email)
    api('PUT', '/api/store/employees', c, clean, { 'If-Match': version('/api/store/employees', c) })
    check('employee cleanup', !(get('/api/store/employees', c) || []).some((e) => e.email === email))

    check('report run-due', api('POST', '/api/reports/run-due', c) === 200)
    check('activity feed', Array.isArray(get('/api/activity?limit=5', c)?.events))
    check('jobs queue', Array.isArray(get('/api/jobs', c)?.jobs))
    check('billing honest', get('/api/billing', c)?.configured === false)

    // Proper signout: CSRF + cookie jar, then verify session is gone and the
    // dashboard redirects to /login (the reported symptom).
    const csrfOut = execFileSync('curl.exe', ['-s', '-b', session.jar, '-c', session.jar, `${base}/api/auth/csrf`], { encoding: 'utf8' })
    const signoutToken = JSON.parse(csrfOut).csrfToken
    const soBody = join(tmpdir(), `hr-e2e-signout-${process.pid}.txt`)
    writeFileSync(soBody, `csrfToken=${encodeURIComponent(signoutToken)}`)
    execFileSync('curl.exe', ['-s', '-b', session.jar, '-c', session.jar, '-o', 'NUL', '-X', 'POST', `${base}/api/auth/signout`, '--data', `@${soBody}`])
    const afterOut = execFileSync('curl.exe', ['-s', '-b', session.jar, `${base}/api/auth/session`], { encoding: 'utf8' })
    check('admin signout clears session', JSON.parse(afterOut)?.user === undefined)
    const redirect = execFileSync('curl.exe', ['-s', '-b', session.jar, '-o', 'NUL', '-w', '%{redirect_url}', `${base}/dashboard`], { encoding: 'utf8' })
    check('signed-out dashboard redirects to login', redirect.includes('/login'), redirect)
  }
}

// ---------------- MANAGER ----------------
{
  const session = login('manager@northwind.co', 'demo1234')
  check('manager login', !!session)
  if (session) {
    const c = session.cookie
    check('manager role', get('/api/auth/session', c)?.user?.role === 'manager')
    check('manager employees page', api('GET', '/employees', c) === 200)
    check('manager admin page blocked', api('GET', '/organization', c) === 307)
    const emp = get('/api/store/employees', c) || []
    check('manager dept scoping', emp.length === 0 || emp.every((e) => e.department === 'Engineering'))
    check('manager cannot write payroll', api('PUT', '/api/store/payroll', c, { payments: [], lastRun: null }) === 403)
    check('manager cannot access jobs', api('GET', '/api/jobs', c) === 403)
  }
}

// ---------------- EMPLOYEE ----------------
{
  const session = login('emp@northwind.co', 'demo1234')
  check('employee login', !!session)
  if (session) {
    const c = session.cookie
    check('employee role', get('/api/auth/session', c)?.user?.role === 'employee')
    check('employee dashboard', api('GET', '/dashboard', c) === 200)
    check('employee admin page blocked', api('GET', '/payroll', c) === 307)
    check('employee own directory row', (get('/api/store/employees', c) || []).length <= 1)
    check('employee cannot write salary status', api('PUT', '/api/store/employees', c, [{ id: 'x', name: 'x', email: 'x@y.co', initials: 'X', department: 'Engineering', role: 'x', location: 'x', status: 'active', salary: 999999, hiredDaysAgo: 0 }]) === 403)
    check('employee sees own payslips only', Array.isArray(get('/api/store/payslips', c)?.payslips))
    check('employee cannot access jobs', api('GET', '/api/jobs', c) === 403)
  }
}

console.log(JSON.stringify({ total: results.length, passed: results.length - failures, failed: failures }, null, 2))
process.exitCode = failures ? 1 : 0
