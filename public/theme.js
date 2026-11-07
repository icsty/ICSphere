/* Loaded before the application to apply the saved theme before first paint. */
(() => {
  const key = 'icsphere.theme'
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const listeners = new Set()
  const valid = value => ['light', 'dark', 'system'].includes(value)
  let preference = 'system'
  try {
    const saved = window.localStorage.getItem(key)
    if (valid(saved)) preference = saved
  } catch { /* Storage may be disabled; retain an in-memory preference. */ }

  function apply() {
    const dark = preference === 'dark' || (preference === 'system' && media.matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    listeners.forEach(listener => listener())
  }

  window.icsphereTheme = {
    getPreference: () => preference,
    setPreference(value) {
      if (!valid(value)) return
      preference = value
      try { window.localStorage.setItem(key, value) } catch { /* In-memory mode. */ }
      apply()
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  }
  media.addEventListener('change', () => { if (preference === 'system') apply() })
  window.addEventListener('storage', event => {
    if ((event.key === key || event.key === null) && (!event.storageArea || event.storageArea === window.localStorage)) {
      preference = valid(event.newValue) ? event.newValue : 'system'
      apply()
    }
  })
  apply()
})()
