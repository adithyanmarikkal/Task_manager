import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [tasks, setTasks] = useState([])
  const [user, setUser] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/tasks/summary/').catch(() => null),
      api.get('/api/tasks/').catch(() => []),
      api.get('/api/user/me/').catch(() => null),
    ])
      .then(([sumData, taskData, userData]) => {
        if (sumData) setSummary(sumData)
        if (Array.isArray(taskData)) setTasks(taskData)
        if (userData) setUser(userData)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  async function handleToggleTask(id, e) {
    e.stopPropagation()
    try {
      const updated = await api.patch(`/api/tasks/${id}/toggle/`)
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
      api.get('/api/tasks/summary/').then(setSummary).catch(() => {})
    } catch {
      alert('Failed to update task status.')
    }
  }

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  const total = summary ? summary.total_tasks : tasks.length
  const completed = summary ? summary.completed_tasks : tasks.filter(t => t.completed).length
  const pending = summary ? summary.pending_tasks : tasks.filter(t => !t.completed).length
  const overdue = summary ? summary.overdue_tasks : 0

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const circumference = 100
  const strokeDash = `${completionPct}, ${circumference}`

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'in-progress') return !t.completed
    if (activeFilter === 'completed') return t.completed
    return true
  })

  const displayName = user?.first_name || user?.username || 'Team'

  if (loading) {
    return (
      <div className="w-full pt-32 pb-20 bg-surface min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-tertiary">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary-container">sync</span>
          <span className="font-label-lg">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-28 bg-surface min-h-[calc(100vh-80px)]">
      <div className="flex flex-col w-full">
        <div className="max-w-7xl mx-auto w-full px-gutter pb-space-xl flex flex-col gap-space-lg">

          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                  {todayStr}
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                Good day, {displayName}.
              </h1>
              <p className="font-body-lg text-body-lg text-tertiary-container">
                You have <span className="font-label-lg text-on-surface font-semibold">{pending} tasks</span> pending today.
              </p>
            </div>

            <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1.5 py-2 px-space-md rounded-full bg-surface-container-low hover:bg-surface-container text-tertiary font-label-lg text-label-lg transition-colors shadow-sm border border-surface-variant/50"
              >
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>
                  tune
                </span>
                Task Board
              </Link>
              <Link
                to="/tasks/new"
                className="inline-flex items-center gap-2 py-2.5 px-space-lg rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  add
                </span>
                + New Task
              </Link>
            </div>
          </div>

          {/* Key Metrics Row: 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">

            {/* Metric 1: Completion Ring */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                  Completed
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {completed}
                  </span>
                  <span className="font-label-md text-label-md text-tertiary-container">
                    / {total} done
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-tertiary-container mt-1">
                  {pending} remaining
                </span>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 -rotate-90 text-surface-container" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-tertiary transition-all duration-1000 ease-out"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                    strokeWidth="3.2"
                  />
                </svg>
                <span className="absolute font-label-sm text-label-sm text-tertiary font-bold">
                  {completionPct}%
                </span>
              </div>
            </div>

            {/* Metric 2: Active / Overdue */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                  Active Tasks
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {pending}
                  </span>
                  <span className="font-body-sm text-body-sm text-tertiary-container">
                    in progress
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-tertiary-container mt-1">
                  {overdue > 0 ? `${overdue} overdue` : 'All schedules on track'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[24px]">rate_review</span>
              </div>
            </div>

            {/* Metric 3: Completion Rate */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-variant/50 hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                  Completion Rate
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-lg text-headline-lg text-tertiary font-bold">
                    {completionPct >= 70 ? 'Optimal' : 'On Track'}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-tertiary-container mt-1">
                  {completed} of {total} completed
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[24px]">speed</span>
              </div>
            </div>
          </div>

          {/* Task Stream — full width */}
          <section className="flex flex-col gap-space-md">
            {/* Controls & Filter Tabs */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                  Your Tasks
                </h2>
                <p className="font-body-sm text-body-sm text-tertiary-container">
                  Organized by urgency and due date
                </p>
              </div>
              <div className="flex items-center p-1 bg-surface-container-low rounded-full gap-0.5 border border-surface-variant/40">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all ${
                    activeFilter === 'all'
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setActiveFilter('in-progress')}
                  className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all ${
                    activeFilter === 'in-progress'
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  In Progress ({pending})
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all ${
                    activeFilter === 'completed'
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-tertiary hover:text-on-surface'
                  }`}
                >
                  Done ({completed})
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-space-sm">
              {filteredTasks.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-surface-variant/40 shadow-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[24px]">task</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-tertiary font-medium">No tasks in this view</p>
                    <p className="font-body-sm text-tertiary-container mt-0.5">
                      Create a new task to begin organizing your workflow.
                    </p>
                  </div>
                  <Link
                    to="/tasks/new"
                    className="mt-2 inline-flex items-center gap-1.5 bg-primary-container text-on-primary font-label-md py-2 px-5 rounded-full shadow-sm hover:bg-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create First Task
                  </Link>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isDueToday = task.completeby && new Date(task.completeby).toDateString() === new Date().toDateString()
                  const isUrgent = isDueToday || (!task.completed && task.completeby && new Date(task.completeby) < new Date())

                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                      className={`group bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md border border-surface-variant/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm cursor-pointer ${
                        task.completed ? 'opacity-75 hover:opacity-100' : ''
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-space-md min-w-0">
                        {/* Checkbox */}
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="relative flex items-center justify-center cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => handleToggleTask(task.id, e)}
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
                              <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                            )}
                          </div>
                        </label>

                        {/* Task details */}
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
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
                                Urgent
                              </span>
                            )}

                            {task.completed && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-tertiary">
                                Done
                              </span>
                            )}
                          </div>

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
                                  <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                                  {new Date(task.completeby).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </>
                            )}
                            {task.description && (
                              <span className="hidden md:inline truncate max-w-xs text-tertiary-container/80">
                                — {task.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="flex items-center gap-space-md self-end sm:self-center shrink-0">
                        <span
                          className="material-symbols-outlined text-tertiary-container group-hover:text-tertiary group-hover:translate-x-0.5 transition-all"
                          style={{ fontSize: 20 }}
                        >
                          chevron_right
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
