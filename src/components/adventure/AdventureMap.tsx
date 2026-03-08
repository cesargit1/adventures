'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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

export function AdventureMap() {
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
      <MapContent selectedStateCode={selectedStateCode} />
    </Suspense>
  )
}
