'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Container } from '@/components/common/Container'

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function UserProfileNavLayout({
  username,
  children,
}: {
  username?: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const safeUsername = username && username !== 'undefined' ? username : undefined

  const profileHref = safeUsername ? `/profile/${safeUsername}` : '/profile'
  const dashboardHref = safeUsername ? `${profileHref}/dashboard` : '/profile/dashboard'
  const myAdventuresHref = safeUsername ? `${profileHref}/my-adventures` : '/profile/my-adventures'

  const navigation = [
    { name: 'Dashboard', href: dashboardHref },
    { name: 'My Adventures', href: myAdventuresHref },
    { name: 'Profile', href: profileHref },
  ]

  const tabs = navigation.map((item) => {
    const current =
      item.href === profileHref
        ? pathname === item.href || pathname === `${profileHref}/edit` || pathname === '/profile/edit'
        : pathname.startsWith(item.href)

    return { ...item, current }
  })

  return (
    <Container className="pt-4">
      <div className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid grid-cols-1 flex-1 sm:hidden">
            <select
              defaultValue={tabs.find((tab) => tab.current)?.name ?? tabs[0]?.name}
              aria-label="Select a tab"
              onChange={(e) => {
                const nextHref = tabs.find((t) => t.name === e.target.value)?.href
                if (nextHref) router.push(nextHref)
              }}
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black"
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
            />
          </div>

          <div className="hidden sm:block">
            <nav aria-label="Tabs" className="flex space-x-4">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  aria-current={tab.current ? 'page' : undefined}
                  className={classNames(
                    tab.current
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:text-gray-800',
                    'rounded-md px-3 py-2 text-sm font-medium',
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/adventures/create"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Create Adventure
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      {children}
    </Container>
  )
}
