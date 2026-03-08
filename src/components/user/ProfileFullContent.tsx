import Link from 'next/link'
import { UserCircleIcon } from '@heroicons/react/24/solid'

import { ProfileCard, type ProfileCardUser } from '@/components/user/ProfileCard'

export type ProfileFullContentData = {
  user: ProfileCardUser
  recentReviews: Array<{
    id: string
    rating: number
    body: string | null
    created_at: string
    reviewer: {
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }>
  hostedAdventures: Array<{
    id: string
    slug?: string | null
    title: string
    start_at: string
  }>
}

export function ProfileFullContent({ data, editHref }: { data: ProfileFullContentData; editHref?: string }) {
  const recentReviews = Array.isArray(data.recentReviews) ? data.recentReviews : []
  const hostedAdventures = Array.isArray(data.hostedAdventures) ? data.hostedAdventures : []

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-6 relative">
        <ProfileCard user={data.user} editHref={editHref} />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
        <div className="space-y-6">
          {recentReviews.length ? recentReviews.map((review) => (
            <div key={review.id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-0">
              {review.reviewer?.avatar_url ? (
                <img alt={review.reviewer.display_name || review.reviewer.username} src={review.reviewer.avatar_url} className="size-10 rounded-full" />
              ) : (
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserCircleIcon className="size-7 text-gray-400" aria-hidden="true" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {review.reviewer?.display_name || review.reviewer?.username || 'Reviewer'}
                  </h3>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, j) => (
                      <span key={j}>{j < (review.rating ?? 0) ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                <p className="text-gray-700 mt-2">{review.body || '—'}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-600">No reviews yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Adventures Hosted</h2>
        <div className="space-y-4">
          {hostedAdventures.length ? hostedAdventures.map((adventure) => (
            <div key={adventure.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-white">
              <div>
                <h3 className="font-semibold text-gray-900">{adventure.title}</h3>
                <p className="text-sm text-gray-500">{new Date(adventure.start_at).toLocaleDateString()}</p>
              </div>
              <Link
                href={`/adventures/${encodeURIComponent((adventure as unknown as { slug?: string | null }).slug || adventure.id)}`}
                className="text-black hover:text-black font-medium"
              >
                View →
              </Link>
            </div>
          )) : (
            <p className="text-sm text-gray-600">No hosted adventures yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
