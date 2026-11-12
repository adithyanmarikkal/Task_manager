/* ------------------------------------------------------------------ *
 * api.js — central fetch wrapper                                       *
 * - Injects Bearer token from localStorage                             *
 * - On 401: attempts silent token refresh, retries once               *
 * - Throws the parsed JSON error body so callers can show messages     *
 * ------------------------------------------------------------------ */

const BASE = '' // vite proxy forwards /api → localhost:8000

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const token = localStorage.getItem('access')
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res = await fetch(BASE + path, { ...options, headers })

  // ── silent token refresh on 401 ──────────────────────────────────
  if (res.status === 401) {
    const refresh = localStorage.getItem('refresh')
    if (refresh) {
      const rr = await fetch(BASE + '/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (rr.ok) {
        const data = await rr.json()
        localStorage.setItem('access', data.access)
        headers['Authorization'] = `Bearer ${data.access}`
        res = await fetch(BASE + path, { ...options, headers })
      }
    }
  }

  if (res.status === 204) return null

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) throw payload   // caller catches and shows errors

  return payload
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}
