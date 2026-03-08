'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/20/solid'

export interface CalendarAdventure {
  id: string
  slug: string
  title: string
  start_at: string
}

interface AdventureCalendarProps {
  adventures?: CalendarAdventure[]
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/** Build the 6-row (42-cell) grid for a given month */
function buildCalendarDays(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1)
  // Monday-based: 0=Mon … 6=Sun
  const startDow = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells: { date: string; isCurrentMonth: boolean; isToday: boolean }[] = []

  // Previous month padding
  const prevMonth = new Date(year, month, 0) // last day of prev month
  const prevDays = prevMonth.getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevDays - i
    const m = month === 0 ? 12 : month
    const y = month === 0 ? year - 1 : year
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, isCurrentMonth: false, isToday: dateStr === todayStr })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, isCurrentMonth: true, isToday: dateStr === todayStr })
  }

  // Next month padding to fill 42 cells
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2
    const y = month + 2 > 12 ? year + 1 : year
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, isCurrentMonth: false, isToday: dateStr === todayStr })
  }

  return cells
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function AdventureCalendar({ adventures = [] }: AdventureCalendarProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)

  const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth)

  function goToPrev() {
    if (!canGoPrev) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function goToNext() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const days = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth])

  // Index adventures by date string (YYYY-MM-DD)
  const adventuresByDate = useMemo(() => {
    const map = new Map<string, CalendarAdventure[]>()
    for (const adv of adventures) {
      const d = new Date(adv.start_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(adv)
    }
    return map
  }, [adventures])

  // Flat list for mobile view: adventures in this viewed month
  const monthAdventures = useMemo(() => {
    return adventures
      .filter((a) => {
        const d = new Date(a.start_at)
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  }, [adventures, viewYear, viewMonth])

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="flex items-center border-b border-gray-200 px-6 py-4 lg:flex-none">
        <div className="relative flex items-center rounded-md bg-white shadow-sm outline outline-1 -outline-offset-1 outline-gray-300 md:items-stretch">
          <button
            type="button"
            onClick={goToPrev}
            disabled={!canGoPrev}
            className="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-gray-400 focus:relative disabled:cursor-not-allowed disabled:opacity-30 md:w-9 md:pr-0"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </button>
          <time
            dateTime={`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`}
            className="flex items-center px-3.5 text-sm font-semibold text-gray-900 select-none"
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </time>
          <button
            type="button"
            onClick={goToNext}
            className="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-gray-400 focus:relative md:w-9 md:pl-0"
          >
            <span className="sr-only">Next month</span>
            <ChevronRightIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>
      <div className="shadow ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col">
        <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={index} className="flex justify-center bg-white py-2">
              <span>{day}</span>
            </div>
          ))}
        </div>
        <div className="flex bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
            {days.map((day) => {
              const dayAdventures = adventuresByDate.get(day.date) ?? []
              return (
                <div
                  key={day.date}
                  data-is-today={day.isToday ? '' : undefined}
                  data-is-current-month={day.isCurrentMonth ? '' : undefined}
                  className={classNames(
                    'group relative min-h-[5.5rem] px-3 py-2 text-gray-500',
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                  )}
                >
                  <time
                    dateTime={day.date}
                    className={classNames(
                      'relative',
                      !day.isCurrentMonth && 'opacity-50',
                      day.isToday && 'flex size-6 items-center justify-center rounded-full bg-black font-semibold text-white',
                    )}
                  >
                    {day.date.split('-').pop()?.replace(/^0/, '')}
                  </time>
                  {dayAdventures.length > 0 && (
                    <ol className="mt-1 space-y-0.5">
                      {dayAdventures.slice(0, 2).map((adv) => (
                        <li key={adv.id}>
                          <Link
                            href={`/adventures/${encodeURIComponent(adv.slug || adv.id)}`}
                            className="group/link flex flex-col"
                          >
                            <p className="truncate text-xs font-semibold text-gray-900 group-hover/link:text-black leading-tight">
                              {adv.title}
                            </p>
                          </Link>
                        </li>
                      ))}
                      {dayAdventures.length > 2 && (
                        <li className="text-xs text-gray-500">+ {dayAdventures.length - 2} more</li>
                      )}
                    </ol>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Mobile list view */}
      <div className="relative px-4 py-6 sm:px-6 lg:hidden">
        {monthAdventures.length > 0 ? (
          <ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow outline outline-1 outline-black/5">
            {monthAdventures.map((adv) => {
              const d = new Date(adv.start_at)
              const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <li key={adv.id} className="group flex p-3 pr-4 focus-within:bg-white hover:bg-white">
                  <div className="flex-auto">
                    <p className="text-sm font-semibold text-gray-900">{adv.title}</p>
                    <time dateTime={adv.start_at} className="mt-1 flex items-center text-xs text-gray-600">
                      <ClockIcon aria-hidden="true" className="mr-1 size-4 text-gray-400" />
                      {dateLabel} · {timeLabel}
                    </time>
                  </div>
                  <Link
                    href={`/adventures/${encodeURIComponent(adv.slug || adv.id)}`}
                    className="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100"
                  >
                    View<span className="sr-only">, {adv.title}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-center text-sm text-gray-500">No adventures this month.</p>
        )}
      </div>
    </div>
  )
}
