'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapLocation } from './data'

type Pin = { loc: string; label: string }

export default function LeafletMap({ locations, pins }: { locations: MapLocation[]; pins: Pin[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: [-37.91, 145.03],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {}).addTo(map)

    // Add location markers
    locations.forEach(loc => {
      if (!loc.lat || !loc.lng) return
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="width:14px;height:14px;border-radius:7px;background:${loc.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>
          <div style="font-size:9px;font-weight:600;color:#4a4540;background:rgba(255,255,255,0.9);padding:1px 4px;border-radius:4px;white-space:nowrap;font-family:'DM Sans',sans-serif">${loc.name}</div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [7, 7],
      })
      L.marker([loc.lat, loc.lng], { icon }).addTo(map)
    })

    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // Update pin markers when pins change
  useEffect(() => {
    if (!mapInstance.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    pins.forEach(pin => {
      const loc = locations.find(l => l.id === pin.loc)
      if (!loc || !pin.label) return
      const color = pin.loc === 'bride' || pin.loc === 'church' || pin.loc === 'ripponlea' ? '#c97a6a' : pin.loc === 'groom' ? '#9a7a3a' : '#6a8aaa'
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;transform:translate(10px,-20px)">
          <div style="font-size:8px;font-weight:600;color:#fff;background:${color};padding:1px 5px;border-radius:4px;white-space:nowrap;font-family:'DM Sans',sans-serif">${pin.label}</div>
        </div>`,
        iconSize: [0, 0],
      })
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstance.current!)
      markersRef.current.push(marker)
    })
  }, [pins])

  return <div ref={mapRef} style={{ height: 220, width: '100%' }} />
}
