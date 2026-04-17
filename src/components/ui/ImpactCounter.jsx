import { useEffect, useRef, useState } from 'react'

/**
 * Animated numeric counter for the "Impact" row in Section 05.
 *
 * Counts from 0 up to `value` over `duration` ms the first time the
 * element scrolls into view. Honours prefers-reduced-motion by jumping
 * straight to the final value.
 *
 * Props:
 *   value    — final number (required)
 *   prefix   — optional string before the number (e.g. "$")
 *   suffix   — optional string after the number (e.g. "+")
 *   label    — caption below the number
 *   duration — animation length in ms (default 1400)
 *   tone     — 'light' | 'dark' (default 'light')
 *   align    — 'center' | 'left' (default 'center')
 */
export default function ImpactCounter({
  value,
  prefix   = '',
  suffix   = '',
  label,
  duration = 1400,
  tone     = 'light',
  align    = 'center',
}) {
  const ref = useRef(null)
  const [current, setCurrent] = useState(0)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || hasRun) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      setCurrent(value)
      setHasRun(true)
      return
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setHasRun(true)
          const start = performance.now()
          const tick = now => {
            const t = Math.min(1, (now - start) / duration)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3)
            setCurrent(Math.round(value * eased))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          observer.disconnect()
        }
      })
    }, { threshold: 0.4 })

    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration, hasRun])

  return (
    <div ref={ref} className={`impact impact--${tone} impact--${align}`}>
      <div className="impact__number">
        {prefix}
        <span>{current.toLocaleString()}</span>
        {suffix}
      </div>
      {label && <div className="impact__label">{label}</div>}

      <style>{`
        .impact {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .impact--center { align-items: center; text-align: center; }
        .impact--left   { align-items: flex-start; text-align: left; }

        .impact__number {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(40px, 6vw, 64px);
          line-height: 1;
          letter-spacing: -1px;
          background: linear-gradient(135deg, var(--purple) 0%, var(--gold) 120%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .impact--dark .impact__number {
          background: linear-gradient(135deg, var(--gold) 0%, #ffe9ac 120%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .impact__label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(13, 33, 55, 0.65);
        }
        .impact--dark .impact__label { color: rgba(255, 255, 255, 0.68); }
      `}</style>
    </div>
  )
}
