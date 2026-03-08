import { notFound, redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/user/ProfileEditForm'
import { parseProfileCertifications } from '@/lib/certifications'

export const metadata = {
  title: 'Edit Profile - AdventuresCalendar',
  description: 'Edit your AdventuresCalendar profile.',
}

function splitName(displayName: string | null) {
  if (!displayName) return { firstName: '', lastName: '' }
  const parts = displayName.trim().split(/\s+/)
  if (!parts.length) return { firstName: '', lastName: '' }
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
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

export default async function ProfileUsernameEditPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: rawUsername } = await params
  const decodedUsername = decodeURIComponent(rawUsername)
  const username = normalizeUsername(decodedUsername)

  // Canonicalize casing/spacing so lookups don't fail.
  if (decodedUsername !== username) {
    redirect(`/profile/${encodeURIComponent(username)}/edit`)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/profile/${encodeURIComponent(username)}/edit`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, cover_url, city, state, certifications')
    .eq('username', username)
    .maybeSingle()

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const metaFirstName = typeof meta.first_name === 'string' ? meta.first_name : ''
  const metaLastName = typeof meta.last_name === 'string' ? meta.last_name : ''

  const metaUsernameRaw = typeof meta.username === 'string' ? meta.username : ''
  const metaUsername = normalizeUsername(metaUsernameRaw)

  const { data: availableInterestRows } = await supabase
    .from('interests')
    .select('name')
    .order('name', { ascending: true })

  const availableInterests = (availableInterestRows ?? [])
    .map((row) => (typeof row.name === 'string' ? row.name.trim() : ''))
    .filter((name): name is string => !!name)

  // If the profile row doesn't exist yet, allow the owner (based on auth + metadata) to edit
  // and create the profile row via the form's upsert.
  if (!profile) {
    if (metaUsername && metaUsername === username) {
      const derived = splitName(null)
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit your profile</h1>
              <ProfileEditForm
                initialEmail={user.email ?? ''}
                initialUsername={username}
                initialAbout={''}
                initialCity={''}
                initialState={''}
                initialInterests={[]}
                availableInterests={availableInterests}
                initialCertifications={[]}
                initialFirstName={metaFirstName || derived.firstName}
                initialLastName={metaLastName || derived.lastName}
                initialAvatarUrl={null}
                initialCoverUrl={null}
              />
            </div>
          </div>
        </div>
      )
    }

    notFound()
  }

  if (profile.id !== user.id) {
    redirect(`/profile/${encodeURIComponent(profile.username)}`)
  }

  const { data: interestRows } = await supabase
    .from('profile_interests')
    .select('interest:interests(name)')
    .eq('profile_id', user.id)

  const initialInterests = mapInterestNames(interestRows as Array<{ interest?: unknown }> | null | undefined)

  const derived = splitName(profile.display_name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit your profile</h1>
          <ProfileEditForm
            initialEmail={user.email ?? ''}
            initialUsername={profile.username}
            initialAbout={profile.bio ?? ''}
            initialCity={profile.city ?? ''}
            initialState={profile.state ?? ''}
            initialInterests={initialInterests}
            availableInterests={availableInterests}
            initialCertifications={parseProfileCertifications(profile.certifications)}
            initialFirstName={metaFirstName || derived.firstName}
            initialLastName={metaLastName || derived.lastName}
            initialAvatarUrl={profile.avatar_url}
            initialCoverUrl={profile.cover_url}
          />
        </div>
      </div>
    </div>
  )
}
