'use client'

import dynamic from 'next/dynamic'

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false })

export default function ShopMiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return <MiniMap lat={lat} lng={lng} name={name} />
}
