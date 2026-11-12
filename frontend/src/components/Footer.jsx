export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low py-space-xl border-t border-surface-variant/40 mt-auto">
      <div className="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm text-on-surface-variant font-label-md text-label-md">
          <span className="font-headline-sm text-headline-sm text-secondary font-bold tracking-tight">
            Kanso
          </span>
          <span>—</span>
          <span>Intentional Task &amp; Project Orchestration</span>
        </div>
        <div className="flex items-center gap-space-lg text-on-surface-variant font-label-sm text-label-sm">
          <a
            className="hover:text-on-surface transition-colors cursor-pointer"
            onClick={(e) => { e.preventDefault(); alert('Kanso Principle: Simplicity through elimination of the non-essential.'); }}
            href="#zen"
          >
            Zen Guidelines
          </a>
          <a
            className="hover:text-on-surface transition-colors cursor-pointer"
            onClick={(e) => { e.preventDefault(); alert('Shortcuts:\n• ⌘ + Enter: Submit Form\n• /: Focus Search\n• N: New Task'); }}
            href="#shortcuts"
          >
            Shortcuts
          </a>
          <span className="text-surface-dim">•</span>
          <span className="text-tertiary-container/80">Kanso v2.4</span>
        </div>
      </div>
    </footer>
  )
}
