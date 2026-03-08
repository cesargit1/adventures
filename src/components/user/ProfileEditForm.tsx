'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useMemo, useRef, useState } from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/16/solid'

import { createClient } from '@/lib/supabase/client'
import {
  type ProfileCertification,
  toCertificationStoragePayload,
} from '@/lib/certifications'

const US_STATE_ABBREVIATIONS = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]

type Props = {
  initialEmail: string
  initialUsername: string
  initialAbout: string
  initialCity: string
  initialState: string
  initialInterests: string[]
  availableInterests: string[]
  initialCertifications: ProfileCertification[]
  initialFirstName: string
  initialLastName: string
  initialAvatarUrl?: string | null
  initialCoverUrl?: string | null
}

type CertificationDraft = {
  id: string
  title: string
  pdfUrl: string | null
  pdfPath: string | null
  isUploading: boolean
}

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_MEDIA_BUCKET?.trim() ||
  'user-media'

function fileExtensionForImage(file: File) {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  return null
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function buildInitialCertificationRows(initialCertifications: ProfileCertification[]): CertificationDraft[] {
  const rows = initialCertifications.map((entry, index) => ({
    id: `initial-${index}`,
    title: entry.title,
    pdfUrl: entry.pdfUrl,
    pdfPath: entry.pdfPath,
    isUploading: false,
  }))

  if (rows.length) return rows

  return [
    {
      id: 'initial-0',
      title: '',
      pdfUrl: null,
      pdfPath: null,
      isUploading: false,
    },
  ]
}

function fileNameFromCertification(row: Pick<CertificationDraft, 'pdfPath' | 'pdfUrl'>) {
  if (row.pdfPath) {
    return decodeURIComponent(row.pdfPath.split('/').pop() ?? row.pdfPath)
  }

  if (row.pdfUrl) {
    return decodeURIComponent(row.pdfUrl.split('/').pop() ?? 'certificate.pdf')
  }

  return ''
}

function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase()
}

function validateUsername(username: string) {
  if (username.length < 3) return 'Username must be at least 3 characters.'
  if (username.length > 30) return 'Username must be 30 characters or less.'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Use only lowercase letters, numbers, and underscores.'
  return null
}

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

export function ProfileEditForm({
  initialEmail,
  initialUsername,
  initialAbout,
  initialCity,
  initialState,
  initialInterests,
  availableInterests,
  initialCertifications,
  initialFirstName,
  initialLastName,
  initialAvatarUrl = null,
  initialCoverUrl = null,
}: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl)

  const [username, setUsername] = useState(initialUsername)
  const [about, setAbout] = useState(initialAbout)
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [city, setCity] = useState(initialCity)
  const [state, setState] = useState(initialState)
  const [certificationRows, setCertificationRows] = useState<CertificationDraft[]>(
    buildInitialCertificationRows(initialCertifications)
  )

  const allInterestOptions = useMemo(() => {
    const merged = [...availableInterests, ...initialInterests]
      .map((value) => value.trim())
      .filter(Boolean)
    return Array.from(new Set(merged)).sort((left, right) => left.localeCompare(right))
  }, [availableInterests, initialInterests])

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    Array.from(
      new Set(
        initialInterests
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
  )

  const displayName = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim()
    return joined.length ? joined : null
  }, [firstName, lastName])

  async function uploadProfileImage(kind: 'avatar' | 'cover', file: File) {
    if (!isImageFile(file)) {
      setError('Please choose an image file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be 10MB or smaller.')
      return
    }

    const ext = fileExtensionForImage(file)
    if (!ext) {
      setError('Unsupported image format. Please use PNG, JPG, GIF, or WebP.')
      return
    }

    setError(null)

    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      return
    }

    if (!user) {
      router.push('/login?next=/profile/edit')
      return
    }

    // NOTE: If we overwrite the same path every time, the public URL stays identical and
    // browsers/CDNs may keep showing the old image due to caching. Use a versioned filename
    // so the URL changes on each upload.
    const version = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now())
    const objectPath = `profiles/${user.id}/${kind}-${version}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      const lower = uploadError.message.toLowerCase()

      if (lower.includes('bucket not found')) {
        setError(
          `Storage bucket not found. Create a public bucket named "${MEDIA_BUCKET}" in Supabase Storage (or set NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET).`
        )
        return
      }

      if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
        setError(
          [
            'Upload blocked by Supabase Storage RLS.',
            `Bucket: ${MEDIA_BUCKET}`,
            `Path: ${objectPath}`,
            `User: ${user.id}`,
            'Add an INSERT/UPDATE policy on storage.objects that allows authenticated users to write to profiles/{uid}/... for this bucket.',
          ].join(' ')
        )
        return
      }

      setError(uploadError.message)
      return
    }

    const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath)
    const publicUrl = publicData.publicUrl

    const update: { avatar_url?: string; cover_url?: string } = {}
    if (kind === 'avatar') update.avatar_url = publicUrl
    if (kind === 'cover') update.cover_url = publicUrl

    // IMPORTANT:
    // `profiles.username` is NOT NULL. If we `upsert({ id, avatar_url })` and the row doesn't exist,
    // Postgres will try to INSERT with username = NULL and fail.
    // So: UPDATE if the row exists; otherwise INSERT only if we have a valid username.
    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select('id')

    if (updateError) {
      setError(updateError.message)
      return
    }

    if (!updatedRows || updatedRows.length === 0) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      const metaUsernameRaw = typeof meta.username === 'string' ? meta.username : ''
      const metaUsername = normalizeUsername(metaUsernameRaw)
      const metaUsernameError = metaUsername ? validateUsername(metaUsername) : 'Username is required.'

      if (metaUsernameError) {
        setError('Save your username first (then try uploading the image again).')
        return
      }

      const { error: insertError } = await supabase.from('profiles').insert({ id: user.id, username: metaUsername, ...update })
      if (insertError) {
        setError(insertError.message)
        return
      }
    }

    if (kind === 'avatar') setAvatarUrl(publicUrl)
    if (kind === 'cover') setCoverUrl(publicUrl)

    router.refresh()
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return
    setIsUploadingAvatar(true)
    try {
      await uploadProfileImage('avatar', file)
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleCoverChange(file: File | null) {
    if (!file) return
    setIsUploadingCover(true)
    try {
      await uploadProfileImage('cover', file)
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function uploadCertificationPdf(certificationId: string, file: File) {
    if (!isPdfFile(file)) {
      setError('Please choose a PDF file for certifications.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Certification PDF must be 20MB or smaller.')
      return
    }

    setError(null)

    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      return
    }

    if (!user) {
      router.push('/login?next=/profile/edit')
      return
    }

    const version = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now())
    const safeId = certificationId.replace(/[^a-zA-Z0-9-]/g, '')
    const objectPath = `profiles/${user.id}/certifications/${safeId}-${version}.pdf`

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        contentType: 'application/pdf',
        cacheControl: '3600',
      })

    if (uploadError) {
      const lower = uploadError.message.toLowerCase()

      if (lower.includes('bucket not found')) {
        setError(
          `Storage bucket not found. Create a public bucket named "${MEDIA_BUCKET}" in Supabase Storage (or set NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET).`
        )
        return
      }

      if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
        setError(
          [
            'Certification upload blocked by Supabase Storage RLS.',
            `Bucket: ${MEDIA_BUCKET}`,
            `Path: ${objectPath}`,
            `User: ${user.id}`,
            'Add INSERT/UPDATE policies for profiles/{uid}/certifications/*.pdf in this bucket.',
          ].join(' ')
        )
        return
      }

      setError(uploadError.message)
      return
    }

    const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath)
    const publicUrl = publicData.publicUrl

    setCertificationRows((current) =>
      current.map((row) =>
        row.id === certificationId
          ? {
              ...row,
              pdfPath: objectPath,
              pdfUrl: publicUrl,
            }
          : row
      )
    )
  }

  async function handleCertificationFileChange(certificationId: string, file: File | null) {
    if (!file) return

    setCertificationRows((current) =>
      current.map((row) => (row.id === certificationId ? { ...row, isUploading: true } : row))
    )

    try {
      await uploadCertificationPdf(certificationId, file)
    } finally {
      setCertificationRows((current) =>
        current.map((row) => (row.id === certificationId ? { ...row, isUploading: false } : row))
      )
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const normalized = normalizeUsername(username)
      const usernameError = validateUsername(normalized)
      if (usernameError) {
        setError(usernameError)
        return
      }

      if (certificationRows.some((row) => row.isUploading)) {
        setError('Please wait for certification uploads to finish before saving.')
        return
      }

      const normalizedCertifications = certificationRows
        .map((row) => ({
          title: row.title.trim(),
          pdfUrl: row.pdfUrl,
          pdfPath: row.pdfPath,
        }))
        .filter((row) => row.title.length || row.pdfUrl || row.pdfPath)

      const incompleteCertification = normalizedCertifications.find(
        (row) => !row.title || !row.pdfUrl || !row.pdfPath
      )

      if (incompleteCertification) {
        setError('Each certification must include both a title and a PDF attachment.')
        return
      }

      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        setError(userError.message)
        return
      }

      if (!user) {
        router.push('/login?next=/profile/edit')
        return
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            username: normalized,
            display_name: displayName,
            bio: about.trim().length ? about.trim() : null,
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            city: city.trim().length ? city.trim() : null,
            state: state.trim().length ? state.trim() : null,
            certifications: toCertificationStoragePayload(normalizedCertifications),
          },
          { onConflict: 'id' }
        )

      if (upsertError) {
        setError(upsertError.message)
        return
      }

      const parsedInterests = Array.from(
        new Set(
          selectedInterests
            .map((value) => value.trim())
            .filter(Boolean)
        )
      )

      const { error: deleteMappingsError } = await supabase
        .from('profile_interests')
        .delete()
        .eq('profile_id', user.id)

      if (deleteMappingsError) {
        setError(deleteMappingsError.message)
        return
      }

      if (parsedInterests.length > 0) {
        const { data: interestRows, error: interestsFetchError } = await supabase
          .from('interests')
          .select('id, name')
          .in('name', parsedInterests)

        if (interestsFetchError) {
          setError(interestsFetchError.message)
          return
        }

        const interestIds = (interestRows ?? []).map((row) => row.id)

        if (interestIds.length > 0) {
          const { error: insertMappingsError } = await supabase
            .from('profile_interests')
            .insert(interestIds.map((interestId) => ({ profile_id: user.id, interest_id: interestId })))

          if (insertMappingsError) {
            setError(insertMappingsError.message)
            return
          }
        }
      }

      router.push('/profile')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Profile</h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            This information will be displayed publicly so be careful what you share.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm/6 font-medium text-gray-900">
                Cover photo
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  {coverUrl ? (
                    <img
                      alt="Cover"
                      src={coverUrl}
                      className="mx-auto h-24 w-full max-w-md rounded-md bg-gray-100 object-cover outline outline-1 -outline-offset-1 outline-black/5"
                    />
                  ) : (
                    <PhotoIcon aria-hidden="true" className="mx-auto size-12 text-gray-300" />
                  )}
                  <div className="mt-4 flex text-sm/6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-transparent font-semibold text-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black hover:text-black"
                    >
                      <span>{isUploadingCover ? 'Uploading…' : 'Upload a file'}</span>
                      <input
                        ref={coverInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        disabled={isUploadingCover}
                        onChange={(e) => handleCoverChange(e.currentTarget.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="photo" className="block text-sm/6 font-medium text-gray-900">
                Photo
              </label>
              <div className="mt-2 flex items-center gap-x-3">
                {avatarUrl ? (
                  <img
                    alt="Profile photo"
                    src={avatarUrl}
                    className="size-12 rounded-full bg-gray-100 object-cover outline outline-1 -outline-offset-1 outline-black/5"
                  />
                ) : (
                  <UserCircleIcon aria-hidden="true" className="size-12 text-gray-300" />
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => handleAvatarChange(e.currentTarget.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  {isUploadingAvatar ? 'Uploading…' : 'Change'}
                </button>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-black">
                  <div className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6">
                    adventurescalendar.com/profile/
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="janesmith"
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                First name
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                Last name
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm/6 font-medium text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm/6 font-medium text-gray-900">
                State
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="state"
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  autoComplete="address-level1"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option value="">—</option>
                  {US_STATE_ABBREVIATIONS.map((abbr) => (
                    <option key={abbr} value={abbr}>
                      {abbr}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">
                Country
              </label>
              <div className="mt-2">
                <input
                  id="country"
                  name="country"
                  type="text"
                  value="USA"
                  disabled
                  className="block w-full rounded-md bg-gray-50 px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm/6 font-medium text-gray-900">
                About
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">Write a few sentences about yourself.</p>
            </div>

            <div className="col-span-full">
              <label className="block text-sm/6 font-medium text-gray-900">
                Interests
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {allInterestOptions.map((interest) => {
                  const isSelected = selectedInterests.includes(interest)

                  if (isSelected) {
                    return (
                      <span key={interest} className="inline-flex items-center gap-x-0.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                        <InterestBadgeIcon interest={interest} className="size-3.5 text-gray-500" />
                        {interest}
                        <button
                          type="button"
                          onClick={() => setSelectedInterests((current) => current.filter((value) => value !== interest))}
                          className="group relative -mr-1 size-3.5 rounded-sm hover:bg-gray-100"
                        >
                          <span className="sr-only">Remove</span>
                          <svg viewBox="0 0 14 14" className="size-3.5 stroke-gray-500/70 group-hover:stroke-gray-700/80">
                            <path d="M4 4l6 6m0-6l-6 6" />
                          </svg>
                          <span className="absolute -inset-1" />
                        </button>
                      </span>
                    )
                  }

                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setSelectedInterests((current) => [...current, interest])}
                      className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                    >
                      <InterestBadgeIcon interest={interest} className="size-3.5 text-gray-500" />
                      {interest}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">Select one or more interests.</p>
            </div>

            <div className="col-span-full">
              <label className="block text-sm/6 font-medium text-gray-900">
                Certifications
              </label>
              <div className="mt-2 space-y-3">
                {certificationRows.map((row) => (
                  <div key={row.id} className="p-0">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-8">
                      <div className="sm:col-span-4">
                        <label htmlFor={`cert-title-${row.id}`} className="block text-sm/6 font-medium text-gray-900">
                          Title
                        </label>
                        <input
                          id={`cert-title-${row.id}`}
                          type="text"
                          value={row.title}
                          onChange={(e) =>
                            setCertificationRows((current) =>
                              current.map((item) =>
                                item.id === row.id ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          placeholder="CPR Certified"
                          className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`cert-file-${row.id}`} className="block text-sm/6 font-medium text-gray-900">
                          PDF attachment
                        </label>
                        <div className="mt-1 flex items-center gap-3">
                          <label
                            htmlFor={`cert-file-${row.id}`}
                            className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            {row.isUploading ? 'Uploading…' : row.pdfUrl ? 'Replace PDF' : 'Upload PDF'}
                          </label>
                          {row.pdfUrl && (
                            <a
                              href={row.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-black hover:text-black"
                            >
                              View PDF
                            </a>
                          )}
                          {!row.pdfUrl && !row.isUploading && (
                            <span className="text-sm text-gray-500">No file uploaded</span>
                          )}
                        </div>
                        <input
                          id={`cert-file-${row.id}`}
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={row.isUploading}
                          onChange={(e) => handleCertificationFileChange(row.id, e.currentTarget.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </div>

                      <div className="sm:col-span-1 sm:flex sm:items-end sm:justify-end">
                        <button
                          type="button"
                          disabled={row.isUploading}
                          onClick={() =>
                            setCertificationRows((current) => {
                              return current.filter((item) => item.id !== row.id)
                            })
                          }
                          className="rounded-md p-2 text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="sr-only">Remove certification</span>
                          <TrashIcon aria-hidden="true" className="size-5" />
                        </button>
                      </div>
                    </div>
                    {row.isUploading && <p className="mt-2 text-xs text-gray-600">Uploading PDF…</p>}
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setCertificationRows((current) => [
                        ...current,
                        {
                          id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now() + current.length),
                          title: '',
                          pdfUrl: null,
                          pdfPath: null,
                          isUploading: false,
                        },
                      ])
                    }
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Add New
                  </button>
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={initialEmail}
                  disabled
                  className="block w-full rounded-md bg-gray-50 px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6"
                />
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}
