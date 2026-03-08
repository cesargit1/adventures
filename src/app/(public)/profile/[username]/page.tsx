import { ProfileFullContent } from '@/components/user/ProfileFullContent'
import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'
import { BreadcrumbBackButton } from '@/components/common/BreadcrumbBackButton'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseProfileCertifications } from '@/lib/certifications'
import { notFound } from 'next/navigation'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  return {
    title: `${username} - Profile - AdventuresCalendar`,
    description: `View ${username}'s profile, hosted adventures, and reviews on AdventuresCalendar.`,
  }
}

function formatJoinDate(value: string) {
  const date = new Date(value)
  const formatted = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
  return formatted
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

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)
  const supabase = await createSupabaseServerClient()

  const [{ data: authData }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, cover_url, city, state, certifications, created_at')
      .eq('username', username)
      .maybeSingle(),
  ])

  const viewer = authData.user

  if (!profile) {
    notFound()
  }

  const viewerIsOwner = !!viewer && viewer.id === profile.id

  const [
    { count: hostedCount },
    { count: reviewsCount },
    { data: reviewAggregate },
    { data: interestRows },
    viewerJoinedCountResult,
    { data: recentReviews },
    { data: hostedAdventures },
  ] = await Promise.all([
    supabase.from('adventures').select('id', { head: true, count: 'exact' }).eq('host_id', profile.id),
    supabase.from('reviews').select('id', { head: true, count: 'exact' }).eq('host_id', profile.id),
    supabase.from('reviews').select('avg:rating.avg()').eq('host_id', profile.id).maybeSingle(),
    supabase.from('profile_interests').select('interest:interests(name)').eq('profile_id', profile.id),
    viewerIsOwner
      ? supabase
          .from('adventure_signups')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', profile.id)
          .eq('status', 'active')
      : Promise.resolve({ count: null }),
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

  const interests = mapInterestNames(interestRows as Array<{ interest?: unknown }> | null | undefined)

  const averageRating =
    reviewAggregate && typeof (reviewAggregate as unknown as { avg?: unknown }).avg === 'number'
      ? ((reviewAggregate as unknown as { avg: number }).avg ?? null)
      : null

  const joinedCount = viewerIsOwner ? (viewerJoinedCountResult.count ?? 0) : undefined

  const profileContentData = {
    user: {
      name: profile.display_name || profile.username,
      role: (hostedCount ?? 0) > 0 ? 'Adventure Host' : 'Member',
      bio: profile.bio,
      joinDate: formatJoinDate(profile.created_at),
      city: profile.city,
      state: profile.state,
      adventuresHosted: hostedCount ?? 0,
      adventuresJoined: joinedCount,
      reviews: reviewsCount ?? 0,
      reviewRating: averageRating,
      imageUrl: profile.avatar_url,
      coverImageUrl: profile.cover_url,
      verificationBadge: false,
      interests,
      certifications: parseProfileCertifications(profile.certifications),
    },
    recentReviews: (recentReviews ?? []).map((review) => {
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
    }),
    hostedAdventures: (hostedAdventures ?? []).map((adventure) => ({
      id: adventure.id,
      slug: (adventure as unknown as { slug?: string | null }).slug ?? null,
      title: adventure.title,
      start_at: adventure.start_at,
    })),
  }

  const content = (
    <div className={viewerIsOwner ? 'py-8' : 'pt-24 pb-8'}>
      <div className="mx-auto max-w-3xl">
        {!viewerIsOwner ? (
          <nav aria-label="Breadcrumb" className="mb-6 flex">
            <ol role="list" className="flex items-center space-x-4">
              <li>
                <div>
                  <BreadcrumbBackButton
                    label="Back"
                    fallbackHref="/"
                    className="text-sm font-medium text-black hover:text-black"
                  />
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-black" />
                  <span aria-current="page" className="ml-4 text-sm font-medium text-black">
                    Profile
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        ) : null}

        <ProfileFullContent
          data={profileContentData}
          editHref={viewerIsOwner ? `/profile/${encodeURIComponent(profile.username)}/edit` : undefined}
        />
      </div>
    </div>
  )

  if (viewerIsOwner) {
    return <UserProfileNavLayout username={profile.username}>{content}</UserProfileNavLayout>
  }

  return content
}
