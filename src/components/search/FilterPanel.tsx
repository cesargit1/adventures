'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'

const seasonOptions = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
]

const stateOptions = [
  { value: 'USA', label: 'All US' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

// Map filter section id → URL param name
const FILTER_PARAM: Record<string, string> = {
  season: 'season',
  difficulty: 'difficulty',
  cost: 'cost',
  adventure_type: 'type',
}

const filters = [
  {
    id: 'state',
    name: 'State',
    options: stateOptions,
  },
  {
    id: 'season',
    name: 'Season',
    options: seasonOptions,
  },
  {
    id: 'difficulty',
    name: 'Difficulty',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    id: 'cost',
    name: 'Cost',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'paid', label: 'Paid' },
    ],
  },
  {
    id: 'adventure_type',
    name: 'Type',
    options: [
      { value: 'hiking', label: 'Hiking' },
      { value: 'camping', label: 'Camping' },
      { value: 'rock climbing', label: 'Rock Climbing' },
      { value: 'kayaking', label: 'Kayaking' },
      { value: 'mountain biking', label: 'Mountain Biking' },
      { value: 'offroading', label: 'Offroading' },
      { value: 'backpacking', label: 'Backpacking' },
      { value: 'sightseeing', label: 'Sightseeing' },
      { value: 'birdwatching', label: 'Birdwatching' },
    ],
  },
]

type FilterPanelProps = {
  /** Optional element rendered to the LEFT of the filters (e.g., a search input). */
  leftSlot?: React.ReactNode
  /** Optional element rendered to the RIGHT of the filters (e.g., a view toggle). */
  viewToggle?: React.ReactNode
}

export function FilterPanel({ leftSlot, viewToggle }: FilterPanelProps) {
  const [open, setOpen] = useState(false)
  const [selectedState, setSelectedState] = useState<(typeof stateOptions)[number] | null>(stateOptions[0])
  const [stateQuery, setStateQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ── Multi-value URL param helpers ─────────────────────────────────────────
  const getActiveValues = (paramName: string): string[] =>
    searchParams.get(paramName)?.split(',').filter(Boolean) ?? []

  const isActiveValue = (paramName: string, value: string): boolean =>
    getActiveValues(paramName).includes(value)

  const toggleMultiFilter = (paramName: string, value: string) => {
    const current = getActiveValues(paramName)
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) {
      params.set(paramName, next.join(','))
    } else {
      params.delete(paramName)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const activeCountForSection = (section: (typeof filters)[number]): number => {
    if (section.id === 'state') {
      return selectedState && selectedState.value !== 'USA' ? 1 : 0
    }
    const paramName = FILTER_PARAM[section.id]
    if (!paramName) return 0
    return getActiveValues(paramName).length
  }

  // ── State filter helpers ──────────────────────────────────────────────────
  useEffect(() => {
    const stateCode = searchParams.get('state')?.toUpperCase()
    if (!stateCode) {
      setSelectedState(stateOptions[0])
      setStateQuery('')
      return
    }
    const matchingState = stateOptions.find((option) => option.value === stateCode) ?? null
    setSelectedState(matchingState)
    setStateQuery(matchingState?.value === 'USA' ? '' : (matchingState?.label ?? ''))
  }, [searchParams])

  const filteredStateOptions = stateQuery.trim()
    ? stateOptions.filter((state) => {
        const normalizedQuery = stateQuery.trim().toLowerCase()
        return (
          state.label.toLowerCase().includes(normalizedQuery) ||
          state.value.toLowerCase().includes(normalizedQuery)
        )
      })
    : stateOptions

  const normalizedStateQuery = stateQuery.trim().toLowerCase()
  const isSelectedStateQueryMatch =
    !!selectedState &&
    !!normalizedStateQuery &&
    (selectedState.label.toLowerCase() === normalizedStateQuery ||
      selectedState.value.toLowerCase() === normalizedStateQuery)

  const handleStateChange = (value: (typeof stateOptions)[number] | null) => {
    setSelectedState(value)
    setStateQuery(value?.value === 'USA' ? '' : (value?.label ?? ''))
    const nextParams = new URLSearchParams(searchParams.toString())
    if (value?.value && value.value !== 'USA') {
      nextParams.set('state', value.value)
    } else {
      nextParams.delete('state')
    }
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  const handleClearState = () => {
    setStateQuery('')
    handleStateChange(stateOptions[0])
  }

  const applyStateFromQuery = () => {
    const query = stateQuery.trim().toLowerCase()
    if (!query) return
    const exactMatch = stateOptions.find(
      (s) => s.label.toLowerCase() === query || s.value.toLowerCase() === query
    )
    const startsWithMatch = stateOptions.find(
      (s) => s.label.toLowerCase().startsWith(query) || s.value.toLowerCase().startsWith(query)
    )
    const includesMatch = stateOptions.find((s) => s.label.toLowerCase().includes(query))
    const match = exactMatch ?? startsWithMatch ?? includesMatch
    if (match) handleStateChange(match)
  }

  // ── Shared checkbox renderer ───────────────────────────────────────────────
  function renderCheckboxes(section: (typeof filters)[number], idPrefix: string) {
    const paramName = FILTER_PARAM[section.id]
    if (!paramName) return null
    return (
      <div className="space-y-3">
        {section.options.map((option, optionIdx) => {
          const checked = isActiveValue(paramName, option.value)
          const inputId = `${idPrefix}-${section.id}-${optionIdx}`
          return (
            <div key={option.value} className="flex gap-3">
              <div className="flex h-5 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMultiFilter(paramName, option.value)}
                    className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-black checked:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={checked ? 'opacity-100' : 'opacity-0'}
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor={inputId} className="cursor-pointer whitespace-nowrap pr-4 text-sm text-gray-900">
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
    )
  }

  // ── State panel ────────────────────────────────────────────────────────────
  function renderStatePanel() {
    return (
      <div className="relative w-[11.5rem]">
        <div className="relative">
          <input
            aria-label="State"
            value={stateQuery}
            autoFocus
            onChange={(e) => setStateQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyStateFromQuery()
              }
            }}
            placeholder="Enter State"
            className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-sm/6 text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black"
          />
          {(stateQuery || selectedState?.value !== 'USA') ? (
            <button
              type="button"
              aria-label="Clear state"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearState}
              className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
        {!isSelectedStateQueryMatch ? (
          <div className="mt-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg outline outline-1 outline-black/5">
            {filteredStateOptions.length ? (
              filteredStateOptions.map((state) => (
                <button
                  key={state.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleStateChange(state)}
                  className="group relative block w-full cursor-default select-none py-2 pl-3 pr-9 text-left text-gray-900 hover:bg-black hover:text-white"
                >
                  <span className="block truncate font-normal">{state.label}</span>
                  {state.value === selectedState?.value ? (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-black group-hover:text-white">
                      <CheckIcon aria-hidden="true" className="size-5" />
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No matching states</div>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      {/* ── Mobile filter dialog ─────────────────────────────────────────── */}
      <Dialog open={open} onClose={setOpen} className="relative z-40 sm:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pb-6 pt-4 shadow-xl transition duration-300 ease-in-out data-[closed]:translate-x-full"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <form className="mt-4">
              {filters.map((section) => (
                <Disclosure key={section.name} as="div" className="border-t border-gray-200 px-4 py-6">
                  <h3 className="-mx-2 -my-3 flow-root">
                    <DisclosureButton className="group flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                      <span className="font-medium text-gray-900">{section.name}</span>
                      <span className="ml-6 flex items-center">
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                        />
                      </span>
                    </DisclosureButton>
                  </h3>
                  <DisclosurePanel className="pt-4">
                    {section.id === 'state' ? renderStatePanel() : renderCheckboxes(section, 'mobile')}
                  </DisclosurePanel>
                </Disclosure>
              ))}
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* ── Desktop filter bar ───────────────────────────────────────────── */}
      <section aria-labelledby="filter-heading" className="border-b border-gray-200 py-4">
        <h2 id="filter-heading" className="sr-only">Adventure filters</h2>

        <div className="flex items-center gap-4">
          {/* Left slot (e.g. search) — grows to fill available space */}
          {leftSlot ? <div className="flex-1 min-w-0">{leftSlot}</div> : null}

          {/* Mobile: "Filters" button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden"
          >
            <ChevronDownIcon className="size-4" />
            Filters
          </button>

          {/* Desktop: filter popovers — pushed to the right */}
          <PopoverGroup className="hidden sm:flex sm:flex-shrink-0 sm:items-center sm:gap-x-6">
            {filters.map((section) => {
              const activeCount = activeCountForSection(section)
              return (
                <Popover key={section.name} className="relative">
                  <PopoverButton className="group inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
                    <span>{section.name}</span>
                    {activeCount > 0 ? (
                      <span className="ml-1 rounded bg-black px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {activeCount}
                      </span>
                    ) : null}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="-mr-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                    />
                  </PopoverButton>

                  <PopoverPanel
                    transition
                    className="absolute left-0 z-10 mt-2 origin-top-left rounded-md bg-white p-4 shadow-2xl ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    {section.id === 'state' ? renderStatePanel() : renderCheckboxes(section, 'desktop')}
                  </PopoverPanel>
                </Popover>
              )
            })}
          </PopoverGroup>

          {/* Right slot: view toggle */}
          {viewToggle ? <div className="flex-shrink-0">{viewToggle}</div> : null}
        </div>
      </section>
    </div>
  )
}
