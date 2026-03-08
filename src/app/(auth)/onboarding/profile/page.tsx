import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/user/ProfileEditForm'
import { parseProfileCertifications } from '@/lib/certifications'

export const metadata = {
  title: 'Complete your profile - AdventuresCalendar',
  description: 'Choose a username and complete your AdventuresCalendar profile.',
}

export default async function CompleteProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/onboarding/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url, cover_url, city, state, certifications')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.username) {
    redirect(`/profile/${encodeURIComponent(profile.username)}/dashboard`)
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const initialFirstName = typeof meta.first_name === 'string' ? meta.first_name : ''
  const initialLastName = typeof meta.last_name === 'string' ? meta.last_name : ''

  const { data: availableInterestRows } = await supabase
    .from('interests')
    .select('name')
    .order('name', { ascending: true })

  const availableInterests = (availableInterestRows ?? [])
    .map((row) => (typeof row.name === 'string' ? row.name.trim() : ''))
    .filter((name): name is string => !!name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <ProfileEditForm
            initialEmail={user.email ?? ''}
            initialUsername={profile?.username ?? ''}
            initialAbout={profile?.bio ?? ''}
            initialCity={profile?.city ?? ''}
            initialState={profile?.state ?? ''}
            initialInterests={[]}
            availableInterests={availableInterests}
            initialCertifications={parseProfileCertifications(profile?.certifications)}
            initialFirstName={initialFirstName}
            initialLastName={initialLastName}
            initialAvatarUrl={profile?.avatar_url ?? null}
            initialCoverUrl={profile?.cover_url ?? null}
          />
        </div>
      </div>
    </div>
  )
}
