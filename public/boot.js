// Bootstrap presentation is independent of authentication and application routes.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let appReady = false
  let introComplete = motion.matches
  let introStarted = false
  let introPreparing = false
  let hasBeenVisible = document.visibilityState !== 'hidden'
  let wasHidden = false
  let finishing = false
  let finished = false
  let animationFallback
  let imageFallback
  let exitFallback
  let recovery
  let reloadBound = false

  function finish() {
    if (finished) return
    finished = true
    window.clearTimeout(exitFallback)
    window.clearTimeout(animationFallback)
    window.clearTimeout(imageFallback)
    window.clearTimeout(recovery)
    document.getElementById('boot-splash')?.remove()
    const root = document.getElementById('root')
    root?.classList.add('boot-page-ready')
    root?.removeAttribute('inert')
    motion.removeEventListener('change', onMotionChange)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('pageshow', onPageShow)
  }

  function revealPage() {
    if (!appReady || !introComplete || finishing) return
    finishing = true
    window.clearTimeout(recovery)
    window.clearTimeout(animationFallback)
    const splash = document.getElementById('boot-splash')
    if (!splash || motion.matches) {
      finish()
      return
    }
    document.getElementById('root')?.classList.add('boot-page-ready')
    splash.addEventListener('transitionend', event => {
      if (event.target === splash && event.propertyName === 'opacity') finish()
    })
    splash.classList.add('boot-splash-ready')
    exitFallback = window.setTimeout(finish, 1100)
  }

  function completeIntro() {
    if (introComplete) return
    introComplete = true
    window.clearTimeout(animationFallback)
    window.clearTimeout(imageFallback)
    revealPage()
  }

  function onMotionChange() {
    if (!motion.matches) return
    completeIntro()
    if (finishing) finish()
  }
  motion.addEventListener('change', onMotionChange)

  function startIntro() {
    if (introPreparing || introStarted || introComplete || finished || document.visibilityState === 'hidden') return
    const splash = document.getElementById('boot-splash')
    if (!splash || motion.matches) {
      completeIntro()
      return
    }
    const image = splash.querySelector('.boot-wordmark img')
    introPreparing = true
    function play() {
      if (introStarted || introComplete || finishing) return
      window.clearTimeout(imageFallback)
      introStarted = true
      splash.addEventListener('animationend', event => {
        if (event.animationName === 'boot-brand-shimmer') completeIntro()
      })
      splash.classList.add('boot-splash-playing')
      // Safety timeout only; animationend normally controls the handoff.
      animationFallback = window.setTimeout(completeIntro, 4000)
    }
    if (image?.decode) {
      imageFallback = window.setTimeout(completeIntro, 4000)
      image.decode().then(play, completeIntro)
    }
    else play()
  }

  function hideRecovery() {
    const splash = document.getElementById('boot-splash')
    splash?.classList.remove('boot-splash-error')
    const message = splash?.querySelector('[data-boot-message]')
    if (message) message.textContent = 'Loading your student portal...'
    const retry = splash?.querySelector('button')
    if (retry) retry.hidden = true
  }

  function armRecovery() {
    window.clearTimeout(recovery)
    if (finished || finishing || appReady || document.visibilityState === 'hidden') return
    const expectedAt = Date.now() + 12000
    recovery = window.setTimeout(() => {
      if (finished || finishing || document.visibilityState === 'hidden') return
      // Sleep and throttled tabs can deliver overdue timers before startup resumes.
      if (appReady || Date.now() - expectedAt > 1500) {
        onResume()
        return
      }
      const splash = document.getElementById('boot-splash')
      if (!splash) return
      splash.classList.add('boot-splash-error')
      const message = splash.querySelector('[data-boot-message]')
      if (message) message.textContent = 'ICSphere has not finished starting. Reload to try again.'
      const retry = splash.querySelector('button')
      if (retry) {
        retry.hidden = false
        if (!reloadBound) {
          retry.addEventListener('click', () => window.location.reload())
          reloadBound = true
        }
      }
    }, 12000)
  }

  function onResume() {
    if (finished) return
    hideRecovery()
    if (appReady) {
      introComplete = true
      finishing = true
      finish()
    } else armRecovery()
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      wasHidden = hasBeenVisible
      window.clearTimeout(recovery)
      hideRecovery()
      return
    }
    hasBeenVisible = true
    if (wasHidden) {
      wasHidden = false
      onResume()
    } else {
      hideRecovery()
      armRecovery()
      if (document.readyState !== 'loading') startIntro()
    }
  }

  function onOnline() {
    hideRecovery()
    armRecovery()
  }

  function onPageShow(event) {
    if (event.persisted) onResume()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('online', onOnline)
  window.addEventListener('pageshow', onPageShow)
  armRecovery()

  window.addEventListener('icsphere:ready', () => {
    appReady = true
    window.clearTimeout(recovery)
    hideRecovery()
    revealPage()
  })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startIntro, { once: true })
  else startIntro()
})()
