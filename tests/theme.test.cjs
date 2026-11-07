const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function boot({ saved = null, dark = false, blocked = false } = {}) {
  const classes = new Set()
  const events = {}
  const writes = []
  const media = { matches: dark, addEventListener: (_name, listener) => { events.system = listener } }
  const storage = {
    getItem() { if (blocked) throw new Error('Storage blocked'); return saved },
    setItem(key, value) { if (blocked) throw new Error('Storage blocked'); writes.push([key, value]) },
  }
  const window = { matchMedia: () => media, localStorage: storage, addEventListener: (name, listener) => { events[name] = listener } }
  vm.runInNewContext(fs.readFileSync('public/theme.js', 'utf8'), {
    window,
    document: { documentElement: { style: {}, classList: { toggle: (name, enabled) => { if (enabled) classes.add(name); else classes.delete(name) } } } },
  })
  return { store: window.icsphereTheme, classes, media, events, writes, storage }
}

test('first paint uses the system preference when no valid setting exists', () => {
  for (const saved of [null, 'invalid']) {
    const h = boot({ saved, dark: true })
    assert.equal(h.store.getPreference(), 'system')
    assert.ok(h.classes.has('dark'))
    assert.ok(!h.classes.has('light'))
  }
})

test('saved manual preference overrides system at startup', () => {
  const h = boot({ saved: 'light', dark: true })
  assert.ok(h.classes.has('light'))
  assert.equal(h.store.getPreference(), 'light')
})

test('theme changes persist and notify subscribers; unsubscribe works', () => {
  const h = boot()
  let count = 0
  const unsubscribe = h.store.subscribe(() => { count++ })
  h.store.setPreference('dark')
  assert.ok(h.classes.has('dark'))
  assert.deepEqual(h.writes[0], ['icsphere.theme', 'dark'])
  assert.equal(count, 1)
  unsubscribe()
  h.store.setPreference('light')
  assert.equal(count, 1)
  assert.ok(h.classes.has('light'))
})

test('system changes apply only while System is selected', () => {
  const h = boot()
  h.media.matches = true
  h.events.system()
  assert.ok(h.classes.has('dark'))
  h.store.setPreference('light')
  h.events.system()
  assert.ok(h.classes.has('light'))
  h.store.setPreference('system')
  assert.ok(h.classes.has('dark'))
})

test('blocked storage still allows in-memory theme switching', () => {
  const h = boot({ blocked: true })
  h.store.setPreference('dark')
  assert.equal(h.store.getPreference(), 'dark')
  assert.ok(h.classes.has('dark'))
})

test('other tabs synchronize preferences and clearing storage restores System', () => {
  const h = boot({ saved: 'light', dark: true })
  h.events.storage({ key: 'icsphere.theme', newValue: 'dark', storageArea: h.storage })
  assert.equal(h.store.getPreference(), 'dark')
  h.events.storage({ key: null, newValue: null, storageArea: h.storage })
  assert.equal(h.store.getPreference(), 'system')
  assert.ok(h.classes.has('dark'))
})

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}

test('theme text, action labels, and semantic statuses meet AA contrast', () => {
  const css = fs.readFileSync('src/styles/tokens.css', 'utf8')
  const blocks = [...css.matchAll(/:root(?:\.dark)?\s*\{([^}]+)\}/g)]
  const tokens = {}
  for (const [index, block] of blocks.entries()) {
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[name] = value.trim()
    function resolve(name) {
      const value = tokens[name]
      return value.startsWith('var(') ? resolve(value.slice(4, -1)) : value
    }
    const pairs = [
      ['--foreground', '--background'], ['--foreground', '--surface'],
      ['--muted-foreground', '--background'], ['--muted-foreground', '--surface'],
      ['--secondary-foreground', '--surface-muted'], ['--link', '--surface'], ['--link', '--primary-subtle'],
      ['--primary-foreground', '--primary-action'], ['--primary-foreground', '--primary-hover'],
      ['--success', '--success-subtle'], ['--warning', '--warning-subtle'],
      ['--danger', '--danger-subtle'], ['--info', '--info-subtle'],
    ]
    for (const [foreground, background] of pairs) {
      const values = [luminance(resolve(foreground)), luminance(resolve(background))].sort((a, b) => a - b)
      const ratio = (values[1] + .05) / (values[0] + .05)
      assert.ok(ratio >= 4.5, `${index === 0 ? 'light' : 'dark'} ${foreground}/${background}: ${ratio.toFixed(2)}`)
    }
    for (const [foreground, background] of [['--primary', '--surface'], ['--input-border', '--surface']]) {
      const values = [luminance(resolve(foreground)), luminance(resolve(background))].sort((a, b) => a - b)
      assert.ok((values[1] + .05) / (values[0] + .05) >= 3, `${foreground} control/focus contrast`)
    }
  }
})
