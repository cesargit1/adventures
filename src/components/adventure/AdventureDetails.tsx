'use client'

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

function SkullIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C7.03 2 3 6.03 3 11c0 3.19 1.66 5.99 4.16 7.59.02.79.2 1.49.52 2.1.42.81 1.06 1.31 1.82 1.31h4.99c.77 0 1.41-.5 1.83-1.31.32-.61.5-1.31.52-2.1C19.34 16.99 21 14.19 21 11c0-4.97-4.03-9-9-9zm-3 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  )
}
import { Container } from '@/components/common/Container'
import { AdventureDetailMap } from '@/components/adventure/AdventureDetailMap'
import { AdventureComments } from '@/components/adventure/AdventureComments'
import { ProfileFullContent, type ProfileFullContentData } from '@/components/user/ProfileFullContent'
import { createClient } from '@/lib/supabase/client'
import { parseProfileCertifications } from '@/lib/certifications'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { StarIcon } from '@heroicons/react/24/solid'

function formatTag(tag: string) {
  return tag
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'baja california': 'BC', 'baja california sur': 'BCS', sonora: 'SON', chihuahua: 'CHIH',
  jalisco: 'JAL', 'nuevo leon': 'NL', quintana_roo: 'QR',
}

function abbreviateState(state: string | null | undefined): string | null {
  if (!state) return null
  const trimmed = state.trim()
  // Already abbreviated (2-4 chars, all uppercase)
  if (trimmed.length <= 4 && trimmed === trimmed.toUpperCase()) return trimmed
  return US_STATE_ABBR[trimmed.toLowerCase()] ?? trimmed
}

function abbreviateCountry(country: string | null | undefined, countryCode: string | null | undefined): string | null {
  if (countryCode) return countryCode.toUpperCase()
  if (!country) return null
  return country
}

function formatLocationText(adventure: { location_name: string | null; location_city: string | null; location_state: string | null; location_country: string | null; location_country_code: string | null }): string {
  const parts = [
    adventure.location_name,
    adventure.location_city,
    abbreviateState(adventure.location_state),
    abbreviateCountry(adventure.location_country, adventure.location_country_code),
  ].filter(Boolean)
  return parts.join(', ') || 'Location TBA'
}

function ActivityTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type?.toLowerCase()) {
    case 'hiking':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 4.3L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.9-.8z" />
        </svg>
      )
    case 'camping':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2L2 22h20L12 2zm0 4.5L18.5 20h-3l-3.5-6-3.5 6h-3L12 6.5z" />
        </svg>
      )
    case 'rock climbing':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 5.28c-1.23-.37-2.22-1.17-2.8-2.18l-1-1.6c-.41-.65-1.11-1-1.84-1-.78 0-1.59.5-1.78 1.44S7 23 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.07 1.32 2.58 2.23 4.31 2.44l1.49-7.44-1.96-.8-.84 4.09z" />
        </svg>
      )
    case 'kayaking':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M21 16c-1.1 0-2.1-.3-3-.8-.9.5-1.9.8-3 .8s-2.1-.3-3-.8c-.9.5-1.9.8-3 .8s-2.1-.3-3-.8c-.9.5-1.9.8-3 .8v2c1.1 0 2.1-.3 3-.8.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8v-2zm0-4c-1.1 0-2.1-.3-3-.8-.9.5-1.9.8-3 .8s-2.1-.3-3-.8c-.9.5-1.9.8-3 .8s-2.1-.3-3-.8c-.9.5-1.9.8-3 .8v2c1.1 0 2.1-.3 3-.8.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8v-2zM21 8c-1.1 0-2.1-.3-3-.8C17.1 7.7 16.1 8 15 8s-2.1-.3-3-.8C11.1 7.7 10.1 8 9 8s-2.1-.3-3-.8C5.1 7.7 4.1 8 3 8v2c1.1 0 2.1-.3 3-.8.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8s2.1-.3 3-.8c.9.5 1.9.8 3 .8V8z" />
        </svg>
      )
    case 'mountain biking':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5S3.1 13.5 5 13.5s3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1v-2c-1.4 0-2.5-.5-3.4-1.4L13.4 5.5c-.4-.4-.9-.5-1.4-.5s-1 .2-1.4.5L8 8.1 11 11v4h2V9.6l-2.2-1.6zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )
  }
}

type Adventure = {
  id: string
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

type Host = {
  username: string
  displayName: string
  avatarUrl: string | null
  reviewCount: number
  averageRating: number | null
}

type Participant = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isHost: boolean
}

type ProfilePreview = {
  username: string
  data: ProfileFullContentData
}

function formatJoinDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function mapInterestNames(rows: Array<{ interest?: unknown }> | null | undefined): string[] {
  return (rows ?? [])
    .map((row) => {
      const rawInterest = row.interest
      const interest = (Array.isArray(rawInterest) ? rawInterest[0] : rawInterest) as { name?: unknown } | null
      return typeof interest?.name === 'string' ? interest.name.trim() : ''
    })
    .filter((name): name is string => !!name)
}

export function AdventureDetails({
  adventure,
  host,
  participants,
}: {
  adventure: Adventure
  host: Host | null
  participants: Participant[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  const [isJoined, setIsJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [coverImageFailed, setCoverImageFailed] = useState(false)

  const isHostViewer = viewerId != null && viewerId === adventure.host_id
  const canJoin = adventure.status?.toLowerCase() === 'open' && !isHostViewer && !isJoined
  const canUnjoin = !isHostViewer && isJoined
  const participantCount = participants.length
  const visibleParticipants = participants.slice(0, 8)
  const hiddenParticipantsCount = Math.max(0, participantCount - visibleParticipants.length)

  useEffect(() => {
    let active = true

    async function loadViewerSignupState() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) {
        return
      }

      const userId = user?.id ?? null
      setViewerId(userId)

      if (!userId) {
        setIsJoined(false)
        return
      }

      const { data: existingSignup } = await supabase
        .from('adventure_signups')
        .select('id')
        .eq('adventure_id', adventure.id)
        .eq('user_id', userId)
        .in('status', ['active', 'pending_payment'])
        .maybeSingle()

      if (!active) {
        return
      }

      setIsJoined(Boolean(existingSignup))
    }

    void loadViewerSignupState()

    return () => {
      active = false
    }
  }, [adventure.id, supabase])

  useEffect(() => {
    let active = true

    async function loadProfilePreview(username: string) {
      setIsProfileLoading(true)
      setProfileError(null)
      setProfilePreview(null)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, cover_url, city, state, certifications, created_at')
        .eq('username', username)
        .maybeSingle()

      if (!active) {
        return
      }

      if (error || !profile) {
        setProfileError(error?.message || 'Unable to load profile.')
        setIsProfileLoading(false)
        return
      }

      const [
        { count: hostedCount },
        { count: reviewsCount },
        { data: reviewAggregate },
        { data: interestRows },
        { count: joinedCount },
        { data: recentReviewsRaw },
        { data: hostedAdventuresRaw },
      ] = await Promise.all([
        supabase.from('adventures').select('id', { head: true, count: 'exact' }).eq('host_id', profile.id),
        supabase.from('reviews').select('id', { head: true, count: 'exact' }).eq('host_id', profile.id),
        supabase.from('reviews').select('avg:rating.avg()').eq('host_id', profile.id).maybeSingle(),
        supabase.from('profile_interests').select('interest:interests(name)').eq('profile_id', profile.id),
        supabase.from('adventure_signups').select('id', { head: true, count: 'exact' }).eq('user_id', profile.id).eq('status', 'active'),
        supabase
          .from('reviews')
          .select('id, rating, body, created_at, reviewer:profiles!reviews_reviewer_id_fkey(username, display_name, avatar_url)')
          .eq('host_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('adventures')
          .select('id, slug, title, start_at')
          .eq('host_id', profile.id)
          .order('start_at', { ascending: false })
          .limit(3),
      ])

      if (!active) {
        return
      }

      const averageRating =
        reviewAggregate && typeof (reviewAggregate as unknown as { avg?: unknown }).avg === 'number'
          ? ((reviewAggregate as unknown as { avg: number }).avg ?? null)
          : null

      const interests = mapInterestNames(interestRows as Array<{ interest?: unknown }> | null | undefined)

      const recentReviews = (recentReviewsRaw ?? []).map((review) => {
        const rawReviewer = (review as unknown as { reviewer?: unknown }).reviewer
        const reviewer = (Array.isArray(rawReviewer) ? rawReviewer[0] : rawReviewer) as
          | { username: string; display_name: string | null; avatar_url: string | null }
          | null

        return {
          id: review.id,
          rating: review.rating ?? 0,
          body: review.body ?? null,
          created_at: review.created_at,
          reviewer,
        }
      })

      const hostedAdventures = (hostedAdventuresRaw ?? []).map((adventure) => ({
        id: adventure.id,
        slug: (adventure as unknown as { slug?: string | null }).slug ?? null,
        title: adventure.title,
        start_at: adventure.start_at,
      }))

      setProfilePreview({
        username: profile.username,
        data: {
          user: {
            name: profile.display_name || profile.username,
            role: (hostedCount ?? 0) > 0 ? 'Adventure Host' : 'Member',
            bio: profile.bio,
            joinDate: formatJoinDate(profile.created_at),
            city: profile.city,
            state: profile.state,
            adventuresHosted: hostedCount ?? 0,
            adventuresJoined: joinedCount ?? 0,
            reviews: reviewsCount ?? 0,
            reviewRating: averageRating,
            imageUrl: profile.avatar_url,
            coverImageUrl: profile.cover_url,
            verificationBadge: false,
            interests,
            certifications: parseProfileCertifications(profile.certifications),
          },
          recentReviews,
          hostedAdventures,
        },
      })
      setIsProfileLoading(false)
    }

    if (isProfileModalOpen && selectedProfileUsername) {
      void loadProfilePreview(selectedProfileUsername)
    }

    return () => {
      active = false
    }
  }, [isProfileModalOpen, selectedProfileUsername, supabase])

  function handleOpenProfileModal(event: React.MouseEvent, username: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    setSelectedProfileUsername(username)
    setIsProfileModalOpen(true)
  }

  async function handleJoinAdventure() {
    if (isJoining || !canJoin) {
      return
    }

    setJoinError(null)
    setJoinSuccess(null)
    setIsJoining(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname || `/adventures/${adventure.id}`)}`)
        return
      }

      const { error } = await supabase.from('adventure_signups').insert({
        adventure_id: adventure.id,
        user_id: user.id,
        status: 'active',
        seats: 1,
      })

      if (error) {
        if (error.code === '23505') {
          setIsJoined(true)
          setJoinSuccess('You are already joined for this adventure.')
          return
        }

        setJoinError(error.message)
        return
      }

      setIsJoined(true)
      setJoinSuccess('You have joined this adventure.')
      router.refresh()
    } finally {
      setIsJoining(false)
    }
  }

  async function handleUnjoinAdventure() {
    if (isJoining || !canUnjoin) {
      return
    }

    setJoinError(null)
    setJoinSuccess(null)
    setIsJoining(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname || `/adventures/${adventure.id}`)}`)
        return
      }

      const { data, error } = await supabase
        .from('adventure_signups')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('adventure_id', adventure.id)
        .eq('user_id', user.id)
        .in('status', ['active', 'pending_payment'])
        .select('id')

      if (error) {
        setJoinError(error.message)
        return
      }

      if (!data || data.length === 0) {
        setJoinError('No active signup found to unjoin.')
        return
      }

      setIsJoined(false)
      setJoinSuccess('You have unjoined this adventure.')
      router.refresh()
    } finally {
      setIsJoining(false)
    }
  }

  const start = new Date(adventure.start_at)
  const formattedDate = Number.isNaN(start.getTime()) ? null : start.toLocaleDateString()
  const formattedTime = Number.isNaN(start.getTime())
    ? null
    : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const cost = adventure.cost_dollars > 0 ? `$${adventure.cost_dollars}` : 'Free'

  let coverUrl: string | null = null
  if (adventure.cover_image_path) {
    const mediaBucket =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim()) ||
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PROFILE_MEDIA_BUCKET?.trim()) ||
      'user-media'
    const { data } = supabase.storage.from(mediaBucket).getPublicUrl(adventure.cover_image_path)
    coverUrl = data?.publicUrl ?? null
  }

  const resolvedCoverUrl = !coverImageFailed && coverUrl ? coverUrl : '/AdventuresCalendar-bg.png'

  return (
    <main>
      <header className="relative isolate pt-16">
        <Container className="py-10">
          <div className="flex items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none">
            <div className="flex items-center gap-x-6">
              <h1>
                <div className="text-2xl font-bold text-gray-900">{adventure.title}</div>
              </h1>
            </div>
            <div className="flex items-center gap-x-4 sm:gap-x-6">
              <button type="button" className="hidden text-sm/6 font-semibold text-gray-900 sm:block">
                Share
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isJoined) {
                    void handleUnjoinAdventure()
                    return
                  }

                  void handleJoinAdventure()
                }}
                disabled={(!canJoin && !canUnjoin) || isJoining}
                className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {isHostViewer
                  ? 'You Are Hosting'
                  : isJoined
                    ? (isJoining ? 'Unjoining…' : 'Unjoin')
                    : (isJoining ? 'Joining…' : 'Join Adventure')}
              </button>

              <Menu as="div" className="relative sm:hidden">
                <MenuButton className="relative block">
                  <span className="absolute -inset-3" />
                  <span className="sr-only">More</span>
                  <EllipsisVerticalIcon aria-hidden="true" className="size-5 text-gray-500" />
                </MenuButton>

                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline outline-1 outline-gray-900/5"
                >
                  <MenuItem>
                    <button
                      type="button"
                      className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-[focus]:bg-white"
                    >
                      Share
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
          {joinError ? (
            <p className="mt-2 text-sm text-red-600">{joinError}</p>
          ) : null}
          {joinSuccess ? (
            <p className="mt-2 text-sm text-green-700">{joinSuccess}</p>
          ) : null}
        </Container>
      </header>

      <Container className="py-2">
        <div className="mx-auto max-w-2xl lg:max-w-none lg:flex lg:gap-x-8">
          {/* Sidebar: Host + Summary + Details (first in DOM for mobile, right on desktop) */}
          <div className="lg:order-2 lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-6">
            {/* Host Card */}
            {host ? (
              <div className="rounded-lg bg-white shadow-sm outline outline-1 outline-gray-900/5 p-6">
                <h2 className="text-sm/6 font-semibold text-gray-900 mb-4">Host</h2>
                <div className="flex items-center gap-x-4">
                  {host.avatarUrl ? (
                    <img
                      src={host.avatarUrl}
                      alt={host.displayName}
                      className="size-12 flex-none rounded-full bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex size-12 flex-none items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {host.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${encodeURIComponent(host.username)}`}
                      onClick={(event) => handleOpenProfileModal(event, host.username)}
                      className="text-sm font-semibold text-gray-900 hover:underline"
                    >
                      {host.displayName}
                    </Link>
                    <div className="mt-1 flex items-center gap-x-1.5 text-sm text-gray-500">
                      {host.averageRating != null ? (
                        <>
                          <StarIcon className="size-4 text-yellow-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700">{host.averageRating}</span>
                          <span>({host.reviewCount} {host.reviewCount === 1 ? 'review' : 'reviews'})</span>
                        </>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Summary Card */}
            <div className="rounded-lg bg-white shadow-sm outline outline-1 outline-gray-900/5">
              <h2 className="sr-only">Summary</h2>

              {/* Map */}
              {adventure.location_name ? (
                <div className="h-48 w-full rounded-t-lg overflow-hidden">
                  <AdventureDetailMap
                    locationName={adventure.location_name}
                    locationCity={adventure.location_city}
                    locationState={adventure.location_state}
                    locationCountry={adventure.location_country}
                  />
                </div>
              ) : null}

              <div className="pl-6 pt-6 pr-6 pb-6">
                <dt className="text-sm/6 font-semibold text-gray-900">Location</dt>
                <dd className="mt-1 flex items-center gap-x-1.5 text-sm/6 text-gray-700">
                  <MapPinIcon aria-hidden="true" className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {formatLocationText(adventure)}
                </dd>
              </div>
            </div>

            {/* Date / Status / Capacity / Cost Card */}
            <div className="rounded-lg bg-white shadow-sm outline outline-1 outline-gray-900/5">
              <dl className="flex flex-wrap">
                <div className="flex-auto pl-6 pt-6">
                  <dt className="text-sm/6 font-semibold text-gray-900">Date</dt>
                  <dd className="mt-1 flex items-center gap-x-1.5 text-sm/6 text-gray-700">
                    <CalendarDaysIcon aria-hidden="true" className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <time dateTime={adventure.start_at}>
                      {formattedDate ? formattedDate : 'Date TBA'}
                      {formattedTime ? ` • ${formattedTime}` : ''}
                    </time>
                  </dd>
                </div>
                <div className="pt-6 pr-6 text-right">
                  <dt className="text-sm/6 font-semibold text-gray-900">Status</dt>
                  <dd className="mt-1">
                    {adventure.status?.toLowerCase() === 'open' ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Open</span>
                    ) : adventure.status?.toLowerCase() === 'draft' ? (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Draft</span>
                    ) : adventure.status?.toLowerCase() === 'scheduled' ? (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Scheduled</span>
                    ) : adventure.status?.toLowerCase() === 'at capacity' || adventure.status?.toLowerCase() === 'at_capacity' ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">At Capacity</span>
                    ) : adventure.status?.toLowerCase() === 'cancelled' ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Cancelled</span>
                    ) : adventure.status?.toLowerCase() === 'completed' ? (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Completed</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{adventure.status}</span>
                    )}
                  </dd>
                </div>
                <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
                  <dt className="flex-none">
                    <span className="sr-only">Participants</span>
                    <UsersIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
                  </dt>
                  <dd className="text-sm/6 text-gray-500">{participantCount} of {adventure.max_capacity} spots filled</dd>
                </div>
                <div className="mt-4 flex w-full flex-none items-center gap-x-4 px-6 pb-6">
                  <dt className="flex-none text-sm/6 font-semibold text-gray-900">Cost:</dt>
                  <dd className="text-sm/6 font-medium text-gray-900">{cost}</dd>
                </div>
              </dl>
            </div>

            {/* Details Card */}
            <div className="rounded-lg bg-white shadow-sm outline outline-1 outline-gray-900/5 p-6">
              <h2 className="text-sm/6 font-semibold text-gray-900">Joining This Adventure</h2>
              <div className="mt-4 flex items-center gap-x-4">
                <div className="flex -space-x-1">
                  {visibleParticipants.map((participant) => (
                    <Link
                      key={participant.id}
                      href={`/profile/${encodeURIComponent(participant.username)}`}
                      onClick={(event) => handleOpenProfileModal(event, participant.username)}
                      title={participant.isHost ? `${participant.displayName} (Host)` : participant.displayName}
                      className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.displayName}
                          className="size-7 rounded-full bg-gray-50 object-cover outline outline-2 outline-white"
                        />
                      ) : (
                        <div
                          className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700 outline outline-2 outline-white"
                        >
                          {participant.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ))}
                  {hiddenParticipantsCount > 0 ? (
                    <div className="flex size-7 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-700 outline outline-2 outline-white">
                      +{hiddenParticipantsCount}
                    </div>
                  ) : null}
                </div>
                <span className="text-sm font-medium text-gray-700">{participantCount} {participantCount === 1 ? 'person' : 'people'}</span>
              </div>
            </div>
          </div>

          {/* Main content: Overview + Comments (second in DOM, left on desktop) */}
          <div className="lg:order-1 flex-1 min-w-0 flex flex-col gap-6 mt-6 lg:mt-0">
            {/* Overview Card */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
              <img
                src={resolvedCoverUrl}
                alt={adventure.title}
                onError={() => setCoverImageFailed(true)}
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="px-4 py-2 sm:px-8 sm:pb-4 xl:px-16 xl:pb-6 xl:pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  <div className="bg-white px-4 py-2 sm:px-6 lg:px-8">
                    <dt className="text-sm/6 font-medium text-gray-500">Activity Type</dt>
                    <dd className="mt-2 flex items-baseline gap-x-2">
                      <span className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        <ActivityTypeIcon type={adventure.adventure_type} className="size-3.5" />
                        {adventure.adventure_type}
                      </span>
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:px-6 lg:px-8">
                    <dt className="text-sm/6 font-medium text-gray-500">Difficulty</dt>
                    <dd className="mt-2 flex items-baseline gap-x-2">
                      {adventure.difficulty?.toLowerCase() === 'beginner' ? (
                        <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <CheckCircleIcon className="size-3.5" />
                          Beginner
                        </span>
                      ) : adventure.difficulty?.toLowerCase() === 'intermediate' ? (
                        <span className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          <ExclamationTriangleIcon className="size-3.5" />
                          Intermediate
                        </span>
                      ) : adventure.difficulty?.toLowerCase() === 'advanced' ? (
                        <span className="inline-flex items-center gap-x-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          <SkullIcon className="size-3.5" />
                          Advanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {adventure.difficulty}
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:px-6 lg:px-8">
                    <dt className="text-sm/6 font-medium text-gray-500">Tags</dt>
                    <dd className="mt-2 flex flex-wrap items-baseline gap-2">
                      {(adventure.tags ?? []).length > 0 ? (
                        (adventure.tags ?? []).map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            {formatTag(tag)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm/6 text-gray-600 whitespace-pre-line">
                  {adventure.description}
                </div>

                {(adventure.required_gear && adventure.required_gear.length > 0) || (adventure.host_included && adventure.host_included.length > 0) ? (
                  <div className="mt-8 border-t border-gray-900/5 pt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {adventure.required_gear && adventure.required_gear.length > 0 ? (
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Required Gear</h3>
                          <ul className="mt-4 space-y-3 text-sm/6 text-gray-600">
                            {adventure.required_gear.map((item) => (
                              <li key={item} className="flex gap-x-3">
                                <CheckCircleIcon aria-hidden="true" className="h-6 w-5 text-yellow-500 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {adventure.host_included && adventure.host_included.length > 0 ? (
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Provided by Host</h3>
                          <ul className="mt-4 space-y-3 text-sm/6 text-gray-600">
                            {adventure.host_included.map((item) => (
                              <li key={item} className="flex gap-x-3">
                                <CheckCircleIcon aria-hidden="true" className="h-6 w-5 text-green-600 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Comments Card */}
            <div>
              <AdventureComments adventureId={adventure.id} />
            </div>
          </div>
        </div>
      </Container>

      <Dialog open={isProfileModalOpen} onClose={setIsProfileModalOpen} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <DialogPanel className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg bg-white p-8 shadow-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 text-black shadow-sm ring-1 ring-inset ring-gray-200 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                aria-label="Close profile modal"
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </button>

              {isProfileLoading ? (
                <p className="mt-4 text-sm text-gray-600">Loading profile...</p>
              ) : profileError ? (
                <p className="mt-4 text-sm text-red-700">{profileError}</p>
              ) : profilePreview?.data ? (
                <ProfileFullContent data={profilePreview.data} />
              ) : null}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </main>
  )
}
