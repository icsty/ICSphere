import { useSyncExternalStore } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

declare global {
  interface Window {
    icsphereTheme?: {
      getPreference: () => ThemePreference
      setPreference: (preference: ThemePreference) => void
      subscribe: (listener: () => void) => () => void
    }
  }
}

const subscribe = (listener: () => void) => window.icsphereTheme?.subscribe(listener) ?? (() => {})
const getSnapshot = () => window.icsphereTheme?.getPreference() ?? 'dark'
const getServerSnapshot = () => 'dark' as const

export function ThemeSelect() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return <div className="theme-select" role="group" aria-label="Color theme">
    {([{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }] as const).map(({ value, label }) =>
      <button key={value} type="button" aria-label={`${label} theme`} title={`${label} theme`} aria-pressed={preference === value} onClick={() => window.icsphereTheme?.setPreference(value)}>
        {label}
      </button>)}
  </div>
}
