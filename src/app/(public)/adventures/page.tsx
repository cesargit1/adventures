import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AdventuresList } from '@/components/adventure/AdventuresList'
import { Container } from '@/components/common/Container'
import { Pagination } from '@/components/common/Pagination'
import { getPublicAdventuresPage, PUBLIC_ADVENTURES_PAGE_SIZE } from '@/lib/adventures'

export const metadata: Metadata = {
  title: 'Adventures - AdventuresCalendar',
  description: 'Browse all open upcoming adventures on AdventuresCalendar.',
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)

  if (!raw) return 1
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const params = await searchParams
  const page = parsePage(params.page)
  const result = await getPublicAdventuresPage({
    page,
    pageSize: PUBLIC_ADVENTURES_PAGE_SIZE,
  })

  if (page > result.totalPages) {
    redirect(result.totalPages <= 1 ? '/adventures' : `/adventures?page=${result.totalPages}`)
  }

  return (
    <div className="min-h-screen bg-white py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Adventures</h1>
            <p className="mt-3 text-base text-gray-600">
              Browse all open adventures sorted from soonest to latest.
            </p>
          </div>

          <AdventuresList
            adventures={result.adventures}
            error={result.error}
            emptyMessage="No open adventures are scheduled right now."
            actionsMode="view"
          />

          {result.totalCount > 0 ? (
            <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
                totalItems={result.totalCount}
                pageSize={result.pageSize}
                pathname="/adventures"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  )
}
