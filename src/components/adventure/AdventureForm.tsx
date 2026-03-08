'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/16/solid'

import { createClient } from '@/lib/supabase/client'

type Props = {
  mode?: 'create' | 'edit'
  adventureId?: string
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

function parseDollars(raw: string) {
  const value = Math.floor(Number(raw))
  if (!Number.isFinite(value)) return null
  if (value < 0) return null
  return value
}

function computeSeason(dateStr: string): string | null {
  if (!dateStr) return null
  const month = new Date(dateStr).getMonth() + 1 // 1-12
  if ([12, 1, 2].includes(month)) return 'Winter'
  if ([3, 4, 5].includes(month)) return 'Spring'
  if ([6, 7, 8].includes(month)) return 'Summer'
  if ([9, 10, 11].includes(month)) return 'Fall'
  return null
}

function combineDateAndTime(date: string, time: string) {
  if (!date || !time) return null
  // Append :00 seconds so the string is always a full ISO 8601 local datetime
  const parsed = new Date(`${date}T${time}:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function formatTimeLabel(value: string) {
  // value is HH:MM (24h)
  const [hhRaw, mm] = value.split(':')
  const hh = Number(hhRaw)
  if (!Number.isFinite(hh) || !mm) return value
  const suffix = hh >= 12 ? 'PM' : 'AM'
  const hour12 = ((hh + 11) % 12) + 1
  return `${hour12}:${mm} ${suffix}`
}

function buildHalfHourOptions() {
  const options: Array<{ value: string; label: string }> = []
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30] as const) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push({ value, label: formatTimeLabel(value) })
    }
  }
  return options
}

function slugifyTitle(raw: string) {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Keep URLs readable and avoid extremely long slugs.
  return cleaned.slice(0, 70)
}

function isMissingColumnError(message: string | undefined | null, column: string) {
  if (!message) return false
  const lower = message.toLowerCase()
  const col = column.toLowerCase()
  return (
    (lower.includes('schema cache') && lower.includes(col)) ||
    (lower.includes("could not find the") && lower.includes(col)) ||
    (lower.includes('column') && lower.includes(col) && lower.includes('does not exist'))
  )
}

export function AdventureForm({ mode = 'create', adventureId }: Props) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Idempotency for create: after we insert once, retries should update the same row
  // instead of inserting duplicates (e.g., if cover upload fails and the user retries).
  const [createdAdventureId, setCreatedAdventureId] = useState<string | null>(null)
  const [createdAdventureSlug, setCreatedAdventureSlug] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [activityType, setActivityType] = useState('Hiking')
  const [description, setDescription] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [status, setStatus] = useState('open')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCountryCode, setLocationCountryCode] = useState('')
  const [cost, setCost] = useState('')

  const [tagFaithBased, setTagFaithBased] = useState(false)
  const [tagFamilyFriendly, setTagFamilyFriendly] = useState(false)
  const [tagAdultsOnly, setTagAdultsOnly] = useState(false)

  const [participantVisibility, setParticipantVisibility] = useState('public')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [requiredGear, setRequiredGear] = useState<string[]>([])
  const [hostIncluded, setHostIncluded] = useState<string[]>([])

  const tags = useMemo(() => {
    const next: string[] = []
    if (tagFaithBased) next.push('faith-based')
    if (tagFamilyFriendly) next.push('family-friendly')
    if (tagAdultsOnly) next.push('adults-only')
    return next
  }, [tagAdultsOnly, tagFaithBased, tagFamilyFriendly])

  const timeOptions = useMemo(() => buildHalfHourOptions(), [])

  // Fetch existing adventure data in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !adventureId) return

    let cancelled = false

    async function fetchAdventure() {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('adventures')
        .select('title, description, adventure_type, difficulty, status, start_at, end_at, max_capacity, location_name, location_city, location_state, location_country, location_country_code, cost_dollars, currency, tags, participant_visibility, required_gear, host_included, cover_image_path')
        .eq('id', adventureId!)
        .single()

      if (cancelled || fetchError || !data) return

      const adventure = data as {
        title: string | null
        description: string | null
        adventure_type: string | null
        difficulty: string | null
        status: string | null
        start_at: string | null
        end_at: string | null
        max_capacity: number | null
        location_name: string | null
        location_city: string | null
        location_state: string | null
        location_country: string | null
        location_country_code: string | null
        cost_dollars: number | null
        currency: string | null
        tags: string[] | null
        participant_visibility: string | null
        required_gear: string[] | null
        host_included: string[] | null
        cover_image_path: string | null
      }

      setTitle(adventure.title ?? '')
      setDescription(adventure.description ?? '')
      setActivityType(adventure.adventure_type ?? 'Hiking')
      setDifficulty(adventure.difficulty ?? 'Beginner')
      setStatus(adventure.status ?? 'open')
      setMaxCapacity(adventure.max_capacity != null ? String(adventure.max_capacity) : '')
      setLocationName(adventure.location_name ?? '')
      setLocationCity(adventure.location_city ?? '')
      setLocationState(adventure.location_state ?? '')
      setLocationCountry(adventure.location_country ?? '')
      setLocationCountryCode(adventure.location_country_code ?? '')
      setCost(adventure.cost_dollars != null ? String(adventure.cost_dollars) : '')
      setParticipantVisibility(adventure.participant_visibility ?? 'public')
      setRequiredGear(adventure.required_gear ?? [])
      setHostIncluded(adventure.host_included ?? [])

      if (adventure.start_at) {
        const d = new Date(adventure.start_at)
        if (!Number.isNaN(d.getTime())) {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          setDate(`${yyyy}-${mm}-${dd}`)

          const hh = String(d.getHours()).padStart(2, '0')
          const min = String(d.getMinutes()).padStart(2, '0')
          setTime(`${hh}:${min}`)
        }
      }

      if (adventure.end_at) {
        const e = new Date(adventure.end_at)
        if (!Number.isNaN(e.getTime())) {
          const yyyy = e.getFullYear()
          const mm = String(e.getMonth() + 1).padStart(2, '0')
          const dd = String(e.getDate()).padStart(2, '0')
          setEndDate(`${yyyy}-${mm}-${dd}`)

          const hh = String(e.getHours()).padStart(2, '0')
          const min = String(e.getMinutes()).padStart(2, '0')
          setEndTime(`${hh}:${min}`)
        }
      }

      const tagList = adventure.tags ?? []
      setTagFaithBased(tagList.includes('faith-based'))
      setTagFamilyFriendly(tagList.includes('family-friendly'))
      setTagAdultsOnly(tagList.includes('adults-only'))

      if (adventure.cover_image_path) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
        setCoverPreviewUrl(`${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${adventure.cover_image_path}`)
      }
    }

    void fetchAdventure()
    return () => { cancelled = true }
  }, [mode, adventureId])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(coverFile)
    setCoverPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  async function uploadCoverIfNeeded({ userId, adventureId }: { userId: string; adventureId: string }) {
    if (!coverFile) return null

    if (!isImageFile(coverFile)) {
      setError('Please choose an image file for the cover photo.')
      return null
    }

    if (coverFile.size > 10 * 1024 * 1024) {
      setError('Cover photo must be 10MB or smaller.')
      return null
    }

    const ext = fileExtensionForImage(coverFile)
    if (!ext) {
      setError('Unsupported cover image format. Please use PNG, JPG, GIF, or WebP.')
      return null
    }

    const supabase = createClient()

    const version = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now())
    const objectPath = `adventures/${userId}/${adventureId}/cover-${version}.${ext}`

    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(objectPath, coverFile, {
      upsert: false,
      contentType: coverFile.type,
      cacheControl: '3600',
    })

    if (uploadError) {
      const lower = uploadError.message.toLowerCase()

      if (lower.includes('bucket not found')) {
        setError(
          `Storage bucket not found. Create a public bucket named "${MEDIA_BUCKET}" in Supabase Storage (or set NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET).`,
        )
        return null
      }

      if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
        setError(
          `Storage permission denied. Update Storage RLS policies to allow uploads to ${MEDIA_BUCKET}/adventures/{uid}/...`,
        )
        return null
      }

      setError(uploadError.message)
      return null
    }

    return objectPath
  }

  async function save(kind: 'draft' | 'submit') {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'edit' && !adventureId) {
        setError('Missing adventure id.')
        return
      }

      if (!title.trim()) {
        setError('Please enter an adventure title.')
        return
      }

      if (!description.trim()) {
        setError('Please enter a description.')
        return
      }

      const startAt = combineDateAndTime(date, time)
      if (!startAt) {
        setError('Please choose a valid date and start time.')
        return
      }

      const capacity = Number(maxCapacity)
      if (!Number.isFinite(capacity) || capacity <= 0) {
        setError('Please enter a max capacity greater than 0.')
        return
      }

      const costDollars = cost.trim().length ? parseDollars(cost) : 0
      if (costDollars == null) {
        setError('Please enter a valid cost.')
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
        router.push('/login?next=/adventures/create')
        return
      }

      const nowIso = new Date().toISOString()

      const endAt = endDate && endTime ? combineDateAndTime(endDate, endTime) : null
      const durationMinutes =
        startAt && endAt
          ? Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
          : null

      const baseWithoutSlug = {
        title: title.trim(),
        description: description.trim(),
        adventure_type: activityType,
        difficulty,
        start_at: startAt,
        end_at: endAt,
        duration_minutes: durationMinutes,
        season: computeSeason(date),
        max_capacity: capacity,
        location_name: locationName.trim().length ? locationName.trim() : null,
        location_city: locationCity.trim().length ? locationCity.trim() : null,
        location_state: locationState.trim().length ? locationState.trim() : null,
        location_country: locationCountry.trim().length ? locationCountry.trim() : null,
        location_country_code: locationCountryCode.trim().length ? locationCountryCode.trim() : null,
        cost_dollars: costDollars,
        currency: 'USD',
        tags,
        participant_visibility: participantVisibility as 'public' | 'private',
        required_gear: requiredGear.filter((g) => g.trim().length > 0),
        host_included: hostIncluded.filter((g) => g.trim().length > 0),
        status,
        submitted_at: kind === 'submit' ? nowIso : null,
      } as const

      const baseWithSlug = {
        ...baseWithoutSlug,
        title_slug: slugifyTitle(title),
      } as const

      const effectiveMode: 'create' | 'edit' =
        mode === 'create' && createdAdventureId ? 'edit' : mode

      const effectiveAdventureId =
        effectiveMode === 'edit'
          ? (mode === 'edit' ? adventureId! : createdAdventureId!)
          : null

      if (effectiveMode === 'create') {
        let created: { id?: string; slug?: string | null } | null = null

        const attemptWithSlug = await supabase
          .from('adventures')
          .insert({
            host_id: user.id,
            ...baseWithSlug,
          })
          .select('id, slug')
          .single()

        if (attemptWithSlug.error) {
          if (isMissingColumnError(attemptWithSlug.error.message, 'title_slug') || isMissingColumnError(attemptWithSlug.error.message, 'slug')) {
            const attemptWithout = await supabase
              .from('adventures')
              .insert({
                host_id: user.id,
                ...baseWithoutSlug,
              })
              .select('id')
              .single()

            if (attemptWithout.error) {
              setError(attemptWithout.error.message)
              return
            }

            created = attemptWithout.data as unknown as { id?: string }
          } else {
            setError(attemptWithSlug.error.message)
            return
          }
        } else {
          created = attemptWithSlug.data as unknown as { id?: string; slug?: string | null }
        }

        const createdId = created?.id
        const createdSlug = created?.slug
        if (!createdId) {
          setError('Adventure was created, but no id was returned.')
          return
        }

        setCreatedAdventureId(createdId)
        setCreatedAdventureSlug(typeof createdSlug === 'string' ? createdSlug : null)

        if (coverFile) {
          const uploadedPath = await uploadCoverIfNeeded({ userId: user.id, adventureId: createdId })
          if (!uploadedPath) return

          const { error: coverUpdateError } = await supabase
            .from('adventures')
            .update({ cover_image_path: uploadedPath })
            .eq('id', createdId)

          if (coverUpdateError) {
            setError(coverUpdateError.message)
            return
          }
        }

        const editKey =
          typeof createdSlug === 'string' && createdSlug.length
            ? createdSlug
            : typeof createdAdventureSlug === 'string' && createdAdventureSlug.length
              ? createdAdventureSlug
              : createdId

        router.push(kind === 'submit' ? '/profile/my-adventures' : `/adventures/${encodeURIComponent(editKey)}/edit`)
        router.refresh()
        return
      }

      const nextAdventureId = effectiveAdventureId!
      let coverImagePath: string | null = null

      if (coverFile) {
        const uploadedPath = await uploadCoverIfNeeded({ userId: user.id, adventureId: nextAdventureId })
        if (!uploadedPath) return
        coverImagePath = uploadedPath
      }

      const attemptUpdateWithSlug = await supabase
        .from('adventures')
        .update({ ...baseWithSlug, ...(coverImagePath ? { cover_image_path: coverImagePath } : {}) })
        .eq('id', nextAdventureId)

      if (attemptUpdateWithSlug.error) {
        if (isMissingColumnError(attemptUpdateWithSlug.error.message, 'title_slug')) {
          const attemptUpdateWithout = await supabase
            .from('adventures')
            .update({ ...baseWithoutSlug, ...(coverImagePath ? { cover_image_path: coverImagePath } : {}) })
            .eq('id', nextAdventureId)

          if (attemptUpdateWithout.error) {
            setError(attemptUpdateWithout.error.message)
            return
          }
        } else {
          setError(attemptUpdateWithSlug.error.message)
          return
        }
      }

      if (kind === 'submit') {
        router.push('/profile/my-adventures')
      }
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return
        void save('submit')
      }}
    >
      <div className="space-y-12">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Adventure Details</h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            Share the details about your upcoming adventure event.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="activity-type" className="block text-sm/6 font-medium text-gray-900">
                Activity Type
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="activity-type"
                  name="activity-type"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option>Hiking</option>
                  <option>Camping</option>
                  <option>Rock Climbing</option>
                  <option>Kayaking</option>
                  <option>Mountain Biking</option>
                  <option>Other</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="difficulty" className="block text-sm/6 font-medium text-gray-900">
                Difficulty Level
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="difficulty"
                  name="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm/6 font-medium text-gray-900">
                Status
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="at_capacity">At Capacity</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="participant-visibility" className="block text-sm/6 font-medium text-gray-900">
                Participant Visibility
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="participant-visibility"
                  name="participant-visibility"
                  value={participantVisibility}
                  onChange={(e) => setParticipantVisibility(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm/6 font-medium text-gray-900">
                Adventure Title
              </label>
              <div className="mt-2">
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Mountain Hiking in Colorado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="location-name" className="block text-sm/6 font-medium text-gray-900">
                Location Name
              </label>
              <div className="mt-2">
                <input
                  id="location-name"
                  name="location-name"
                  type="text"
                  placeholder="e.g., Lake Isabella"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="location-city" className="block text-sm/6 font-medium text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  id="location-city"
                  name="location-city"
                  type="text"
                  placeholder="e.g., Lake Isabella"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="location-state" className="block text-sm/6 font-medium text-gray-900">
                State / Province
              </label>
              <div className="mt-2">
                <input
                  id="location-state"
                  name="location-state"
                  type="text"
                  placeholder="e.g., California"
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="location-country" className="block text-sm/6 font-medium text-gray-900">
                Country
              </label>
              <div className="mt-2">
                <input
                  id="location-country"
                  name="location-country"
                  type="text"
                  placeholder="e.g., United States"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="location-country-code" className="block text-sm/6 font-medium text-gray-900">
                Country Code
              </label>
              <div className="mt-2">
                <input
                  id="location-country-code"
                  name="location-country-code"
                  type="text"
                  maxLength={2}
                  placeholder="e.g., US"
                  value={locationCountryCode}
                  onChange={(e) => setLocationCountryCode(e.target.value.toUpperCase())}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm/6 font-medium text-gray-900">
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                  placeholder="Describe what participants can expect..."
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm/6 font-medium text-gray-900">
                Cover Photo
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon aria-hidden="true" className="mx-auto size-12 text-gray-300" />
                  {coverPreviewUrl ? (
                    <div className="mt-4">
                      <img
                        src={coverPreviewUrl}
                        alt="Selected cover"
                        className="mx-auto h-32 w-full max-w-md rounded-md object-cover"
                      />
                      <p className="mt-2 text-xs/5 text-gray-600">Selected: {coverFile?.name}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 flex text-sm/6 text-gray-600">
                    <label
                      htmlFor="adventure-cover-upload"
                      className="relative cursor-pointer rounded-md bg-transparent font-semibold text-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black hover:text-black"
                    >
                      <span>Upload a file</span>
                      <input
                        id="adventure-cover-upload"
                        name="adventure-cover-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const next = e.target.files?.[0] ?? null
                          setError(null)
                          setCoverFile(next)
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Required Gear */}
            <div className="col-span-full">
              <label className="block text-sm/6 font-medium text-gray-900">Required Gear</label>
              <p className="mt-1 text-xs text-gray-500">Items participants must bring.</p>
              <div className="mt-3 space-y-2">
                {requiredGear.map((item, i) => (
                  <div key={i} className="flex gap-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setRequiredGear((prev) => prev.map((g, idx) => idx === i ? e.target.value : g))}
                      placeholder="e.g., hiking poles"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                    />
                    <button
                      type="button"
                      onClick={() => setRequiredGear((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-md px-2.5 py-1.5 text-sm text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRequiredGear((prev) => [...prev, ''])}
                className="mt-3 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Add new +
              </button>
            </div>

            {/* Host Included */}
            <div className="col-span-full">
              <label className="block text-sm/6 font-medium text-gray-900">Provided by Host</label>
              <p className="mt-1 text-xs text-gray-500">Gear, food, or supplies the host will provide.</p>
              <div className="mt-3 space-y-2">
                {hostIncluded.map((item, i) => (
                  <div key={i} className="flex gap-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setHostIncluded((prev) => prev.map((g, idx) => idx === i ? e.target.value : g))}
                      placeholder="e.g., camp dinner & breakfast"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                    />
                    <button
                      type="button"
                      onClick={() => setHostIncluded((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-md px-2.5 py-1.5 text-sm text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setHostIncluded((prev) => [...prev, ''])}
                className="mt-3 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Add new +
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Logistics</h2>
          <p className="mt-1 text-sm/6 text-gray-600">Essential information about your adventure.</p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="date" className="block text-sm/6 font-medium text-gray-900">
                Start Date
              </label>
              <div className="mt-2">
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="time" className="block text-sm/6 font-medium text-gray-900">
                Start Time
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="time"
                  name="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option value="" disabled>
                    Select a start time
                  </option>
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="end-date" className="block text-sm/6 font-medium text-gray-900">
                End Date
              </label>
              <div className="mt-2">
                <input
                  id="end-date"
                  name="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="end-time" className="block text-sm/6 font-medium text-gray-900">
                End Time
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="end-time"
                  name="end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                >
                  <option value="">Select an end time</option>
                  {timeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="max-capacity" className="block text-sm/6 font-medium text-gray-900">
                Max Capacity
              </label>
              <div className="mt-2">
                <input
                  id="max-capacity"
                  name="max-capacity"
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="cost" className="block text-sm/6 font-medium text-gray-900">
                Cost per Person
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-black">
                  <div className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6">$</div>
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Tags</h2>
          <p className="mt-1 text-sm/6 text-gray-600">Help people find your adventure.</p>

          <fieldset className="mt-6 space-y-6">
            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <input
                  id="faith-based"
                  name="faith-based"
                  type="checkbox"
                  checked={tagFaithBased}
                  onChange={(e) => setTagFaithBased(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-black focus:ring-black"
                />
              </div>
              <label htmlFor="faith-based" className="text-sm/6 font-medium text-gray-900">
                Faith-based
              </label>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <input
                  id="family-friendly"
                  name="family-friendly"
                  type="checkbox"
                  checked={tagFamilyFriendly}
                  onChange={(e) => setTagFamilyFriendly(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-black focus:ring-black"
                />
              </div>
              <label htmlFor="family-friendly" className="text-sm/6 font-medium text-gray-900">
                Family-friendly
              </label>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <input
                  id="adults-only"
                  name="adults-only"
                  type="checkbox"
                  checked={tagAdultsOnly}
                  onChange={(e) => setTagAdultsOnly(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-black focus:ring-black"
                />
              </div>
              <label htmlFor="adults-only" className="text-sm/6 font-medium text-gray-900">
                Adults-only
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void save('draft')}
          className="text-sm/6 font-semibold text-gray-900 disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Save Adventure'}
        </button>
      </div>
    </form>
  )
}
