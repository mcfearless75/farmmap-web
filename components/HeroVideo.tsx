'use client'

import { useEffect, useRef } from 'react'

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.play().catch(() => {/* autoplay blocked — video stays hidden */})
  }, [])

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: 0.22 }}
      aria-hidden="true"
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )
}
