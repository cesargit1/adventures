import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const { Client } = pg

// ── Texas adventures for remaining weekends of March 2026 ─────────────────
// Weekends: Mar 13-15, Mar 20-22, Mar 27-29
const TX_ADVENTURES = [
  // ── Weekend 1: March 13-15 ──────────────────────────────────────────────
  {
    title: 'Enchanted Rock Summit Night Hike & Camp',
    description:
      'Set out at dusk on the main Loop Trail as the giant pink granite dome glows in the fading light. We summit the 1,825-ft dome for a sweeping panorama of the Hill Country, then drop into primitive campsites below the rock for an overnight under one of the darkest skies in central Texas. Morning breaks with coffee on the dome and a second sunrise loop before packing out.',
    activity_type: 'Hiking',
    difficulty: 'Intermediate',
    required_gear: ['headlamp', 'sleeping bag', 'trekking poles', '2L water', 'layers for cold nights'],
    host_included: ['trail snacks', 'morning coffee & oatmeal', 'star chart'],
    tags: ['hiking', 'camping', 'stargazing', 'overnight'],
    start_at: '2026-03-13T23:00:00Z', // 7 pm CT
    end_at: '2026-03-14T16:00:00Z',   // noon CT
    duration_minutes: 1020,
    location_name: 'Enchanted Rock State Natural Area',
    location_city: 'Fredericksburg',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 30.5060,
    location_lng: -98.8209,
    max_capacity: 12,
    cost_dollars: 95,
  },
  {
    title: 'Pedernales Falls Spring Creek Day Hike',
    description:
      'Hit the Pedernales Falls trail system as spring wildflowers line the limestone canyon walls. We follow the river downstream to the dramatic tiered falls, wade the shallows, and loop back via the Twin Falls spur. A relaxed pace with frequent stops for geology and bird ID makes this great for hikers of all backgrounds. We finish with a group picnic at the main trailhead.',
    activity_type: 'Hiking',
    difficulty: 'Beginner',
    required_gear: ['trail shoes', 'water sandals', '2L water', 'sunscreen', 'snacks'],
    host_included: ['trail map', 'picnic spread at finish', 'field ID guide'],
    tags: ['hiking', 'waterfall', 'wildflowers', 'day-trip'],
    start_at: '2026-03-14T15:00:00Z', // 9 am CT
    end_at: '2026-03-14T23:00:00Z',   // 5 pm CT
    duration_minutes: 480,
    location_name: 'Pedernales Falls State Park',
    location_city: 'Johnson City',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 30.3068,
    location_lng: -98.2568,
    max_capacity: 16,
    cost_dollars: 55,
  },

  // ── Weekend 2: March 20-22 ──────────────────────────────────────────────
  {
    title: 'Garner State Park Frio River Weekend Camp',
    description:
      'Garner is the crown jewel of Texas state parks and the Frio River in late March is crystal clear and cool. We set up base camp Friday evening, spend Saturday swimming, paddling, and hiking the Old Baldy summit trail, and wrap up Sunday morning with a riverside breakfast before packing out. A true Hill Country escape that fills up fast in spring — spots are limited.',
    activity_type: 'Camping',
    difficulty: 'Beginner',
    required_gear: ['tent', 'sleeping bag', 'camp chairs', 'water shoes', 'sunscreen'],
    host_included: ['Friday dinner', 'Saturday camp breakfast', 'kayak & paddle rental', 'firewood'],
    tags: ['camping', 'river', 'hill-country', 'swimming', 'family-friendly'],
    start_at: '2026-03-20T23:00:00Z', // 5 pm CT Friday
    end_at: '2026-03-22T16:00:00Z',   // 11 am CT Sunday
    duration_minutes: 2820,
    location_name: 'Garner State Park',
    location_city: 'Concan',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 29.5885,
    location_lng: -99.7479,
    max_capacity: 20,
    cost_dollars: 185,
  },
  {
    title: "Palo Duro Canyon Rim & Lighthouse Trail",
    description:
      'The "Grand Canyon of Texas" drops 800 feet of layered red, orange, and white canyon walls right in the Texas Panhandle. We hike the popular Lighthouse Trail to the 75-ft hoodoo spire for photos, then continue along the rim for wide-angle views before looping back through juniper and mesquite. An early start beats the heat and gives us the best light for photography.',
    activity_type: 'Hiking',
    difficulty: 'Intermediate',
    required_gear: ['hiking boots', '3L water', 'sun hat', 'sunscreen', 'camera'],
    host_included: ['trail snacks', 'lunch at the canyon rim', 'printed trail map'],
    tags: ['hiking', 'canyon', 'photography', 'day-trip'],
    start_at: '2026-03-21T13:00:00Z', // 8 am CT
    end_at: '2026-03-21T23:00:00Z',   // 6 pm CT
    duration_minutes: 600,
    location_name: 'Palo Duro Canyon State Park',
    location_city: 'Canyon',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 34.9300,
    location_lng: -101.6714,
    max_capacity: 14,
    cost_dollars: 75,
  },

  // ── Weekend 3: March 27-29 ──────────────────────────────────────────────
  {
    title: 'Big Bend Chisos Basin Overnight Backpack',
    description:
      'March is prime Big Bend season — desert in bloom, mild temps, and uncrowded trails. We hike into the Chisos Basin, set up camp at Pinnacles, and tackle the South Rim trail on Saturday for jaw-dropping 100-mile views into Mexico. Sunday morning we descend via the Laguna Meadow loop and soak in the quiet before driving back out across the Chihuahuan Desert.',
    activity_type: 'Hiking',
    difficulty: 'Advanced',
    required_gear: ['backpack (40L+)', 'sleeping bag (20°F rated)', 'water filter', 'trekking poles', 'bear canister'],
    host_included: ['backcountry permit', 'freeze-dried trail meals (Fri dinner, Sat lunch & dinner)', 'emergency satellite communicator'],
    tags: ['backpacking', 'desert', 'overnight', 'advanced'],
    start_at: '2026-03-27T20:00:00Z', // 3 pm CT Friday
    end_at: '2026-03-29T20:00:00Z',   // 3 pm CT Sunday
    duration_minutes: 2880,
    location_name: 'Big Bend National Park — Chisos Basin',
    location_city: 'Terlingua',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 29.2698,
    location_lng: -103.3008,
    max_capacity: 8,
    cost_dollars: 249,
  },
  {
    title: 'Dinosaur Valley Fossil Tracks & Riverside Camp',
    description:
      'Walk in the footsteps of sauropods and theropods exposed in the Paluxy River limestone — the best-preserved dinosaur tracks in North America. We explore multiple track sites with a guided interpretation, then set up camp on the river bank for an overnight under the stars. Sunday morning is free for birding, swimming, or a second self-guided track walk before heading home.',
    activity_type: 'Camping',
    difficulty: 'Beginner',
    required_gear: ['tent', 'sleeping bag', 'water shoes', 'headlamp', 'camp towel'],
    host_included: ['Friday dinner at camp', 'track-site guided tour', 'morning camp breakfast', 'firewood'],
    tags: ['camping', 'educational', 'family-friendly', 'river', 'paleontology'],
    start_at: '2026-03-28T16:00:00Z', // 11 am CT Saturday
    end_at: '2026-03-29T20:00:00Z',   // 3 pm CT Sunday
    duration_minutes: 1680,
    location_name: 'Dinosaur Valley State Park',
    location_city: 'Glen Rose',
    location_state: 'Texas',
    location_country: 'United States',
    location_country_code: 'US',
    location_lat: 32.2487,
    location_lng: -97.8269,
    max_capacity: 18,
    cost_dollars: 129,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function loadEnv() {
  const root = process.cwd()
  const env = path.join(root, '.env')
  if (fs.existsSync(env)) dotenv.config({ path: env })
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
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

function buildDbUrl() {
  let url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!url) return null
  if (url.includes('[YOUR-PASSWORD]')) {
    const pw = process.env.SUPABASE_DB_PASSWORD
    if (!pw) throw new Error('SUPABASE_DB_URL has [YOUR-PASSWORD] but SUPABASE_DB_PASSWORD is not set.')
    url = url.replace('[YOUR-PASSWORD]', encodeURIComponent(pw))
  }
  return url
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

// ── Supabase-client path ───────────────────────────────────────────────────

async function getHostIds(supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username')
    .eq('username', 'cheech')

  if (error) throw new Error(`Failed loading host profiles: ${error.message}`)

  const cheech = data?.[0]
  if (!cheech) throw new Error('Could not find profile: cheech')
  return [cheech.id]
}

async function upsertAdventure({ supabase, hostId, draft }) {
  const payload = {
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
    location_lat: draft.location_lat ?? null,
    location_lng: draft.location_lng ?? null,
    location_precise_point:
      draft.location_lat != null && draft.location_lng != null
        ? `POINT(${draft.location_lng} ${draft.location_lat})`
        : null,
    max_capacity: draft.max_capacity,
    cost_dollars: draft.cost_dollars,
    currency: 'USD',
    status: 'open',
    participant_visibility: 'public',
    submitted_at: new Date('2026-03-01T00:00:00Z').toISOString(),
  }

  const { data: existing } = await supabase
    .from('adventures')
    .select('id')
    .eq('title', draft.title)
    .eq('start_at', draft.start_at)
    .maybeSingle()

  if (existing?.id) {
    await supabase.from('adventures').update(payload).eq('id', existing.id)
    return { id: existing.id, mode: 'updated' }
  }

  const { data: inserted, error } = await supabase
    .from('adventures')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(`Failed inserting "${draft.title}": ${error.message}`)
  return { id: inserted.id, mode: 'inserted' }
}

// ── Direct Postgres path ───────────────────────────────────────────────────

async function getHostIdsPg(client) {
  const result = await client.query(
    `select id, username from public.profiles where username = any($1)`,
    [['cheech']]
  )
  const cheech = result.rows.find((r) => r.username === 'cheech')
  if (!cheech) throw new Error('Could not find profile: cheech')
  return [cheech.id]
}

async function upsertAdventurePg({ client, hostId, draft }) {
  const existing = await client.query(
    `select id from public.adventures where title = $1 and start_at = $2 limit 1`,
    [draft.title, draft.start_at]
  )

  if (existing.rows[0]?.id) {
    const id = existing.rows[0].id
    await client.query(
      `update public.adventures
       set host_id = $1, title = $2, title_slug = $3, description = $4,
           adventure_type = $5, difficulty = $6, required_gear = $7,
           host_included = $8, tags = $9, start_at = $10, end_at = $11,
           duration_minutes = $12, season = $13, location_name = $14,
           location_city = $15, location_state = $16, location_country = $17,
           location_country_code = $18,
           location_precise_point = ST_SetSRID(ST_MakePoint($19, $20), 4326)::geography,
           location_lat = $20, location_lng = $19,
           max_capacity = $21, cost_dollars = $22, currency = 'USD',
           status = 'open', participant_visibility = 'public', submitted_at = $23
       where id = $24`,
      [
        hostId, draft.title, slugifyTitle(draft.title), draft.description,
        draft.activity_type, draft.difficulty, draft.required_gear,
        draft.host_included, draft.tags, draft.start_at, draft.end_at,
        draft.duration_minutes, computeSeason(draft.start_at), draft.location_name,
        draft.location_city ?? null, draft.location_state ?? null,
        draft.location_country ?? null, draft.location_country_code ?? null,
        draft.location_lng ?? null, draft.location_lat ?? null,
        draft.max_capacity, draft.cost_dollars,
        new Date('2026-03-01T00:00:00Z').toISOString(), id,
      ]
    )
    return { id, mode: 'updated' }
  }

  const inserted = await client.query(
    `insert into public.adventures (
       host_id, title, title_slug, description, adventure_type, difficulty,
       required_gear, host_included, tags, start_at, end_at, duration_minutes,
       season, location_name, location_city, location_state, location_country,
       location_country_code, location_precise_point, location_lat, location_lng,
       max_capacity, cost_dollars, currency, status, participant_visibility, submitted_at
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
       $13, $14, $15, $16, $17,
       $18, ST_SetSRID(ST_MakePoint($19, $20), 4326)::geography, $20, $19,
       $21, $22, 'USD', 'open', 'public', $23
     ) returning id`,
    [
      hostId, draft.title, slugifyTitle(draft.title), draft.description,
      draft.activity_type, draft.difficulty, draft.required_gear,
      draft.host_included, draft.tags, draft.start_at, draft.end_at,
      draft.duration_minutes, computeSeason(draft.start_at), draft.location_name,
      draft.location_city ?? null, draft.location_state ?? null,
      draft.location_country ?? null, draft.location_country_code ?? null,
      draft.location_lng ?? null, draft.location_lat ?? null,
      draft.max_capacity, draft.cost_dollars,
      new Date('2026-03-01T00:00:00Z').toISOString(),
    ]
  )

  return { id: inserted.rows[0].id, mode: 'inserted' }
}

async function setDummyCoverPathPg({ client, adventureId }) {
  await client.query(
    `update public.adventures set cover_image_path = null where id = $1`,
    [adventureId]
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

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

    for (const [i, draft] of TX_ADVENTURES.entries()) {
      const hostId = hostIds[i % hostIds.length]
      const result = await upsertAdventure({ supabase, hostId, draft })
      if (result.mode === 'inserted') inserted++
      if (result.mode === 'updated') updated++
      console.log(`✅ ${result.mode.toUpperCase()} ${draft.title} (${result.id})`)
    }
  } else {
    const dbUrl = buildDbUrl()
    if (!dbUrl) throw new Error('Missing credentials. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_URL.')

    const client = createPgClient(dbUrl)
    await client.connect()

    try {
      const hostIds = await getHostIdsPg(client)

      for (const [i, draft] of TX_ADVENTURES.entries()) {
        const hostId = hostIds[i % hostIds.length]
        const result = await upsertAdventurePg({ client, hostId, draft })
        if (result.mode === 'inserted') inserted++
        if (result.mode === 'updated') updated++
        await setDummyCoverPathPg({ client, adventureId: result.id })
        console.log(`✅ ${result.mode.toUpperCase()} ${draft.title} (${result.id})`)
      }

      console.log('ℹ️ Seeded via direct Postgres (cover_image_path cleared to use UI fallback image).')
    } finally {
      await client.end().catch(() => {})
    }
  }

  console.log('\nFinished seeding TX adventures')
  console.log(`Inserted: ${inserted}`)
  console.log(`Updated: ${updated}`)
}

await main()
