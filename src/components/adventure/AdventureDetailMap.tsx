'use client'

import dynamic from 'next/dynamic'

const MapInner = dynamic(
  () => import('./AdventureDetailMapInner').then((mod) => mod.AdventureDetailMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500 text-sm">Loading map…</p>
      </div>
    ),
  }
)

type Props = {
  locationName: string
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
}

export function AdventureDetailMap(props: Props) {
  return <MapInner {...props} />
}
