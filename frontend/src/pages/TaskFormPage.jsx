import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api/api'

const EMPTY = {
  title: '',
  topic: 'Design System 2.0',
  description: '',
  completeby: '',
}

export default function TaskFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [priority, setPriority] = useState('Medium')
  const [topics, setTopics] = useState(['Design System 2.0', 'Brand Architecture', 'Client Presentation', 'Studio Operations'])
  const [subtasks, setSubtasks] = useState([
    { text: 'Confirm structural load formulas with lead engineer', done: true },
    { text: 'Export high-resolution CAD layer previews', done: true },
    { text: "Prepare revisions ledger for tomorrow's executive sign-off", done: false },
  ])
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [tags, setTags] = useState(['Architecture', 'Design', 'Review'])
  const [newTagText, setNewTagText] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [slackNotify, setSlackNotify] = useState(true)

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  // Pre-fill form in edit mode
  useEffect(() => {
    // Load existing distinct topics
    api.get('/api/tasks/topics/')
      .then(d => {
        if (d.topics && d.topics.length > 0) {
          setTopics(prev => Array.from(new Set([...prev, ...d.topics])))
        }
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

  function handleAddSubtask() {
    if (!newSubtaskText.trim()) return
    setSubtasks(prev => [...prev, { text: newSubtaskText.trim(), done: false }])
    setNewSubtaskText('')
    setShowAddSubtask(false)
  }

  function handleToggleSubtask(index) {
    setSubtasks(prev =>
      prev.map((s, i) => (i === index ? { ...s, done: !s.done } : s))
    )
  }

  function handleRemoveSubtask(index) {
    setSubtasks(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddTag() {
    if (!newTagText.trim()) return
    if (!tags.includes(newTagText.trim())) {
      setTags(prev => [...prev, newTagText.trim()])
    }
    setNewTagText('')
    setShowAddTag(false)
  }

  function handleRemoveTag(tagToRemove) {
    setTags(prev => prev.filter(t => t !== tagToRemove))
  }

  function setPresetDate(daysAhead) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    d.setHours(17, 0, 0, 0)
    // Format YYYY-MM-DDTHH:mm
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

    // Build payload
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

  const completedSubtasksCount = subtasks.filter(s => s.done).length

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
        <div className="max-w-7xl mx-auto w-full px-gutter pb-space-xl">
          
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-lg">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-tertiary-container">
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

            <div className="flex items-center gap-space-sm text-tertiary font-label-sm text-label-sm bg-surface-container-low px-space-md py-1.5 rounded-full shadow-sm border border-surface-variant/40">
              <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
              <span>Workspace connected</span>
              <span className="text-outline-variant font-normal">·</span>
              <span className="text-tertiary-container font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Form Grid */}
          <form
            className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start"
            onSubmit={handleSubmit}
          >
            {/* Primary Core Details (Left 7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              
              {/* Main Card: Title & Rich Description */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">
                
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      edit_note
                    </span>
                    Core Specification
                  </span>
                  <span className="text-tertiary-container font-label-sm text-label-sm">
                    Step 1 of 2
                  </span>
                </div>

                {/* Task Title Input */}
                <div className="flex flex-col gap-1">
                  <label className="sr-only" htmlFor="task-title">Task Title</label>
                  <input
                    id="task-title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    autoFocus
                    required
                    placeholder="e.g. Finalize architectural blueprints for client review"
                    className="w-full bg-transparent font-headline-lg text-headline-lg text-tertiary placeholder:text-surface-dim focus:outline-none transition-all py-1 font-semibold"
                  />
                  {fieldError('title')}
                </div>

                {/* Topic quick selector/input */}
                <div className="flex items-center gap-2">
                  <span className="text-label-sm text-tertiary font-medium">Topic / Category:</span>
                  <input
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    list="topics-datalist"
                    placeholder="e.g. Design System 2.0"
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

                {/* Rich Text Formatting Toolbar Mock */}
                <div className="flex flex-col bg-surface-container-low rounded-xl p-1.5 gap-1.5 border border-surface-variant/40">
                  <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-surface-container-lowest rounded-lg">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, description: p.description + '**bold text**' }))}
                        className="w-8 h-8 rounded flex items-center justify-center text-tertiary hover:bg-surface-container transition-colors"
                        title="Bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_bold</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, description: p.description + '*italic text*' }))}
                        className="w-8 h-8 rounded flex items-center justify-center text-tertiary hover:bg-surface-container transition-colors"
                        title="Italic"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_italic</span>
                      </button>
                      <span className="w-[1px] h-4 bg-surface-variant mx-1" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, description: p.description + '\n- Item' }))}
                        className="w-8 h-8 rounded flex items-center justify-center text-tertiary hover:bg-surface-container transition-colors"
                        title="Bulleted List"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, description: p.description + '\n1. Item' }))}
                        className="w-8 h-8 rounded flex items-center justify-center text-tertiary hover:bg-surface-container transition-colors"
                        title="Numbered List"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, description: p.description + '\n[ ] Task' }))}
                        className="w-8 h-8 rounded flex items-center justify-center text-tertiary hover:bg-surface-container transition-colors"
                        title="Checklist"
                      >
                        <span className="material-symbols-outlined text-[18px]">checklist</span>
                      </button>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary-container pr-2">
                      Markdown supported
                    </span>
                  </div>

                  {/* Description Text Area */}
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Outline objectives, critical milestones, architectural constraints, and deliverables..."
                    className="w-full bg-transparent px-3 py-2 font-body-md text-body-md text-tertiary placeholder:text-surface-dim focus:outline-none resize-none leading-relaxed"
                  />
                  {fieldError('description')}
                </div>

                {/* Subtasks Checklist Section */}
                <div className="flex flex-col gap-space-sm pt-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-lg text-label-lg text-tertiary flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-outlined text-[18px]">splitscreen_left</span>
                      Milestone Breakdown
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary-container">
                      {completedSubtasksCount} of {subtasks.length} completed
                    </span>
                  </div>

                  {/* Subtask list */}
                  <div className="flex flex-col gap-2">
                    {subtasks.map((st, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-all border border-surface-variant/40"
                      >
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={() => handleToggleSubtask(idx)}
                          className="w-4 h-4 rounded text-tertiary accent-tertiary cursor-pointer focus:ring-0"
                        />
                        <span
                          className={`font-body-md text-body-md flex-1 transition-colors ${
                            st.done ? 'text-tertiary-container line-through' : 'text-tertiary'
                          }`}
                        >
                          {st.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(idx)}
                          className="text-surface-dim hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add subtask */}
                  {showAddSubtask ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSubtask()
                          }
                        }}
                        autoFocus
                        placeholder="Add milestone or subtask..."
                        className="flex-1 bg-surface-container-low px-3 py-1.5 rounded-xl text-body-md text-tertiary border border-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="px-3 py-1.5 rounded-full bg-tertiary text-on-tertiary font-label-sm text-label-sm hover:opacity-90"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSubtask(false)}
                        className="text-tertiary-container font-label-sm text-label-sm hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSubtask(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md hover:bg-secondary-container transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add subtask item</span>
                      </button>
                      <span className="text-tertiary-container font-label-sm text-label-sm">
                        Press Tab to nest
                      </span>
                    </div>
                  )}
                </div>

                {/* Asset Repertoire Dropzone */}
                <div className="flex flex-col gap-2 pt-space-xs">
                  <span className="font-label-lg text-label-lg text-tertiary flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[18px]">attachment</span>
                    Asset Repertoire
                  </span>
                  <div
                    onClick={() => alert('File attachment staged in Kanso Assets storage.')}
                    className="relative flex flex-col items-center justify-center p-space-lg rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer text-center group border border-dashed border-surface-variant"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-sm mb-2 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                    </div>
                    <p className="font-label-lg text-label-lg text-tertiary">
                      Drop files here or <span className="text-secondary font-semibold underline">browse files</span>
                    </p>
                    <p className="font-label-sm text-label-sm text-tertiary-container mt-0.5">
                      DWG, PDF, ZIP or PNG up to 100MB per file
                    </p>
                  </div>

                  {/* Attached Previews */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-lg shadow-sm border border-surface-variant/40">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-secondary text-[20px]">draft</span>
                        <div className="flex flex-col truncate">
                          <span className="font-label-md text-label-md text-tertiary truncate">
                            Section_B_GroundElevation.dwg
                          </span>
                          <span className="font-label-sm text-label-sm text-tertiary-container">14.8 MB</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-lg shadow-sm border border-surface-variant/40">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-secondary text-[20px]">picture_as_pdf</span>
                        <div className="flex flex-col truncate">
                          <span className="font-label-md text-label-md text-tertiary truncate">
                            Structural_Compliance_Spec.pdf
                          </span>
                          <span className="font-label-sm text-label-sm text-tertiary-container">2.4 MB</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Metadata & Assignment Controls (Right 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/50 flex flex-col gap-space-md">
                
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      folder_managed
                    </span>
                    Project &amp; Context
                  </span>
                </div>

                {/* Priority Level Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-tertiary font-medium">
                      Priority Level
                    </label>
                    <span className="font-label-sm text-label-sm text-tertiary-container">
                      Determines triage
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-variant/40">
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => {
                      const isSelected = priority === p
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 text-center font-label-md text-label-md rounded-lg transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? p === 'Urgent'
                                ? 'bg-error-container text-on-error-container font-bold shadow-sm'
                                : 'bg-surface-container-lowest text-tertiary shadow-sm font-semibold'
                              : p === 'Urgent'
                              ? 'text-primary hover:bg-primary-fixed'
                              : 'text-tertiary-container hover:text-tertiary hover:bg-surface-container'
                          }`}
                        >
                          {p === 'Urgent' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                          )}
                          <span>{p}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Due Date & Time Picker */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-tertiary font-medium flex items-center justify-between">
                    <span>Target Delivery Date</span>
                    <span className="font-label-sm text-label-sm text-secondary font-normal">
                      Local Timezone
                    </span>
                  </label>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetDate(0)}
                      className="flex-1 py-1 px-2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm hover:bg-secondary-container transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(1)}
                      className="flex-1 py-1 px-2 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm hover:bg-surface-container transition-colors border border-surface-variant/40"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(3)}
                      className="flex-1 py-1 px-2 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm hover:bg-surface-container transition-colors border border-surface-variant/40"
                    >
                      In 3 Days
                    </button>
                  </div>

                  {/* Native datetime-local picker styled cleanly */}
                  <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-variant/50">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      calendar_today
                    </span>
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

                {/* Assignee & Owner */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-tertiary font-medium">
                      Assignee &amp; Owner
                    </label>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Active Member
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-surface-variant/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold text-label-md">
                        KA
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-tertiary font-semibold">
                          Alex Rivera
                        </span>
                        <span className="font-label-sm text-label-sm text-tertiary-container">
                          Lead Architectural Designer
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                  </div>

                  {/* Quick Team Avatars Selection */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-label-sm text-label-sm text-tertiary-container">
                      Quick assign:
                    </span>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-label-sm font-semibold hover:scale-105 transition-transform"
                      title="Marcus Vance"
                    >
                      MV
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-surface-container-high text-tertiary flex items-center justify-center font-label-sm text-label-sm font-semibold hover:scale-105 transition-transform"
                      title="Elena Chen"
                    >
                      EC
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-sm text-label-sm font-semibold hover:scale-105 transition-transform"
                      title="Devon Smith"
                    >
                      DS
                    </button>
                  </div>
                </div>

                {/* Tags & Intent Labels */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-tertiary font-medium">
                    Tags &amp; Intent Labels
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm shadow-sm border border-surface-variant/40"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-tertiary-container hover:text-tertiary ml-0.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}

                    {showAddTag ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                          autoFocus
                          placeholder="tag"
                          className="w-20 px-2 py-0.5 rounded-full bg-surface-container text-body-sm focus:outline-none border border-tertiary/40"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="text-tertiary font-label-sm"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTag(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-tertiary-container hover:text-tertiary font-label-sm text-label-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Add tag</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Automation Card */}
                <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm border border-surface-variant/40">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      notifications_active
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-tertiary font-medium">
                        Slack notifications
                      </span>
                      <span className="font-label-sm text-label-sm text-tertiary-container">
                        Broadcast to #orchestration
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={slackNotify}
                    onChange={(e) => setSlackNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                  />
                </div>

              </div>
            </div>

            {/* Bottom Docked Action Bar (Full 12 cols) */}
            <div className="lg:col-span-12 w-full mt-space-md">
              <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-[0_12px_28px_-6px_rgba(38,59,79,0.08),0_4px_12px_-2px_rgba(38,59,79,0.04)] border border-surface-variant/50 flex flex-col sm:flex-row items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-md w-full sm:w-auto justify-between sm:justify-start">
                  <Link
                    to="/tasks"
                    className="font-label-lg text-label-lg text-tertiary-container hover:text-tertiary transition-colors px-2 py-1"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Draft captured in local workspace.')
                    }}
                    className="inline-flex items-center justify-center px-space-lg py-2 rounded-full font-label-lg text-label-lg text-tertiary bg-surface-container-low hover:bg-surface-container transition-all border border-surface-variant/40"
                  >
                    Save as Draft
                  </button>
                </div>

                {/* Primary CTA Button: 10% Lacquer Red Highlight */}
                <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
                  <button
                    id="task-submit-btn"
                    type="submit"
                    disabled={loading}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary font-label-lg text-label-lg py-2.5 px-space-xl rounded-full shadow-[0_4px_14px_rgba(200,50,50,0.25)] hover:bg-primary transition-all active:scale-95 group cursor-pointer ${
                      loading ? 'opacity-80 pointer-events-none' : ''
                    }`}
                  >
                    <span>{loading ? 'Saving Task...' : isEdit ? 'Save Changes' : 'Create Task'}</span>
                    <span className="bg-primary/40 text-on-primary-container font-mono text-[11px] px-2 py-0.5 rounded-full tracking-wider group-hover:bg-primary/60 transition-colors">
                      ⌘ + Enter
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  )
}
