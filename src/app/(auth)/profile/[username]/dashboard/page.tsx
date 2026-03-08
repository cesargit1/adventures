import { redirect } from 'next/navigation'

import { ProfileDashboardContent } from '@/components/user/ProfileDashboardContent'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const minutes = Math.round(diffMs / (1000 * 60))
  const hours = Math.round(diffMs / (1000 * 60 * 60))
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  return rtf.format(days, 'day')
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/profile/${encodeURIComponent(username)}/dashboard`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle()

  if (!profile || profile.id !== user.id) {
    redirect('/profile/dashboard')
  }

  const [
    { count: activeAdventuresCount },
    { count: reviewsCount },
    { count: followersCount },
    { count: savedCount },
    { data: hostedAdventures },
    { data: joinedSignupRows },
    { data: reviews },
    { data: createdAdventureActivity },
  ] = await Promise.all([
    supabase
      .from('adventures')
      .select('id', { head: true, count: 'exact' })
      .eq('host_id', user.id)
      .in('status', ['open', 'scheduled', 'at_capacity']),
    supabase.from('reviews').select('id', { head: true, count: 'exact' }).eq('host_id', user.id),
    supabase.from('user_follows').select('follower_id', { head: true, count: 'exact' }).eq('following_id', user.id),
    supabase.from('adventure_saves').select('adventure_id', { head: true, count: 'exact' }).eq('user_id', user.id),
    supabase
      .from('adventures')
      .select('id, slug, title, start_at, status, created_at')
      .eq('host_id', user.id)
      .order('start_at', { ascending: false })
      .limit(8),
    supabase
      .from('adventure_signups')
      .select('created_at, adventure:adventures(id, slug, title, start_at, status, created_at)')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending_payment'])
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('reviews')
      .select('id, rating, created_at, adventure:adventures(title)')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('adventures')
      .select('id, title, created_at')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const joinedAdventures = (joinedSignupRows ?? [])
    .map((signup) => {
      const rawAdventure = (signup as unknown as { adventure?: unknown }).adventure
      const adventure = Array.isArray(rawAdventure)
        ? (rawAdventure[0] as {
            id?: string
            slug?: string | null
            title?: string
            start_at?: string
            status?: string
            created_at?: string
          } | undefined)
        : (rawAdventure as {
            id?: string
            slug?: string | null
            title?: string
            start_at?: string
            status?: string
            created_at?: string
          } | null)

      if (!adventure?.id || !adventure?.title || !adventure?.start_at || !adventure?.status || !adventure?.created_at) {
        return null
      }

      return {
        id: adventure.id,
        slug: adventure.slug ?? null,
        title: adventure.title,
        start_at: adventure.start_at,
        status: adventure.status,
        created_at: adventure.created_at,
      }
    })
    .filter((adventure): adventure is NonNullable<typeof adventure> => adventure !== null)

  const hostedAdventureIds = new Set((hostedAdventures ?? []).map((adventure) => adventure.id))
  const uniqueJoinedAdventures = joinedAdventures.filter((adventure) => !hostedAdventureIds.has(adventure.id))

  const allAdventures = [...(hostedAdventures ?? []), ...uniqueJoinedAdventures]
  const adventureIds = allAdventures.map((adventure) => adventure.id)
  const { data: signupRows } = adventureIds.length
    ? await supabase
        .from('adventure_signups')
        .select('adventure_id')
        .in('adventure_id', adventureIds)
        .in('status', ['active', 'pending_payment'])
    : { data: [] as Array<{ adventure_id: string }> }

  const participantCountByAdventure = (signupRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.adventure_id] = (acc[row.adventure_id] ?? 0) + 1
    return acc
  }, {})

  const myAdventures = [
    ...(hostedAdventures ?? []).map((adventure) => ({
      id: adventure.id,
      slug: (adventure as unknown as { slug?: string | null }).slug ?? null,
      title: adventure.title,
      startAt: adventure.start_at,
      dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(adventure.start_at)),
      status: adventure.status,
      participants: participantCountByAdventure[adventure.id] ?? 0,
      involvement: 'hosting' as const,
    })),
    ...uniqueJoinedAdventures.map((adventure) => ({
      id: adventure.id,
      slug: adventure.slug ?? null,
      title: adventure.title,
      startAt: adventure.start_at,
      dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(adventure.start_at)),
      status: adventure.status,
      participants: participantCountByAdventure[adventure.id] ?? 0,
      involvement: 'joining' as const,
    })),
  ]
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    .slice(0, 8)

  const reviewActivity = (reviews ?? []).map((review) => {
    const rawAdventure = (review as unknown as { adventure?: unknown }).adventure
    const adventure = Array.isArray(rawAdventure)
      ? (rawAdventure[0] as { title?: string | null } | undefined)
      : (rawAdventure as { title?: string | null } | null)

    return {
      id: `review-${review.id}`,
      kind: 'review_received' as const,
      title: `Received ${review.rating}-star review${adventure?.title ? ` for "${adventure.title}"` : ''}`,
      date: formatRelativeTime(review.created_at),
      createdAt: review.created_at,
    }
  })

  const adventureActivity = (createdAdventureActivity ?? []).map((adventure) => ({
    id: `adventure-${adventure.id}`,
    kind: 'adventure_created' as const,
    title: `Created "${adventure.title}"`,
    date: formatRelativeTime(adventure.created_at),
    createdAt: adventure.created_at,
  }))

  const joinActivity = (joinedSignupRows ?? [])
    .map((signup) => {
      const rawAdventure = (signup as unknown as { adventure?: unknown }).adventure
      const adventure = Array.isArray(rawAdventure)
        ? (rawAdventure[0] as { title?: string | null } | undefined)
        : (rawAdventure as { title?: string | null } | null)

      const createdAt = (signup as unknown as { created_at?: string }).created_at
      if (!adventure?.title || !createdAt) {
        return null
      }

      return {
        id: `joined-${createdAt}-${adventure.title}`,
        kind: 'adventure_joined' as const,
        title: `Joined "${adventure.title}"`,
        date: formatRelativeTime(createdAt),
        createdAt,
      }
    })
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null)

  const recentActivity = [...adventureActivity, ...reviewActivity, ...joinActivity]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      date: item.date,
    }))

  return (
    <ProfileDashboardContent
      username={profile.username}
      stats={{
        activeAdventures: activeAdventuresCount ?? 0,
        totalReviews: reviewsCount ?? 0,
        followers: followersCount ?? 0,
        savedAdventures: savedCount ?? 0,
      }}
      myAdventures={myAdventures}
      recentActivity={recentActivity}
    />
  )
}
