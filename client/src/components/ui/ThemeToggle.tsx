import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex h-8 w-14 items-center rounded-full border border-theme-subtle bg-theme-surface p-1 transition-colors"
    >
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-brand-white text-brand-black transition-transform duration-200 ${
          isDark ? 'translate-x-0' : 'translate-x-6'
        }`}
      >
        {isDark ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
      </span>
      <span className="sr-only">{isDark ? 'Dark mode' : 'Light mode'}</span>
    </button>
  )
}
