import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(value)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next')

  // Only allow internal redirects.
  let next = nextParam && nextParam.startsWith('/') ? nextParam : '/'

  // Legacy: older confirmation links pointed to onboarding.
  if (next === '/onboarding/profile') {
    next = '/profile/edit'
  }

  // Legacy: older flows used /profile/me/* aliases.
  if (next === '/profile/me/edit') {
    next = '/profile/edit'
  }

  if (code) {
    const supabase = await createSupabaseServerClient()

    await supabase.auth.exchangeCodeForSession(code)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
    const rawUsername = typeof meta.username === 'string' ? meta.username : ''
    const username = normalizeUsername(rawUsername)

    if (user && username && isValidUsername(username)) {
      // Ensure a profile row exists immediately after verification.
      // This enables /profile/{username} redirects to work on first login.
      await supabase.from('profiles').upsert({ id: user.id, username }, { onConflict: 'id' })
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
