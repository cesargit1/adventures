import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Create Account - AdventuresCalendar',
  description: 'Create your AdventuresCalendar account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
