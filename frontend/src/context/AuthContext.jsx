import { createContext, useContext, useState } from 'react'
import { api } from '../api/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState({
    access:  localStorage.getItem('access'),
    refresh: localStorage.getItem('refresh'),
  })

  function login(access, refresh) {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    setTokens({ access, refresh })
  }

  async function logout() {
    const refresh = localStorage.getItem('refresh')
    if (refresh) {
      await api.post('/api/logout/', { refresh }).catch(() => {})
    }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setTokens({ access: null, refresh: null })
  }

  const isAuthenticated = !!tokens.access

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// convenience hook
export function useAuth() {
  return useContext(AuthContext)
}
