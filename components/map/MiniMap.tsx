'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MiniMapProps {
  lat: number
  lng: number
  name: string
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    })

    new maplibregl.Marker({ color: '#15803D' })
      .setLngLat([lng, lat])
      .addTo(map)

    return () => map.remove()
  }, [lat, lng])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="img"
      aria-label={`Map showing location of ${name}`}
    />
  )
}
