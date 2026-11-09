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

test('first paint is dark regardless of saved preference, system theme, or blocked storage', () => {
  for (const saved of [null, 'invalid', 'light', 'system', 'dark']) {
    for (const dark of [false, true]) {
      for (const blocked of [false, true]) {
        const h = boot({ saved, dark, blocked })
        assert.equal(h.store.getPreference(), 'dark')
        assert.ok(h.classes.has('dark'))
        assert.ok(!h.classes.has('light'))
      }
    }
  }
})

test('theme switching is disabled while the portal uses a fixed dark presentation', () => {
  const h = boot({ saved: 'light' })
  for (const preference of ['light', 'system', 'dark']) {
    h.store.setPreference(preference)
    assert.equal(h.store.getPreference(), 'dark')
    assert.ok(h.classes.has('dark'))
  }
  assert.equal(h.writes.length, 0)
  assert.equal(h.events.system, undefined)
  assert.equal(h.events.storage, undefined)
  const unsubscribe = h.store.subscribe(() => assert.fail('A fixed theme must not emit changes'))
  unsubscribe()
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
