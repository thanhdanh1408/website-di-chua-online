import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const motes = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: (index * 37 + 11) % 100,
  y: (index * 53 + 17) % 100,
  size: 2 + (index % 4),
  delay: -(index * 1.7),
  duration: 12 + (index % 6) * 2,
}))

export function AmbientEffects() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const glowRef = useRef<HTMLDivElement>(null)
  const rippleId = useRef(0)

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches) return
    let frame = 0
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        glowRef.current?.style.setProperty('--glow-x', `${event.clientX}px`)
        glowRef.current?.style.setProperty('--glow-y', `${event.clientY}px`)
      })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move) }
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = document.querySelectorAll<HTMLElement>('main section, main .page-heading, main article, main aside')
    if (reduce) { elements.forEach(el => el.classList.add('is-visible')); return }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: .08, rootMargin: '0px 0px -35px' })
    elements.forEach((el, index) => {
      el.classList.add('reveal-on-scroll')
      el.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 65}ms`)
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    const ripple = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest('button, .button, .ritual-card, .wish-card')
      if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const node = document.createElement('span')
      node.className = 'click-ripple'
      node.dataset.id = String(++rippleId.current)
      node.style.left = `${event.clientX}px`; node.style.top = `${event.clientY}px`
      document.body.appendChild(node)
      node.addEventListener('animationend', () => node.remove(), { once: true })
    }
    window.addEventListener('pointerdown', ripple)
    return () => window.removeEventListener('pointerdown', ripple)
  }, [])

  return <>
    <div className="scroll-progress" style={{ transform: `scaleX(${progress / 100})` }} />
    <div ref={glowRef} className="cursor-ambient" aria-hidden="true" />
    <div className="ambient-motes" aria-hidden="true">{motes.map(mote => <i key={mote.id} style={{ left:`${mote.x}%`, top:`${mote.y}%`, width:mote.size, height:mote.size, animationDelay:`${mote.delay}s`, animationDuration:`${mote.duration}s` }} />)}</div>
  </>
}
