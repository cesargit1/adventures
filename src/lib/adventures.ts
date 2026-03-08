import { createSupabaseServerClient } from '@/lib/supabase/server'

const SELECT_WITH_SLUG = 'id, slug, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season'
const SELECT_WITHOUT_SLUG = 'id, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season'

export const PUBLIC_ADVENTURES_PAGE_SIZE = 5

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
}

export async function getPublicAdventuresPage({
  page,
  pageSize = PUBLIC_ADVENTURES_PAGE_SIZE,
}: {
  page: number
  pageSize?: number
}) {
  const supabase = await createSupabaseServerClient()
  const nowIso = new Date().toISOString()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let error: string | null = null
  let rows: AdventureRow[] = []
  let totalCount = 0

  const withSlug = await supabase
    .from('adventures')
    .select(SELECT_WITH_SLUG, { count: 'exact' })
    .eq('status', 'open')
    .gte('start_at', nowIso)
    .order('start_at', { ascending: true })
    .range(from, to)

  if (withSlug.error) {
    const message = withSlug.error.message || 'Failed to load adventures.'
    if (message.toLowerCase().includes('column') && message.toLowerCase().includes('slug')) {
      const withoutSlug = await supabase
        .from('adventures')
        .select(SELECT_WITHOUT_SLUG, { count: 'exact' })
        .eq('status', 'open')
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })
        .range(from, to)

      if (withoutSlug.error) {
        error = withoutSlug.error.message
      } else {
        rows = (withoutSlug.data as unknown as AdventureRow[]) ?? []
        totalCount = withoutSlug.count ?? 0
      }
    } else {
      error = message
    }
  } else {
    rows = (withSlug.data as unknown as AdventureRow[]) ?? []
    totalCount = withSlug.count ?? 0
  }

  const signupCountMap = new Map<string, number>()
  const adventureIds = rows.map((row) => row.id)

  if (adventureIds.length > 0) {
    const { data: signups } = await supabase
      .from('adventure_signups')
      .select('adventure_id')
      .in('adventure_id', adventureIds)
      .in('status', ['active', 'pending_payment'])

    for (const signup of (signups ?? []) as Array<{ adventure_id: string }>) {
      signupCountMap.set(signup.adventure_id, (signupCountMap.get(signup.adventure_id) ?? 0) + 1)
    }
  }

  return {
    adventures: rows.map((row) => ({
      ...row,
      signup_count: signupCountMap.get(row.id) ?? 0,
    })),
    error,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
    pageSize,
  }
}
