import Link from 'next/link'
import type { Metadata } from 'next'

import { AdventuresExplorer, type ExplorerAdventure } from '@/components/adventure/AdventuresExplorer'
import { CTASection } from '@/components/common/CTASection'
import { Container } from '@/components/common/Container'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Find Your Next Adventure - AdventuresCalendar',
  description:
    'Browse outdoor adventures on the map and calendar. Filter by season, cost, and difficulty to find the right trip.',
}

const features = [
  {
    step: 1,
    name: 'Browse Adventures',
    description:
      'Explore upcoming trips on the map and calendar, then filter by season, cost, and difficulty to find the right fit.',
  },
  {
    step: 2,
    name: 'Become an Adventurer',
    description:
      'Create your adventurer profile so you can join trips, track your activity, and connect with the community.',
  },
  {
    step: 3,
    name: 'Join Adventures',
    description:
      'Open an adventure to review the details, then join to reserve your spot and get ready for the day.',
  },
  {
    step: 4,
    name: 'Host Your Own Adventures',
    description:
      'Bookmark favorites for later, and when you’re ready, create your own adventure to bring people together.',
  },
]

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const nowIso = new Date().toISOString()

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
    location_lat?: number | null
    location_lng?: number | null
    cost_dollars?: number | null
    currency?: string | null
    max_capacity?: number | null
    cover_image_path?: string | null
    tags?: string[] | null
    season?: string | null
  }

  const selectWithSlug =
    'id, slug, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, ' +
    'location_name, location_city, location_state, location_country, location_lat, location_lng, ' +
    'cost_dollars, currency, max_capacity, cover_image_path, tags, season'
  const selectWithoutSlug =
    'id, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, ' +
    'location_name, location_city, location_state, location_country, location_lat, location_lng, ' +
    'cost_dollars, currency, max_capacity, cover_image_path, tags, season'

  let rows: AdventureRow[] = []

  const withSlug = await supabase
    .from('adventures')
    .select(selectWithSlug)
    .eq('status', 'open')
    .gte('start_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(300)

  if (withSlug.error) {
    const msg = withSlug.error.message ?? ''
    if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('slug')) {
      const withoutSlug = await supabase
        .from('adventures')
        .select(selectWithoutSlug)
        .eq('status', 'open')
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(300)
      rows = (withoutSlug.data as unknown as AdventureRow[]) ?? []
    }
  } else {
    rows = (withSlug.data as unknown as AdventureRow[]) ?? []
  }

  // Signup counts
  const signupCountMap = new Map<string, number>()
  const ids = rows.map((r) => r.id)
  if (ids.length > 0) {
    const { data: signups } = await supabase
      .from('adventure_signups')
      .select('adventure_id')
      .in('adventure_id', ids)
      .in('status', ['active', 'pending_payment'])
    for (const s of (signups ?? []) as Array<{ adventure_id: string }>) {
      signupCountMap.set(s.adventure_id, (signupCountMap.get(s.adventure_id) ?? 0) + 1)
    }
  }

  const adventures: ExplorerAdventure[] = rows.map((r) => ({
    ...r,
    signup_count: signupCountMap.get(r.id) ?? 0,
  }))

  return (
    <div
      id="top"
      className="min-h-screen bg-white"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(/AdventuresCalendar-bg.png)',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
      }}
    >
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden pt-14">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Find Your Next Adventure
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Browse outdoor events across the country and discover new experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Explorer: filters + view toggle + active view */}
      <Container className="py-0 -mt-4 pb-12">
        <AdventuresExplorer adventures={adventures} />
      </Container>

      {/* Platform Features */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <Container>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-5">
            <h2 className="col-span-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              How it Works
            </h2>
            <dl className="col-span-3 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.name}>
                  <dt className="text-base/7 font-semibold text-gray-900">
                    <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-black">
                      <span className="text-white text-sm font-semibold">{feature.step}</span>
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 text-base/7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

