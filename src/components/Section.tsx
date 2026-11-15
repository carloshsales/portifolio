import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import styles from './Section.module.css'

type SectionProps = {
  id: string
  title: string
  children: ReactNode
}

export default function Section({ id, title, children }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false })

  const update = useCallback(() => {
    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    const { scrollHeight, clientHeight, scrollTop } = scroll
    const trackHeight = track.clientHeight

    if (scrollHeight <= clientHeight || trackHeight === 0) {
      setThumb({ height: 0, top: 0, visible: false })
      return
    }

    const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, 24)
    const maxScroll = scrollHeight - clientHeight
    const maxThumbTop = trackHeight - thumbHeight
    const thumbTop = (scrollTop / maxScroll) * maxThumbTop

    setThumb({ height: thumbHeight, top: thumbTop, visible: true })
  }, [])

  useEffect(() => {
    update()

    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    scroll.addEventListener('scroll', update)
    const observer = new ResizeObserver(update)
    observer.observe(scroll)
    observer.observe(track)

    return () => {
      scroll.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  const handleThumbMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const scroll = scrollRef.current
    const track = trackRef.current
    if (!scroll || !track) return

    const startY = event.clientY
    const startScrollTop = scroll.scrollTop
    const trackHeight = track.clientHeight
    const maxScroll = scroll.scrollHeight - scroll.clientHeight
    const maxThumbTop = trackHeight - thumb.height

    if (maxScroll <= 0 || maxThumbTop <= 0) return

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY
      const nextThumbTop = Math.min(
        Math.max(0, (startScrollTop / maxScroll) * maxThumbTop + deltaY),
        maxThumbTop,
      )
      scroll.scrollTop = (nextThumbTop / maxThumbTop) * maxScroll
    }

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-titulo`}>
      <div ref={scrollRef} className={styles.scroll} tabIndex={0}>
        <h2 id={`${id}-titulo`}>{title}</h2>
        {children}
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        aria-hidden="true"
        style={{ opacity: thumb.visible ? 1 : 0 }}
      >
        <div
          className={styles.thumb}
          style={{ height: `${thumb.height}px`, top: `${thumb.top}px` }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </section>
  )
}
