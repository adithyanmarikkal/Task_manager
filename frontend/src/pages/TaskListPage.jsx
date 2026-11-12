import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/api'

export default function TaskListPage() {
  const [tasks, setTasks] = useState([])
  const [topics, setTopics] = useState([])
  const [filters, setFilters] = useState({ completed: '', topic: '', search: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Load distinct topics on mount
  useEffect(() => {
    api.get('/api/tasks/topics/')
      .then(d => setTopics(d.topics || []))
      .catch(() => {})
  }, [])

  // Load tasks based on filters
  const fetchTasks = useCallback(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filters.completed !== '') params.set('completed', filters.completed)
    if (filters.topic) params.set('topic', filters.topic)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString() ? `?${params}` : ''

    api.get(`/api/tasks/${qs}`)
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load tasks.'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function handleFilterChange(e) {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function setStatusFilter(status) {
    setFilters(prev => ({ ...prev, completed: status }))
  }

  function resetFilters() {
    setFilters({ completed: '', topic: '', search: '' })
  }

  async function handleToggle(id, e) {
    e.stopPropagation()
    try {
      const updated = await api.patch(`/api/tasks/${id}/toggle/`)
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch {
      alert('Failed to toggle task.')
    }
  }

  async function handleDelete(id, title, e) {
    e.stopPropagation()
    if (!window.confirm(`Delete task "${title}"?`)) return
    try {
      await api.delete(`/api/tasks/${id}/delete/`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Failed to delete task.')
    }
  }

  return (
    <div className="w-full pt-28 bg-surface min-h-[calc(100vh-80px)]">
      <div className="flex flex-col w-full">
        <div className="max-w-7xl mx-auto w-full px-gutter pb-space-xl flex flex-col gap-space-lg">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-xs">
                <Link to="/dashboard" className="text-tertiary-container hover:text-tertiary flex items-center gap-1 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Dashboard</span>
                </Link>
                <span className="text-surface-dim">/</span>
                <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                  Task Registry
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                Task Orchestration
              </h1>
              <p className="font-body-lg text-body-lg text-tertiary-container">
                All milestones, deliverables, and operational workflows
              </p>
            </div>

            <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
              <Link
                to="/tasks/new"
                className="inline-flex items-center gap-2 py-2.5 px-space-lg rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                + New Task
              </Link>
            </div>
          </div>

          {/* Filter Bar Controls Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary-container text-[20px] pointer-events-none">
                search
              </span>
              <input
                name="search"
                placeholder="Search title or description..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full h-11 pl-11 pr-4 bg-surface-container-low text-tertiary font-body-md text-body-md rounded-xl border border-surface-variant/60 focus:outline-none focus:bg-surface-container-lowest focus:border-tertiary transition-all"
              />
            </div>

            {/* Filter pills & topic dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Tabs */}
              <div className="flex items-center p-1 bg-surface-container-low rounded-full gap-0.5 border border-surface-variant/40">
                <button
                  type="button"
                  onClick={() => setStatusFilter('')}
                  className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all ${
                    filters.completed === ''
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('false')}
                  className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all ${
                    filters.completed === 'false'
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('true')}
                  className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all ${
                    filters.completed === 'true'
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Topic Selector */}
              <div className="relative">
                <select
                  name="topic"
                  value={filters.topic}
                  onChange={handleFilterChange}
                  className="appearance-none bg-surface-container-low text-tertiary font-label-md text-label-md h-10 py-1.5 pl-3 pr-8 rounded-xl border border-surface-variant/60 focus:outline-none cursor-pointer"
                >
                  <option value="">All Topics</option>
                  {topics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary text-[18px] pointer-events-none">
                  unfold_more
                </span>
              </div>

              {(filters.completed !== '' || filters.topic || filters.search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-full text-label-sm text-tertiary-container hover:text-tertiary hover:bg-surface-container transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

          </div>

          {/* Feedback & Loading */}
          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-body-sm">
              <span className="material-symbols-outlined text-error">error</span>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-tertiary gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary-container">sync</span>
              <span className="font-label-lg">Fetching tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-variant/40 shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <div>
                <p className="font-headline-sm text-tertiary font-bold">No tasks match your filters</p>
                <p className="font-body-sm text-tertiary-container mt-1">
                  Adjust your search or create a new milestone.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-full font-label-md bg-surface-container-low text-tertiary hover:bg-surface-container"
                >
                  Reset filters
                </button>
                <Link
                  to="/tasks/new"
                  className="px-5 py-2 rounded-full font-label-md bg-primary-container text-on-primary hover:bg-primary shadow-sm"
                >
                  Create Task
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm">
              {tasks.map(task => {
                const isDueToday = task.completeby && new Date(task.completeby).toDateString() === new Date().toDateString()
                const isUrgent = isDueToday || (!task.completed && task.completeby && new Date(task.completeby) < new Date())

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    className={`group bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md border border-surface-variant/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm cursor-pointer ${
                      task.completed ? 'opacity-70 hover:opacity-100 bg-surface-container-lowest/80' : ''
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-space-md min-w-0">
                      {/* Checkbox */}
                      <label
                        onClick={e => e.stopPropagation()}
                        className="relative flex items-center justify-center cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={e => handleToggle(task.id, e)}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                            task.completed
                              ? 'bg-tertiary border-tertiary'
                              : isUrgent
                              ? 'bg-surface-container-lowest border-primary-container hover:bg-primary-fixed'
                              : 'bg-surface-container-lowest border-tertiary-container hover:bg-surface-container'
                          }`}
                        >
                          {task.completed && (
                            <span className="material-symbols-outlined text-white text-[14px] font-bold">
                              check
                            </span>
                          )}
                        </div>
                      </label>

                      {/* Content */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-headline-sm text-[16px] font-semibold truncate transition-colors ${
                              task.completed
                                ? 'text-tertiary-container line-through'
                                : 'text-on-surface group-hover:text-primary'
                            }`}
                          >
                            {task.title}
                          </span>

                          {isUrgent && !task.completed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/70 text-on-error-container font-label-sm text-label-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                              Urgent
                            </span>
                          )}

                          {task.completed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-tertiary">
                              Done
                            </span>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-space-sm mt-1 flex-wrap text-tertiary-container font-body-sm text-body-sm">
                          {task.topic && (
                            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary bg-secondary-container/30 px-2 py-0.5 rounded-md">
                              {task.topic}
                            </span>
                          )}
                          {task.completeby && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">
                                  calendar_today
                                </span>
                                {new Date(task.completeby).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                          {task.description && (
                            <span className="hidden sm:inline truncate max-w-sm text-tertiary-container/80">
                              — {task.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/tasks/${task.id}/edit`)
                        }}
                        className="p-1.5 rounded-lg text-tertiary hover:bg-surface-container transition-colors"
                        title="Edit task"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDelete(task.id, task.title, e)}
                        className="p-1.5 rounded-lg text-tertiary-container hover:text-error hover:bg-error-container/40 transition-colors"
                        title="Delete task"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
