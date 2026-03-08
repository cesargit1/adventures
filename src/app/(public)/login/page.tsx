import { LoginForm } from '@/components/auth/LoginForm'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Suspense } from 'react'

export const metadata = {
  title: 'Sign In - AdventuresCalendar',
  description: 'Sign in to your AdventuresCalendar account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
