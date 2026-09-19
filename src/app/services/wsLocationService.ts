const WS_URL = "https://backend-daa-mja-production.up.railway.app".replace(/^http/, "ws")

export type LocationState = {
  conectado: boolean
  pos: { lat: number; lng: number } | null
}

type Listener = (state: LocationState) => void

class WsLocationService {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private listeners = new Set<Listener>()
  private state: LocationState = { conectado: false, pos: null }

  getState(): LocationState {
    return this.state
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(patch: Partial<LocationState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((fn) => fn(this.state))
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping")
      }
    }, 25000)
  }

  connect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.stopHeartbeat()

    const prev = this.ws
    this.ws = null
    if (prev) { prev.onclose = null; prev.onerror = null; prev.close() }

    const ws = new WebSocket(`${WS_URL}/ws/location?role=subscriber`)
    this.ws = ws

    ws.onopen = () => {
      this.notify({ conectado: true })
      this.startHeartbeat()
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.active === false) {
          this.notify({ pos: null })
        } else if (typeof data.lat === "number" && typeof data.lng === "number") {
          this.notify({ pos: { lat: data.lat, lng: data.lng } })
        }
      } catch { /* ignore malformed */ }
    }

    ws.onclose = () => {
      this.stopHeartbeat()
      this.notify({ conectado: false })
      this.reconnectTimer = setTimeout(() => this.connect(), 3000)
    }

    ws.onerror = () => ws.close()
  }
}

export const wsLocationService = new WsLocationService()

// Auto-start as soon as this module loads in the browser
if (typeof window !== "undefined") {
  wsLocationService.connect()
}
