'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/20/solid'

import { SearchBar } from '@/components/search/SearchBar'
import { createClient } from '@/lib/supabase/client'

export type AdventureListItem = {
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
  involvement?: 'hosting' | 'joining'
  signup_count?: number | null
}

type AdventuresListProps = {
  adventures: AdventureListItem[]
  error?: string | null
  title?: string
  description?: string
  emptyMessage?: string
  showSearchBar?: boolean
  showInvolvementBadge?: boolean
  actionsMode?: 'none' | 'view' | 'manage'
}

function formatStatus(status: string) {
  if (status === 'draft') return 'Draft'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'open') return 'Open'
  if (status === 'at_capacity') return 'At Capacity'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return status
}

function badgeClass(status: string) {
  if (status === 'open') return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
  if (status === 'at_capacity') return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
  if (status === 'cancelled') return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
  if (status === 'completed') return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10'
  if (status === 'draft') return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
  if (status === 'scheduled') return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
  return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = {
    easy: 'Beginner',
    beginner: 'Beginner',
    moderate: 'Intermediate',
    intermediate: 'Intermediate',
    hard: 'Advanced',
    advanced: 'Advanced',
    expert: 'Advanced',
  }
  return map[d.toLowerCase()] ?? d
}

function difficultyBadgeClass(d: string) {
  switch (d.toLowerCase()) {
    case 'easy':
    case 'beginner':
      return 'bg-green-50 text-green-700 ring-green-600/20'
    case 'moderate':
    case 'intermediate':
      return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
    case 'hard':
    case 'advanced':
    case 'expert':
      return 'bg-red-50 text-red-700 ring-red-600/10'
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-500/10'
  }
}

function formatLocation(adventure: AdventureListItem): string | null {
  if (adventure.location_city && adventure.location_state) return `${adventure.location_city}, ${adventure.location_state}`
  if (adventure.location_city) return adventure.location_city
  if (adventure.location_name) return adventure.location_name
  if (adventure.location_country) return adventure.location_country
  return null
}

function formatCost(dollars: number | null | undefined, currency: string | null | undefined): string {
  if (dollars == null || dollars === 0) return 'Free'
  const cur = currency ?? 'USD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(dollars)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function spotsLabel(signup: number | null | undefined, max: number | null | undefined): string | null {
  const count = signup ?? 0
  if (max != null && max > 0) return `${count}/${max} spots`
  return null
}

export function AdventuresList({
  adventures,
  error,
  title,
  description,
  emptyMessage = 'No adventures yet.',
  showSearchBar = false,
  showInvolvementBadge,
  actionsMode = 'none',
}: AdventuresListProps) {
  const supabase = useMemo(() => createClient(), [])
  const mediaBucket =
    process.env?.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim() ||
    process.env?.NEXT_PUBLIC_SUPABASE_PROFILE_MEDIA_BUCKET?.trim() ||
    'user-media'

  const shouldShowInvolvementBadge = showInvolvementBadge ?? adventures.some((adventure) => adventure.involvement)

  return (
    <div>
      {title || description || showSearchBar ? (
        <div className="mb-4 flex flex-col gap-4 px-1 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {title ? <h2 className="text-xl font-bold text-gray-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
          </div>
          {showSearchBar ? (
            <div className="w-full lg:flex-1 lg:max-w-md">
              <SearchBar />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {!adventures.length && !error ? (
        <div className="rounded-lg bg-white px-6 py-10 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-600">{emptyMessage}</p>
        </div>
      ) : null}

      <ul role="list" className="space-y-4">
        {adventures.map((adventure) => {
          const key = adventure.slug || adventure.id
          const href = `/adventures/${encodeURIComponent(key)}`
          const editHref = `/adventures/${encodeURIComponent(key)}/edit`
          const manageHref = `/adventures/${encodeURIComponent(key)}/manage`
          const location = formatLocation(adventure)
          const cost = formatCost(adventure.cost_dollars, adventure.currency)
          const spots = spotsLabel(adventure.signup_count, adventure.max_capacity)
          const tags = (adventure.tags ?? []).slice(0, 3)

          let coverUrl: string | null = null
          if (adventure.cover_image_path) {
            const { data } = supabase.storage.from(mediaBucket).getPublicUrl(adventure.cover_image_path)
            coverUrl = data?.publicUrl ?? null
          }

          return (
            <li key={adventure.id} className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
              <div className="flex">
                {coverUrl ? (
                  <Link href={href} className="flex-none overflow-hidden rounded-l-lg">
                    <img alt="" src={coverUrl} className="h-full w-32 object-cover sm:w-44" />
                  </Link>
                ) : (
                  <Link href={href} className="flex-none overflow-hidden rounded-l-lg">
                    <div className="flex h-full w-32 items-center justify-center bg-gray-100 text-gray-400 sm:w-44">
                      <CalendarDaysIcon className="size-10" />
                    </div>
                  </Link>
                )}

                <div className="flex flex-1 justify-between gap-x-6 p-5">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm/6 font-semibold text-gray-900">
                      <Link href={href} className="hover:underline">
                        {adventure.title}
                      </Link>
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs/5 text-gray-500">
                      {adventure.difficulty ? (
                        <>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${difficultyBadgeClass(adventure.difficulty)}`}>
                            {difficultyLabel(adventure.difficulty)}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                        </>
                      ) : null}
                      {adventure.adventure_type ? (
                        <>
                          <span className="capitalize">{adventure.adventure_type}</span>
                          <span aria-hidden="true">&middot;</span>
                        </>
                      ) : null}
                      <span className="flex items-center gap-x-1">
                        <CalendarDaysIcon className="size-3.5 text-gray-400" />
                        <time dateTime={adventure.start_at}>{formatDate(adventure.start_at)}</time>
                      </span>
                      {adventure.season ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {adventure.season}
                          </span>
                        </>
                      ) : null}
                      {location ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span className="flex items-center gap-x-1 truncate">
                            <MapPinIcon className="size-3.5 flex-shrink-0 text-gray-400" />
                            {location}
                          </span>
                        </>
                      ) : null}
                      {shouldShowInvolvementBadge && adventure.involvement ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span
                            className={
                              adventure.involvement === 'hosting'
                                ? 'inline-flex items-center rounded-md bg-black px-1.5 py-0.5 text-xs font-medium text-white'
                                : 'inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'
                            }
                          >
                            {adventure.involvement === 'hosting' ? 'Hosting' : 'Joined'}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-x-4">
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <p className="text-sm/6 font-medium text-gray-900">{cost}</p>
                      {spots ? <p className="mt-1 text-xs/5 text-gray-500">{spots}</p> : null}
                      <span
                        className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass(adventure.status)}`}
                      >
                        {formatStatus(adventure.status)}
                      </span>
                    </div>
                    {actionsMode !== 'none' ? (
                      <Menu as="div" className="relative flex-none">
                        <MenuButton className="relative block text-gray-500 hover:text-gray-900">
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Open options</span>
                          <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
                        </MenuButton>
                        <MenuItems
                          transition
                          className="absolute right-0 z-50 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline outline-1 outline-gray-900/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                          <MenuItem>
                            <Link
                              href={href}
                              className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                            >
                              View<span className="sr-only">, {adventure.title}</span>
                            </Link>
                          </MenuItem>
                          {actionsMode === 'manage' && adventure.involvement === 'hosting' ? (
                            <>
                              <MenuItem>
                                <Link
                                  href={editHref}
                                  className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                                >
                                  Edit<span className="sr-only">, {adventure.title}</span>
                                </Link>
                              </MenuItem>
                              <MenuItem>
                                <Link
                                  href={manageHref}
                                  className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                                >
                                  Manage<span className="sr-only">, {adventure.title}</span>
                                </Link>
                              </MenuItem>
                            </>
                          ) : null}
                        </MenuItems>
                      </Menu>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
