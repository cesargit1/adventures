import { redirect } from 'next/navigation'

import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'
import { ProfileEditForm } from '@/components/user/ProfileEditForm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseProfileCertifications } from '@/lib/certifications'

export const metadata = {
  title: 'Edit Profile - AdventuresCalendar',
  description: 'Edit your AdventuresCalendar profile.',
}

export default async function ProfileEditIndexPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile/edit')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, cover_url, bio, city, state, certifications, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.username) {
    redirect(`/profile/${encodeURIComponent(profile.username)}/edit`)
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const initialFirstName = typeof meta.first_name === 'string' ? meta.first_name : ''
  const initialLastName = typeof meta.last_name === 'string' ? meta.last_name : ''
  const initialUsername = typeof meta.username === 'string' ? meta.username : ''

  function splitName(displayName: string | null) {
    if (!displayName) return { firstName: '', lastName: '' }
    const parts = displayName.trim().split(/\s+/)
    if (!parts.length) return { firstName: '', lastName: '' }
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
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

  const derived = splitName(profile?.display_name ?? null)
  const { data: interestRows } = await supabase
    .from('profile_interests')
    .select('interest:interests(name)')
    .eq('profile_id', user.id)

  const { data: availableInterestRows } = await supabase
    .from('interests')
    .select('name')
    .order('name', { ascending: true })

  const initialInterests = mapInterestNames(interestRows as Array<{ interest?: unknown }> | null | undefined)
  const availableInterests = (availableInterestRows ?? [])
    .map((row) => (typeof row.name === 'string' ? row.name.trim() : ''))
    .filter((name): name is string => !!name)

  return (
    <UserProfileNavLayout>
      <div className="py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit your profile</h1>
            <ProfileEditForm
              initialEmail={user.email ?? ''}
              initialUsername={initialUsername}
              initialAbout={profile?.bio ?? ''}
              initialCity={profile?.city ?? ''}
              initialState={profile?.state ?? ''}
              initialInterests={initialInterests}
              availableInterests={availableInterests}
              initialCertifications={parseProfileCertifications(profile?.certifications)}
              initialFirstName={initialFirstName || derived.firstName}
              initialLastName={initialLastName || derived.lastName}
              initialAvatarUrl={profile?.avatar_url ?? null}
              initialCoverUrl={profile?.cover_url ?? null}
            />
          </div>
        </div>
      </div>
    </UserProfileNavLayout>
  )
}
