import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ email: '', first_name: '', last_name: '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileMsg, setProfileMsg] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  // Load profile on mount
  useEffect(() => {
    api.get('/api/user/me/')
      .then(data => {
        setProfile(data)
        setProfileForm({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
        })
      })
      .catch(() => {})
  }, [])

  function handleProfileChange(e) {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setProfileErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    setProfileMsg('')
  }

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileErrors({})
    setProfileMsg('')
    setProfileLoading(true)
    try {
      const updated = await api.patch('/api/user/me/', profileForm)
      setProfile(updated)
      setProfileMsg('Profile updated successfully.')
    } catch (err) {
      setProfileErrors(typeof err === 'object' ? err : { non_field_errors: ['Update failed.'] })
    } finally {
      setProfileLoading(false)
    }
  }

  function handlePwChange(e) {
    setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setPwErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    setPwMsg('')
  }

  async function handlePwSubmit(e) {
    e.preventDefault()
    setPwErrors({})
    setPwMsg('')
    setPwLoading(true)
    try {
      await api.post('/api/user/change-password/', pwForm)
      setPwMsg('Password changed successfully.')
      setPwForm({ old_password: '', new_password: '' })
    } catch (err) {
      setPwErrors(typeof err === 'object' ? err : { non_field_errors: ['Failed to change password.'] })
    } finally {
      setPwLoading(false)
    }
  }

  function fieldError(errors, key) {
    const val = errors[key]
    if (!val) return null
    const msg = Array.isArray(val) ? val.join(' ') : val
    return <span className="text-error text-label-sm mt-1">{msg}</span>
  }

  if (!profile) {
    return (
      <div className="w-full pt-32 pb-20 bg-surface min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-tertiary">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary-container">sync</span>
          <span className="font-label-lg">Loading Profile...</span>
        </div>
      </div>
    )
  }

  const initials = `${(profile.first_name?.[0] || profile.username?.[0] || 'K')}${(profile.last_name?.[0] || '')}`.toUpperCase()

  return (
    <div className="w-full pt-28 bg-surface min-h-[calc(100vh-80px)]">
      <div className="flex flex-col w-full">
        <div className="max-w-4xl mx-auto w-full px-gutter pb-space-xl flex flex-col gap-space-lg">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-tertiary-container">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-tertiary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dashboard</span>
            </Link>
            <span className="text-surface-dim">/</span>
            <span className="font-label-lg text-label-lg text-tertiary font-semibold">
              Profile &amp; Security
            </span>
          </div>

          {/* Profile Overview Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/60 text-tertiary font-bold font-headline-lg flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <div className="flex flex-col">
                <h1 className="font-headline-lg text-headline-lg text-tertiary font-bold">
                  {profile.first_name || profile.username} {profile.last_name || ''}
                </h1>
                <p className="font-body-md text-body-md text-tertiary-container flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                  <span>@{profile.username}</span>
                  <span>•</span>
                  <span>Member since {new Date(profile.date_joined).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm border border-surface-variant/40">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Kanso Workspace Pro</span>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            
            {/* Edit Personal Information Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    person
                  </span>
                  Personal Details
                </span>
              </div>

              {profileErrors.non_field_errors && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm">
                  {profileErrors.non_field_errors.join(' ')}
                </div>
              )}
              {profileMsg && (
                <div className="p-3 bg-secondary-container/40 text-on-secondary-fixed rounded-xl text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    First Name
                  </label>
                  <input
                    name="first_name"
                    value={profileForm.first_name}
                    onChange={handleProfileChange}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-tertiary rounded-xl border border-surface-variant/60 focus:bg-surface-container-lowest focus:border-tertiary focus:outline-none"
                    placeholder="Alex"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    value={profileForm.last_name}
                    onChange={handleProfileChange}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-tertiary rounded-xl border border-surface-variant/60 focus:bg-surface-container-lowest focus:border-tertiary focus:outline-none"
                    placeholder="Rivera"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-tertiary rounded-xl border border-surface-variant/60 focus:bg-surface-container-lowest focus:border-tertiary focus:outline-none"
                    placeholder="alex@studio.design"
                  />
                  {fieldError(profileErrors, 'email')}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary shadow-sm transition-all"
                  >
                    <span>{profileLoading ? 'Updating...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    lock
                  </span>
                  Security &amp; Password
                </span>
              </div>

              {pwErrors.non_field_errors && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm">
                  {pwErrors.non_field_errors.join(' ')}
                </div>
              )}
              {pwMsg && (
                <div className="p-3 bg-secondary-container/40 text-on-secondary-fixed rounded-xl text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{pwMsg}</span>
                </div>
              )}

              <form onSubmit={handlePwSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    Current Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="old_password"
                      type={showOldPw ? 'text' : 'password'}
                      value={pwForm.old_password}
                      onChange={handlePwChange}
                      required
                      className="w-full h-11 pl-3.5 pr-10 bg-surface-container-low text-tertiary rounded-xl border border-surface-variant/60 focus:bg-surface-container-lowest focus:border-tertiary focus:outline-none"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPw(!showOldPw)}
                      className="absolute right-3 text-tertiary-container hover:text-tertiary"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showOldPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {fieldError(pwErrors, 'old_password')}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="new_password"
                      type={showNewPw ? 'text' : 'password'}
                      value={pwForm.new_password}
                      onChange={handlePwChange}
                      required
                      className="w-full h-11 pl-3.5 pr-10 bg-surface-container-low text-tertiary rounded-xl border border-surface-variant/60 focus:bg-surface-container-lowest focus:border-tertiary focus:outline-none"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 text-tertiary-container hover:text-tertiary"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {fieldError(pwErrors, 'new_password')}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg hover:bg-secondary-container shadow-sm transition-all"
                  >
                    <span>{pwLoading ? 'Updating...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
