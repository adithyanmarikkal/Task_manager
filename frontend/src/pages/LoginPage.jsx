import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'
import KansoLogo from '../components/KansoLogo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setStatusMsg('Verifying workspace access...')

    try {
      const data = await api.post('/api/token/', form)
      setStatusMsg('Authentication approved. Loading workspace...')
      login(data.access, data.refresh)
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err) {
      setStatusMsg('')
      setError(err?.detail || 'Invalid username or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-gutter bg-surface selection:bg-secondary-container selection:text-on-secondary-fixed relative overflow-hidden">
      <div className="flex flex-col w-full items-center justify-center py-6 px-4">
        {/* Subtle Ambient Glow Element */}
        <div className="relative w-full max-w-md flex flex-col items-center">
          {/* Background Architectural Radial Warmth */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Main Authentication Sanctuary Card */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-8 sm:p-10 shadow-xl border border-surface-variant/40 transition-all duration-300">
            {/* Brand & Header Hierarchy */}
            <div className="flex flex-col items-center text-center">
              {/* Logo Display */}
              <div className="w-16 h-16 rounded-xl bg-surface-container-low p-2.5 flex items-center justify-center shadow-sm mb-5 transition-transform duration-300 hover:scale-105">
                <KansoLogo className="h-10 w-10 justify-center" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-tertiary font-label-sm text-label-sm uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                Kanso Task Suite
              </div>

              <h1 className="font-headline-lg text-headline-lg text-tertiary font-bold tracking-tight">
                Welcome to Kanso
              </h1>
              <p className="font-body-md text-body-md text-tertiary-container mt-1.5 max-w-xs">
                Clarity, architecture, and intentional focus
              </p>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setForm({ username: 'testuser', password: 'password123' })
                }}
                className="w-full h-11 bg-surface-container-low hover:bg-surface-container text-tertiary font-label-md text-label-md rounded-xl flex items-center justify-center gap-2.5 transition-colors duration-200 group active:scale-[0.99] border border-surface-variant/50"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">key</span>
                <span>Auto-fill Demo Credentials</span>
              </button>
            </div>

            {/* Deliberate Visual Partition */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-surface-container-high" />
              <span className="absolute bg-surface-container-lowest px-3 font-label-sm text-label-sm uppercase tracking-widest text-tertiary-container/70">
                or sign in below
              </span>
            </div>

            {/* Credential Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-tertiary font-medium flex items-center justify-between" htmlFor="username">
                  <span>Username</span>
                  <span className="font-body-sm text-body-sm text-tertiary-container/80">Personal account</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-tertiary-container pointer-events-none select-none text-[20px]">
                    alternate_email
                  </span>
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/80 shadow-sm outline-none transition-all placeholder:text-tertiary-container/50 focus:border-tertiary focus:bg-surface focus:shadow-md"
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-tertiary font-medium" htmlFor="password">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); alert('Please ask your system administrator or register a new account.'); }}
                    className="font-label-sm text-label-sm text-tertiary hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-tertiary-container pointer-events-none select-none text-[20px]">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/80 shadow-sm outline-none transition-all placeholder:text-tertiary-container/50 focus:border-tertiary focus:bg-surface focus:shadow-md"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 text-tertiary-container hover:text-tertiary p-1 rounded-md transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Session Preferences */}
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-tertiary accent-tertiary cursor-pointer focus:ring-0"
                  />
                  <span className="font-body-sm text-body-sm text-tertiary">
                    Trust this device for 30 days
                  </span>
                </label>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="p-3 bg-error-container/80 text-on-error-container rounded-xl flex items-center gap-2.5 text-body-sm">
                  <span className="material-symbols-outlined text-error text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Status Feedback Banner */}
              {statusMsg && !error && (
                <div className="p-3 bg-surface-container rounded-xl flex items-center gap-2.5 transition-all">
                  <span className="material-symbols-outlined text-primary-container text-[18px] animate-spin">
                    sync
                  </span>
                  <span className="font-body-sm text-body-sm text-tertiary">
                    {statusMsg}
                  </span>
                </div>
              )}

              {/* Primary Call to Action (Strict 10% Lacquer Red) */}
              <div className="pt-2">
                <button
                  id="submitBtn"
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 bg-primary-container text-on-error font-label-lg text-label-lg rounded-full shadow-md hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                    loading ? 'opacity-80 pointer-events-none' : ''
                  }`}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Quick Switch / Register Prompt */}
            <div className="mt-6 pt-4 text-center bg-surface-container-low rounded-xl py-3 px-4 flex items-center justify-center gap-1.5 border border-surface-variant/40">
              <span className="font-body-sm text-body-sm text-tertiary-container">
                New to Kanso?
              </span>
              <Link
                to="/register"
                className="font-label-sm text-label-sm text-tertiary font-semibold hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* Security & Institutional Governance Footer */}
          <div className="mt-8 text-center flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 font-body-sm text-body-sm text-tertiary-container">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                verified_user
              </span>
              <span>Protected with enterprise encryption</span>
            </div>
            <div className="flex items-center gap-3 font-label-sm text-label-sm text-tertiary-container/80">
              <span className="hover:text-tertiary transition-colors cursor-pointer">Terms of Service</span>
              <span>·</span>
              <span className="hover:text-tertiary transition-colors cursor-pointer">Privacy Protocol</span>
              <span>·</span>
              <span className="hover:text-tertiary transition-colors cursor-pointer">System Status 99.98%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
