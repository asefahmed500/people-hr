"use client"

import * as React from "react"

type Theme = "light" | "dark"
type ThemeProviderProps = { children: React.ReactNode; defaultTheme?: Theme; storageKey?: string }

function getStoredTheme(key: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback
  try {
    const v = localStorage.getItem(key)
    if (v === "dark" || v === "light") return v
  } catch {}
  return fallback
}

function applyTheme(t: Theme) {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(t)
  document.documentElement.style.colorScheme = t
}

const ThemeCtx = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
})

export function useTheme() {
  return React.useContext(ThemeCtx)
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)

  React.useEffect(() => {
    const stored = getStoredTheme(storageKey, defaultTheme)
    setThemeState(stored)
    applyTheme(stored)
  }, [storageKey, defaultTheme])

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t)
      try { localStorage.setItem(storageKey, t) } catch {}
      applyTheme(t)
    },
    [storageKey],
  )

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}
