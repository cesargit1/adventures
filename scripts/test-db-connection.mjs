import process from 'node:process'
import dns from 'node:dns/promises'

import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg

function loadEnv() {
  const root = process.cwd()
  const env = path.join(root, '.env')
  if (fs.existsSync(env)) dotenv.config({ path: env })
}

function redactConnectionString(connectionString) {
  try {
    const url = new URL(connectionString)
    const user = url.username ? `${url.username}` : ''
    const host = url.host
    const db = url.pathname?.replace(/^\//, '') || ''
    return `${user ? user + '@' : ''}${host}/${db}`
  } catch {
    return '<unparseable>'
  }
}

function sslFromUrl(url) {
  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase()
  if (sslmode === 'disable') return undefined

  const host = url.hostname
  const defaultToSsl = host.endsWith('.supabase.co') || host.endsWith('.supabase.com')
  const useSsl = defaultToSsl || Boolean(sslmode)
  if (!useSsl) return undefined

  const verify = sslmode === 'verify-full' || sslmode === 'verify-ca'

  // Supabase pooler frequently requires sslmode=require (encryption on, without strict chain verification)
  return {
    rejectUnauthorized: verify,
    servername: host,
  }
}

async function createClientFromConnectionString(connectionString) {
  const url = new URL(connectionString)
  const originalHost = url.hostname

  const ssl = sslFromUrl(url)

  // Try OS resolution first; if it yields nothing (common with IPv6-only + no IPv6 configured), fall back to AAAA.
  let resolvedHost = originalHost
  try {
    await dns.lookup(originalHost)
  } catch {
    try {
      const ipv6 = await dns.resolve6(originalHost)
      if (ipv6?.[0]) resolvedHost = ipv6[0]
    } catch {
      // keep original host; pg will throw a useful error
    }
  }

  return new Client({
    host: resolvedHost,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl,
  })
}

async function main() {
  loadEnv()
  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Set SUPABASE_DB_URL (preferred) or DATABASE_URL in your .env')
  }

  if (connectionString.includes('[YOUR-PASSWORD]')) {
    const password = process.env.SUPABASE_DB_PASSWORD
    if (!password) {
      throw new Error('SUPABASE_DB_URL contains [YOUR-PASSWORD] but SUPABASE_DB_PASSWORD is not set.')
    }

    connectionString = connectionString.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
  }

  const client = await createClientFromConnectionString(connectionString)
  try {
    await client.connect()
    const result = await client.query('select now() as now, current_user as user, current_database() as db')
    // eslint-disable-next-line no-console
    console.log('✅ Connected to Postgres')
    // eslint-disable-next-line no-console
    console.log('   Target:', redactConnectionString(connectionString))
    // eslint-disable-next-line no-console
    console.log('   Server time:', result.rows[0]?.now)
    // eslint-disable-next-line no-console
    console.log('   DB user:', result.rows[0]?.user)
    // eslint-disable-next-line no-console
    console.log('   Database:', result.rows[0]?.db)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error.code === 'ENOTFOUND' || error.code === 'EAI_NODATA')) {
      throw new Error(
        [
          'DNS lookup failed for the Postgres host in SUPABASE_DB_URL.',
          `Target: ${redactConnectionString(connectionString)}`,
          '',
          'This is not a password problem. Fix by using the exact connection string from:',
          'Supabase Dashboard → Project Settings → Database → Connection string',
          '',
          'Tip: try the Connection Pooler string if Direct connection host does not resolve on your network.',
        ].join('\n'),
      )
    }

    if (error && typeof error === 'object' && 'code' in error && (error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH')) {
      throw new Error(
        [
          'Network cannot reach the Supabase Postgres host from this machine.',
          `Target: ${redactConnectionString(connectionString)}`,
          '',
          'This commonly happens when the Direct connection host is IPv6-only but your network does not support IPv6.',
          'Fix: use the Connection Pooler host (usually IPv4) from:',
          'Supabase Dashboard → Project Settings → Database → Connection string → Pooler',
        ].join('\n'),
      )
    }
    throw error
  } finally {
    await client.end().catch(() => {})
  }
}

await main()
