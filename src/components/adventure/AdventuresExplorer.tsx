'use client'

import { useMemo, Suspense, useCallback, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MapIcon, ListBulletIcon, CalendarDaysIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FilterPanel } from '@/components/search/FilterPanel'
import { Pagination } from '@/components/common/Pagination'
import { AdventureMap } from './AdventureMap'
import { AdventureCalendar } from './AdventureCalendar'
import { AdventuresList } from './AdventuresList'
import type { AdventureListItem } from './AdventuresList'

export type ExplorerAdventure = AdventureListItem & {
  location_lat?: number | null
  location_lng?: number | null
}

type ViewMode = 'map' | 'list' | 'calendar'

const PAGE_SIZE = 6

// State code → full name mapping (shared with FilterPanel)
const STATE_CODE_TO_NAME: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

function normalizeDifficulty(d: string): string {
  const lower = d.toLowerCase()
  if (lower === 'easy' || lower === 'beginner') return 'beginner'
  if (lower === 'moderate' || lower === 'intermediate') return 'intermediate'
  if (lower === 'hard' || lower === 'advanced' || lower === 'expert') return 'advanced'
  return lower
}

const views: { id: ViewMode; label: string; Icon: React.ElementType }[] = [
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'list', label: 'List', Icon: ListBulletIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDaysIcon },
]

function ViewToggle({ current, onChange }: { current: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm">
      {views.map(({ id, label, Icon }, idx) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
            idx > 0 ? 'border-l border-gray-200' : '',
            current === id
              ? 'bg-black text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          ].join(' ')}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

function AdventuresExplorerInner({ adventures, detectedState }: { adventures: ExplorerAdventure[]; detectedState?: string | null }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const view = (searchParams.get('view') ?? 'map') as ViewMode
  // URL param takes precedence; fall back to Vercel-detected state (US only), else null
  const selectedState = searchParams.get('state')?.toUpperCase() ?? detectedState ?? null
  const seasons = useMemo(
    () => searchParams.get('season')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const difficulties = useMemo(
    () => searchParams.get('difficulty')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const costFilter = searchParams.get('cost') ?? null
  const adventureTypes = useMemo(
    () => searchParams.get('type')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const searchQuery = searchParams.get('q')?.toLowerCase().trim() ?? ''

  // On mount: if Vercel detected a US state but no ?state= param is in the URL, write it in
  // so FilterPanel shows the correct selection and filtering is visible to the user.
  useEffect(() => {
    if (detectedState && !searchParams.get('state')) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('state', detectedState.toUpperCase())
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
    // Only run once on mount — deps intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Page (URL-driven, reset to 1 when any filter changes)
  const rawPage = Number(searchParams.get('page') ?? '1')
  const pageParam = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1

  // Reset page in URL whenever filter params change
  const filterKey = [selectedState, seasons.join(','), difficulties.join(','), costFilter ?? '', adventureTypes.join(','), searchQuery].join('|')
  const prevFilterKeyRef = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey
      const params = new URLSearchParams(searchParams.toString())
      if (params.has('page')) {
        params.delete('page')
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      }
    }
  })

  // Local controlled value for the search input (syncs from URL if changed externally)
  const [inputQuery, setInputQuery] = useState(searchParams.get('q') ?? '')
  useEffect(() => {
    setInputQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const setView = (v: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'map') {
      params.delete('view')
    } else {
      params.set('view', v)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const setSearchQuery = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set('q', q.trim())
      } else {
        params.delete('q')
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const filteredAdventures = useMemo(() => {
    return adventures.filter((a) => {
      // ── State filter ──────────────────────────────────────────
      if (selectedState && selectedState !== 'USA') {
        const locationState = a.location_state?.trim() ?? ''
        const fullName = STATE_CODE_TO_NAME[selectedState]?.toLowerCase() ?? ''
        const codeMatch = locationState.toUpperCase() === selectedState
        const nameMatch = fullName && locationState.toLowerCase() === fullName
        const containsMatch =
          locationState.toUpperCase().includes(selectedState) ||
          (fullName && locationState.toLowerCase().includes(fullName))
        if (!codeMatch && !nameMatch && !containsMatch) return false
      }

      // ── Season filter ─────────────────────────────────────────
      if (seasons.length > 0) {
        if (!a.season || !seasons.includes(a.season.toLowerCase())) return false
      }

      // ── Difficulty filter ─────────────────────────────────────
      if (difficulties.length > 0) {
        if (!a.difficulty || !difficulties.includes(normalizeDifficulty(a.difficulty))) return false
      }

      // ── Cost filter ───────────────────────────────────────────
      if (costFilter === 'free' && (a.cost_dollars ?? 0) > 0) return false
      if (costFilter === 'paid' && (a.cost_dollars ?? 0) === 0) return false

      // ── Adventure type filter ─────────────────────────────────
      if (adventureTypes.length > 0) {
        if (!a.adventure_type) return false
        const type = a.adventure_type.toLowerCase()
        if (!adventureTypes.some((t) => type === t || type.includes(t) || t.includes(type))) return false
      }

      // ── Search query filter ───────────────────────────────────
      if (searchQuery) {
        const haystack = [
          a.title,
          a.adventure_type,
          a.location_city,
          a.location_state,
          a.location_name,
          a.location_country,
          ...(a.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(searchQuery)) return false
      }

      return true
    })
  }, [adventures, selectedState, seasons, difficulties, costFilter, adventureTypes, searchQuery])

  // Derived shapes for each view
  const mapAdventures = useMemo(
    () =>
      filteredAdventures
        .filter((a) => a.location_lat != null && a.location_lng != null)
        .map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          adventure_type: a.adventure_type ?? 'sightseeing',
          location_lat: a.location_lat!,
          location_lng: a.location_lng!,
        })),
    [filteredAdventures]
  )

  const calendarAdventures = useMemo(
    () =>
      filteredAdventures.map((a) => ({
        id: a.id,
        slug: a.slug ?? a.id,
        title: a.title,
        start_at: a.start_at,
      })),
    [filteredAdventures]
  )

  const activeCount = filteredAdventures.length
  const totalCount = adventures.length
  const isFiltered = activeCount !== totalCount

  const searchInput = (
    <div className="relative w-full lg:max-w-[75%]">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
      <input
        type="text"
        value={inputQuery}
        placeholder="Search…"
        onChange={(e) => {
          setInputQuery(e.target.value)
          setSearchQuery(e.target.value)
        }}
        className="block w-full rounded-md border border-gray-200 bg-white py-1.5 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black"
      />
      {inputQuery ? (
        <button
          type="button"
          onClick={() => { setInputQuery(''); setSearchQuery('') }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )

  return (
    <div>
      {/* Row 1: search (left) + filters (right) */}
      <FilterPanel leftSlot={searchInput} />

      {/* Row 2: result count (left) + view toggle (right) */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {isFiltered ? `Showing ${activeCount} of ${totalCount} adventures` : `${totalCount} adventures`}
        </span>
        <ViewToggle current={view} onChange={setView} />
      </div>

      {/* Active view */}
      <div className="mt-3">
        {view === 'map' && (
          <div className="h-[460px] rounded-lg overflow-hidden border border-gray-200">
            <AdventureMap adventures={mapAdventures} />
          </div>
        )}

        {view === 'list' && (
          <AdventuresList
            adventures={filteredAdventures}
            title=""
            emptyMessage="No adventures match the current filters."
            actionsMode="view"
          />
        )}

        {view === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <AdventureCalendar adventures={calendarAdventures} />
          </div>
        )}
      </div>
    </div>
  )
}

export function AdventuresExplorer({ adventures, detectedState }: { adventures: ExplorerAdventure[]; detectedState?: string | null }) {
  return (
    <Suspense fallback={<div className="h-[460px] flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
      <AdventuresExplorerInner adventures={adventures} detectedState={detectedState} />
    </Suspense>
  )
}
