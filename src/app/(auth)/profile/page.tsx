import { redirect } from 'next/navigation'

import Link from 'next/link'

import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'
import { ProfileCard } from '@/components/user/ProfileCard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseProfileCertifications } from '@/lib/certifications'

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

export default async function ProfileIndexPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url, cover_url, city, state, certifications, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.username) {
    redirect(`/profile/${encodeURIComponent(profile.username)}`)
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const metaFirstName = typeof meta.first_name === 'string' ? meta.first_name : ''
  const metaLastName = typeof meta.last_name === 'string' ? meta.last_name : ''
  const displayName = (profile?.display_name ?? `${metaFirstName} ${metaLastName}`.trim()) || user.email || 'Account'
  const { data: interestRows } = await supabase
    .from('profile_interests')
    .select('interest:interests(name)')
    .eq('profile_id', user.id)

  const interests = mapInterestNames(interestRows as Array<{ interest?: unknown }> | null | undefined)

  return (
    <UserProfileNavLayout>
      <div className="py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
            Your profile isn’t public yet. You can keep browsing, or{' '}
            <Link href="/profile/edit" className="font-semibold text-black hover:text-black">
              finish setting it up
            </Link>
            .
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 relative">
            <ProfileCard
              editHref="/profile/edit"
              user={{
                name: displayName,
                role: 'Member',
                bio: profile?.bio ?? null,
                joinDate: formatJoinDate(profile?.created_at ?? user.created_at ?? new Date().toISOString()),
                city: profile?.city ?? null,
                state: profile?.state ?? null,
                adventuresHosted: 0,
                adventuresJoined: 0,
                reviews: 0,
                reviewRating: null,
                imageUrl: profile?.avatar_url ?? null,
                coverImageUrl: profile?.cover_url ?? null,
                verificationBadge: false,
                interests,
                certifications: parseProfileCertifications(profile?.certifications),
              }}
            />
          </div>
        </div>
      </div>
    </UserProfileNavLayout>
  )
}
