import { redirect } from 'next/navigation'

import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'
import { ProfileMyAdventuresContent } from '@/components/user/ProfileMyAdventuresContent'
import type { MyAdventureListItem } from '@/components/user/ProfileMyAdventuresContent'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function ProfileMyAdventuresIndexPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile/my-adventures')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.username) {
    redirect(`/profile/${encodeURIComponent(profile.username)}/my-adventures`)
  }

  let adventuresError: string | null = null
  type AdventureRow = {
    id: string
    slug?: string | null
    title: string
    adventure_type?: string | null
    difficulty?: string | null
    start_at: string
    end_at?: string | null
    duration_minutes?: number | null
    status: string
    location_name?: string | null
    location_city?: string | null
    location_state?: string | null
    location_country?: string | null
    cost_dollars?: number | null
    currency?: string | null
    max_capacity?: number | null
    cover_image_path?: string | null
    tags?: string[] | null
    season?: string | null
    created_at: string
  }

  const selectWithSlug = 'id, slug, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season, created_at'
  const selectWithoutSlug = 'id, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season, created_at'

  let hostedRows: AdventureRow[] = []
  const hostedWithSlug = await supabase
    .from('adventures')
    .select(selectWithSlug)
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  if (hostedWithSlug.error) {
    const message = hostedWithSlug.error.message || 'Failed to load hosted adventures.'
    if (message.toLowerCase().includes('column') && message.toLowerCase().includes('slug')) {
      const hostedWithoutSlug = await supabase
        .from('adventures')
        .select(selectWithoutSlug)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

      if (hostedWithoutSlug.error) {
        adventuresError = hostedWithoutSlug.error.message
      } else {
        hostedRows = (hostedWithoutSlug.data as unknown as AdventureRow[]) ?? []
      }
    } else {
      adventuresError = message
    }
  } else {
    hostedRows = (hostedWithSlug.data as unknown as AdventureRow[]) ?? []
  }

  let joinedRows: AdventureRow[] = []
  const joinedSignups = await supabase
    .from('adventure_signups')
    .select('adventure_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'pending_payment'])

  if (joinedSignups.error) {
    adventuresError = adventuresError ?? joinedSignups.error.message
  } else {
    const joinedIds = Array.from(
      new Set(((joinedSignups.data ?? []) as Array<{ adventure_id: string }>).map((row) => row.adventure_id))
    ).filter((id) => id && !hostedRows.some((adventure) => adventure.id === id))

    if (joinedIds.length > 0) {
      const joinedWithSlug = await supabase
        .from('adventures')
        .select(selectWithSlug)
        .in('id', joinedIds)
        .order('created_at', { ascending: false })

      if (joinedWithSlug.error) {
        const message = joinedWithSlug.error.message || 'Failed to load joined adventures.'
        if (message.toLowerCase().includes('column') && message.toLowerCase().includes('slug')) {
          const joinedWithoutSlug = await supabase
            .from('adventures')
            .select(selectWithoutSlug)
            .in('id', joinedIds)
            .order('created_at', { ascending: false })

          if (joinedWithoutSlug.error) {
            adventuresError = adventuresError ?? joinedWithoutSlug.error.message
          } else {
            joinedRows = (joinedWithoutSlug.data as unknown as AdventureRow[]) ?? []
          }
        } else {
          adventuresError = adventuresError ?? message
        }
      } else {
        joinedRows = (joinedWithSlug.data as unknown as AdventureRow[]) ?? []
      }
    }
  }

  const allIds = Array.from(new Set([...hostedRows.map((row) => row.id), ...joinedRows.map((row) => row.id)]))
  const signupCountMap = new Map<string, number>()

  if (allIds.length > 0) {
    const { data: allSignups } = await supabase
      .from('adventure_signups')
      .select('adventure_id')
      .in('adventure_id', allIds)
      .in('status', ['active', 'pending_payment'])

    for (const signup of (allSignups ?? []) as Array<{ adventure_id: string }>) {
      signupCountMap.set(signup.adventure_id, (signupCountMap.get(signup.adventure_id) ?? 0) + 1)
    }
  }

  const combined: MyAdventureListItem[] = [
    ...hostedRows.map((adventure) => ({
      ...adventure,
      involvement: 'hosting' as const,
      signup_count: signupCountMap.get(adventure.id) ?? 0,
    })),
    ...joinedRows.map((adventure) => ({
      ...adventure,
      involvement: 'joining' as const,
      signup_count: signupCountMap.get(adventure.id) ?? 0,
    })),
  ].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())

  return (
    <UserProfileNavLayout>
      <ProfileMyAdventuresContent adventures={combined} error={adventuresError} />
    </UserProfileNavLayout>
  )
}
