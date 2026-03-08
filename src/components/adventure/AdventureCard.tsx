import Link from 'next/link'

interface Adventure {
  id: number
  title?: string
  location?: string
  date?: string
  difficulty?: string
  spots_available?: number
}

export function AdventureCard({ adventures = [] }: { adventures?: Adventure[] }) {
  const items = adventures.length > 0 ? adventures : [{ id: 1 }, { id: 2 }, { id: 3 }]

  return (
    <ul role="list" className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-4 sm:px-0">
          <Link href={`/adventures/${item.id}`} className="block hover:bg-white -mx-4 px-4 py-4 sm:mx-0 sm:px-0">
            <div className="flex items-center justify-between">
              <div className="flex-auto">
                <h3 className="font-semibold text-gray-900">{item.title || `Adventure ${item.id}`}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.location || 'Location TBA'}</p>
                <div className="mt-2 flex gap-x-4 text-sm text-gray-500">
                  <span>{item.date || 'Date TBA'}</span>
                  <span className="font-medium text-gray-900">{item.difficulty || 'Beginner'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {item.spots_available || 0} spots
                </div>
                <span className="inline-block px-3 py-1 mt-2 text-xs font-medium rounded-full bg-black text-white">
                  View Details
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
