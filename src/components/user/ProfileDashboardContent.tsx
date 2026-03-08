import Link from 'next/link'
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

type DashboardStats = {
  activeAdventures: number
  totalReviews: number
  followers: number
  savedAdventures: number
}

type DashboardAdventure = {
  id: string
  slug?: string | null
  title: string
  startAt: string
  dateLabel: string
  participants: number
  status: string
  involvement: 'hosting' | 'joining'
}

type DashboardActivity = {
  id: string
  kind: 'adventure_created' | 'review_received' | 'adventure_joined'
  title: string
  date: string
}

function formatStatus(status: string) {
  if (status === 'at_capacity') return 'At Capacity'
  if (status === 'open') return 'Open'
  if (status === 'draft') return 'Draft'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'cancelled') return 'Cancelled'
  return status
}

export function ProfileDashboardContent({
  username,
  stats,
  myAdventures,
  recentActivity,
}: {
  username?: string
  stats: DashboardStats
  myAdventures: DashboardAdventure[]
  recentActivity: DashboardActivity[]
}) {
  const isCanonicalUser = !!username && username !== 'me'
  const profileHref = isCanonicalUser ? `/profile/${encodeURIComponent(username)}` : '/profile'
  const manageAdventuresHref = isCanonicalUser ? `${profileHref}/my-adventures` : '/profile/my-adventures'
  const statCards = [
    { label: 'Active Adventures', value: stats.activeAdventures, icon: CalendarDaysIcon, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: ClipboardDocumentListIcon, color: 'bg-green-50 text-green-600' },
    { label: 'Followers', value: stats.followers, icon: UserGroupIcon, color: 'bg-purple-50 text-purple-600' },
    { label: 'Saved Adventures', value: stats.savedAdventures, icon: HeartIcon, color: 'bg-pink-50 text-pink-600' },
  ]

  return (
    <div className="py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="size-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Adventures */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Adventures</h2>
            </div>
            <div className="space-y-4">
              {myAdventures.length ? myAdventures.map((adventure) => (
                <div
                  key={adventure.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-white transition"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      <Link
                        href={`/adventures/${encodeURIComponent((adventure as unknown as { slug?: string | null }).slug || adventure.id)}`}
                        className="hover:underline"
                      >
                        {adventure.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {adventure.dateLabel} • {adventure.participants} participants
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        adventure.status === 'open'
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                      }`}
                    >
                      {formatStatus(adventure.status)}
                    </span>
                    <span
                      className={
                        adventure.involvement === 'hosting'
                          ? 'inline-flex items-center rounded-md bg-black px-2 py-1 text-xs font-medium text-white'
                          : 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'
                      }
                    >
                      {adventure.involvement === 'hosting' ? 'Hosting' : 'Joined'}
                    </span>
                    {adventure.involvement === 'hosting' ? (
                      <a
                        href={`/adventures/${encodeURIComponent((adventure as unknown as { slug?: string | null }).slug || adventure.id)}/manage`}
                        className="text-black hover:text-black font-medium"
                      >
                        Manage &rarr;
                      </a>
                    ) : null}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-600">No adventures yet.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {recentActivity.length ? recentActivity.map((activity, idx) => {
                const Icon = activity.kind === 'review_received' ? ClipboardDocumentListIcon : CalendarDaysIcon
                return (
                <div
                  key={activity.id}
                  className={`flex gap-4 ${idx !== recentActivity.length - 1 ? 'pb-6 border-b border-gray-200' : ''}`}
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
                      <Icon className="h-4 w-4 text-black" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
                )
              }) : (
                <p className="text-sm text-gray-600">No recent activity yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href={profileHref} className="text-sm text-black hover:text-black font-medium">
                  View Profile
                </Link>
              </li>
              <li>
                <Link
                  href={manageAdventuresHref}
                  className="text-sm text-black hover:text-black font-medium"
                >
                  Manage Adventures
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
