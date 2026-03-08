'use client'

import Link from 'next/link'
import {
  UsersIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ServerIcon,
  FlagIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const stats = [
  { label: 'Total Users', value: '2,543', icon: UsersIcon, color: 'bg-blue-50 text-blue-600' },
  { label: 'Active Adventures', value: '427', icon: GlobeAltIcon, color: 'bg-green-50 text-green-600' },
  { label: 'Total Revenue', value: '$89,234', icon: CurrencyDollarIcon, color: 'bg-purple-50 text-purple-600' },
  { label: 'Platform Health', value: '99.8%', icon: ServerIcon, color: 'bg-emerald-50 text-emerald-600' },
]

const recentActivity = [
  {
    id: 1,
    type: 'user_registered',
    title: 'New user registered: Sarah Johnson',
    date: '45 minutes ago',
    icon: UsersIcon,
  },
  {
    id: 2,
    type: 'adventure_flagged',
    title: 'Adventure flagged for review: "Extreme Cliff Diving"',
    date: '3 hours ago',
    icon: FlagIcon,
  },
  {
    id: 3,
    type: 'user_verified',
    title: 'Guide verification approved: Michael Foster',
    date: '5 hours ago',
    icon: ShieldCheckIcon,
  },
  {
    id: 4,
    type: 'report_submitted',
    title: 'Safety report submitted for "Desert Hiking Tour"',
    date: '12 hours ago',
    icon: ExclamationTriangleIcon,
  },
  {
    id: 5,
    type: 'adventure_created',
    title: 'New adventure published: "Rocky Mountain Trail"',
    date: '1 day ago',
    icon: GlobeAltIcon,
  },
]

const flaggedAdventures = [
  {
    id: 1,
    title: 'Extreme Cliff Diving Experience',
    author: 'Tom Cook',
    reason: 'Safety concerns',
    status: 'pending',
  },
  {
    id: 2,
    title: 'Unverified Skydiving Tour',
    author: 'Lindsay Walton',
    reason: 'Missing certifications',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Remote Wilderness Survival',
    author: 'Courtney Henry',
    reason: 'User reports',
    status: 'under_review',
  },
]

export default function AdminDashboard() {
  return (
    <div className="py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-200">
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
          {/* Flagged Adventures */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Flagged Adventures</h2>
            </div>
            <div className="space-y-4">
              {flaggedAdventures.map((adventure) => (
                <div key={adventure.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{adventure.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">By {adventure.author} &middot; {adventure.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      adventure.status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20' : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10'
                    }`}>
                      {adventure.status === 'pending' ? 'Pending' : 'Under Review'}
                    </span>
                    <Link href={`/admin/adventures`} className="text-black hover:text-black font-medium">
                      Review &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Platform Activity</h2>
            <div className="space-y-6">
              {recentActivity.map((activity, idx) => (
                <div key={activity.id} className={`flex gap-4 ${idx !== recentActivity.length - 1 ? 'pb-6 border-b border-gray-200' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
                      <activity.icon className="h-4 w-4 text-black" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Platform Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-none rounded-full bg-green-500/10 p-1 text-green-500">
                <div className="size-2 rounded-full bg-current" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Platform Status: Healthy</h3>
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500">Uptime (30d)</dt>
                <dd className="text-lg font-semibold text-gray-900 mt-1">99.8%</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Avg Response Time</dt>
                <dd className="text-lg font-semibold text-gray-900 mt-1">142ms</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Active Sessions</dt>
                <dd className="text-lg font-semibold text-gray-900 mt-1">1,247</dd>
              </div>
            </dl>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Admin Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/admin/users" className="text-sm text-black hover:text-black font-medium">Manage Users</Link></li>
              <li><Link href="/admin/adventures" className="text-sm text-black hover:text-black font-medium">Moderate Adventures</Link></li>
              <li><a href="#" className="text-sm text-black hover:text-black font-medium">View Reports</a></li>
              <li><a href="#" className="text-sm text-black hover:text-black font-medium">Platform Settings</a></li>
            </ul>
          </div>

          {/* Alerts */}
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Pending Actions</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>3 adventures awaiting review</li>
              <li>5 guide verifications pending</li>
              <li>2 user reports to address</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
