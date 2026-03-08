'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function createPinIcon() {
  return L.divIcon({
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    html: `
      <div style="position:relative;width:25px;height:41px;">
        <img
          src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png"
          alt=""
          aria-hidden="true"
          style="display:block;width:25px;height:41px;"
        />
      </div>
    `,
  })
}

const pinIcon = createPinIcon()

type Props = {
  locationName: string
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
}

function buildSearchQueries(props: Props): string[] {
  const queries: string[] = []
  // Full query: name + city + state + country
  const full = [props.locationName, props.locationCity, props.locationState, props.locationCountry]
    .filter(Boolean)
    .join(', ')
  if (full) queries.push(full)
  // Fallback: city + state + country
  const cityLevel = [props.locationCity, props.locationState, props.locationCountry]
    .filter(Boolean)
    .join(', ')
  if (cityLevel && cityLevel !== full) queries.push(cityLevel)
  // Fallback: just location name
  if (props.locationName && props.locationName !== full) queries.push(props.locationName)
  return queries
}

async function geocode(queries: string[]): Promise<[number, number] | null> {
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      )
      const results = await res.json()
      if (results && results.length > 0) {
        return [parseFloat(results[0].lat), parseFloat(results[0].lon)]
      }
    } catch {
      // try next query
    }
  }
  return null
}

function FlyToPosition({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, 9, { duration: 0.6 })
  }, [map, position])
  return null
}

export function AdventureDetailMapInner(props: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const queries = buildSearchQueries(props)
    if (queries.length === 0) {
      setLoading(false)
      return
    }

    geocode(queries).then((pos) => {
      if (cancelled) return
      if (pos) setPosition(pos)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [props.locationName, props.locationCity, props.locationState, props.locationCountry])

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading map…</p>
      </div>
    )
  }

  if (!position) return null

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      <MapContainer
        center={position}
        zoom={9}
        scrollWheelZoom={false}
        className="w-full h-full [filter:grayscale(1)_contrast(1.2)]"
        style={{ height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FlyToPosition position={position} />
        <Marker position={position} icon={pinIcon}>
          <Popup>{props.locationName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
