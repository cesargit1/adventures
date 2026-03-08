import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  return {
    title: `Manage Adventure ${decoded} - AdventuresCalendar`,
    description: `Manage participants, schedule, reviews, and settings for adventure ${decoded} on AdventuresCalendar.`,
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function extractShortId(value: string) {
  const last = value.split('-').pop() || ''
  return /^[0-9a-f]{8}$/i.test(last) ? last.toLowerCase() : null
}

export default async function ManageAdventurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = decodeURIComponent(id)

  const supabase = await createSupabaseServerClient()
  const selectCols = 'id, slug'

  type Resolved = { id: string; slug: string | null }
  let resolved: Resolved | null = null
  if (isUuid(raw)) {
    const { data } = await supabase.from('adventures').select(selectCols).eq('id', raw).maybeSingle()
    resolved = (data as unknown as Resolved | null) ?? null
  } else {
    const bySlug = await supabase.from('adventures').select(selectCols).eq('slug', raw).maybeSingle()
    resolved = (bySlug.data as unknown as Resolved | null) ?? null

    if (!resolved) {
      const shortId = extractShortId(raw)
      if (shortId) {
        const byShort = await supabase.from('adventures').select(selectCols).eq('short_id', shortId).maybeSingle()
        resolved = (byShort.data as unknown as Resolved | null) ?? null
      }
    }
  }

  if (!resolved) {
    notFound()
  }

  if (isUuid(raw) && resolved.slug) {
    redirect(`/adventures/${encodeURIComponent(resolved.slug)}/manage`)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Adventure</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
              <p className="text-gray-600">Manage participants for this adventure</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
              <p className="text-gray-600">View and respond to participant reviews</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
              <p className="text-gray-600">Manage adventure dates and times</p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Configure adventure settings and visibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
