import { useSyncExternalStore } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

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
const getSnapshot = () => window.icsphereTheme?.getPreference() ?? 'system'
const getServerSnapshot = () => 'system' as const

export function ThemeSelect() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return <div className="theme-select" role="group" aria-label="Color theme">
    {([{ value: 'light', label: 'Light', Icon: Sun }, { value: 'dark', label: 'Dark', Icon: Moon }, { value: 'system', label: 'System', Icon: Monitor }] as const).map(({ value, label, Icon }) =>
      <button key={value} type="button" aria-label={`${label} theme`} title={`${label} theme`} aria-pressed={preference === value} onClick={() => window.icsphereTheme?.setPreference(value)}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>)}
  </div>
}
