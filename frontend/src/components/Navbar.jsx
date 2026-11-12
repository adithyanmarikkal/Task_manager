import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import KansoLogo from './KansoLogo'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  // If we are on login or register page and unauthenticated, don't show the header for a distraction-free experience
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  if (!isAuthenticated && isAuthPage) {
    return null
  }

  const isCurrent = (path) => {
    if (path === '/tasks') {
      return location.pathname.startsWith('/tasks')
    }
    return location.pathname === path
  }

  return (
    <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none px-gutter">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand / Logo */}
        <Link to="/dashboard" className="flex items-center gap-space-sm group">
          <KansoLogo />
        </Link>

        {/* Floating Centered Pill Navigation */}
        {isAuthenticated ? (
          <nav className="w-full max-w-md mx-4 bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-variant rounded-full p-1.5 shadow-[0_12px_28px_-6px_rgba(38,59,79,0.08),0_4px_12px_-2px_rgba(38,59,79,0.04)] flex items-center justify-between">
            <Link
              to="/dashboard"
              className={`flex-1 text-center py-2 px-space-sm rounded-full font-label-lg text-label-lg transition-all ${
                isCurrent('/dashboard')
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/tasks"
              className={`flex-1 text-center py-2 px-space-sm rounded-full font-label-lg text-label-lg transition-all ${
                isCurrent('/tasks')
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Tasks
            </Link>
            <Link
              to="/profile"
              className={`flex-1 text-center py-2 px-space-sm rounded-full font-label-lg text-label-lg transition-all ${
                isCurrent('/profile')
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Profile
            </Link>
          </nav>
        ) : (
          <nav className="w-full max-w-xs mx-4 bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-variant rounded-full p-1.5 shadow-sm flex items-center justify-around">
            <Link
              to="/login"
              className={`flex-1 text-center py-1.5 px-space-sm rounded-full font-label-lg text-label-lg transition-all ${
                location.pathname === '/login'
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className={`flex-1 text-center py-1.5 px-space-sm rounded-full font-label-lg text-label-lg transition-all ${
                location.pathname === '/register'
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Register
            </Link>
          </nav>
        )}

        {/* Right CTA / User Profile Menu */}
        <div className="flex items-center justify-end gap-space-md">
          {isAuthenticated ? (
            <>
              <Link
                to="/tasks/new"
                className="hidden md:inline-flex items-center justify-center gap-1.5 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full py-2 px-5 shadow-[0_2px_10px_-2px_rgba(82,65,52,0.04)] hover:bg-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New Task</span>
              </Link>

              {/* Profile Avatar / Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-full ring-2 ring-surface-variant flex items-center justify-center bg-secondary-fixed text-on-secondary-fixed font-semibold hover:ring-tertiary transition-all focus:outline-none"
                  aria-label="User menu"
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant/70 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-tertiary hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                      Profile Settings
                    </Link>
                    <Link
                      to="/tasks"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-tertiary hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">checklist</span>
                      All Tasks
                    </Link>
                    <div className="h-px bg-surface-container-high my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-label-md text-error hover:bg-error-container/40 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full py-2 px-space-lg shadow-sm hover:bg-primary transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
