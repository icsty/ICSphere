export const studentPages = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/schedule', label: 'My schedule' },
  { path: '/announcements', label: 'Announcements' },
  { path: '/enrollment', label: 'Enrollment information' },
  { path: '/resources', label: 'Academic resources' },
  { path: '/profile', label: 'My profile' },
] as const

export function readRoute(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

export function navigate(path: string, replace = false) {
  if (replace) window.history.replaceState(window.history.state, '', path)
  else window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function resolveScreen(route: string, development: boolean, signedIn: boolean, approved = false, administrator = false) {
  const preview = development && route.startsWith('/preview/')
  const path = preview ? route.slice('/preview'.length) : route
  const known = ['/onboarding', '/verification', '/admin/registrations', ...studentPages.map(page => page.path)].includes(path)
  if (!known) return { path, preview: false, access: 'missing' as const }
  if (preview && path !== '/admin/registrations') return { path, preview, access: 'screen' as const }
  if (!signedIn) return { path, preview, access: 'signin' as const }
  if (path === '/onboarding' || path === '/verification') return { path, preview, access: 'screen' as const }
  if (path === '/admin/registrations' && administrator) return { path, preview: false, access: 'screen' as const }
  if (path !== '/admin/registrations' && approved) return { path, preview, access: 'screen' as const }
  return { path, preview, access: 'restricted' as const }
}
