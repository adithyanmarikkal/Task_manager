export default function KansoLogo({ className = "h-8 w-auto" }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Architectural geometric logo emblem */}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 shrink-0 transition-transform hover:scale-105"
      >
        <rect width="36" height="36" rx="10" fill="#355674" />
        {/* Subtle grid lines */}
        <line x1="8" y1="18" x2="28" y2="18" stroke="#efeeeb" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        <line x1="18" y1="8" x2="18" y2="28" stroke="#efeeeb" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        {/* Minimalist Japanese circular focus ring */}
        <circle cx="18" cy="18" r="9" stroke="#ffffff" strokeWidth="2.5" />
        {/* 10% Lacquer red dot at center */}
        <circle cx="18" cy="18" r="3.5" fill="#c83232" />
      </svg>
      <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold hidden sm:inline">
        Kanso
      </span>
    </div>
  )
}
