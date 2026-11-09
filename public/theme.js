/* Apply the portal's dark presentation before the application and styles load. */
(() => {
  document.documentElement.classList.toggle('dark', true)
  document.documentElement.classList.toggle('light', false)
  document.documentElement.style.colorScheme = 'dark'
  // Keep the shared interface available while theme selection is disabled.
  window.icsphereTheme = {
    getPreference: () => 'dark',
    setPreference() {},
    subscribe: () => () => {},
  }
})()
