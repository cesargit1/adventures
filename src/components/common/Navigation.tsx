'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

const navigationItems: { name: string; href: string }[] = [
  { name: 'How it Works', href: '/#how-it-works' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null)
  const [profileHref, setProfileHref] = useState('/profile')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function resolveProfileHref(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single()

      if (!isMounted) return
      setAvatarUrl(profile?.avatar_url ?? null)
      if (profile?.username) {
        setProfileHref(`/profile/${encodeURIComponent(profile.username)}`)
      } else {
        setProfileHref('/profile')
      }
    }

    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      const sessionUser = data.session?.user
      setIsSignedIn(Boolean(sessionUser))
      setUserEmail(sessionUser?.email ?? null)

      if (sessionUser?.id) {
        await resolveProfileHref(sessionUser.id)
      } else {
        setProfileHref('/profile')
      }
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      const sessionUser = session?.user
      setIsSignedIn(Boolean(sessionUser))
      setUserEmail(sessionUser?.email ?? null)

      if (sessionUser?.id) {
        void resolveProfileHref(sessionUser.id)
      } else {
        setProfileHref('/profile')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isSignedIn) return
    if (!profileHref.startsWith('/profile/')) return
    void router.prefetch(profileHref)
  }, [isSignedIn, profileHref, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <Disclosure as="nav" className="fixed inset-x-0 top-0 z-50 bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between">
          {/* Left: logo */}
          <div className="flex flex-1 shrink-0 items-center">
            <Link href="/">
              <span className="sr-only">AdventuresCalendar</span>
              <Image
                src="/AdventuresCalendarLogo.png"
                alt="AdventuresCalendar"
                width={200}
                height={200}
                className="h-14 w-auto"
              />
            </Link>
          </div>

          {/* Center: nav links */}
          <div className="hidden sm:flex sm:self-stretch sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Search
              </Link>

              {navigationItems.map((item) => {
                const isActive = !item.href.includes('#') && pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:flex-1 sm:items-center sm:justify-end">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  className="relative rounded-full p-1 text-gray-400 hover:text-gray-500 cursor-pointer focus:outline-none"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="relative flex cursor-pointer rounded-full hover:opacity-80 focus:outline-none">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 rounded-full bg-gray-100 object-cover outline outline-1 -outline-offset-1 outline-black/5"
                      />
                    ) : (
                      <UserCircleIcon aria-hidden="true" className="size-8 rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5 text-gray-500" />
                    )}
                  </MenuButton>

                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-1 outline-black/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <MenuItem>
                      <Link
                        href="/profile/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      >
                        Dashboard
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        href="/profile/my-adventures"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      >
                        My Adventures
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        href={profileHref}
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      >
                        My Profile
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      >
                        Sign out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-gray-900 hover:text-black">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-600">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          <DisclosureButton
            as={Link}
            href="/"
            className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
          >
            Search
          </DisclosureButton>
          {navigationItems.map((item) => (
            <DisclosureButton
              key={item.name}
              as={Link}
              href={item.href}
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>

        <div className="border-t border-gray-200 pb-3 pt-4">
          {isSignedIn ? (
            <>
              <div className="flex items-center px-4">
                <div className="shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-full bg-gray-100 object-cover outline outline-1 -outline-offset-1 outline-black/5"
                    />
                  ) : (
                    <UserCircleIcon aria-hidden="true" className="size-10 rounded-full bg-gray-100 text-gray-500 outline outline-1 -outline-offset-1 outline-black/5" />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">Signed in</div>
                  <div className="text-sm font-medium text-gray-500">{userEmail ?? 'Account'}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 cursor-pointer focus:outline-none"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <DisclosureButton
                  as={Link}
                  href="/profile/dashboard"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Dashboard
                </DisclosureButton>
                <DisclosureButton
                  as={Link}
                  href="/profile/my-adventures"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  My Adventures
                </DisclosureButton>
                <DisclosureButton
                  as={Link}
                  href={profileHref}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  My Profile
                </DisclosureButton>
                <DisclosureButton
                  as="button"
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Sign out
                </DisclosureButton>
              </div>
            </>
          ) : (
            <div className="px-4">
              <Link href="/login" className="block text-base font-medium text-gray-500 hover:text-gray-800">
                Log in
              </Link>
            </div>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
