import { AdventureForm } from '@/components/adventure/AdventureForm'
import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  return {
    title: `Edit Adventure ${decoded} - AdventuresCalendar`,
    description: `Edit details and settings for adventure ${decoded} on AdventuresCalendar.`,
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function extractShortId(value: string) {
  const last = value.split('-').pop() || ''
  return /^[0-9a-f]{8}$/i.test(last) ? last.toLowerCase() : null
}

export default async function EditAdventurePage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!resolved) notFound()

  if (isUuid(raw) && resolved.slug) {
    redirect(`/adventures/${encodeURIComponent(resolved.slug)}/edit`)
  }

  // Fetch current user's username for the tab nav
  const { data: { user } } = await supabase.auth.getUser()
  let username: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
    username = profile?.username ?? undefined
  }

  return (
    <UserProfileNavLayout username={username}>
      <div className="mx-auto max-w-4xl py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Adventure</h1>
          <AdventureForm mode="edit" adventureId={resolved.id} />
        </div>
      </div>
    </UserProfileNavLayout>
  )
}
