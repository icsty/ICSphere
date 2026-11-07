const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function boot(reduced = false) {
  const timers = new Map()
  const events = {}
  const classes = []
  let removed = false
  let inert = true
  let clicked
  let reloaded = false
  const message = { textContent: 'Loading your student portal...' }
  const button = { hidden: true, addEventListener: (_event, callback) => { clicked = callback } }
  const splash = { querySelector: selector => selector === 'button' ? button : message, classList: { add: name => classes.push(name) }, remove: () => { removed = true } }
  vm.runInNewContext(fs.readFileSync('public/boot.js', 'utf8'), {
    window: {
      setTimeout: (callback, delay) => { timers.set(delay, callback); return delay },
      clearTimeout: id => timers.delete(id),
      addEventListener: (name, callback) => { events[name] = callback },
      matchMedia: () => ({ matches: reduced }),
      location: { reload: () => { reloaded = true } },
    },
    document: { getElementById: id => id === 'root' ? { removeAttribute: () => { inert = false } } : removed ? null : splash },
  })
  return { timers, events, classes, message, button, click: () => clicked(), get removed() { return removed }, get inert() { return inert }, get reloaded() { return reloaded } }
}

test('slow boot reveals a working recovery button', () => {
  const h = boot()
  h.timers.get(12000)()
  assert.equal(h.button.hidden, false)
  assert.match(h.message.textContent, /Check your connection/)
  h.click()
  assert.equal(h.reloaded, true)
})

test('app readiness dismisses the splash with a short exit transition and releases the page', () => {
  const h = boot()
  h.events['icsphere:ready']()
  assert.equal(h.timers.has(12000), false)
  assert.ok(h.classes.includes('boot-splash-ready'))
  assert.equal(h.inert, true)
  h.timers.get(180)()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
  assert.doesNotThrow(() => h.events['icsphere:ready']())
})

test('reduced motion skips the splash exit animation immediately', () => {
  const h = boot(true)
  h.events['icsphere:ready']()
  assert.equal(h.removed, true)
  assert.equal(h.inert, false)
  assert.equal(h.timers.has(180), false)
})
