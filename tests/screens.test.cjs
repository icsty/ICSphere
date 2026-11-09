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
const { ApplicantLayout } = load('src/components/ApplicantLayout.tsx')
const { Onboarding, Verification } = load('src/pages/ApplicantScreens.tsx')
const auth = { session: null, loading: false, action: null, configured: true, message: '', signIn() {}, signOut() {} }

test('all academic routes remain restricted to signed-in but unverified users', () => {
  for (const path of ['/dashboard', '/schedule', '/announcements', '/enrollment', '/resources', '/profile']) {
    assert.equal(resolveScreen(path, false, true).access, 'restricted')
    assert.equal(resolveScreen(path, false, false).access, 'signin')
  }
})

test('trusted approval unlocks student routes while administrator review requires an administrator', () => {
  assert.equal(resolveScreen('/dashboard', false, true, true, false).access, 'screen')
  assert.equal(resolveScreen('/admin/registrations', false, true, true, false).access, 'restricted')
  assert.equal(resolveScreen('/admin/registrations', false, true, false, true).access, 'screen')
  assert.equal(resolveScreen('/admin/registrations', true, false).access, 'signin')
})

test('saved application states expose the corresponding action without inventing approval', () => {
  for (const status of ['pending','approved','rejected','deactivated']) {
    const registration={data:{application:{status,personal:{studentNumber:'2020-000001'},submitted_at:'2026-01-01',review_reason:status==='rejected' ? 'Provide a readable official form.':null}},loading:false,error:'',refresh(){}}
    const html=renderToStaticMarkup(createElement(Verification,{preview:false,auth,registration}))
    assert.match(html,new RegExp(`registration-status--${status}`))
    assert.equal(/href="\/dashboard"/.test(html),status==='approved')
    assert.equal(/href="\/onboarding"/.test(html),status==='rejected')
    if(status==='rejected')assert.match(html,/Provide a readable official form/)
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

test('applicant layout exposes registration and status without academic navigation', () => {
  const html = renderToStaticMarkup(createElement(ApplicantLayout, { auth, path: '/onboarding', preview: false }, createElement(StudentScreen, { path: '/onboarding', auth, preview: false })))
  assert.match(html, /Complete your student registration/)
  assert.match(html, /href="\/verification"/)
  assert.doesNotMatch(html, /href="\/(?:dashboard|schedule|announcements|enrollment|resources|profile)"/)
  assert.doesNotMatch(html, /Academic workspace|Student workspace|workspace-sidebar|Document upload not yet available/)
  assert.match(html, /<dt>Google account<\/dt><dd>/)
  assert.match(html, /<dt>Program<\/dt><dd>/)
})

test('clean pathname routes support direct links and trailing slashes', () => {
  assert.equal(readRoute('/'), '/')
  assert.equal(readRoute('/schedule/'), '/schedule')
  assert.equal(readRoute('/preview/dashboard'), '/preview/dashboard')
  assert.equal(readRoute('/unknown'), '/unknown')
})

test('student registration blocks accounts outside the supplied institutional email format', () => {
  const html = renderToStaticMarkup(createElement(Onboarding, {
    auth: { ...auth, session: { user: { email: 'student@example.com' } } }, preview: false,
  }))
  assert.match(html, /Use your RTU student account/)
  assert.doesNotMatch(html, /id="student-name"|id="student-number"/)
})

test('institutional accounts see the registration fields and the actual program code', () => {
  const html = renderToStaticMarkup(createElement(Onboarding, {
    auth: { ...auth, session: { user: { email: '2020-000001@rtu.edu.ph' } } }, preview: false,
  }))
  for (const field of ['lastName','firstName','middleName','suffix']) assert.match(html, new RegExp(`id="student-${field}"`))
  assert.doesNotMatch(html, /id="student-name"/)
  assert.match(html, /id="student-number"/)
  assert.match(html, /BSINFOTECH/)
  assert.doesNotMatch(html, /type="file"|Application submitted|Application approved/)
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
    assert.equal(button.props.children, label.replace(' theme', ''))
    assert.equal(button.props['aria-pressed'], value === 'dark')
    button.props.onClick()
  }
  assert.deepEqual(changes, ['light', 'dark', 'system'])
})

test('editorial landing exposes all four tools without tabs or hidden panels', () => {
  const html = renderToStaticMarkup(createElement(LandingPage, { auth }));
  for (const title of ['My Schedule', 'Announcements', 'Enrollment Information', 'Academic Resources']) assert.ok(html.includes(title));
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"/);
  assert.match(html, /An administrator must review your application/);
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
