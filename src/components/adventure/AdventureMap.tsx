'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { MapAdventure } from './MapContent'

const MapContent = dynamic(
  () => import('./MapContent.tsx').then((mod) => mod.MapContent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
)

export function AdventureMap({ adventures }: { adventures?: MapAdventure[] }) {
  const searchParams = useSearchParams()
  const selectedStateCode = searchParams.get('state')?.toUpperCase() ?? null

  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      }
    >
      <MapContent selectedStateCode={selectedStateCode} adventures={adventures} />
    </Suspense>
  )
}
