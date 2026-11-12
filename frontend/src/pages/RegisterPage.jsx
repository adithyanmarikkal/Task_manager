import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import KansoLogo from '../components/KansoLogo'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/api/register/', form)
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setErrors(typeof err === 'object' ? err : { non_field_errors: ['Registration failed.'] })
    } finally {
      setLoading(false)
    }
  }

  function fieldError(key) {
    const val = errors[key]
    if (!val) return null
    const msg = Array.isArray(val) ? val.join(' ') : val
    return <span className="text-error text-label-sm mt-1">{msg}</span>
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-gutter bg-surface selection:bg-secondary-container selection:text-on-secondary-fixed relative overflow-hidden">
      <div className="flex flex-col w-full items-center justify-center py-6 px-4">
        {/* Ambient Glow */}
        <div className="relative w-full max-w-md flex flex-col items-center">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Main Sanctuary Card */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-8 sm:p-10 shadow-xl border border-surface-variant/40 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-surface-container-low p-2.5 flex items-center justify-center shadow-sm mb-5 transition-transform duration-300 hover:scale-105">
                <KansoLogo className="h-10 w-10 justify-center" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-tertiary font-label-sm text-label-sm uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Join Kanso Suite
              </div>

              <h1 className="font-headline-lg text-headline-lg text-tertiary font-bold tracking-tight">
                Create Account
              </h1>
              <p className="font-body-md text-body-md text-tertiary-container mt-1.5 max-w-xs">
                Streamlined productivity with intentional architecture
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4 mt-6" onSubmit={handleSubmit}>
              {errors.non_field_errors && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errors.non_field_errors.join(' ')}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-secondary-container/40 text-on-secondary-fixed rounded-xl flex items-center gap-2 text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-tertiary font-medium" htmlFor="reg-username">
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-tertiary-container pointer-events-none select-none text-[20px]">
                    person
                  </span>
                  <input
                    id="reg-username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/80 shadow-sm outline-none transition-all placeholder:text-tertiary-container/50 focus:border-tertiary focus:bg-surface focus:shadow-md"
                    placeholder="Choose a username"
                    required
                    autoFocus
                  />
                </div>
                {fieldError('username')}
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-tertiary font-medium" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-tertiary-container pointer-events-none select-none text-[20px]">
                    alternate_email
                  </span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/80 shadow-sm outline-none transition-all placeholder:text-tertiary-container/50 focus:border-tertiary focus:bg-surface focus:shadow-md"
                    placeholder="name@example.com"
                    required
                  />
                </div>
                {fieldError('email')}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-tertiary font-medium" htmlFor="reg-password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-tertiary-container pointer-events-none select-none text-[20px]">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/80 shadow-sm outline-none transition-all placeholder:text-tertiary-container/50 focus:border-tertiary focus:bg-surface focus:shadow-md"
                    placeholder="Minimum 8 characters"
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
                {fieldError('password')}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 bg-primary-container text-on-error font-label-lg text-label-lg rounded-full shadow-md hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                    loading ? 'opacity-80 pointer-events-none' : ''
                  }`}
                >
                  <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Back to Login Prompt */}
            <div className="mt-6 pt-4 text-center bg-surface-container-low rounded-xl py-3 px-4 flex items-center justify-center gap-1.5 border border-surface-variant/40">
              <span className="font-body-sm text-body-sm text-tertiary-container">
                Already have an account?
              </span>
              <Link
                to="/login"
                className="font-label-sm text-label-sm text-tertiary font-semibold hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
