// Bootstrap splash lifecycle is independent of authentication and application routes.
(() => {
  let finishing = false
  const recovery = window.setTimeout(() => {
    const splash = document.getElementById('boot-splash')
    if (!splash || finishing) return
    const message = splash.querySelector('[data-boot-message]')
    if (message) message.textContent = 'ICSphere is taking longer to load. Check your connection and try again.'
    const retry = splash.querySelector('button')
    if (retry) {
      retry.hidden = false
      retry.addEventListener('click', () => window.location.reload())
    }
  }, 12000)

  window.addEventListener('icsphere:ready', () => {
    if (finishing) return
    finishing = true
    window.clearTimeout(recovery)
    const splash = document.getElementById('boot-splash')
    function finish() {
      splash?.remove()
      document.getElementById('root')?.removeAttribute('inert')
    }
    if (!splash || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    splash.classList.add('boot-splash-ready')
    window.setTimeout(finish, 180)
  })
})()
