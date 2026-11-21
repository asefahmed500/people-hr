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
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark"
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
  // Read the theme synchronously so the first client render matches the class
  // the inline init script already applied — avoids a light-theme flash.
  const [theme, setThemeState] = React.useState<Theme>(() => getStoredTheme(storageKey, defaultTheme))

  React.useEffect(() => {
    applyTheme(theme)
  }, [theme])

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
