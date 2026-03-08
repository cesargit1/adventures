import { AdventureDetails } from '@/components/adventure/AdventureDetails'
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
    title: `Adventure ${decoded} - AdventuresCalendar`,
    description: `View details, location, and schedule for adventure ${decoded} on AdventuresCalendar.`,
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function extractShortId(value: string) {
  const last = value.split('-').pop() || ''
  return /^[0-9a-f]{8}$/i.test(last) ? last.toLowerCase() : null
}

export default async function AdventureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = decodeURIComponent(id)
  const supabase = await createSupabaseServerClient()

  const baseSelectCols = 'id, title, description, adventure_type, difficulty, tags, required_gear, host_included, start_at, status, location_name, location_city, location_state, location_country, location_country_code, location_precise_point, max_capacity, cost_dollars, currency, cover_image_path, host_id, created_at'
  const withSlugSelectCols = `${baseSelectCols}, slug`

  type AdventureRow = {
    id: string
    slug?: string | null
    title: string
    description: string
    adventure_type: string
    difficulty: string
    tags: string[]
    required_gear: string[] | null
    host_included: string[] | null
    start_at: string
    status: string
    location_name: string | null
    location_city: string | null
    location_state: string | null
    location_country: string | null
    location_country_code: string | null
    location_precise_point: { type: string; coordinates: [number, number] } | null
    max_capacity: number
    cost_dollars: number
    currency: string
    cover_image_path: string | null
    host_id: string
    created_at: string
  }

  let row: AdventureRow | null = null

  if (isUuid(raw)) {
    const withSlug = await supabase.from('adventures').select(withSlugSelectCols).eq('id', raw).maybeSingle()
    if (withSlug.error) {
      const withoutSlug = await supabase.from('adventures').select(baseSelectCols).eq('id', raw).maybeSingle()
      row = (withoutSlug.data as unknown as AdventureRow | null) ?? null
    } else {
      row = (withSlug.data as unknown as AdventureRow | null) ?? null
    }
  } else {
    const bySlug = await supabase.from('adventures').select(withSlugSelectCols).eq('slug', raw).maybeSingle()
    if (!bySlug.error && bySlug.data) {
      row = bySlug.data as unknown as AdventureRow
    } else {
      const shortId = extractShortId(raw)
      if (shortId) {
        const byShort = await supabase
          .from('adventures')
          .select(withSlugSelectCols)
          .eq('short_id', shortId)
          .maybeSingle()

        if (byShort.error) {
          const minimal = await supabase
            .from('adventures')
            .select(baseSelectCols)
            .eq('short_id', shortId)
            .maybeSingle()
          row = (minimal.data as unknown as AdventureRow | null) ?? null
        } else {
          row = (byShort.data as unknown as AdventureRow | null) ?? null
        }
      }
    }
  }

  if (!row) {
    notFound()
  }

  if (row.slug && raw !== row.slug) {
    // Canonicalize: UUID -> slug, and any non-canonical slug variant -> stored slug
    redirect(`/adventures/${encodeURIComponent(row.slug)}`)
  }

  // Fetch host profile
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', row.host_id)
    .maybeSingle()

  // Fetch host review stats
  let reviewCount = 0
  let averageRating: number | null = null
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('rating')
    .eq('host_id', row.host_id)

  if (reviewRows && reviewRows.length > 0) {
    reviewCount = reviewRows.length
    const sum = reviewRows.reduce((acc, r) => acc + (r.rating ?? 0), 0)
    averageRating = Math.round((sum / reviewCount) * 10) / 10
  }

  const host = hostProfile
    ? {
        username: hostProfile.username,
        displayName: hostProfile.display_name || hostProfile.username,
        avatarUrl: hostProfile.avatar_url as string | null,
        reviewCount,
        averageRating,
      }
    : null

  const { data: signupRows } = await supabase
    .from('adventure_signups')
    .select('user_id')
    .eq('adventure_id', row.id)
    .in('status', ['active', 'pending_payment'])

  const joinedUserIds = Array.from(
    new Set((signupRows ?? []).map((signup) => signup.user_id).filter(Boolean))
  )

  const participantIds = Array.from(new Set([row.host_id, ...joinedUserIds]))

  const { data: participantProfiles } = participantIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', participantIds)
    : { data: [] as Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }> }

  const profileMap = new Map((participantProfiles ?? []).map((profile) => [profile.id, profile]))

  const participants = participantIds
    .map((id) => {
      const profile = profileMap.get(id)
      if (!profile) {
        return null
      }

      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name || profile.username,
        avatarUrl: profile.avatar_url,
        isHost: profile.id === row.host_id,
      }
    })
    .filter((participant): participant is NonNullable<typeof participant> => participant !== null)

  const sortedParticipants = participants.sort((left, right) => {
    if (left.isHost) return -1
    if (right.isHost) return 1
    return left.displayName.localeCompare(right.displayName)
  })

  return (
    <div className="min-h-screen">
      <AdventureDetails adventure={row} host={host} participants={sortedParticipants} />
    </div>
  )
}
