'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CommentItem = {
  id: string
  authorName: string
  authorUsername?: string
  body: string
  createdAt: string // ISO
}

function formatShortDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase()
}

export function AdventureComments({ adventureId }: { adventureId: string }) {
  const supabase = useMemo(() => createClient(), [])

  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    // Try fetching with a join to profiles for author display name
    const { data, error: fetchError } = await supabase
      .from('adventure_comments')
      .select('id, body, created_at, author_id, profiles!adventure_comments_author_id_fkey(display_name, username)')
      .eq('adventure_id', adventureId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (fetchError) {
      // Fallback without join
      const fallback = await supabase
        .from('adventure_comments')
        .select('id, body, created_at, author_id')
        .eq('adventure_id', adventureId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (fallback.error) {
        setError(fallback.error.message)
        setLoading(false)
        return
      }

      setComments(
        (fallback.data ?? []).map((row: any) => ({
          id: row.id,
          authorName: 'User',
          body: row.body,
          createdAt: row.created_at,
        })),
      )
      setLoading(false)
      return
    }

    setComments(
      (data ?? []).map((row: any) => {
        const profile = row.profiles
        const displayName = profile?.display_name || profile?.username || 'User'
        return {
          id: row.id,
          authorName: displayName,
          authorUsername: profile?.username ?? undefined,
          body: row.body,
          createdAt: row.created_at,
        }
      }),
    )
    setLoading(false)
  }, [supabase, adventureId])

  useEffect(() => {
    void fetchComments()
  }, [fetchComments])

  async function submit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Please enter a comment.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to comment.')
        return
      }

      const { error: insertError } = await supabase
        .from('adventure_comments')
        .insert({
          adventure_id: adventureId,
          author_id: user.id,
          body: trimmed,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setDraft('')
      await fetchComments()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-label="Comments">
      <div>
        <div className="flex items-baseline justify-between gap-x-6">
          <h2 className="text-base font-semibold text-gray-900">Comments</h2>
          <p className="text-sm/6 text-gray-500">{comments.length} total</p>
        </div>

        <div className="mt-6 rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
          <div>
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No comments yet. Be the first to comment!</div>
            ) : (
            <ul role="list" className="divide-y divide-gray-900/5">
              {comments.map((c) => (
                <li key={c.id} className="p-4 sm:p-6">
                  <div className="flex items-start gap-x-4">
                    <div className="flex size-10 flex-none items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-900/5">
                      {initials(c.authorName)}
                    </div>
                    <div className="min-w-0 flex-auto">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-gray-900">{c.authorName}</p>
                        {c.authorUsername ? (
                          <p className="text-sm/6 text-gray-500">@{c.authorUsername}</p>
                        ) : null}
                        <span className="text-gray-300">&bull;</span>
                        <time dateTime={c.createdAt} className="text-sm/6 text-gray-500">
                          {formatShortDateTime(c.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm/6 text-gray-600 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </div>

          <div className="border-t border-gray-900/5 p-4 sm:p-6">
            <label htmlFor="comment" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment..."
              className="block w-full resize-none rounded-md border-0 bg-white px-3 py-2 text-sm/6 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black"
            />
            {error ? <p className="mt-2 text-sm/6 text-red-600">{error}</p> : null}
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
