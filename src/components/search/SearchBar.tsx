'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

export function SearchBar({ onSearch }: { onSearch?: (query: string) => void }) {
  return (
    <div>
      <div className="mt-2">
        <div className="flex rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-black">
          <MagnifyingGlassIcon className="pointer-events-none absolute ml-3 mt-3 size-5 text-gray-400" />
          <input
            id="search"
            name="search"
            type="text"
            placeholder="Search adventures, locations..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="block min-w-0 grow px-3 py-1.5 pl-10 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
          />
          <div className="flex py-1.5 pr-1.5">
            <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
