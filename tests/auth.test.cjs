const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Exercise lifecycle and async failures without contacting the live project.
const source = ts.transpileModule(fs.readFileSync('src/hooks/useAuth.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function harness({ configured = true, href = 'http://localhost:5173/', getSession, signIn, signOut } = {}) {
  const states = []
  const effects = []
  const listeners = {}
  const location = new URL(href)
  const redirects = []
  const replacements = []
  let onAuth
  let unsubscribed = false
  let signInCalls = 0
  const client = { auth: {
    onAuthStateChange(callback) { onAuth = callback; return { data: { subscription: { unsubscribe() { unsubscribed = true } } } } },
    getSession: getSession || (async () => ({ data: { session: null }, error: null })),
    async signInWithOAuth(options) { signInCalls++; return signIn ? signIn(options) : { data: { url: 'https://example.test/oauth' }, error: null } },
    signOut: signOut || (async () => ({ error: null })),
  } }
  const module = { exports: {} }
  vm.runInNewContext(source, {
    exports: module.exports, URL, URLSearchParams,
    window: {
      location: { href, search: location.search, hash: location.hash, origin: location.origin, assign: url => redirects.push(url) },
      history: { state: null, replaceState: (_state, _title, url) => replacements.push(url) },
      addEventListener: (name, fn) => { listeners[name] = fn },
      removeEventListener: name => { delete listeners[name] },
    },
    require(name) {
      if (name === '../lib/supabase') return { supabase: configured ? client : null }
      if (name === 'react') return {
        useState(initial) { const index = states.length; states.push(initial); return [initial, next => { states[index] = next }] },
        useRef: current => ({ current }),
        useEffect: callback => effects.push(callback),
      }
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  const auth = module.exports.useAuth()
  const cleanups = effects.map(effect => effect())
  return {
    auth, states, redirects, replacements, listeners,
    event: next => onAuth('SIGNED_IN', next),
    cleanup: () => cleanups.forEach(cleanup => cleanup?.()),
    get unsubscribed() { return unsubscribed },
    get signInCalls() { return signInCalls },
  }
}

const flush = () => new Promise(resolve => setImmediate(resolve))

test('missing configuration leaves the public page available without auth requests', () => {
  const h = harness({ configured: false })
  assert.equal(h.auth.configured, false)
  assert.equal(h.states[1], false)
  h.cleanup()
})

test('restores a session and cleans up subscriptions', async () => {
  const session = { user: { id: 'student' } }
  const h = harness({ getSession: async () => ({ data: { session }, error: null }) })
  await flush()
  assert.equal(h.states[0], session)
  assert.equal(h.states[1], false)
  h.cleanup()
  assert.equal(h.unsubscribed, true)
})

test('new auth events take precedence over a stale initial session read', async () => {
  let complete
  const h = harness({ getSession: () => new Promise(resolve => { complete = resolve }) })
  const session = { user: { id: 'new-session' } }
  h.event(session)
  complete({ data: { session: null }, error: null })
  await flush()
  assert.equal(h.states[0], session)
})

test('cancelled OAuth shows safe retry feedback and removes callback errors', async () => {
  const h = harness({ href: 'http://localhost:5173/?error=access_denied&error_description=private-detail#student-access' })
  await flush()
  assert.match(h.states[3], /try Google sign-in again/)
  assert.doesNotMatch(h.states[3], /private-detail/)
  assert.equal(h.replacements[0], '/#student-access')
})

test('Google sign-in uses the current root and blocks duplicate clicks', async () => {
  const h = harness({ signIn: async options => {
    assert.equal(options.provider, 'google')
    assert.equal(options.options.redirectTo, 'http://localhost:5173/')
    return { data: { url: 'https://example.test/oauth' }, error: null }
  } })
  await Promise.all([h.auth.signIn(), h.auth.signIn()])
  assert.equal(h.signInCalls, 1)
  assert.equal(h.redirects[0], 'https://example.test/oauth')
  h.listeners.pageshow({ persisted: true })
  assert.equal(h.states[2], null)
})

test('provider failures release the action lock for retry', async () => {
  const h = harness({ signIn: async () => { throw new Error('private provider detail') } })
  await h.auth.signIn()
  assert.equal(h.states[2], null)
  assert.match(h.states[3], /try again/)
  await h.auth.signIn()
  assert.equal(h.signInCalls, 2)
})

test('sign-out is local and clears the displayed session', async () => {
  const h = harness({ signOut: async options => {
    assert.equal(options.scope, 'local')
    return { error: null }
  } })
  await flush()
  h.event({ user: { id: 'student' } })
  await h.auth.signOut()
  assert.equal(h.states[0], null)
  assert.match(h.states[3], /signed out/)
})

test('failed sign-out preserves the session and provides retry feedback', async () => {
  const h = harness({ signOut: async () => ({ error: new Error('network') }) })
  await flush()
  const session = { user: { id: 'student' } }
  h.event(session)
  await h.auth.signOut()
  assert.equal(h.states[0], session)
  assert.equal(h.states[2], null)
  assert.match(h.states[3], /could not sign you out/)
})
