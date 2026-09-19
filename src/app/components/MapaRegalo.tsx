"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { wsLocationService } from "../services/wsLocationService"

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const MARKER_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:48px;height:48px;
    border-radius:50%;
    border:3px solid #e53e3e;
    box-shadow:0 0 14px rgba(229,62,62,0.7);
    overflow:hidden;
    background:#0d0d0f;
  ">
    <img src="/lotso.webp" style="width:100%;height:100%;object-fit:cover;" />
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
})

// Colombia center
const DEFAULT_CENTER: [number, number] = [4.5709, -74.2973]
const DEFAULT_ZOOM = 6

export default function MapaRegalo() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [conectado, setConectado] = useState(() => wsLocationService.getState().conectado)
  const [ultimaPos, setUltimaPos] = useState(() => wsLocationService.getState().pos)

  const centrar = () => {
    if (!mapInstanceRef.current || !ultimaPos) return
    mapInstanceRef.current.setView([ultimaPos.lat, ultimaPos.lng], 16, { animate: true })
  }

  const reconectar = () => wsLocationService.connect()

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map)

    // Dark mode via CSS filter on the tile pane
    const tilePane = map.getPane("tilePane")
    if (tilePane) {
      tilePane.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.85) contrast(0.9)"
    }

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null   // marker belongs to this map instance
    }
  }, [])

  // Subscribe to singleton WS state
  useEffect(() => {
    const applyState = ({ conectado, pos }: { conectado: boolean; pos: { lat: number; lng: number } | null }) => {
      setConectado(conectado)
      setUltimaPos(pos)

      if (pos) {
        const map = mapInstanceRef.current
        if (!map) return
        if (!markerRef.current) {
          markerRef.current = L.marker([pos.lat, pos.lng], { icon: MARKER_ICON }).addTo(map)
          map.setView([pos.lat, pos.lng], 16)
        } else {
          markerRef.current.setLatLng([pos.lat, pos.lng])
          map.panTo([pos.lat, pos.lng])
        }
      } else if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
    }

    // Restore last known state immediately when remounting
    applyState(wsLocationService.getState())

    return wsLocationService.subscribe(applyState)
  }, [])

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[#f0edf2]/40 text-xs">Ubicación en tiempo real</span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: conectado ? "#48bb78" : "#718096",
              boxShadow: conectado ? "0 0 6px #48bb78" : "none",
            }}
          />
          <span className="text-xs" style={{ color: conectado ? "#48bb78" : "#718096" }}>
            {conectado ? "Conectado" : "Esperando..."}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full">
        <div
          ref={mapRef}
          className="rounded-2xl overflow-hidden w-full"
          style={{ height: "35vh", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        {ultimaPos && (
          <button
            onClick={centrar}
            className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: "rgba(13,13,15,0.85)",
              border: "1px solid rgba(229,62,62,0.4)",
              color: "#e53e3e",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
            Centrar
          </button>
        )}
      </div>

      {/* Reconnect + last position */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={reconectar}
          disabled={conectado}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: conectado ? "rgba(255,255,255,0.04)" : "rgba(229,62,62,0.15)",
            border: `1px solid ${conectado ? "rgba(255,255,255,0.1)" : "rgba(229,62,62,0.4)"}`,
            color: conectado ? "#718096" : "#e53e3e",
            cursor: conectado ? "default" : "pointer",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Reconectar
        </button>
        {ultimaPos && (
          <p className="text-[#f0edf2]/30 text-xs">
            {ultimaPos.lat.toFixed(6)}, {ultimaPos.lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  )
}
