import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const { Client } = pg

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_MEDIA_BUCKET?.trim() ||
  'user-media'

const CA_ADVENTURES = [
  {
    title: 'Lake Isabella Winter Raft & Shore Camp',
    description:
      'Join a guided day on calmer Lake Isabella channels where we practice paddle control, safety signals, and shoreline route planning before settling into a relaxed beach-style camp. After sunset we run a camp kitchen session, share a fire circle, and review optional morning paddle routes so newer participants can build confidence in both water and camp skills.',
    activity_type: 'Rafting',
    difficulty: 'Beginner',
    required_gear: ['water shoes', 'quick-dry layers', 'headlamp', 'sleeping bag'],
    host_included: ['rafting equipment & life jackets', 'camp dinner & breakfast', 'firewood'],
    tags: ['family-friendly', 'lake', 'rafting'],
    start_at: '2027-01-23T16:00:00Z',
    end_at: '2027-01-24T18:00:00Z',
    duration_minutes: 1560,
    location_name: 'Lake Isabella',
    location_city: 'Lake Isabella',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 35.6186,
    location_lng: -118.4731,
    max_capacity: 18,
    cost_dollars: 125,
  },
  {
    title: 'Sequoia Redwood Camp Weekend',
    description:
      'Spend a full weekend under giant sequoias with a structured but low-pressure tent-camping itinerary that includes camp setup coaching, food storage best practices, and leave-no-trace routines. A guided forest ecology walk and an optional sunrise loop are included, with plenty of downtime for families and first-time campers to enjoy the setting at their own pace.',
    activity_type: 'Camping',
    difficulty: 'Intermediate',
    required_gear: ['4-season tent', 'insulated pad', 'stove', 'water filter'],
    host_included: ['ranger-led ecology walk', 'camp cooking supplies', 'morning trail snack'],
    tags: ['tent-camping', 'forest', 'family-friendly'],
    start_at: '2027-02-20T17:00:00Z',
    end_at: '2027-02-21T21:00:00Z',
    duration_minutes: 1680,
    location_name: 'Sequoia National Forest',
    location_city: 'Sequoia National Forest',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 36.4864,
    location_lng: -118.5658,
    max_capacity: 14,
    cost_dollars: 159,
  },
  {
    title: 'Sierra Nevadas Alpine Traverse',
    description:
      'This alpine-focused trek is designed for experienced hikers who want a demanding elevation profile, route-finding checkpoints, and mountain-weather decision practice in a single day. We move at a steady technical pace, stop for safety briefings at key terrain transitions, and finish with a debrief on navigation choices, pacing strategy, and risk management.',
    activity_type: 'Hiking',
    difficulty: 'Advanced',
    required_gear: ['hiking poles', 'shell jacket', 'microspikes', '3L water capacity'],
    host_included: ['trail snacks', 'navigation GPS loaner', 'alpine safety kit'],
    tags: ['hiking', 'alpine', 'wilderness-survival'],
    start_at: '2027-03-27T13:00:00Z',
    end_at: '2027-03-27T23:00:00Z',
    duration_minutes: 600,
    location_name: 'Sierra Nevadas',
    location_city: 'Sierra Nevada',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 37.7749,
    location_lng: -119.4179,
    max_capacity: 10,
    cost_dollars: 89,
  },
  {
    title: 'Death Valley Scenic Dunes & Stargaze',
    description:
      'Explore Death Valley’s dune corridors during golden hour with frequent scenic stops chosen for wide-angle views, short easy walks, and desert photography opportunities. After dusk we transition into a dark-sky session with constellation orientation and low-light viewing tips, making this an accessible outing for casual explorers and photographers alike.',
    activity_type: 'Sightseeing',
    difficulty: 'Beginner',
    required_gear: ['sun hat', '2L water', 'camera', 'light jacket'],
    host_included: ['sunset snacks', 'star map guide', 'shared binoculars'],
    tags: ['sightseeing', 'wildlife-photography', 'desert'],
    start_at: '2027-04-17T22:00:00Z',
    end_at: '2027-04-18T06:00:00Z',
    duration_minutes: 480,
    location_name: 'Death Valley',
    location_city: 'Death Valley',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 36.5054,
    location_lng: -117.0794,
    max_capacity: 20,
    cost_dollars: 49,
  },
  {
    title: 'Anza Borrego Offroad Overnighter',
    description:
      'This overnighter follows a curated offroad line through washes and badland sections with coached recovery drills, tire-pressure strategy, and terrain reading at key decision points. We establish dispersed camp before sunset, run a night navigation segment, and close with a morning vehicle check protocol before exiting the route.',
    activity_type: 'Offroading',
    difficulty: 'Advanced',
    required_gear: ['4x4 vehicle', 'recovery straps', 'air compressor', 'camp setup'],
    host_included: ['camp dinner & breakfast', 'recovery gear demo kit', 'navigation materials'],
    tags: ['offroad-camp', 'overlanding', 'adults-only'],
    start_at: '2027-05-22T19:00:00Z',
    end_at: '2027-05-23T20:00:00Z',
    duration_minutes: 1500,
    location_name: 'Anza-Borrego Desert State Park',
    location_city: 'Borrego Springs',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 33.2558,
    location_lng: -116.3987,
    max_capacity: 12,
    cost_dollars: 189,
  },
  {
    title: 'Big Bear Forest Camp & Lake Loop',
    description:
      'Set up a friendly forest basecamp near Big Bear and enjoy a beginner-level lake loop designed for mixed ages and casual pace groups. The itinerary includes a practical camp cooking workshop, optional short nature breaks, and evening social activities that keep the experience welcoming for families and new outdoor participants.',
    activity_type: 'Camping',
    difficulty: 'Beginner',
    host_included: ['camp cooking workshop supplies', 'firewood', "s'mores kit"],
    tags: ['family-friendly', 'tent-camping', 'lake'],
    start_at: '2027-06-26T17:30:00Z',
    end_at: '2027-06-27T19:30:00Z',
    duration_minutes: 1560,
    location_name: 'Big Bear Lake',
    location_city: 'Big Bear Lake',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 34.2439,
    location_lng: -116.9114,
    max_capacity: 24,
    cost_dollars: 99,
  },
  {
    title: 'Joshua Tree Sunrise Boulders Trek',
    description:
      'Start before peak heat and move through Joshua Tree’s iconic boulder zones on a route built around shade timing, hydration intervals, and safe desert pacing. We include several scenic pull-offs for photography, quick geology context, and short technical footing sections that make this a strong intermediate day hike.',
    activity_type: 'Hiking',
    difficulty: 'Intermediate',
    required_gear: ['sun protection', 'trail shoes', '3L water', 'snacks'],
    host_included: ['trail snacks', 'printed trail map', 'morning coffee'],
    tags: ['hiking', 'desert', 'wildlife-photography'],
    start_at: '2027-07-24T11:30:00Z',
    end_at: '2027-07-24T18:30:00Z',
    duration_minutes: 420,
    location_name: 'Joshua Tree National Park',
    location_city: 'Twentynine Palms',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 33.8734,
    location_lng: -115.9010,
    max_capacity: 16,
    cost_dollars: 69,
  },
  {
    title: 'San Jacinto Birdwatch Ridge Walk',
    description:
      'Follow a moderate ridge route near San Jacinto with a birdwatch-first pace that prioritizes quiet movement, viewing angles, and habitat interpretation at each stop. Participants receive guidance on binocular technique, species spotting patterns, and field-note basics while still enjoying a rewarding mountain hike profile.',
    activity_type: 'Birdwatching',
    difficulty: 'Intermediate',
    required_gear: ['binoculars', 'trail shoes', 'wind layer', 'field notebook'],
    host_included: ['species field guide booklet', 'trail snacks', 'loaner binoculars'],
    tags: ['birdwatching', 'hiking', 'wildlife-photography'],
    start_at: '2027-09-18T15:00:00Z',
    end_at: '2027-09-18T22:00:00Z',
    duration_minutes: 420,
    location_name: 'Mt. San Jacinto State Park and Wilderness',
    location_city: 'Idyllwild',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 33.8140,
    location_lng: -116.6793,
    max_capacity: 14,
    cost_dollars: 79,
  },
  {
    title: 'Baja Dunes Offroad & Beach Camp',
    description:
      'Drive a guided dune-and-coast offroad route that blends technical sand travel with scenic shoreline access and timing based on tide and light conditions. The trip transitions into beach camp setup, a structured sunset cookout, and a morning pack-down sequence focused on low-impact camp practices in coastal terrain.',
    activity_type: 'Offroad Camping',
    difficulty: 'Advanced',
    required_gear: ['4x4 vehicle', 'sand boards', 'air-down kit', 'beach camping gear'],
    host_included: ['sunset cookout dinner', 'beach camp firewood', 'breakfast supplies'],
    tags: ['offroad-camp', 'overlanding', 'adults-only'],
    start_at: '2027-10-16T18:00:00Z',
    end_at: '2027-10-17T21:00:00Z',
    duration_minutes: 1620,
    location_name: 'Baja Dunes',
    location_city: 'San Felipe',
    location_state: 'Baja California',
    location_country: 'Mexico',
    location_country_code: 'MX',
    location_lat: 31.0246,
    location_lng: -114.8413,
    max_capacity: 10,
    cost_dollars: 229,
  },
  {
    title: 'Pismo Beach Coastal Camp & Dune Walk',
    description:
      'Build a relaxed coastal basecamp in Pismo and enjoy an easy dune-and-shoreline walk with tide-pool interpretation and beginner-friendly route segments. The schedule balances social camp time with guided sightseeing moments, making it ideal for participants who want a scenic, low-intensity beach adventure weekend.',
    activity_type: 'Sightseeing',
    difficulty: 'Beginner',
    required_gear: ['light layers', 'camp setup', 'headlamp', 'sand stakes'],
    host_included: ['tide pool identification guide', 'campfire snacks', 'firewood'],
    tags: ['family-friendly', 'beach', 'sightseeing'],
    start_at: '2027-12-04T18:00:00Z',
    end_at: '2027-12-05T20:00:00Z',
    duration_minutes: 1560,
    location_name: 'Pismo Beach',
    location_city: 'Pismo Beach',
    location_state: 'California',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 35.1428,
    location_lng: -120.6413,
    max_capacity: 22,
    cost_dollars: 109,
  },
]

function loadEnv() {
  const root = process.cwd()
  const env = path.join(root, '.env')
  if (fs.existsSync(env)) dotenv.config({ path: env })
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function slugifyTitle(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

function computeSeason(dateStr) {
  const month = new Date(dateStr).getMonth() + 1
  if ([12, 1, 2].includes(month)) return 'Winter'
  if ([3, 4, 5].includes(month)) return 'Spring'
  if ([6, 7, 8].includes(month)) return 'Summer'
  if ([9, 10, 11].includes(month)) return 'Fall'
  return null
}

function getDummyPngBuffer() {
  // 1x1 white PNG
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2G1f8AAAAASUVORK5CYII='
  return Buffer.from(base64, 'base64')
}

function buildDbUrl() {
  let raw = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!raw) return null

  if (raw.includes('[YOUR-PASSWORD]')) {
    const password = process.env.SUPABASE_DB_PASSWORD
    if (!password) {
      throw new Error('SUPABASE_DB_URL contains [YOUR-PASSWORD] but SUPABASE_DB_PASSWORD is missing.')
    }
    raw = raw.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
  }

  return raw
}

function sslFromUrl(url) {
  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase()
  if (sslmode === 'disable') return undefined
  return {
    rejectUnauthorized: sslmode === 'verify-full' || sslmode === 'verify-ca',
    servername: url.hostname,
  }
}

function createPgClient(connectionString) {
  const url = new URL(connectionString)
  return new Client({
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl: sslFromUrl(url),
  })
}

async function getHostIdsPg(client) {
  const { rows } = await client.query(
    `select id, username
     from public.profiles
     where username in ('ceez', 'danny')`
  )

  const ceez = rows.find((row) => row.username === 'ceez')
  const danny = rows.find((row) => row.username === 'danny')

  if (!ceez || !danny) {
    throw new Error('Could not find both profiles: ceez and danny')
  }

  return [ceez.id, danny.id]
}

async function upsertAdventurePg({ client, hostId, draft }) {
  const existing = await client.query(
    `select id
     from public.adventures
     where title = $1 and start_at = $2
     limit 1`,
    [draft.title, draft.start_at]
  )

  if (existing.rows[0]?.id) {
    const adventureId = existing.rows[0].id
    await client.query(
      `update public.adventures
       set host_id = $1,
           title = $2,
           title_slug = $3,
           description = $4,
           adventure_type = $5,
           difficulty = $6,
           required_gear = $7,
           host_included = $8,
           tags = $9,
           start_at = $10,
           end_at = $11,
           duration_minutes = $12,
           season = $13,
           location_name = $14,
           location_city = $15,
           location_state = $16,
           location_country = $17,
           location_country_code = $18,
           location_precise_point = ST_SetSRID(ST_MakePoint($19, $20), 4326)::geography,
           max_capacity = $21,
           cost_dollars = $22,
           currency = 'USD',
           status = 'open',
           participant_visibility = 'public',
           submitted_at = $23
       where id = $24`,
      [
        hostId,
        draft.title,
        slugifyTitle(draft.title),
        draft.description,
        draft.activity_type,
        draft.difficulty,
        draft.required_gear,
        draft.host_included,
        draft.tags,
        draft.start_at,
        draft.end_at,
        draft.duration_minutes,
        computeSeason(draft.start_at),
        draft.location_name,
        draft.location_city ?? null,
        draft.location_state ?? null,
        draft.location_country ?? null,
        draft.location_country_code ?? null,
        draft.location_lng ?? null,
        draft.location_lat ?? null,
        draft.max_capacity,
        draft.cost_dollars,
        new Date('2027-01-01T00:00:00Z').toISOString(),
        adventureId,
      ]
    )

    return { id: adventureId, mode: 'updated' }
  }

  const inserted = await client.query(
    `insert into public.adventures (
       host_id, title, title_slug, description, adventure_type, difficulty,
       required_gear, host_included, tags, start_at, end_at, duration_minutes,
       season, location_name, location_city, location_state, location_country,
       location_country_code, location_precise_point,
       max_capacity, cost_dollars, currency,
       status, participant_visibility, submitted_at
     ) values (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11, $12,
       $13, $14, $15, $16, $17,
       $18, ST_SetSRID(ST_MakePoint($19, $20), 4326)::geography,
       $21, $22, 'USD',
       'open', 'public', $23
     )
     returning id`,
    [
      hostId,
      draft.title,
      slugifyTitle(draft.title),
      draft.description,
      draft.activity_type,
      draft.difficulty,
      draft.required_gear,
      draft.host_included,
      draft.tags,
      draft.start_at,
      draft.end_at,
      draft.duration_minutes,
      computeSeason(draft.start_at),
      draft.location_name,
      draft.location_city ?? null,
      draft.location_state ?? null,
      draft.location_country ?? null,
      draft.location_country_code ?? null,
      draft.location_lng ?? null,
      draft.location_lat ?? null,
      draft.max_capacity,
      draft.cost_dollars,
      new Date('2027-01-01T00:00:00Z').toISOString(),
    ]
  )

  return { id: inserted.rows[0].id, mode: 'inserted' }
}

async function setDummyCoverPathPg({ client, hostId, adventureId }) {
  await client.query(
    `update public.adventures set cover_image_path = $1 where id = $2`,
    [null, adventureId]
  )
}

async function getHostIds(supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username')
    .in('username', ['ceez', 'danny'])

  if (error) throw new Error(`Failed loading host profiles: ${error.message}`)

  const ceez = data?.find((row) => row.username === 'ceez')
  const danny = data?.find((row) => row.username === 'danny')

  if (!ceez || !danny) {
    throw new Error('Could not find both profiles: ceez and danny')
  }

  return [ceez.id, danny.id]
}

async function upsertAdventure({ supabase, hostId, draft }) {
  const basePayload = {
    host_id: hostId,
    title: draft.title,
    title_slug: slugifyTitle(draft.title),
    description: draft.description,
    adventure_type: draft.activity_type,
    difficulty: draft.difficulty,
    required_gear: draft.required_gear,
    host_included: draft.host_included,
    tags: draft.tags,
    start_at: draft.start_at,
    end_at: draft.end_at,
    duration_minutes: draft.duration_minutes,
    season: computeSeason(draft.start_at),
    location_name: draft.location_name,
    location_city: draft.location_city ?? null,
    location_state: draft.location_state ?? null,
    location_country: draft.location_country ?? null,
    location_country_code: draft.location_country_code ?? null,
    location_precise_point: draft.location_lat != null && draft.location_lng != null
      ? `POINT(${draft.location_lng} ${draft.location_lat})`
      : null,
    max_capacity: draft.max_capacity,
    cost_dollars: draft.cost_dollars,
    currency: 'USD',
    status: 'open',
    participant_visibility: 'public',
    submitted_at: new Date('2027-01-01T00:00:00Z').toISOString(),
  }

  const { data: existing, error: existingError } = await supabase
    .from('adventures')
    .select('id')
    .eq('title', draft.title)
    .eq('start_at', draft.start_at)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed checking existing adventure "${draft.title}": ${existingError.message}`)
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('adventures')
      .update(basePayload)
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(`Failed updating adventure "${draft.title}": ${updateError.message}`)
    }

    return { id: existing.id, mode: 'updated' }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('adventures')
    .insert(basePayload)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed inserting adventure "${draft.title}": ${insertError.message}`)
  }

  return { id: inserted.id, mode: 'inserted' }
}

async function uploadDummyCover({ supabase, hostId, adventureId }) {
  const pngBuffer = getDummyPngBuffer()
  const objectPath = `adventures/${hostId}/${adventureId}/cover-seed.png`

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(objectPath, pngBuffer, {
    upsert: true,
    contentType: 'image/png',
    cacheControl: '3600',
  })

  if (uploadError) {
    throw new Error(`Failed uploading cover image for ${adventureId}: ${uploadError.message}`)
  }

  const { error: updateError } = await supabase
    .from('adventures')
    .update({ cover_image_path: objectPath })
    .eq('id', adventureId)

  if (updateError) {
    throw new Error(`Failed saving cover path for ${adventureId}: ${updateError.message}`)
  }
}

async function main() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  let inserted = 0
  let updated = 0

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const hostIds = await getHostIds(supabase)

    for (const [index, draft] of CA_ADVENTURES.entries()) {
      const hostId = hostIds[index % hostIds.length]
      const result = await upsertAdventure({ supabase, hostId, draft })

      if (result.mode === 'inserted') inserted += 1
      if (result.mode === 'updated') updated += 1

      await uploadDummyCover({ supabase, hostId, adventureId: result.id })

      // eslint-disable-next-line no-console
      console.log(`✅ ${result.mode.toUpperCase()} ${draft.title} (${result.id})`)
    }
  } else {
    const dbUrl = buildDbUrl()
    if (!dbUrl) {
      throw new Error('Missing credentials. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_URL.')
    }

    const client = createPgClient(dbUrl)
    await client.connect()

    try {
      const hostIds = await getHostIdsPg(client)

      for (const [index, draft] of CA_ADVENTURES.entries()) {
        const hostId = hostIds[index % hostIds.length]
        const result = await upsertAdventurePg({ client, hostId, draft })

        if (result.mode === 'inserted') inserted += 1
        if (result.mode === 'updated') updated += 1

        await setDummyCoverPathPg({ client, hostId, adventureId: result.id })

        // eslint-disable-next-line no-console
        console.log(`✅ ${result.mode.toUpperCase()} ${draft.title} (${result.id})`)
      }

      // eslint-disable-next-line no-console
      console.log('ℹ️ Seeded via direct Postgres (storage upload skipped: cover_image_path cleared to use UI fallback image).')
    } finally {
      await client.end().catch(() => {})
    }
  }

  // eslint-disable-next-line no-console
  console.log('\nFinished seeding CA adventures')
  // eslint-disable-next-line no-console
  console.log(`Inserted: ${inserted}`)
  // eslint-disable-next-line no-console
  console.log(`Updated: ${updated}`)
  // eslint-disable-next-line no-console
  console.log(`Storage bucket: ${MEDIA_BUCKET}`)
}

await main()
