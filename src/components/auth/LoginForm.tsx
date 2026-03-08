'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from './OAuthButtons'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldShowVerifyEmailNotice = useMemo(() => {
    return searchParams.get('notice') === 'verify-email'
  }, [searchParams])

  const [showVerifyEmailNotice, setShowVerifyEmailNotice] = useState(false)

  useEffect(() => {
    if (!shouldShowVerifyEmailNotice) return

    setShowVerifyEmailNotice(true)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('notice')
    const query = nextParams.toString()
    router.replace(query ? `/login?${query}` : '/login')
  }, [router, searchParams, shouldShowVerifyEmailNotice])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = String(formData.get('email') ?? '').trim()
      const password = String(formData.get('password') ?? '')

      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const next = searchParams.get('next')
      if (next && next.startsWith('/')) {
        router.push(next)
        router.refresh()
        return
      }

      router.push('/profile/dashboard')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>

        {showVerifyEmailNotice && (
          <div className="mt-6 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <ExclamationTriangleIcon aria-hidden="true" className="size-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Verify your email</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    We sent you a confirmation link. Please verify your email address before signing in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="text-center text-sm/6">
              <a href="#" className="font-semibold text-black hover:text-black">
                Forgot password?
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <div>
            <div className="mt-10 flex items-center gap-x-6">
              <div className="w-full flex-1 border-t border-gray-200" />
              <p className="text-nowrap text-sm/6 font-medium text-gray-900">Or continue with</p>
              <div className="w-full flex-1 border-t border-gray-200" />
            </div>

            <div className="mt-6">
              <OAuthButtons />
            </div>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Not a member?{' '}
              <Link href="/signup" className="font-semibold text-black hover:text-black">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
