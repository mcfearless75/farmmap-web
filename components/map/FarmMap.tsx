'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Shop } from '@/lib/types'
import { truncate } from '@/lib/utils'

interface FarmMapProps {
  shops: Pick<Shop, 'id' | 'name' | 'slug' | 'latitude' | 'longitude' | 'town' | 'county' | 'product_categories' | 'verified'>[]
  onShopClick?: (slug: string) => void
}

// Build a GeoJSON source from shop data
function shopsToGeoJSON(shops: FarmMapProps['shops']): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: shops
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.longitude!, s.latitude!],
        },
        properties: {
          id: s.id,
          name: s.name,
          slug: s.slug,
          town: s.town,
          county: s.county,
          verified: s.verified,
          categories: s.product_categories.slice(0, 3).join(', '),
        },
      })),
  }
}

// UK/Ireland bounds: [west, south, east, north]
const BOUNDS: maplibregl.LngLatBoundsLike = [-10.6, 49.9, 2.1, 60.9]

export default function FarmMap({ shops, onShopClick }: FarmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  const handleClick = useCallback(
    (slug: string) => onShopClick?.(slug),
    [onShopClick]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      bounds: BOUNDS,
      fitBoundsOptions: { padding: 20 },
    })

    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }), 'top-right')

    map.on('load', () => {
      // Add shops source with clustering
      map.addSource('shops', {
        type: 'geojson',
        data: shopsToGeoJSON(shops),
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      })

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'shops',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#2d6a4f', 10,
            '#1b4332', 30,
            '#081c15',
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            20, 10,
            26, 30,
            32,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      })

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'shops',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      // Individual shop pins
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'shops',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['get', 'verified'], '#e76f51',
            '#2d6a4f',
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#fff',
        },
      })

      // Click on cluster — zoom in
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        if (!features.length) return
        const clusterId = features[0].properties.cluster_id
        const source = map.getSource('shops') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
          map.easeTo({ center: coords, zoom })
        })
      })

      // Click on individual shop — show popup
      map.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return
        const props = e.features[0].properties
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]

        if (popupRef.current) popupRef.current.remove()

        const el = document.createElement('div')
        el.className = 'p-3'
        el.innerHTML = `
          <div class="font-semibold text-sm text-gray-900 mb-0.5">${props.name}</div>
          <div class="text-xs text-gray-500 mb-1">${props.town}${props.county ? ', ' + props.county : ''}</div>
          ${props.categories ? `<div class="text-xs text-green-700 mb-2">${props.categories}</div>` : ''}
          <a href="/shop/${props.slug}" class="inline-block text-xs bg-green-700 text-white px-3 py-1.5 rounded-full hover:bg-green-800 transition-colors">View listing →</a>
        `

        const popup = new maplibregl.Popup({ offset: 12, maxWidth: '280px' })
          .setLngLat(coords)
          .setDOMContent(el)
          .addTo(map)

        popupRef.current = popup

        el.querySelector('a')?.addEventListener('click', (ev) => {
          if (onShopClick) {
            ev.preventDefault()
            handleClick(props.slug)
          }
        })
      })

      // Cursors
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update source data when shops change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('shops') as maplibregl.GeoJSONSource | undefined
    source?.setData(shopsToGeoJSON(shops))
  }, [shops])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
