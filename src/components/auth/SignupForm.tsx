'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from './OAuthButtons'

export function SignupForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function normalizeUsername(value: string) {
    return value.trim().toLowerCase()
  }

  function isValidUsername(value: string) {
    // Keep this in sync with any server-side expectations.
    return /^[a-z0-9_]{3,20}$/.test(value)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const username = normalizeUsername(String(formData.get('username') ?? ''))
      const email = String(formData.get('email') ?? '').trim()
      const password = String(formData.get('password') ?? '')
      const confirmPassword = String(formData.get('confirm-password') ?? '')

      if (!username || !email || !password) {
        setError('Username, email, and password are required.')
        return
      }

      if (!isValidUsername(username)) {
        setError('Username must be 3–20 characters and only use lowercase letters, numbers, and underscores.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      const supabase = createClient()

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (existingProfileError) {
        setError(existingProfileError.message)
        return
      }

      if (existingProfile) {
        setError('That username is already taken.')
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile/edit`,
          data: {
            username,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmations are enabled, there may be no session yet.
      if (!data.session) {
        setNotice('Check your email to confirm your account, then continue setup.')
        router.push('/login?notice=verify-email&next=/profile/edit')
        return
      }

      // If the project is configured to return a session immediately, create the profile row now.
      if (data.user) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, username }, { onConflict: 'id' })

        if (upsertError) {
          setError(upsertError.message)
          return
        }
      }

      router.push('/profile/edit')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign up failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Create your account</h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" onSubmit={onSubmit}>
            {(error || notice) && (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  error ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-800'
                }`}
              >
                {error ?? notice}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="nickname"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm/6 font-medium text-gray-900">
                Confirm password
              </label>
              <div className="mt-2">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-black checked:bg-black indeterminate:border-black indeterminate:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-[:checked]:opacity-100"
                    />
                    <path
                      d="M3 7H11"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-[:indeterminate]:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor="terms" className="block text-sm/6 text-gray-900">
                I agree to the{' '}
                <a href="#" className="font-semibold text-black hover:text-black">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-black hover:text-black">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>

          <div>
            <div className="mt-10 flex items-center gap-x-6">
              <div className="w-full flex-1 border-t border-gray-200" />
              <p className="text-nowrap text-sm/6 font-medium text-gray-900">Or sign up with</p>
              <div className="w-full flex-1 border-t border-gray-200" />
            </div>

            <div className="mt-6">
              <OAuthButtons />
            </div>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-black hover:text-black">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
