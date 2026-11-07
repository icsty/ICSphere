const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const path = require('node:path')
const { renderToStaticMarkup } = require('react-dom/server')
const { createElement } = require('react')

function load(file, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exported = {}
  function localRequire(name) {
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(file), name)
      const source = [target, `${target}.ts`, `${target}.tsx`].find(candidate => fs.existsSync(candidate))
      if (source) return load(source)
    }
    return require(name)
  }
  vm.runInNewContext(code, { exports: exported, require: localRequire, ...globals })
  return exported
}

const { resolveScreen, readRoute } = load('src/lib/navigation.ts')
const { default: LandingPage } = load('src/pages/LandingPage.tsx')
const { StudentScreen } = load('src/pages/StudentScreens.tsx')
const auth = { session: null, loading: false, action: null, configured: true, message: '', signIn() {}, signOut() {} }

test('all academic routes remain restricted to signed-in but unverified users', () => {
  for (const path of ['/dashboard', '/schedule', '/announcements', '/enrollment', '/resources', '/profile']) {
    assert.equal(resolveScreen(path, false, true).access, 'restricted')
    assert.equal(resolveScreen(path, false, false).access, 'signin')
  }
})

test('previews are development-only, including guessed URLs in production', () => {
  assert.equal(resolveScreen('/preview/dashboard', false, true).access, 'missing')
  assert.equal(resolveScreen('/preview/dashboard', false, false).access, 'missing')
  assert.equal(resolveScreen('/preview/dashboard', true, false).access, 'screen')
  assert.equal(resolveScreen('/preview/unknown', true, false).access, 'missing')
})

test('onboarding and verification require sign-in outside previews', () => {
  for (const path of ['/onboarding', '/verification']) {
    assert.equal(resolveScreen(path, false, false).access, 'signin')
    assert.equal(resolveScreen(path, false, true).access, 'screen')
  }
})

test('clean pathname routes support direct links and trailing slashes', () => {
  assert.equal(readRoute('/'), '/')
  assert.equal(readRoute('/schedule/'), '/schedule')
  assert.equal(readRoute('/preview/dashboard'), '/preview/dashboard')
  assert.equal(readRoute('/unknown'), '/unknown')
})

test('navigation uses browser history and emits route updates without fragments', () => {
  const calls = []
  const events = []
  const { navigate } = load('src/lib/navigation.ts', {
    window: {
      history: {
        state: null,
        pushState: (_state, _title, path) => calls.push(['push', path]),
        replaceState: (_state, _title, path) => calls.push(['replace', path]),
      },
      dispatchEvent: event => events.push(event.type),
    },
    PopStateEvent: class { constructor(type) { this.type = type } },
  })
  navigate('/preview/dashboard')
  navigate('/onboarding', true)
  navigate('/', true)
  assert.deepEqual(calls, [['push', '/preview/dashboard'], ['replace', '/onboarding'], ['replace', '/']])
  assert.deepEqual(events, ['popstate', 'popstate', 'popstate'])
})

test('landing and student screen links contain no fragments', () => {
  const landing = renderToStaticMarkup(createElement(LandingPage, { auth }))
  assert.doesNotMatch(landing, /href="[^"]*#/)
  for (const path of ['/onboarding', '/verification', '/dashboard']) {
    const html = renderToStaticMarkup(createElement(StudentScreen, { path, auth, preview: true }))
    assert.doesNotMatch(html, /href="[^"]*#/)
  }
})

function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  const children = node.props?.children
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const match = findElement(child, predicate)
    if (match) return match
  }
  return null
}

test('Continue with Google calls sign-in directly rather than using a scroll anchor', () => {
  let calls = 0
  const tree = LandingPage({ auth: { ...auth, signIn() { calls++ } } })
  const cta = findElement(tree, node => node.props?.children === 'Continue with Google')
  assert.equal(cta.type, 'button')
  assert.equal(cta.props.href, undefined)
  cta.props.onClick()
  assert.equal(calls, 1)
})

test('theme buttons expose the selected preference and call the shared controller', () => {
  const changes = []
  const { ThemeSelect } = load('src/components/ThemeSelect.tsx', {
    require(name) {
      if (name === 'react') return { useSyncExternalStore: () => 'dark' }
      return require(name)
    },
    window: { icsphereTheme: { setPreference: value => changes.push(value) } },
  })
  const tree = ThemeSelect()
  assert.equal(tree.props.role, 'group')
  for (const value of ['light', 'dark', 'system']) {
    const label = `${value[0].toUpperCase()}${value.slice(1)} theme`
    const button = findElement(tree, node => node.props?.['aria-label'] === label)
    assert.equal(button.type, 'button')
    assert.equal(button.props['aria-pressed'], value === 'dark')
    button.props.onClick()
  }
  assert.deepEqual(changes, ['light', 'dark', 'system'])
})

test('editorial landing exposes all four tools without tabs or hidden panels', () => {
  const html = renderToStaticMarkup(createElement(LandingPage, { auth }));
  for (const title of ['My Schedule', 'Announcements', 'Enrollment Information', 'Academic Resources']) assert.ok(html.includes(title));
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"/);
  assert.match(html, /These features are not available yet/);
});

test('closing sign-in calls OAuth directly', () => {
  let calls = 0;
  const tree = LandingPage({ auth: { ...auth, signIn() { calls++; } } });
  const closing = findElement(tree, node => node.props?.className === 'editorial-closing');
  const button = findElement(closing, node => node.type === 'button');
  button.props.onClick();
  assert.equal(calls, 1);
});

test('all primary screens render meaningful headings and no demo academic records', () => {
  for (const path of ['/onboarding', '/verification', '/dashboard', '/schedule', '/announcements', '/enrollment', '/resources', '/profile']) {
    const html = renderToStaticMarkup(createElement(StudentScreen, { path, auth, preview: true }))
    assert.match(html, /<h1/)
    assert.doesNotMatch(html, /Application approved|Pending administrator review|CS101/)
  }
})

test('verification does not claim an application was submitted', () => {
  const html = renderToStaticMarkup(createElement(StudentScreen, { path: '/verification', auth, preview: true }))
  assert.match(html, /No application submitted/)
  assert.match(html, /registration has not been submitted/)
})
