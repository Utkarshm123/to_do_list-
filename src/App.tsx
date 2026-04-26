import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Task = {
  id: number
  name: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'completed' | 'remaining'

const USER_STORAGE_KEY = 'todo-3d-user'
const TASK_STORAGE_KEY = 'todo-3d-tasks'

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(USER_STORAGE_KEY)?.trim() ?? ''
}

const readStoredTasks = () => {
  if (typeof window === 'undefined') {
    return [] as Task[]
  }

  const raw = window.localStorage.getItem(TASK_STORAGE_KEY)

  if (!raw) {
    return [] as Task[]
  }

  try {
    const parsed = JSON.parse(raw) as Task[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

export default function App() {
  const [userName, setUserName] = useState(readStoredUser)
  const [draftName, setDraftName] = useState(readStoredUser)
  const [nameError, setNameError] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(!readStoredUser())

  const [tasks, setTasks] = useState<Task[]>(readStoredTasks)
  const [taskDraft, setTaskDraft] = useState('')
  const [taskError, setTaskError] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  )
  const remainingCount = tasks.length - completedCount
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'completed':
        return tasks.filter((task) => task.completed)
      case 'remaining':
        return tasks.filter((task) => !task.completed)
      default:
        return tasks
    }
  }, [activeFilter, tasks])

  const saveUserName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextName = draftName.trim()

    if (!nextName) {
      setNameError('Please enter your name to continue.')
      return
    }

    window.localStorage.setItem(USER_STORAGE_KEY, nextName)
    setUserName(nextName)
    setDraftName(nextName)
    setNameError('')
    setIsNameModalOpen(false)
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextTaskName = taskDraft.trim()

    if (!nextTaskName) {
      setTaskError('Task name cannot be empty.')
      return
    }

    const nextTasks = [
      {
        id: Date.now(),
        name: nextTaskName,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...tasks,
    ]

    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(nextTasks))
    setTasks(nextTasks)
    setTaskDraft('')
    setTaskError('')
  }

  const toggleTask = (id: number) => {
    const nextTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    )

    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(nextTasks))
    setTasks(nextTasks)
  }

  const openRenameModal = () => {
    setDraftName(userName)
    setNameError('')
    setIsNameModalOpen(true)
  }

  const clearTasks = () => {
    window.localStorage.removeItem(TASK_STORAGE_KEY)
    setTasks([])
    setActiveFilter('all')
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'remaining', label: 'Remaining', count: remainingCount },
  ]

  return (
    <main className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      {isNameModalOpen && (
        <div className="modal-backdrop">
          <section className="name-modal glass-card">
            <p className="eyebrow">Welcome aboard</p>
            <h1>{userName ? 'Rename your workspace' : 'Start your 3D task hub'}</h1>
            <p className="intro-copy">
              Add your name to unlock a personal dashboard that tracks finished and
              remaining work in one place.
            </p>

            <form className="stack-form" onSubmit={saveUserName}>
              <label htmlFor="username" className="field-label">
                Your name
              </label>
              <input
                id="username"
                className="glass-input"
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Enter your name"
                autoFocus
              />
              {nameError && <p className="error-text">{nameError}</p>}

              <button className="primary-button" type="submit">
                {userName ? 'Save new name' : 'Enter dashboard'}
              </button>
            </form>
          </section>
        </div>
      )}

      <section className="dashboard">
        <header className="hero-panel glass-card elevated-card">
          <div className="hero-copy">
            <p className="eyebrow">Personal command center</p>
            <h2>
              {userName ? `Hello, ${userName}.` : 'Hello there.'}
            </h2>
            <p className="intro-copy">
              Capture every task, track what is complete, and keep the remaining
              work in clear view.
            </p>
          </div>

          <div className="hero-actions">
            <button className="ghost-button" type="button" onClick={openRenameModal}>
              Change name
            </button>
            <button className="ghost-button danger" type="button" onClick={clearTasks}>
              Clear tasks
            </button>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="progress-shell glass-card">
              <div
                className="progress-ring"
                style={{
                  background: `conic-gradient(var(--accent) ${completionRate}%, rgba(255, 255, 255, 0.08) ${completionRate}% 100%)`,
                }}
              >
                <div className="progress-ring__inner">
                  <strong>{completionRate}%</strong>
                  <span>Complete</span>
                </div>
              </div>
              <div className="progress-copy">
                <p className="eyebrow">Today at a glance</p>
                <h3>{remainingCount === 0 && tasks.length > 0 ? 'All caught up' : 'Stay in flow'}</h3>
                <p>
                  {remainingCount > 0
                    ? `${remainingCount} task${remainingCount === 1 ? '' : 's'} still need attention.`
                    : tasks.length > 0
                      ? 'Everything on your list is done.'
                      : 'Add your first task to begin the day.'}
                </p>
              </div>
            </div>
            <div className="depth-plates">
              <span className="depth-plate plate-back" />
              <span className="depth-plate plate-mid" />
              <span className="depth-plate plate-front" />
            </div>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card glass-card elevated-card">
            <span className="summary-label">Total tasks</span>
            <strong>{tasks.length}</strong>
            <p>Everything currently in your planner.</p>
          </article>
          <article className="summary-card glass-card elevated-card complete">
            <span className="summary-label">Done</span>
            <strong>{completedCount}</strong>
            <p>Tasks you have already finished.</p>
          </article>
          <article className="summary-card glass-card elevated-card remaining">
            <span className="summary-label">Remaining</span>
            <strong>{remainingCount}</strong>
            <p>Tasks still waiting for attention.</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="glass-card panel-card elevated-card composer-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Add a task</p>
                <h3>Create your next move</h3>
              </div>
            </div>

            <form className="task-form" onSubmit={addTask}>
              <input
                className="glass-input"
                type="text"
                value={taskDraft}
                onChange={(event) => setTaskDraft(event.target.value)}
                placeholder="Write your task name"
              />
              <button className="primary-button" type="submit">
                Add task
              </button>
            </form>

            {taskError && <p className="error-text">{taskError}</p>}
          </article>

          <article className="glass-card panel-card task-board elevated-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Task overview</p>
                <h3>See what is done and what remains</h3>
              </div>
            </div>

            <div className="filter-row">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`filter-pill ${
                    activeFilter === filter.key ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>

            {filteredTasks.length > 0 ? (
              <div className="task-list-shell">
                <div className="task-list">
                {filteredTasks.map((task) => (
                  <article
                    key={task.id}
                    className={`task-card ${task.completed ? 'is-done' : 'is-open'}`}
                  >
                    <div className="task-meta">
                      <span className={`status-dot ${task.completed ? 'done' : 'open'}`} />
                      <div>
                        <h4>{task.name}</h4>
                        <p>{task.completed ? 'Completed task' : 'Remaining task'}</p>
                      </div>
                    </div>

                    <div className="task-side">
                      <span className="task-date">{formatDate(task.createdAt)}</span>
                      <span className={`task-state-badge ${task.completed ? 'done' : 'open'}`}>
                        {task.completed ? 'Done' : 'Pending'}
                      </span>
                      <button
                        type="button"
                        className="toggle-button"
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed ? 'Mark remaining' : 'Mark done'}
                      </button>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            ) : (
              <div className="empty-state glass-card">
                <h4>No tasks in this view yet</h4>
                <p>
                  Add a task or switch filters to see your completed and remaining
                  work.
                </p>
              </div>
            )}
          </article>
        </section>
      </section>
    </main>
  )
}
