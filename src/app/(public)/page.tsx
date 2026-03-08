import Link from 'next/link'
import type { Metadata } from 'next'

import { FilterPanel } from '@/components/search/FilterPanel'
import { AdventureMap } from '@/components/adventure/AdventureMap'
import { AdventureCalendar } from '@/components/adventure/AdventureCalendar'
import { AdventuresList, type AdventureListItem } from '@/components/adventure/AdventuresList'
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
    cost_dollars?: number | null
    currency?: string | null
    max_capacity?: number | null
    cover_image_path?: string | null
    tags?: string[] | null
    season?: string | null
  }

  const selectWithSlug = 'id, slug, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season'
  const selectWithoutSlug = 'id, title, adventure_type, difficulty, start_at, end_at, duration_minutes, status, location_name, location_city, location_state, location_country, cost_dollars, currency, max_capacity, cover_image_path, tags, season'

  let adventuresError: string | null = null
  let openRows: AdventureRow[] = []

  const openWithSlug = await supabase
    .from('adventures')
    .select(selectWithSlug)
    .eq('status', 'open')
    .gte('start_at', nowIso)
    .order('start_at', { ascending: true })

  if (openWithSlug.error) {
    const message = openWithSlug.error.message || 'Failed to load adventures.'
    if (message.toLowerCase().includes('column') && message.toLowerCase().includes('slug')) {
      const openWithoutSlug = await supabase
        .from('adventures')
        .select(selectWithoutSlug)
        .eq('status', 'open')
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })

      if (openWithoutSlug.error) {
        adventuresError = openWithoutSlug.error.message
      } else {
        openRows = (openWithoutSlug.data as unknown as AdventureRow[]) ?? []
      }
    } else {
      adventuresError = message
    }
  } else {
    openRows = (openWithSlug.data as unknown as AdventureRow[]) ?? []
  }

  // Fetch adventures for the calendar (all open adventures with a start_at)
  const { data: calendarAdventures } = await supabase
    .from('adventures')
    .select('id, slug, title, start_at')
    .eq('status', 'open')
    .gte('start_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(200)

  const signupCountMap = new Map<string, number>()
  const openIds = openRows.map((adventure) => adventure.id)

  if (openIds.length > 0) {
    const { data: signups } = await supabase
      .from('adventure_signups')
      .select('adventure_id')
      .in('adventure_id', openIds)
      .in('status', ['active', 'pending_payment'])

    for (const signup of (signups ?? []) as Array<{ adventure_id: string }>) {
      signupCountMap.set(signup.adventure_id, (signupCountMap.get(signup.adventure_id) ?? 0) + 1)
    }
  }

  const featuredResults: AdventureListItem[] = (adventuresError ? [] : openRows).map((adventure) => ({
    ...adventure,
    signup_count: signupCountMap.get(adventure.id) ?? 0,
  })).slice(0, 5)

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
              Brouse outdoor events across the country and discover new experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Map Section with Filters */}
      <Container className="py-0 -mt-4">
        <div className="flex justify-end mb-4">
          <div className="w-full lg:w-auto">
            <FilterPanel />
          </div>
        </div>
        <div className="h-[460px] rounded-lg overflow-hidden border border-gray-200">
          <AdventureMap />
        </div>
      </Container>

      {/* Calendar and Results Grid */}
      <Container className="py-12">
        {/* Calendar Row */}
        <div id="calendar" className="mb-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Adventures Calendar</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <AdventureCalendar adventures={calendarAdventures ?? []} />
          </div>
        </div>

        {/* Featured Adventures Row */}
        <div>
          <AdventuresList
            adventures={featuredResults}
            error={adventuresError}
            title="Upcoming Adventures"
            description="Showing 5 upcoming adventures."
            emptyMessage="No open adventures are scheduled right now."
            showSearchBar
            actionsMode="view"
          />
          <div className="mt-6 flex justify-end">
            <Link href="/adventures" className="text-sm font-semibold text-black hover:text-gray-700">
              Browse all adventures -&gt;
            </Link>
          </div>
        </div>
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
