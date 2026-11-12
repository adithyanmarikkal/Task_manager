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
        setError('Failed to load dashboard data.')
        setLoading(false)
      })
  }, [])

  async function handleToggleTask(id, e) {
    e.stopPropagation()
    try {
      const updated = await api.patch(`/api/tasks/${id}/toggle/`)
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
      // refresh summary
      api.get('/api/tasks/summary/').then(setSummary).catch(() => {})
    } catch {
      alert('Failed to update task status.')
    }
  }

  // Format today's date for sprint badge
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

  // Filter tasks based on active tab
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
          <span className="font-label-lg">Loading Kanso Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-28 bg-surface min-h-[calc(100vh-80px)]">
      <div className="flex flex-col w-full">
        <div className="max-w-7xl mx-auto w-full px-gutter pb-space-xl flex flex-col gap-space-lg">
          
          {/* Header Area: Welcome & Action Station */}
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
                You have <span className="font-label-lg text-on-surface font-semibold">{pending} tasks</span> requiring orchestration today.
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
            
            {/* Metric 1: Completed Ring */}
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

          {/* Main Workspace Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            
            {/* Left Column (8 cols): Task Stream */}
            <section className="lg:col-span-8 flex flex-col gap-space-md">
              {/* Controls & Filter Tabs */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                    Active Tasks &amp; Milestones
                  </h2>
                  <p className="font-body-sm text-body-sm text-tertiary-container">
                    Organized by urgency and operational impact
                  </p>
                </div>
                {/* Dynamic Tabs */}
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

              {/* Task Stream List */}
              <div className="flex flex-col gap-space-sm" id="task-container">
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
                          task.completed ? 'opacity-75 hover:opacity-100 bg-surface-container-lowest/80' : ''
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
                                <span className="material-symbols-outlined text-white text-[14px] font-bold">
                                  check
                                </span>
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

                              {/* Status / Priority Badges */}
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
                                    <span className="material-symbols-outlined text-[15px]">
                                      calendar_today
                                    </span>
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

                        {/* Right side actions */}
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

            {/* Right Column (4 cols): Insights & Rhythm */}
            <aside className="lg:col-span-4 flex flex-col gap-space-md">
              
              {/* Weekly Focus Rhythm Visual Chart */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Weekly Focus Rhythm
                    </h3>
                    <span className="font-body-sm text-body-sm text-tertiary-container">
                      Target: 25h deep focus
                    </span>
                  </div>
                  <span className="font-label-lg text-label-lg font-bold text-tertiary">
                    22.4h
                  </span>
                </div>

                {/* Clean Architectural Bar Chart (Inline SVG) */}
                <div className="pt-2 pb-1">
                  <svg className="w-full h-32" fill="none" viewBox="0 0 280 120">
                    {/* Horizontal Guideline grids */}
                    <line stroke="#EBE5DF" strokeDasharray="2 3" strokeWidth="1" x1="0" x2="280" y1="20" y2="20" />
                    <line stroke="#EBE5DF" strokeDasharray="2 3" strokeWidth="1" x1="0" x2="280" y1="60" y2="60" />
                    <line stroke="#EBE5DF" strokeWidth="1" x1="0" x2="280" y1="100" y2="100" />
                    
                    {/* Day 1: Mon (3.5h) */}
                    <rect className="fill-tertiary-container/40 hover:fill-tertiary transition-colors" height="45" rx="5" width="22" x="14" y="55" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="25" y="115">M</text>
                    
                    {/* Day 2: Tue (5.2h) */}
                    <rect className="fill-tertiary-container/60 hover:fill-tertiary transition-colors" height="68" rx="5" width="22" x="54" y="32" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="65" y="115">T</text>
                    
                    {/* Day 3: Wed (6.0h) */}
                    <rect className="fill-tertiary-container/80 hover:fill-tertiary transition-colors" height="78" rx="5" width="22" x="94" y="22" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="105" y="115">W</text>
                    
                    {/* Day 4: Thu (Today) - Highlighted in Denim */}
                    <rect className="fill-tertiary hover:opacity-90 transition-opacity" height="58" rx="5" width="22" x="134" y="42" />
                    <text className="fill-tertiary text-[11px] font-sans font-bold" textAnchor="middle" x="145" y="115">T</text>
                    {/* Current Day Pin */}
                    <circle className="fill-primary-container" cx="145" cy="14" r="3" />
                    
                    {/* Day 5: Fri (3.2h) */}
                    <rect className="fill-surface-container hover:fill-tertiary-container transition-colors" height="40" rx="5" width="22" x="174" y="60" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="185" y="115">F</text>
                    
                    {/* Day 6: Sat */}
                    <rect className="fill-surface-container" height="15" rx="5" width="22" x="214" y="85" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="225" y="115">S</text>
                    
                    {/* Day 7: Sun */}
                    <rect className="fill-surface-container" height="8" rx="4" width="22" x="254" y="92" />
                    <text className="fill-tertiary-container text-[11px] font-sans font-medium" textAnchor="middle" x="265" y="115">S</text>
                  </svg>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-tertiary font-body-sm text-body-sm border border-surface-variant/40">
                  <span className="flex items-center gap-1.5 font-label-md text-label-md">
                    <span className="w-2 h-2 rounded-full bg-tertiary" /> Peak Focus Window
                  </span>
                  <span className="font-medium text-on-surface">9:00 AM – 11:30 AM</span>
                </div>
              </div>

              {/* Recent Activity Timeline Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-variant/50 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Recent Activity
                  </h3>
                  <Link to="/tasks" className="font-label-sm text-label-sm text-tertiary hover:underline">
                    View Log
                  </Link>
                </div>
                
                {/* Timeline entries with vertical line */}
                <div className="relative flex flex-col gap-space-md pl-4 mt-2">
                  <div className="absolute top-2 bottom-2 left-1.5 w-0.5 bg-surface-container" />
                  
                  {/* Event 1 */}
                  <div className="relative flex items-start gap-space-sm">
                    <div className="absolute -left-4 mt-1 w-2.5 h-2.5 rounded-full bg-primary-container ring-4 ring-surface-container-lowest" />
                    <div className="flex flex-col">
                      <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                        <span className="font-semibold text-tertiary">{displayName}</span> updated task priorities
                      </p>
                      <span className="font-label-sm text-label-sm text-tertiary-container mt-0.5">
                        Just now
                      </span>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="relative flex items-start gap-space-sm">
                    <div className="absolute -left-4 mt-1 w-2.5 h-2.5 rounded-full bg-tertiary ring-4 ring-surface-container-lowest" />
                    <div className="flex flex-col">
                      <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                        Completed milestone <span className="font-medium">Sprint 14 Planning & Prioritization</span>
                      </p>
                      <span className="font-label-sm text-label-sm text-tertiary-container mt-0.5">
                        1h ago
                      </span>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="relative flex items-start gap-space-sm">
                    <div className="absolute -left-4 mt-1 w-2.5 h-2.5 rounded-full bg-tertiary-container ring-4 ring-surface-container-lowest" />
                    <div className="flex flex-col">
                      <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                        Synchronized with <span className="font-medium">Kanso Architectural Suite</span>
                      </p>
                      <span className="font-label-sm text-label-sm text-tertiary-container mt-0.5">
                        3h ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serene Productivity Tip / Quote Card */}
              <div className="rounded-2xl p-space-md bg-secondary-container/20 border border-secondary-container/40 flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-tertiary mt-0.5" style={{ fontSize: 20 }}>
                  spa
                </span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">
                    Kanso Insight
                  </span>
                  <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-0.5 italic">
                    “Simplicity is the deliberate elimination of the non-essential to let the essential speak.”
                  </p>
                </div>
              </div>

            </aside>
          </div>

        </div>
      </div>
    </div>
  )
}
