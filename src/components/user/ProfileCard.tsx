import { MapPinIcon, PencilSquareIcon } from '@heroicons/react/20/solid'

function InterestBadgeIcon({ interest, className }: { interest: string; className?: string }) {
  const name = interest.toLowerCase()

  if (name.includes('camp')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <path d="M2.5 15.5h15" strokeLinecap="round" />
        <path d="M4.5 15.5 10 4l5.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 4v11.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (name.includes('trail running') || name.includes('offroad') || name.includes('overland')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <rect x="3" y="9" width="14" height="4" rx="1" />
        <circle cx="6" cy="14.5" r="1.5" />
        <circle cx="14" cy="14.5" r="1.5" />
      </svg>
    )
  }

  if (name.includes('hik') || name.includes('backpack')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <circle cx="10.5" cy="4.2" r="1.3" />
        <path d="M10.5 5.8v3.1l2.5 2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 8.9 8.4 11l-1.6 4.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 9.8 12 14.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name.includes('climb') || name.includes('trail')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <path d="M2.5 15.5h15" strokeLinecap="round" />
        <path d="M4 15.5 8.8 8l2.6 3.5 2.1-2.7 2.5 6.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name.includes('kayak') || name.includes('fish')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <path d="M3 12.5c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 2.4-1 3.6 0" strokeLinecap="round" />
        <path d="M6.5 9.5h7" strokeLinecap="round" />
      </svg>
    )
  }

  if (name.includes('bike')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <circle cx="6" cy="13.5" r="2.5" />
        <circle cx="14" cy="13.5" r="2.5" />
        <path d="M8.5 13.5h3l-2-4h2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name.includes('photo') || name.includes('bird')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
        <rect x="3.5" y="6.5" width="13" height="9" rx="1.5" />
        <circle cx="10" cy="11" r="2.3" />
        <path d="M6.5 6.5 7.5 4.8h5L13.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  )
}

export type ProfileCardUser = {
  name: string
  role: string
  bio: string | null
  joinDate: string
  city?: string | null
  state?: string | null
  adventuresHosted?: number
  adventuresJoined?: number
  reviews?: number
  reviewRating?: number | null
  imageUrl?: string | null
  coverImageUrl?: string | null
  verificationBadge?: boolean
  interests?: string[]
  certifications?: Array<string | { title?: string | null; pdfUrl?: string | null; pdf_url?: string | null }>
}

interface ProfileCardProps {
  user: ProfileCardUser
  editHref?: string
}

export function ProfileCard({ user, editHref }: ProfileCardProps) {
  const reviewCount = user.reviews ?? 0
  const normalizedRating = typeof user.reviewRating === 'number' && Number.isFinite(user.reviewRating)
    ? Math.max(0, Math.min(5, user.reviewRating))
    : 0
  const roundedRating = Math.round(normalizedRating)

  const city = typeof user.city === 'string' ? user.city.trim() : ''
  const state = typeof user.state === 'string' ? user.state.trim() : ''
  const locationParts = [city, state, 'USA'].filter(Boolean)
  const locationLine = locationParts.length ? locationParts.join(', ') : null
  const interests = Array.isArray(user.interests)
    ? user.interests.map((value) => value?.trim()).filter((value): value is string => !!value)
    : []
  const certifications = Array.isArray(user.certifications)
    ? user.certifications
        .map((entry) => {
          if (typeof entry === 'string') {
            const title = entry.trim()
            return title ? { title, pdfUrl: null as string | null } : null
          }

          if (!entry || typeof entry !== 'object') {
            return null
          }

          const title = typeof entry.title === 'string' ? entry.title.trim() : ''
          const pdfUrl = typeof entry.pdfUrl === 'string'
            ? entry.pdfUrl.trim()
            : typeof entry.pdf_url === 'string'
              ? entry.pdf_url.trim()
              : ''

          return title ? { title, pdfUrl: pdfUrl || null } : null
        })
        .filter((entry): entry is { title: string; pdfUrl: string | null } => !!entry)
    : []

  const headerContent = (
    <div className="flex w-full items-center gap-4 px-2">
      {user.imageUrl && (
        <img
          alt={user.name}
          src={user.imageUrl}
          className="size-16 rounded-full bg-gray-100 outline outline-1 -outline-offset-1 outline-black/5"
        />
      )}
      <div className="flex-1">
        <div className="grid grid-cols-3 items-center gap-3">
          <div className="flex min-w-0 items-center justify-start gap-2">
            <h3 className="truncate text-left text-base/7 font-semibold text-gray-900">{user.name}</h3>
            {user.verificationBadge && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Verified
              </span>
            )}
          </div>

          <div
            className="flex items-center justify-end gap-2 whitespace-nowrap"
            aria-label={`Rating ${normalizedRating.toFixed(1)} out of 5, ${reviewCount} reviews`}
          >
              <div className="flex text-yellow-500 sm:text-lg lg:text-xl xl:text-2xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i} aria-hidden="true">
                    {i < roundedRating ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm/6 text-gray-600">{reviewCount}</span>
          </div>

          {editHref ? (
            <a
              href={editHref}
              aria-label="Edit profile"
              className="justify-self-end pr-3 shrink-0 rounded-md p-1 text-black hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <PencilSquareIcon aria-hidden="true" className="size-5" />
            </a>
          ) : (
            <div aria-hidden="true" className="justify-self-end pr-3 size-7" />
          )}
        </div>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm/6 text-black font-medium">
          <MapPinIcon aria-hidden="true" className="size-4" />
          <span>{locationLine || 'USA'}</span>
        </p>
      </div>
    </div>
  )

  return (
    <div>
      {user.coverImageUrl && (
        <div className="-mx-8 -mt-8 mb-6 overflow-hidden rounded-t-lg border-b border-gray-100">
          <div className="relative h-64 w-full sm:h-72">
            <img
              alt={`${user.name} cover`}
              src={user.coverImageUrl}
              className="absolute inset-0 h-full w-full bg-gray-100 object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_15%,rgba(255,255,255,0.9)_25%,rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.0)_75%)] px-4 pb-6 pt-20">
              {headerContent}
            </div>
          </div>
        </div>
      )}

      {/* Header with profile image and basic info */}
      {!user.coverImageUrl && (
        <div className="px-4 sm:px-0">
          {headerContent}
        </div>
      )}

      {/* Divider */}
      <div className="mt-6">
        {/* Stats grid */}
        <div className="w-full px-0 py-2 sm:pb-4 xl:pb-6 xl:pt-4">
          <div className="grid w-full grid-cols-1 sm:grid-cols-3">
            <div className="w-full bg-white px-2 py-2 text-center sm:px-3 lg:px-4">
              <dt className="text-sm/6 font-normal text-gray-500 whitespace-nowrap">Adventures Hosted</dt>
              <dd className="mt-2 flex items-baseline justify-center gap-x-2">
                <span className="text-2xl font-semibold tracking-tight text-gray-900">{user.adventuresHosted}</span>
              </dd>
            </div>
            <div className="w-full bg-white px-2 py-2 text-center sm:px-3 lg:px-4">
              <dt className="text-sm/6 font-normal text-gray-500 whitespace-nowrap">Adventures Joined</dt>
              <dd className="mt-2 flex items-baseline justify-center gap-x-2">
                <span className="text-2xl font-semibold tracking-tight text-gray-900">{user.adventuresJoined}</span>
              </dd>
            </div>
            <div className="w-full bg-white px-2 py-2 text-center sm:px-3 lg:px-4">
              <dt className="text-sm/6 font-normal text-gray-500">Member Since</dt>
              <dd className="mt-2 flex items-baseline justify-center gap-x-2">
                <span className="text-sm/6 font-semibold text-gray-900">{user.joinDate}</span>
              </dd>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">About</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {user.bio || '—'}
            </dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Interests</dt>
            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {interests.length ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                    >
                      <InterestBadgeIcon interest={interest} className="size-3.5 text-gray-500" />
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </dd>
          </div>

          {/* Certifications/Documents */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Certifications</dt>
            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {certifications.length ? (
                <ol className="list-decimal pl-5 space-y-1">
                  {certifications.map((cert) => (
                    <li key={`${cert.title}-${cert.pdfUrl ?? 'none'}`} className="text-sm/6">
                      {cert.pdfUrl ? (
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-gray-900 underline-offset-2 hover:underline"
                        >
                          {cert.title}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900">{cert.title}</span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="font-medium text-gray-900">none</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

    </div>
  )
}
