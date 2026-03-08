import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

function getPageItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) {
    items.push('ellipsis')
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (end < totalPages - 1) {
    items.push('ellipsis')
  }

  items.push(totalPages)
  return items
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pathname,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pathname: string
}) {
  if (totalItems <= 0) {
    return null
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const pageItems = getPageItems(currentPage, totalPages)

  function buildHref(page: number) {
    return page <= 1 ? pathname : `${pathname}?page=${page}`
  }

  const baseButtonClass =
    'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0'

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </Link>
        ) : (
          <span className="relative inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
            Previous
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </Link>
        ) : (
          <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
            Next
          </span>
        )}
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            {currentPage > 1 ? (
              <Link
                href={buildHref(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon aria-hidden="true" className="size-5" />
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-200">
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon aria-hidden="true" className="size-5" />
              </span>
            )}

            {pageItems.map((item, index) => {
              if (item === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                  >
                    ...
                  </span>
                )
              }

              if (item === currentPage) {
                return (
                  <span
                    key={item}
                    aria-current="page"
                    className="relative z-10 inline-flex items-center bg-black px-4 py-2 text-sm font-semibold text-white focus:z-20"
                  >
                    {item}
                  </span>
                )
              }

              return (
                <Link
                  key={item}
                  href={buildHref(item)}
                  className={baseButtonClass}
                >
                  {item}
                </Link>
              )
            })}

            {currentPage < totalPages ? (
              <Link
                href={buildHref(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon aria-hidden="true" className="size-5" />
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-200">
                <span className="sr-only">Next</span>
                <ChevronRightIcon aria-hidden="true" className="size-5" />
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
