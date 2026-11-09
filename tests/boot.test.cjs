const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function boot(reduced = false, initialVisibility = 'visible') {
  const timers = new Map()
  const events = {}
  const classes = new Set()
  const rootClasses = new Set()
  let removed = false
  let inert = true
  let clicked
  let reloaded = false
  let timerId = 0
  let now = 0
  let resolveImage
  let rejectImage
  const image = { decode: () => new Promise((resolve, reject) => { resolveImage = resolve; rejectImage = reject }) }
  const motion = {
    matches: reduced,
    addEventListener: (_name, callback) => { events.motion = callback },
    removeEventListener: () => { delete events.motion },
  }
  const message = { textContent: 'Loading your student portal...' }
  const button = { hidden: true, addEventListener: (_event, callback) => { clicked = callback } }
  const splash = {
    querySelector: selector => selector === 'button' ? button : selector === '.boot-wordmark img' ? image : message,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    addEventListener: (name, callback) => { events[name] = callback },
    remove: () => { removed = true },
  }
  const root = { classList: { add: name => rootClasses.add(name) }, removeAttribute: () => { inert = false } }
  const document = {
    readyState: 'complete', visibilityState: initialVisibility,
    getElementById: id => id === 'root' ? root : removed ? null : splash,
    addEventListener: (name, callback) => { events['document:' + name] = callback },
    removeEventListener: name => { delete events['document:' + name] },
  }
  vm.runInNewContext(fs.readFileSync('public/boot.js', 'utf8'), {
    window: {
      setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id },
      clearTimeout: id => timers.delete(id),
      addEventListener: (name, callback) => { events[name] = callback },
      removeEventListener: name => { delete events[name] },
      matchMedia: () => motion,
      location: { reload: () => { reloaded = true } },
    },
    document,
    Date: { now: () => now },
  })
  return {
    classes, rootClasses, message, button,
    ready: () => events['icsphere:ready'](),
    imageReady: async () => { resolveImage(); await Promise.resolve() },
    imageFailed: async () => { rejectImage(new Error('Image failed')); await Promise.resolve() },
    endAnimation: (name = 'boot-brand-shimmer') => events.animationend?.({ animationName: name }),
    endTransition: (propertyName = 'opacity') => events.transitionend?.({ propertyName, target: splash }),
    reducedMotion: () => { motion.matches = true; events.motion?.() },
    hide: () => { document.visibilityState = 'hidden'; events['document:visibilitychange']?.() },
    show: () => { document.visibilityState = 'visible'; events['document:visibilitychange']?.() },
    online: () => events.online?.(),
    focus: () => events.focus?.(),
    elapse: milliseconds => { now += milliseconds },
    click: () => clicked(),
    timerCount: delay => [...timers.values()].filter(timer => timer.delay === delay).length,
    runTimer: delay => {
      const entry = [...timers].find(([, timer]) => timer.delay === delay)
      assert.ok(entry, 'Expected a timer for ' + delay)
      timers.delete(entry[0])
      now += delay
      entry[1].callback()
    },
    get removed() { return removed }, get inert() { return inert }, get reloaded() { return reloaded },
  }
}

test('a fast mount waits for image decoding and the complete shine before crossfading', async () => {
  const h = boot()
  h.ready()
  assert.equal(h.classes.has('boot-splash-playing'), false)
  assert.equal(h.rootClasses.has('boot-page-ready'), false)
  await h.imageReady()
  assert.ok(h.classes.has('boot-splash-playing'))
  h.endAnimation('unrelated-animation')
  assert.equal(h.classes.has('boot-splash-ready'), false)
  h.endAnimation()
  assert.ok(h.classes.has('boot-splash-ready'))
  assert.ok(h.rootClasses.has('boot-page-ready'))
  assert.equal(h.classes.has('boot-splash-resolved'), false)
  assert.equal(h.inert, true)
  assert.equal(h.timerCount(4000), 0)
  h.endTransition('color')
  assert.equal(h.inert, true)
  h.endTransition()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
})

test('an earlier completed shine waits for the actual application mount', async () => {
  const h = boot()
  await h.imageReady()
  h.endAnimation()
  assert.equal(h.removed, false)
  assert.equal(h.rootClasses.has('boot-page-ready'), false)
  h.ready()
  assert.ok(h.classes.has('boot-splash-ready'))
  h.endTransition()
  assert.equal(h.inert, false)
})

test('missing animation events cannot leave a mounted app inaccessible', async () => {
  const h = boot()
  await h.imageReady()
  h.ready()
  h.runTimer(4000)
  assert.ok(h.classes.has('boot-splash-ready'))
  h.endTransition()
  assert.equal(h.inert, false)
})

test('a failed logo image does not block a mounted app', async () => {
  const h = boot()
  h.ready()
  await h.imageFailed()
  assert.ok(h.classes.has('boot-splash-ready'))
  h.endTransition()
  assert.equal(h.inert, false)
})

test('reduced motion skips image waiting, shine, and crossfade', () => {
  const h = boot(true)
  h.ready()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
  assert.equal(h.timerCount(1100), 0)
  assert.ok(h.rootClasses.has('boot-page-ready'))
})

test('switching to reduced motion during the shine releases a ready app immediately', async () => {
  const h = boot()
  await h.imageReady()
  h.ready()
  h.reducedMotion()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
})

test('a stalled boot reveals recovery guidance and a working reload action', () => {
  const h = boot()
  h.runTimer(12000)
  assert.equal(h.button.hidden, false)
  assert.match(h.message.textContent, /not finished starting/)
  assert.ok(h.classes.has('boot-splash-error'))
  h.click()
  assert.equal(h.reloaded, true)
})

test('repeated ready and animation events do not restart the transition', async () => {
  const h = boot()
  await h.imageReady()
  h.ready()
  h.endAnimation()
  h.ready()
  h.endAnimation()
  assert.equal(h.timerCount(1100), 1)
  h.endTransition()
  assert.doesNotThrow(h.ready)
})

test('a missing opacity transition event still releases the page safely', async () => {
  const h = boot()
  await h.imageReady()
  h.ready()
  h.endAnimation()
  h.runTimer(1100)
  assert.equal(h.inert, false)
  assert.equal(h.removed, true)
})

test('time spent in an inactive tab does not trigger a startup error on return', () => {
  const h = boot()
  h.hide()
  assert.equal(h.timerCount(12000), 0)
  h.elapse(180000)
  h.show()
  assert.equal(h.button.hidden, true)
  assert.equal(h.classes.has('boot-splash-error'), false)
  assert.equal(h.timerCount(12000), 1)
  h.runTimer(12000)
  assert.equal(h.button.hidden, false)
})

test('an overdue recovery timer after system sleep grants fresh startup time', () => {
  const h = boot()
  h.elapse(180000)
  h.runTimer(12000)
  assert.equal(h.button.hidden, true)
  assert.equal(h.classes.has('boot-splash-error'), false)
  assert.equal(h.timerCount(12000), 1)
})

test('returning to an already mounted app dismisses the splash without reloading', () => {
  const h = boot()
  h.ready()
  h.hide()
  h.elapse(180000)
  h.show()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
  assert.equal(h.reloaded, false)
  assert.equal(h.timerCount(12000), 0)
})

test('reconnecting clears an old warning and starts a fresh recovery window', () => {
  const h = boot()
  h.runTimer(12000)
  assert.equal(h.button.hidden, false)
  h.online()
  assert.equal(h.button.hidden, true)
  assert.equal(h.classes.has('boot-splash-error'), false)
  assert.equal(h.timerCount(12000), 1)
})

test('a stalled logo decode cannot block an already mounted app indefinitely', () => {
  const h = boot()
  h.ready()
  h.runTimer(4000)
  h.endTransition()
  assert.equal(h.inert, false)
  assert.equal(h.removed, true)
  assert.equal(h.button.hidden, true)
})

test('initial window focus does not dismiss a first-visit intro', async () => {
  const h = boot()
  h.ready()
  await h.imageReady()
  h.focus()
  assert.equal(h.removed, false)
  assert.equal(h.classes.has('boot-splash-ready'), false)
  h.endAnimation()
  h.endTransition()
  assert.equal(h.inert, false)
})

test('a connection event during startup does not skip the intro', async () => {
  const h = boot()
  h.ready()
  await h.imageReady()
  h.online()
  assert.equal(h.removed, false)
  assert.equal(h.classes.has('boot-splash-ready'), false)
})

test('an initial visible event is not mistaken for returning from inactivity', async () => {
  const h = boot()
  h.ready()
  await h.imageReady()
  h.show()
  assert.equal(h.removed, false)
  assert.equal(h.classes.has('boot-splash-ready'), false)
})

test('a first visit opened in a background tab waits to play until it is viewed', async () => {
  const h = boot(false, 'hidden')
  h.ready()
  assert.equal(h.classes.has('boot-splash-playing'), false)
  h.show()
  await h.imageReady()
  assert.equal(h.removed, false)
  assert.ok(h.classes.has('boot-splash-playing'))
  h.endAnimation()
  h.endTransition()
  assert.equal(h.inert, false)
})
