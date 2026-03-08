'use client'

import { AdventuresList, type AdventureListItem } from '@/components/adventure/AdventuresList'

export type MyAdventureListItem = AdventureListItem

export function ProfileMyAdventuresContent({
  adventures,
  error,
}: {
  adventures: MyAdventureListItem[]
  error?: string | null
}) {
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Adventures</h1>
        <p className="mt-2 text-gray-600">View adventures you&apos;re hosting and joining</p>
      </div>

      <AdventuresList
        adventures={adventures}
        error={error}
        emptyMessage="No adventures yet."
        showInvolvementBadge
        actionsMode="manage"
      />
    </div>
  )
}
