'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMap } from 'react-leaflet'
import Link from 'next/link'

type ActivityIcon = 'camping' | 'hiking' | 'offroad' | 'sightseeing' | 'birdwatching' | 'rafting'

export type MapAdventure = {
  id: string
  slug?: string | null
  title: string
  adventure_type: string
  location_lat: number | null
  location_lng: number | null
}

function adventureTypeToIcon(type: string): ActivityIcon {
  const t = type.toLowerCase()
  if (t.includes('camp')) return 'camping'
  if (t.includes('hike') || t.includes('hiking') || t.includes('backpack') || t.includes('trail')) return 'hiking'
  if (t.includes('offroad') || t.includes('off-road') || t.includes('4x4') || t.includes('overlanding') || t.includes('atv')) return 'offroad'
  if (t.includes('raft') || t.includes('kayak') || t.includes('paddle') || t.includes('canoe')) return 'rafting'
  if (t.includes('bird') || t.includes('wildlife') || t.includes('nature')) return 'birdwatching'
  return 'sightseeing'
}

function getActivityIconMarkup(activity: ActivityIcon) {
  if (activity === 'camping') {
    return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M12 4L3.2 19h2.9l5.9-10.1L17.9 19h2.9L12 4z"/><rect x="7" y="18" width="10" height="2" rx="1"/></svg>`
  }

  if (activity === 'hiking') {
    return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><circle cx="14" cy="5" r="2.2"/><path d="M12.8 8.2l-3 3.1a1 1 0 00.1 1.5l2.4 1.8-1.6 5.2h2.2l1.4-4.6 2.7 1.9a1 1 0 001.5-.3l1.2-2.3-1.8-1-0.7 1.2-2.3-1.6 1-3.2-1.1-1.7z"/></svg>`
  }

  if (activity === 'offroad') {
    return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M5 12h14l-1.2-3.3A1 1 0 0016.9 8H7.1a1 1 0 00-.9.7L5 12z"/><circle cx="8" cy="16.5" r="2.3"/><circle cx="16" cy="16.5" r="2.3"/></svg>`
  }

  if (activity === 'sightseeing') {
    return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M12 5c-6 0-9.5 5.7-9.7 5.9a1 1 0 000 1.1C2.5 12.3 6 18 12 18s9.5-5.7 9.7-5.9a1 1 0 000-1.1C21.5 10.7 18 5 12 5zm0 10a3 3 0 110-6 3 3 0 010 6z"/></svg>`
  }

  if (activity === 'birdwatching') {
    return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M4 15.5c3.5 0 5.8-2.2 7.6-4 1.5 1.2 3.4 2.2 6.1 2.2l2.3-.1-2.8 1.8a1 1 0 01-.5.2h-1.9l1.2 2.1-1.8 1-1.8-3.1c-1.5.7-3.2.9-5 .9H4v-1z"/></svg>`
  }

  return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M3 16h18l-2-3.8A2 2 0 0017.2 11H6.8a2 2 0 00-1.8 1.2L3 16zm8-10h2v6h-2z"/><rect x="9" y="5" width="6" height="2" rx="1"/></svg>`
}

function createActivityMarkerIcon(activity: ActivityIcon) {
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
          style="display:block;width:25px;height:41px;filter:drop-shadow(0 0 0 #e5e7eb) drop-shadow(0 0 0 #e5e7eb);"
        />
        <div style="position:absolute;left:50%;top:6px;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;color:#ffffff;">
          ${getActivityIconMarkup(activity)}
        </div>
      </div>
    `,
  })
}

const markerIconByActivity: Record<ActivityIcon, L.DivIcon> = {
  camping: createActivityMarkerIcon('camping'),
  hiking: createActivityMarkerIcon('hiking'),
  offroad: createActivityMarkerIcon('offroad'),
  sightseeing: createActivityMarkerIcon('sightseeing'),
  birdwatching: createActivityMarkerIcon('birdwatching'),
  rafting: createActivityMarkerIcon('rafting'),
}

const DEFAULT_US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_US_ZOOM = 4

const stateViewByCode: Record<string, { center: [number, number]; zoom: number }> = {
  AL: { center: [32.8, -86.8], zoom: 7 },
  AK: { center: [64.2, -149.5], zoom: 3 },
  AZ: { center: [34.3, -111.7], zoom: 6 },
  AR: { center: [35.2, -92.4], zoom: 7 },
  CA: { center: [36.8, -119.4], zoom: 6 },
  CO: { center: [39.0, -105.5], zoom: 6 },
  CT: { center: [41.6, -72.7], zoom: 8 },
  DE: { center: [39.0, -75.5], zoom: 8 },
  FL: { center: [27.8, -81.7], zoom: 6 },
  GA: { center: [32.6, -83.4], zoom: 7 },
  HI: { center: [20.8, -156.3], zoom: 6 },
  ID: { center: [44.2, -114.6], zoom: 6 },
  IL: { center: [40.0, -89.2], zoom: 7 },
  IN: { center: [39.9, -86.3], zoom: 7 },
  IA: { center: [42.1, -93.5], zoom: 7 },
  KS: { center: [38.5, -98.0], zoom: 7 },
  KY: { center: [37.8, -85.8], zoom: 7 },
  LA: { center: [31.0, -92.0], zoom: 7 },
  ME: { center: [45.3, -69.0], zoom: 7 },
  MD: { center: [39.0, -76.7], zoom: 8 },
  MA: { center: [42.3, -71.8], zoom: 8 },
  MI: { center: [44.3, -85.4], zoom: 6 },
  MN: { center: [46.7, -94.6], zoom: 6 },
  MS: { center: [32.7, -89.7], zoom: 7 },
  MO: { center: [38.5, -92.5], zoom: 7 },
  MT: { center: [46.9, -110.4], zoom: 6 },
  NE: { center: [41.5, -99.8], zoom: 7 },
  NV: { center: [39.3, -116.6], zoom: 6 },
  NH: { center: [43.7, -71.6], zoom: 8 },
  NJ: { center: [40.1, -74.7], zoom: 8 },
  NM: { center: [34.5, -106.0], zoom: 6 },
  NY: { center: [42.9, -75.0], zoom: 7 },
  NC: { center: [35.5, -79.4], zoom: 7 },
  ND: { center: [47.5, -100.5], zoom: 6 },
  OH: { center: [40.3, -82.8], zoom: 7 },
  OK: { center: [35.6, -97.5], zoom: 7 },
  OR: { center: [44.0, -120.5], zoom: 6 },
  PA: { center: [41.0, -77.8], zoom: 7 },
  RI: { center: [41.7, -71.5], zoom: 9 },
  SC: { center: [33.8, -80.9], zoom: 7 },
  SD: { center: [44.4, -100.2], zoom: 6 },
  TN: { center: [35.8, -86.4], zoom: 7 },
  TX: { center: [31.0, -99.3], zoom: 6 },
  UT: { center: [39.3, -111.7], zoom: 6 },
  VT: { center: [44.0, -72.7], zoom: 8 },
  VA: { center: [37.5, -78.7], zoom: 7 },
  WA: { center: [47.4, -120.7], zoom: 6 },
  WV: { center: [38.6, -80.6], zoom: 7 },
  WI: { center: [44.5, -89.5], zoom: 7 },
  WY: { center: [43.0, -107.5], zoom: 6 },
}

function MapViewportUpdater({ selectedStateCode }: { selectedStateCode: string | null }) {
  const map = useMap()

  useEffect(() => {
    const selectedView = selectedStateCode ? stateViewByCode[selectedStateCode] : undefined

    if (selectedView) {
      map.flyTo(selectedView.center, selectedView.zoom, { duration: 0.8 })
      return
    }

    map.flyTo(DEFAULT_US_CENTER, DEFAULT_US_ZOOM, { duration: 0.8 })
  }, [map, selectedStateCode])

  return null
}

export function MapContent({ selectedStateCode, adventures = [] }: { selectedStateCode: string | null; adventures?: MapAdventure[] }) {
  const locations = adventures
    .filter((a) => a.location_lat != null && a.location_lng != null)
    .map((a) => ({
      id: a.slug ?? a.id,
      title: a.title,
      position: [a.location_lat!, a.location_lng!] as [number, number],
      activity: adventureTypeToIcon(a.adventure_type),
    }))

  const mapCenter: [number, number] = DEFAULT_US_CENTER
  const zoomLevel = DEFAULT_US_ZOOM

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        className="w-full h-full [filter:grayscale(1)_contrast(1.2)]"
        style={{ height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapViewportUpdater selectedStateCode={selectedStateCode} />
        {locations.map((location) => (
          <Marker key={location.id} position={location.position} icon={markerIconByActivity[location.activity]}>
            <Popup>
              <Link
                href={`/adventures/${encodeURIComponent(location.id)}`}
                className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {location.title}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
