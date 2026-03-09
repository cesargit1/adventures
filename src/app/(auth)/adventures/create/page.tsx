import { AdventureForm } from '@/components/adventure/AdventureForm'
import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'

export const metadata = {
  title: 'Create Adventure - AdventuresCalendar',
  description: 'Create and publish a new outdoor adventure for others to find, join, and experience.',
}

export default function CreateAdventurePage() {
  return (
    <UserProfileNavLayout>
      <div className="py-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Adventure</h1>
            <AdventureForm />
          </div>
        </div>
      </div>
    </UserProfileNavLayout>
  )
}
