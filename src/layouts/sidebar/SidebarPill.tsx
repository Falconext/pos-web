import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { animate, motion, stagger, useMotionValue, useTransform, type AnimationPlaybackControls } from 'framer-motion'

// Ítem de primer nivel activo: los NavLink traen aria-current; los acordeones,
// la clase is-active (un botón no recibe aria-current solo).
const ACTIVE_SELECTOR = '.krk-nav[aria-current="page"], .krk-nav.is-active'

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const
const EASE_BACK = [0.34, 2.2, 0.64, 1] as const

// offsetTop y no getBoundingClientRect: el panel usa `zoom` y los rects vienen
// escalados, mientras que top/height del estilo se escalan otra vez.
function offsetWithin(el: HTMLElement, container: HTMLElement) {
  let top = 0
  let left = 0
  let node: HTMLElement | null = el
  while (node && node !== container) {
    top += node.offsetTop
    left += node.offsetLeft
    node = node.offsetParent as HTMLElement | null
  }
  return node ? { top, left } : null
}

interface Props {
  containerRef: RefObject<HTMLElement | null>
  /** Cambia al navegar: dispara el deslizamiento animado. */
  routeKey: string
  collapsed: boolean
  reduceMotion: boolean
}

/**
 * Píldora que marca el ítem activo y se desliza al cambiar de ruta. Los dos
 * bordes viajan a distinta velocidad (el de adelante llega primero), así que en
 * el camino se estira y al llegar se encoge. El ícono del nuevo activo da un
 * pequeño salto.
 */
export default function SidebarPill({ containerRef, routeKey, collapsed, reduceMotion }: Props) {
  const top = useMotionValue(0)
  const bottom = useMotionValue(0)
  const left = useMotionValue(0)
  const width = useMotionValue(0)
  const height = useTransform(() => bottom.get() - top.get())
  const [visible, setVisible] = useState(false)
  const prev = useRef<{ top: number; el: HTMLElement } | null>(null)
  const running = useRef<AnimationPlaybackControls[]>([])

  const measure = useCallback((animated: boolean) => {
    const container = containerRef.current
    const el = container?.querySelector<HTMLElement>(ACTIVE_SELECTOR)
    const pos = container && el && el.offsetHeight ? offsetWithin(el, container) : null
    if (!el || !pos) {
      setVisible(false)
      prev.current = null
      return
    }
    const t = pos.top
    const b = pos.top + el.offsetHeight
    left.set(pos.left)
    width.set(el.offsetWidth)
    setVisible(true)

    const last = prev.current
    prev.current = { top: t, el }
    if (!animated || reduceMotion || !last || last.el === el) {
      // Solo cambió el layout (acordeón, resize): acompañar sin animar.
      if (!running.current.length) {
        top.set(t)
        bottom.set(b)
      }
      return
    }
    running.current.forEach((c) => c.stop())
    const down = t > last.top
    running.current = [
      animate(top, t, { duration: down ? 0.5 : 0.34, ease: down ? EASE_IN_OUT : EASE_OUT }),
      animate(bottom, b, { duration: down ? 0.34 : 0.5, ease: down ? EASE_OUT : EASE_IN_OUT }),
    ]
    Promise.all(running.current).then(() => { running.current = [] })

    const icon = el.querySelector('svg')
    if (icon) animate(icon, { scale: [0.7, 1], rotate: [-12, 0] }, { duration: 0.6, ease: EASE_BACK })
  }, [containerRef, reduceMotion, top, bottom, left, width])

  useLayoutEffect(() => { measure(true) }, [routeKey, measure])
  useLayoutEffect(() => { measure(false) }, [collapsed, measure])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => measure(false))
    Array.from(container.children).forEach((child) => ro.observe(child))
    document.fonts?.ready.then(() => measure(false))
    return () => ro.disconnect()
  }, [containerRef, measure])

  return (
    <motion.span
      aria-hidden
      className="krk-side__pill"
      style={{ top, height, left, width, opacity: visible ? 1 : 0 }}
    />
  )
}

/** Entrada en cascada de los ítems al abrir el menú en el celular. */
export function revealSidebarItems(container: HTMLElement | null) {
  if (!container) return
  const items = container.querySelectorAll('.krk-nav, .krk-side__group')
  if (!items.length) return
  animate(items, { opacity: [0, 1], x: [-12, 0] }, { duration: 0.4, ease: EASE_OUT, delay: stagger(0.018, { startDelay: 0.08 }) })
}
