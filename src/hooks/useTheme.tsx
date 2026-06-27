import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Temă light/dark pentru portal. Scrie `data-theme` pe <html>, persistă în
// localStorage. Frontend pur — niciun efect pe backend.

type Theme = 'light' | 'dark'

type ThemeValue = {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined)

const LS_KEY = 'qapp-membri:theme'

function initialTheme(): Theme {
  const saved = localStorage.getItem(LS_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(LS_KEY, theme)
  }, [theme])

  const value = useMemo<ThemeValue>(
    () => ({ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme trebuie folosit în interiorul <ThemeProvider>')
  return ctx
}
