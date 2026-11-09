import { useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'

export function LandingMobileNavigation({ onNavigate, sections }: { onNavigate: (id: string) => void; sections: readonly { id: string; label: string }[] }) {
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const details = menu.current
    if (!details) return
    const mobile = window.matchMedia('(max-width: 700px)')

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !details!.contains(event.target)) details!.open = false
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !details!.open) return
      event.preventDefault()
      details!.open = false
      details!.querySelector('summary')?.focus()
    }
    function onResize() {
      if (mobile.matches) return
      const focused = details!.open || details!.contains(document.activeElement)
      details!.open = false
      if (focused) document.querySelector<HTMLButtonElement>('.landing-navigation button')?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    mobile.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      mobile.removeEventListener('change', onResize)
    }
  }, [])

  function navigate(id: string) {
    if (menu.current) menu.current.open = false
    onNavigate(id)
  }

  return <details className="landing-mobile-menu" ref={menu}>
    <summary aria-label="Navigation menu" aria-controls="landing-mobile-links">
      <Menu className="ui-icon menu-open-icon" aria-hidden="true" />
      <X className="ui-icon menu-close-icon" aria-hidden="true" />
    </summary>
    <div className="landing-mobile-panel">
      <div className="entrance-width">
        <nav id="landing-mobile-links" aria-label="Mobile navigation">
          {sections.map(section => <button key={section.id} onClick={() => navigate(section.id)}>{section.label}</button>)}
        </nav>
        <p className="landing-mobile-institution">Institute of Computer Studies<br />Rizal Technological University</p>
      </div>
    </div>
  </details>
}
