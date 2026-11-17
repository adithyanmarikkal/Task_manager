import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api/api'

const EMPTY = {
  title: '',
  topic: '',
  description: '',
  completeby: '',
}

export default function TaskFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [topics, setTopics] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  // Pre-fill form in edit mode
  useEffect(() => {
    // Load existing distinct topics for autocomplete
    api.get('/api/tasks/topics/')
      .then(d => {
        if (d.topics && d.topics.length > 0) setTopics(d.topics)
      })
      .catch(() => {})

    if (!isEdit) return
    api.get(`/api/tasks/${id}/`)
      .then(task => {
        setForm({
          title: task.title,
          topic: task.topic,
          description: task.description,
          completeby: task.completeby ? task.completeby.slice(0, 16) : '',
        })
        setFetching(false)
      })
      .catch(() => {
        alert('Task not found.')
        navigate('/tasks')
      })
  }, [id, isEdit, navigate])

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const submitBtn = document.getElementById('task-submit-btn')
        if (submitBtn) submitBtn.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  function setPresetDate(daysAhead) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    d.setHours(17, 0, 0, 0)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    setForm(prev => ({ ...prev, completeby: `${year}-${month}-${day}T${hours}:${mins}` }))
  }

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault()
    setErrors({})
    setLoading(true)

    const payload = {
      title: form.title,
      topic: form.topic || 'General',
      description: form.description,
      completeby: form.completeby || null,
    }

    try {
      if (isEdit) {
        await api.put(`/api/tasks/${id}/update/`, payload)
      } else {
        await api.post('/api/tasks/create/', payload)
      }
      navigate('/tasks')
    } catch (err) {
      setErrors(typeof err === 'object' ? err : { non_field_errors: ['Save failed.'] })
      setLoading(false)
    }
  }

  function fieldError(key) {
    const val = errors[key]
    if (!val) return null
    const msg = Array.isArray(val) ? val.join(' ') : val
    return <span className="text-error text-label-sm mt-1">{msg}</span>
  }

  if (fetching) {
    return (
      <div className="w-full pt-32 pb-20 bg-surface min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-tertiary">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary-container">sync</span>
          <span className="font-label-lg">Loading task details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-28 bg-surface min-h-[calc(100vh-80px)]">
      <div className="flex flex-col w-full">
        <div className="max-w-4xl mx-auto w-full px-gutter pb-space-xl">

          {/* Breadcrumb */}
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-tertiary-container mb-space-lg">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-tertiary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dashboard</span>
            </Link>
            <span className="text-surface-dim">/</span>
            <Link to="/tasks" className="text-tertiary-container hover:text-tertiary font-normal transition-colors">
              Tasks
            </Link>
            <span className="text-surface-dim">/</span>
            <span className="font-label-lg text-label-lg text-tertiary font-semibold">
              {isEdit ? 'Edit Task' : 'Create New Task'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">

            {/* Main Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">

              {errors.non_field_errors && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm">
                  {errors.non_field_errors.join(' ')}
                </div>
              )}

              {/* Task Title */}
              <div className="flex flex-col gap-1">
                <label className="sr-only" htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  autoFocus
                  required
                  placeholder="Task title"
                  className="w-full bg-transparent font-headline-lg text-headline-lg text-tertiary placeholder:text-surface-dim focus:outline-none transition-all py-1 font-semibold"
                />
                {fieldError('title')}
              </div>

              {/* Topic */}
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-tertiary font-medium">Topic / Category:</span>
                <input
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  list="topics-datalist"
                  placeholder="e.g. Work, Personal"
                  className="bg-surface-container-low px-3 py-1 rounded-full text-label-md text-tertiary border border-surface-variant/60 focus:outline-none focus:bg-surface-container-lowest"
                  required
                />
                <datalist id="topics-datalist">
                  {topics.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                {fieldError('topic')}
              </div>

              {/* Description */}
              <div className="flex flex-col bg-surface-container-low rounded-xl p-1.5 gap-1.5 border border-surface-variant/40">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Describe the task objectives, context, and any relevant details..."
                  className="w-full bg-transparent px-3 py-2 font-body-md text-body-md text-tertiary placeholder:text-surface-dim focus:outline-none resize-none leading-relaxed"
                />
                {fieldError('description')}
              </div>
            </div>

            {/* Due Date Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Target Delivery Date
              </span>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetDate(0)}
                  className="flex-1 py-1.5 px-2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm hover:bg-secondary-container transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(1)}
                  className="flex-1 py-1.5 px-2 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm hover:bg-surface-container transition-colors border border-surface-variant/40"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(3)}
                  className="flex-1 py-1.5 px-2 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm hover:bg-surface-container transition-colors border border-surface-variant/40"
                >
                  In 3 Days
                </button>
              </div>

              {/* Datetime picker */}
              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-variant/50">
                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
                <input
                  name="completeby"
                  type="datetime-local"
                  value={form.completeby}
                  onChange={handleChange}
                  className="flex-1 bg-transparent font-label-md text-label-md text-tertiary focus:outline-none"
                />
              </div>
              {fieldError('completeby')}
            </div>

            {/* Action Bar */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <Link
                to="/tasks"
                className="font-label-lg text-label-lg text-tertiary-container hover:text-tertiary transition-colors px-2 py-1"
              >
                Cancel
              </Link>

              <button
                id="task-submit-btn"
                type="submit"
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary font-label-lg text-label-lg py-2.5 px-space-xl rounded-full shadow-md hover:bg-primary transition-all active:scale-95 group cursor-pointer ${
                  loading ? 'opacity-80 pointer-events-none' : ''
                }`}
              >
                <span>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}</span>
                <span className="bg-primary/40 text-on-primary-container font-mono text-[11px] px-2 py-0.5 rounded-full tracking-wider group-hover:bg-primary/60 transition-colors">
                  ⌘ + Enter
                </span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  )
}
