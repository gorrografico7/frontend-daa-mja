"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import "./services/wsLocationService" // auto-starts WS on module load

const MapaRegalo = dynamic(() => import("./components/MapaRegalo"), { ssr: false })

// ─── Themes ───────────────────────────────────────────────────────────────────
interface Theme {
  heartColors: string[]
  waveFrom: string; waveMid: string; waveTo: string
  orbFrom: string; orbMid: string; orbTo: string
  button: string; buttonHover: string
}

const THEMES: Record<string, Theme> = {
  white: {
    heartColors: ["#ffffff", "#d4d4d4", "#8b8b9a", "#5a5a6e", "#ffffff", "#f0f0f0"],
    waveFrom: "#ffffff", waveMid: "#d4d4d4", waveTo: "#a0a0a0",
    orbFrom: "#ffffff", orbMid: "#d4d4d4", orbTo: "#a0a0a0",
    button: "#ffffff", buttonHover: "#e0e0e0",
  },
  yellow: {
    heartColors: ["#f5c518", "#c49a06", "#8b8b9a", "#5a5a6e", "#f5c518", "#fde68a"],
    waveFrom: "#fde68a", waveMid: "#f5c518", waveTo: "#c49a06",
    orbFrom: "#fde68a", orbMid: "#f5c518", orbTo: "#c49a06",
    button: "#f5c518", buttonHover: "#c49a06",
  },
  pink: {
    heartColors: ["#e8588a", "#c0375f", "#8b8b9a", "#5a5a6e", "#e8588a", "#ff7aaa"],
    waveFrom: "#ff7aaa", waveMid: "#e8588a", waveTo: "#c0375f",
    orbFrom: "#ff7aaa", orbMid: "#e8588a", orbTo: "#c0375f",
    button: "#e8588a", buttonHover: "#d04478",
  },
  blue: {
    heartColors: ["#60a5fa", "#2563eb", "#8b8b9a", "#5a5a6e", "#60a5fa", "#93c5fd"],
    waveFrom: "#93c5fd", waveMid: "#60a5fa", waveTo: "#2563eb",
    orbFrom: "#93c5fd", orbMid: "#60a5fa", orbTo: "#2563eb",
    button: "#3b82f6", buttonHover: "#2563eb",
  },
  red: {
    heartColors: ["#e53e3e", "#c53030", "#feb2b2", "#742a2a", "#fc8181", "#ffffff"],
    waveFrom: "#fc8181", waveMid: "#e53e3e", waveTo: "#c53030",
    orbFrom: "#fc8181", orbMid: "#e53e3e", orbTo: "#742a2a",
    button: "#e53e3e", buttonHover: "#c53030",
  },
  coffee: {
    heartColors: ["#6f4e37", "#c4a882", "#ffffff", "#2c1810", "#8b6347", "#f5f0e8"],
    waveFrom: "#c4a882", waveMid: "#6f4e37", waveTo: "#2c1810",
    orbFrom: "#c4a882", orbMid: "#6f4e37", orbTo: "#2c1810",
    button: "#6f4e37", buttonHover: "#8b6347",
  },
}

// ─── Hearts canvas ────────────────────────────────────────────────────────────
interface Heart {
  x: number; y: number; size: number; opacity: number
  speedY: number; speedX: number; phase: number; color: string; fadeDir: number
}

function LavaHearts({ colorsRef }: { colorsRef: React.MutableRefObject<string[]> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)

    const hearts: Heart[] = Array.from({ length: 7 }, () => {
      const c = colorsRef.current
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 12 + Math.random() * 32,
        opacity: Math.random(),
        speedY: -(0.2 + Math.random() * 0.5),
        speedX: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        color: c[Math.floor(Math.random() * c.length)],
        fadeDir: Math.random() > 0.5 ? 1 : -1,
      }
    })

    function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.3)
      ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3)
      ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size)
      ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3)
      ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3)
      ctx.closePath()
    }

    let raf: number, t = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.008
      const COLORS = colorsRef.current
      hearts.forEach((h) => {
        h.y += h.speedY
        h.x += Math.sin(t + h.phase) * 0.4 + h.speedX
        h.opacity += h.fadeDir * 0.004
        if (h.opacity >= 0.45) h.fadeDir = -1
        if (h.opacity <= 0.02) {
          h.fadeDir = 1
          if (Math.random() < 0.3) {
            h.y = canvas.height + h.size
            h.x = Math.random() * canvas.width
            h.color = COLORS[Math.floor(Math.random() * COLORS.length)]
          }
        }
        if (h.x < -h.size) h.x = canvas.width + h.size
        if (h.x > canvas.width + h.size) h.x = -h.size
        if (h.y < -h.size * 2) { h.y = canvas.height + h.size; h.x = Math.random() * canvas.width }
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(0.45, h.opacity))
        ctx.fillStyle = h.color
        ctx.translate(h.x, h.y)
        ctx.rotate(Math.sin(t * 0.5 + h.phase) * 0.15)
        drawHeart(ctx, 0, -h.size * 0.5, h.size)
        ctx.fill()
        ctx.restore()
      })
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [colorsRef])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
}

// ─── Lava wave (top) ──────────────────────────────────────────────────────────
const LAVA_BLOBS = [
  { cx: -0.02, baseY: -80, amp: 45, freq: 0.10, phase: 0.0, rx: 230, ry: 200 },
  { cx: 0.22,  baseY: -70, amp: 55, freq: 0.08, phase: 1.8, rx: 250, ry: 220 },
  { cx: 0.48,  baseY: -50, amp: 60, freq: 0.12, phase: 3.1, rx: 210, ry: 190 },
  { cx: 0.73,  baseY: -75, amp: 50, freq: 0.09, phase: 0.7, rx: 240, ry: 215 },
  { cx: 1.02,  baseY: -65, amp: 42, freq: 0.11, phase: 2.4, rx: 225, ry: 200 },
  { cx: 0.34,  baseY: 90,  amp: 65, freq: 0.07, phase: 4.2, rx: 170, ry: 150 },
  { cx: 0.62,  baseY: 75,  amp: 58, freq: 0.09, phase: 2.0, rx: 180, ry: 155 },
]

function LavaWave({ theme }: { theme: Theme }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number, start: number | null = null
    const tick = (ts: number) => { if (!start) start = ts; setT((ts - start) / 1000); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const id = `lavaColor-${theme.waveFrom.slice(1)}`
  return (
    <div className="fixed top-0 left-0 w-full pointer-events-none z-0 overflow-hidden" style={{ height: "60vh" }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="lava-merge" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="35" />
          </filter>
          <radialGradient id={id} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.waveFrom} stopOpacity="0.7" />
            <stop offset="70%" stopColor={theme.waveTo} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.waveTo} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#lava-merge)">
          {LAVA_BLOBS.map((b, i) => (
            <ellipse key={i} cx={`${b.cx * 100}%`} cy={b.baseY + Math.sin(t * b.freq + b.phase) * b.amp}
              rx={b.rx} ry={b.ry} fill={`url(#${id})`} fillOpacity="0.35" />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ─── Lava orbs (bottom) ───────────────────────────────────────────────────────
const ORBS = [
  { cx: 0.08, baseY: 0.82, amp: 0.04, freq: 0.09, phase: 0.0, r: 18 },
  { cx: 0.18, baseY: 0.91, amp: 0.05, freq: 0.07, phase: 1.4, r: 12 },
  { cx: 0.28, baseY: 0.86, amp: 0.04, freq: 0.11, phase: 2.8, r: 22 },
  { cx: 0.40, baseY: 0.93, amp: 0.06, freq: 0.08, phase: 0.6, r: 10 },
  { cx: 0.52, baseY: 0.88, amp: 0.05, freq: 0.10, phase: 3.5, r: 16 },
  { cx: 0.63, baseY: 0.94, amp: 0.04, freq: 0.06, phase: 1.9, r: 14 },
  { cx: 0.74, baseY: 0.85, amp: 0.06, freq: 0.09, phase: 4.1, r: 20 },
  { cx: 0.85, baseY: 0.90, amp: 0.05, freq: 0.08, phase: 2.3, r: 11 },
  { cx: 0.93, baseY: 0.87, amp: 0.04, freq: 0.11, phase: 0.9, r: 17 },
]

function LavaOrbs({ theme }: { theme: Theme }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number, start: number | null = null
    const tick = (ts: number) => { if (!start) start = ts; setT((ts - start) / 1000); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const id = `orbColor-${theme.orbFrom.slice(1)}`
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
          </filter>
          <radialGradient id={id} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.orbFrom} stopOpacity="0.9" />
            <stop offset="60%" stopColor={theme.orbMid} stopOpacity="0.5" />
            <stop offset="100%" stopColor={theme.orbTo} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#orb-blur)">
          {ORBS.map((o, i) => (
            <circle key={i} cx={`${o.cx * 100}%`}
              cy={`${(o.baseY + Math.sin(t * o.freq + o.phase) * o.amp) * 100}%`}
              r={o.r} fill={`url(#${id})`} fillOpacity="0.45" />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ─── Corner waves ─────────────────────────────────────────────────────────────
const CORNER_BLOBS = [
  { cx: -30,  baseY: 320, amp: 30, freq: 0.09, phase: 0.0, rx: 130, ry: 110 },
  { cx: 110,  baseY: 340, amp: 35, freq: 0.07, phase: 1.6, rx: 110, ry: 95  },
  { cx: 210,  baseY: 330, amp: 28, freq: 0.11, phase: 3.0, rx: 100, ry: 90  },
  { cx: 1030, baseY: 320, amp: 30, freq: 0.09, phase: 0.8, rx: 130, ry: 110 },
  { cx: 890,  baseY: 340, amp: 35, freq: 0.07, phase: 2.4, rx: 110, ry: 95  },
  { cx: 790,  baseY: 330, amp: 28, freq: 0.11, phase: 4.2, rx: 100, ry: 90  },
]

function CornerWaves({ theme }: { theme: Theme }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number, start: number | null = null
    const tick = (ts: number) => { if (!start) start = ts; setT((ts - start) / 1000); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const id = `cornerColor-${theme.waveFrom.slice(1)}`
  return (
    <div className="fixed bottom-0 left-0 w-full pointer-events-none z-0 overflow-hidden" style={{ height: "30vh" }}>
      <svg viewBox="0 0 1000 300" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="corner-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
          </filter>
          <radialGradient id={id} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.waveFrom} stopOpacity="0.6" />
            <stop offset="65%" stopColor={theme.waveTo} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.waveTo} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#corner-blur)">
          {CORNER_BLOBS.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={b.baseY + Math.sin(t * b.freq + b.phase) * b.amp}
              rx={b.rx} ry={b.ry} fill={`url(#${id})`} fillOpacity="0.35" />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ─── Looping GIF ──────────────────────────────────────────────────────────────
function LoopingGif({ src, intervalMs = 2000, className }: { src: string; intervalMs?: number; className?: string }) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      if (ref.current) ref.current.src = src
    }, intervalMs)
    return () => clearInterval(id)
  }, [src, intervalMs])

  return <img ref={ref} src={src} className={className} alt="" />
}

// ─── Floating photos ──────────────────────────────────────────────────────────
const PHOTO_FILES = ['p1.png','p2.png','p3.png','p4.png','p5.png','p6.png']

interface PhotoParticle {
  x: number; y: number; speedY: number; speedX: number
  opacity: number; fadeDir: number; hold: number; size: number; rotation: number
  img: HTMLImageElement; crop: { sx: number; sy: number; sw: number; sh: number }
}

function detectCrop(img: HTMLImageElement) {
  const tmp = document.createElement('canvas')
  tmp.width = img.naturalWidth; tmp.height = img.naturalHeight
  const c = tmp.getContext('2d')!
  c.drawImage(img, 0, 0)
  const { data, width, height } = c.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
  const dark = (x: number, y: number) => { const i = (y * width + x) * 4; return data[i] < 25 && data[i+1] < 25 && data[i+2] < 25 }
  let top = 0, bot = height - 1, left = 0, right = width - 1
  for (let y = 0; y < height; y++) { if (!Array.from({length: width}, (_, x) => dark(x, y)).every(Boolean)) { top = y; break } }
  for (let y = height - 1; y >= 0; y--) { if (!Array.from({length: width}, (_, x) => dark(x, y)).every(Boolean)) { bot = y; break } }
  for (let x = 0; x < width; x++) { if (!Array.from({length: height}, (_, y) => dark(x, y)).every(Boolean)) { left = x; break } }
  for (let x = width - 1; x >= 0; x--) { if (!Array.from({length: height}, (_, y) => dark(x, y)).every(Boolean)) { right = x; break } }
  return { sx: left, sy: top, sw: right - left, sh: bot - top }
}

function FloatingPhotos() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    type ImgWithCrop = HTMLImageElement & { crop?: ReturnType<typeof detectCrop> }
    const images: ImgWithCrop[] = []
    let loaded = 0
    PHOTO_FILES.forEach((name, i) => {
      const img = new window.Image() as ImgWithCrop
      img.onload = () => { img.crop = detectCrop(img); images[i] = img; loaded++ }
      img.src = `/fotos/${name}`
    })

    const particles: PhotoParticle[] = []
    let raf: number, frame = 0

    const spawn = () => {
      if (loaded === 0) return
      const img = images[Math.floor(Math.random() * loaded)]
      if (!img?.crop) return
      const size = 45 + Math.random() * 30
      particles.push({ x: Math.random() * canvas.width, y: canvas.height + size,
        speedY: -(0.2 + Math.random() * 0.5), speedX: (Math.random() - 0.5) * 0.4,
        opacity: 0, fadeDir: 1, hold: 0, size, rotation: (Math.random() - 0.5) * 0.2,
        img, crop: img.crop })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      if (frame % 220 === 0 && Math.random() < 0.5) spawn()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.y += p.speedY; p.x += p.speedX
        if (p.fadeDir === 1) { p.opacity += 0.006; if (p.opacity >= 0.42) { p.opacity = 0.42; p.fadeDir = 0; p.hold = 320 } }
        else if (p.fadeDir === 0) { p.hold--; if (p.hold <= 0) p.fadeDir = -1 }
        else { p.opacity -= 0.004 }
        if (p.opacity <= 0 || p.y < -p.size * 2) { particles.splice(i, 1); continue }
        const { sx, sy, sw, sh } = p.crop
        const drawH = p.size * (sh / sw)
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.beginPath()
        ctx.roundRect(-p.size / 2, -drawH / 2, p.size, drawH, 10)
        ctx.clip()
        ctx.drawImage(p.img, sx, sy, sw, sh, -p.size / 2, -drawH / 2, p.size, drawH)
        ctx.restore()
      }
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// ─── Shared background layer ──────────────────────────────────────────────────
function Background({ theme, colorsRef }: { theme: Theme; colorsRef: React.MutableRefObject<string[]> }) {
  return (
    <>
      <LavaHearts colorsRef={colorsRef} />
      <FloatingPhotos />
      <LavaWave theme={theme} />
      <LavaOrbs theme={theme} />
      <CornerWaves theme={theme} />
    </>
  )
}

// ─── Screens ──────────────────────────────────────────────────────────────────
function Screen1({ onNext, theme }: { onNext: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Feliz día bebé <br />Con mucho cariño: <br /> Tu bebé
      </p>
      <Image src="/image.png" alt="Pardo" width={160} height={160} className="object-contain" />
      <div className="mt-8">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button, color: theme.button === "#ffffff" ? "#0d0d0f" : "#ffffff" }}
          className="w-72 py-3.5 rounded-xl text-sm font-semibold active:scale-95 transition-all"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

function Screen2({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        No soy mucho de hacer este tipo de cosas pero, cuando lo hago de verdad es con todo mi corazón, espero que te guste
      </p>
      <img src="/gitbobesponja1.gif" alt="Bob Esponja" className="w-40 h-40 object-contain" />
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button }}
          className="w-72 py-3.5 rounded-xl text-[#0d0d0f] text-sm font-semibold active:scale-95 transition-all"
        >
          Continuar
        </button>
        <button
          onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all"
        >
          ← Atrás
        </button>
      </div>
    </div>
  )
}

function Screen3({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <LoopingGif src="/marciano.gif" intervalMs={2000} className="fixed bottom-4 right-4 w-20 h-20 object-contain z-20 pointer-events-none" />
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Tu eres una personita muy especial en mi vida y quería hacer que este día fuese un poco especial para ti, así sea un simple detalle de mi
      </p>
      <Image src="/lotso.webp" alt="Lotso" width={160} height={160} className="object-contain" />
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all"
        >
          Continuar
        </button>
        <button
          onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all"
        >
          ← Atrás
        </button>
      </div>
    </div>
  )
}

function Screen4({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Cuando llegaste a mi vida me illuminaste el corazón, me motivaste a seguir creciendo, por eso voy a decir siempre que eres un angelito
      </p>
      <Image src="/angelica-rugrats.png" alt="Angélica" width={200} height={200} className="object-contain" />
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all"
        >
          Continuar
        </button>
        <button
          onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all"
        >
          ← Atrás
        </button>
      </div>
    </div>
  )
}

function BorderBear() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const SPEED = 1.4
    const SIZE = 60
    let dist = 0
    let raf: number

    const loopId = setInterval(() => {
      if (imgRef.current) imgRef.current.src = '/osos_caminando_sin_fondo.gif'
    }, 1800)

    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const perimeter = 2 * (w + h)
      dist = (dist + SPEED) % perimeter

      let x: number, y: number, rotation: number

      if (dist <= w) {
        x = dist - SIZE / 2
        y = h - SIZE
        rotation = 0
      } else if (dist <= w + h) {
        x = w - SIZE
        y = h - SIZE - (dist - w)
        rotation = -90
      } else if (dist <= 2 * w + h) {
        x = w - SIZE - (dist - w - h)
        y = 0
        rotation = 180
      } else {
        x = 0
        y = dist - 2 * w - h
        rotation = 90
      }

      if (imgRef.current) {
        imgRef.current.style.left = `${x}px`
        imgRef.current.style.top = `${y}px`
        imgRef.current.style.transform = `rotate(${rotation}deg)`
      }

      raf = requestAnimationFrame(animate)
    }

    animate()
    return () => { cancelAnimationFrame(raf); clearInterval(loopId) }
  }, [])

  return (
    <>
      <img
        ref={imgRef}
        src="/osos_caminando_sin_fondo.gif"
        alt=""
        onClick={() => setShowModal(true)}
        style={{ position: 'fixed', width: 60, height: 60, objectFit: 'contain', pointerEvents: 'auto', zIndex: 30, cursor: 'pointer' }}
      />
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#16141a] border border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 max-w-xs text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl">😡</span>
            <p className="text-[#f0edf2] text-base font-medium leading-relaxed">
              deja a los escandalosos caminar
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-1 px-6 py-2 rounded-xl bg-[#6f4e37] text-white text-sm font-semibold active:scale-95 transition-all"
            >
              ok ok
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Screen5({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <BorderBear />
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Por eso te doy las gracias por: la paciencia, el tiempo, los momentos, las risas, los besos. Te doy gracias por existir
      </p>
      <Image src="/cartoon-network-escandalosos.webp" alt="Escandalosos" width={200} height={200} className="object-contain" />
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all"
        >
          Continuar
        </button>
        <button
          onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all"
        >
          ← Atrás
        </button>
      </div>
    </div>
  )
}

function Screen6({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  return (
    <div className="relative flex flex-col items-center gap-6 z-10">
      <p className="text-[#f0edf2] text-xl font-medium tracking-wide text-center max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Feliz dia bebé <br /> Te amo y siempre te amaré... ❤️
      </p>
      <Image src="/ellayyo.jpeg" alt="Ella y yo" width={200} height={200} className="object-contain rounded-2xl" />
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          style={{ backgroundColor: theme.button }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all"
        >
          Botón ultra misterioso
        </button>
        <button
          onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all"
        >
          ← Atrás
        </button>
      </div>
    </div>
  )
}

// ─── Roulette ─────────────────────────────────────────────────────────────────
const API_URL = "https://backend-daa-mja-production.up.railway.app"

const OPCIONES_FISICO = [
  { label: "Regalo físico", titulo: "Por definir" },
]


function QRDesbloqueo() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [desbloqueado, setDesbloqueado] = useState(false)

  // Carga inicial del estado
  useEffect(() => {
    fetch(`${API_URL}/regalo-virtual/estado`)
      .then(r => r.json())
      .then(d => { if (d.desbloqueado) setDesbloqueado(true) })
      .catch(() => {})
  }, [])

  // Genera y refresca el QR cada 25s (antes de que expire la ventana de 30s)
  useEffect(() => {
    if (desbloqueado) return
    const cargarQr = () => {
      setQrUrl(`${API_URL}/regalo-virtual/qr?t=${Date.now()}`)
    }
    cargarQr()
    const id = setInterval(cargarQr, 25000)
    return () => clearInterval(id)
  }, [desbloqueado])

  // Polling del estado cada 3s hasta que se desbloquee
  useEffect(() => {
    if (desbloqueado) return
    const id = setInterval(() => {
      fetch(`${API_URL}/regalo-virtual/estado`)
        .then(r => r.json())
        .then(d => { if (d.desbloqueado) setDesbloqueado(true) })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(id)
  }, [desbloqueado])

  if (desbloqueado) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <span className="text-3xl">🎁</span>
        <p className="text-[#f0edf2] text-sm text-center leading-relaxed">
          {/* contenido regalo virtual desbloqueado */}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-[#f0edf2]/60 text-xs text-center">
        Escanea con la app para desbloquear
      </p>
      {qrUrl ? (
        <img
          src={qrUrl}
          alt="QR de desbloqueo"
          className="rounded-xl"
          style={{ width: "160px", height: "160px", imageRendering: "pixelated" }}
        />
      ) : (
        <div style={{ width: 160, height: 160 }} className="rounded-xl bg-white/5 animate-pulse" />
      )}
      <p className="text-[#f0edf2]/30 text-xs">Se renueva cada 25 segundos</p>
    </div>
  )
}

const ROULETTE_ITEMS = [
  "Regalito físico", "Regalito virtual", "Regalito físico",
  "Regalito virtual", "Ambas", "Regalito físico",
  "Regalito virtual", "Regalito virtual",
]
const ROULETTE_COLORS = ["#e53e3e", "#b91c1c", "#ef4444", "#991b1b", "#f87171", "#7f1d1d", "#fca5a5", "#c53030"]

function RouletteWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [yaGirada, setYaGirada] = useState(false)
  const [loadingEstado, setLoadingEstado] = useState(true)
  const [tabActiva, setTabActiva] = useState<"fisico" | "virtual">("fisico")
  const [opcionActiva, setOpcionActiva] = useState<number | null>(null)
  const angleRef = useRef(0)
  const velRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    fetch(`${API_URL}/ruleta`)
      .then(r => r.json())
      .then(data => {
        if (data.girada) { setYaGirada(true); setResult("Ambas") }
      })
      .catch(() => {})
      .finally(() => setLoadingEstado(false))
  }, [])

  const draw = (angle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8
    const n = ROULETTE_ITEMS.length, arc = (Math.PI * 2) / n
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < n; i++) {
      const start = angle + i * arc, end = start + arc
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath()
      ctx.fillStyle = ROULETTE_COLORS[i]; ctx.fill()
      ctx.strokeStyle = "#fff2"; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2)
      ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"
      ctx.fillText(ROULETTE_ITEMS[i], r - 6, 4)
      ctx.restore()
    }
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.fillStyle = "#fff"; ctx.fill()
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fillStyle = "#e53e3e"; ctx.fill()
  }

  useEffect(() => { draw(0) }, [])
  useEffect(() => { if (!loadingEstado && !yaGirada) draw(angleRef.current) }, [loadingEstado, yaGirada])

  const spin = async () => {
    if (spinning || yaGirada) return
    try {
      const res = await fetch(`${API_URL}/ruleta/girar`, { method: "POST" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.ok) { setYaGirada(true); setResult("Ambas"); return }
    } catch { return }
    setSpinning(true); setResult(null)
    const n = ROULETTE_ITEMS.length
    const arc = (Math.PI * 2) / n
    const ambasIdx = ROULETTE_ITEMS.indexOf("Ambas")
    // angle where Ambas middle lands at top pointer (-π/2 = 3π/2)
    const baseTarget = (3 * Math.PI / 2) - (ambasIdx + 0.5) * arc
    const remainder = ((baseTarget - angleRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    const extraRotations = (10 + Math.floor(Math.random() * 6)) * Math.PI * 2
    const targetAngle = angleRef.current + remainder + extraRotations
    const startAngle = angleRef.current
    const startTime = performance.now()
    const duration = 4500 + Math.random() * 1500
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      angleRef.current = startAngle + (targetAngle - startAngle) * eased
      draw(angleRef.current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        angleRef.current = targetAngle
        draw(targetAngle)
        setSpinning(false)
        setResult("Ambas")
        setYaGirada(true)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Canvas siempre en el DOM para que useEffect pueda dibujar */}
      <div className={`relative ${yaGirada || loadingEstado ? "hidden" : ""}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10"
          style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '22px solid white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
        <canvas ref={canvasRef} width={240} height={240} style={{ borderRadius: '50%', boxShadow: '0 0 30px rgba(229,62,62,0.4)' }} />
      </div>

      {loadingEstado && (
        <p className="text-[#f0edf2]/60 text-sm py-4">Cargando...</p>
      )}

      {!yaGirada && !loadingEstado && (
        <button onClick={spin} disabled={spinning}
          style={{ backgroundColor: '#e53e3e' }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {spinning ? "Girando..." : "¡Girar!"}
        </button>
      )}

      {yaGirada && (
        <div className="w-72 flex flex-col gap-3">
          <div className="flex gap-2 p-1 rounded-full" style={{ backgroundColor: "rgba(229,62,62,0.15)", border: "1px solid rgba(229,62,62,0.2)" }}>
            <button
              onClick={() => { setTabActiva("fisico"); setOpcionActiva(null) }}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: tabActiva === "fisico" ? "#e53e3e" : "transparent",
                color: tabActiva === "fisico" ? "#fff" : "rgba(255,255,255,0.45)",
                boxShadow: tabActiva === "fisico" ? "0 0 16px rgba(229,62,62,0.5)" : "none",
                transform: tabActiva === "fisico" ? "scale(1.03)" : "scale(1)",
              }}>
              Regalo físico
            </button>
            <button
              onClick={() => { setTabActiva("virtual"); setOpcionActiva(null) }}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: tabActiva === "virtual" ? "#e53e3e" : "transparent",
                color: tabActiva === "virtual" ? "#fff" : "rgba(255,255,255,0.45)",
                boxShadow: tabActiva === "virtual" ? "0 0 16px rgba(229,62,62,0.5)" : "none",
                transform: tabActiva === "virtual" ? "scale(1.03)" : "scale(1)",
              }}>
              Regalo virtual
            </button>
          </div>
          {/* Contenido por tab */}
          <div
            className="rounded-2xl w-full p-3"
            style={{
              display: tabActiva === "fisico" ? "block" : "none",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
            <MapaRegalo />
          </div>
          <div
            className="rounded-2xl w-full items-center justify-center"
            style={{
              display: tabActiva === "virtual" ? "flex" : "none",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: "35vh",
            }}>
            <QRDesbloqueo />
          </div>

        </div>
      )}
    </div>
  )
}

function Screen7({ onNext, onBack, theme }: { onNext: () => void; onBack: () => void; theme: Theme }) {
  // UTC-5 (Colombia) current date
  const nowCol = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const todayY = nowCol.getUTCFullYear()
  const todayM = nowCol.getUTCMonth()
  const todayD = nowCol.getUTCDate()

  const [viewYear, setViewYear] = useState(todayY)
  const [viewMonth, setViewMonth] = useState(todayM)
  const [selDate, setSelDate] = useState<{ y: number; m: number; d: number } | null>(null)
  const nowHour = nowCol.getUTCHours()
  const nowMinute = nowCol.getUTCMinutes()
  const isToday = (s: typeof selDate) => s?.y === todayY && s?.m === todayM && s?.d === todayD

  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)

  const clampTime = (h: number, m: number, sel: typeof selDate) => {
    if (!isToday(sel)) return { h, m }
    if (h < nowHour) return { h: nowHour, m: nowMinute }
    if (h === nowHour && m < nowMinute) return { h, m: nowMinute }
    return { h, m }
  }

  const isPast = (y: number, m: number, d: number) =>
    y < todayY || (y === todayY && m < todayM) || (y === todayY && m === todayM && d < todayD)

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const DAY_LABELS = ["D","L","M","M","J","V","S"]
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isSel = (d: number) => selDate?.y === viewYear && selDate?.m === viewMonth && selDate?.d === d
  const isTod = (d: number) => todayY === viewYear && todayM === viewMonth && todayD === d
  const label = selDate ? `${selDate.d} de ${MONTHS[selDate.m]} de ${selDate.y}` : "Elige una fecha"

  return (
    <div className="relative flex flex-col items-center gap-4 z-10 w-full max-w-xs">
      <div className="text-center">
        <p className="text-[#f0edf2]/40 text-xs tracking-widest uppercase mb-1">Entrega del regalo físico</p>
        <p className="text-[#f0edf2] text-base font-medium">{label}</p>
        {selDate && (
          <p className="text-[#e53e3e] text-2xl font-bold mt-0.5">
            {String(hour).padStart(2,"0")}:{String(minute).padStart(2,"0")}
          </p>
        )}
      </div>

      {/* Calendar */}
      <div className="w-full rounded-2xl overflow-hidden" style={{ backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(229,62,62,0.2)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1)}else setViewMonth(m=>m-1) }}
            disabled={viewYear === todayY && viewMonth === todayM}
            className="text-[#f0edf2]/50 px-2 py-1 text-xl active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed">‹</button>
          <span className="text-[#f0edf2] text-sm font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={() => { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1)}else setViewMonth(m=>m+1) }}
            className="text-[#f0edf2]/50 px-2 py-1 text-xl active:scale-90 transition-all">›</button>
        </div>
        <div className="grid grid-cols-7 px-3 pb-1">
          {DAY_LABELS.map((d,i) => <div key={i} className="text-center text-[#f0edf2]/30 text-xs py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
          {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`}/>)}
          {Array.from({length: daysInMonth}).map((_,i) => {
            const d = i + 1
            const sel = isSel(d), tod = isTod(d), past = isPast(viewYear, viewMonth, d)
            return (
              <button key={d}
                onClick={() => {
                  if (past) return
                  const newSel = {y:viewYear,m:viewMonth,d}
                  setSelDate(newSel)
                  const { h, m } = clampTime(hour, minute, newSel)
                  setHour(h); setMinute(m)
                }}
                disabled={past}
                className="mx-auto flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all active:scale-90 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: sel ? "#e53e3e" : "transparent",
                  color: past ? "rgba(240,237,242,0.18)" : sel ? "#fff" : tod ? "#e53e3e" : "rgba(240,237,242,0.8)",
                  fontWeight: sel || tod ? "700" : "400",
                  border: tod && !sel ? "1px solid rgba(229,62,62,0.4)" : "none",
                  textDecoration: past ? "line-through" : "none",
                }}>
                {d}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time picker */}
      <div className="w-full rounded-2xl px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(229,62,62,0.2)" }}>
        <span className="text-[#f0edf2]/40 text-xs tracking-wide">Hora</span>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => { const {h,m} = clampTime((hour+1)%24, minute, selDate); setHour(h); setMinute(m) }} className="text-[#f0edf2]/40 text-xs px-2 py-0.5 active:scale-90 transition-all">▲</button>
            <span className="text-[#f0edf2] text-2xl font-bold w-10 text-center tabular-nums">{String(hour).padStart(2,"0")}</span>
            <button onClick={() => { const {h,m} = clampTime((hour+23)%24, minute, selDate); setHour(h); setMinute(m) }} className="text-[#f0edf2]/40 text-xs px-2 py-0.5 active:scale-90 transition-all">▼</button>
          </div>
          <span className="text-[#f0edf2]/40 text-2xl font-light pb-1">:</span>
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => { const {h,m} = clampTime(hour, (minute+5)%60, selDate); setHour(h); setMinute(m) }} className="text-[#f0edf2]/40 text-xs px-2 py-0.5 active:scale-90 transition-all">▲</button>
            <span className="text-[#f0edf2] text-2xl font-bold w-10 text-center tabular-nums">{String(minute).padStart(2,"0")}</span>
            <button onClick={() => { const {h,m} = clampTime(hour, (minute+55)%60, selDate); setHour(h); setMinute(m) }} className="text-[#f0edf2]/40 text-xs px-2 py-0.5 active:scale-90 transition-all">▼</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => {
            if (!selDate) return
            const fechaIso = `${selDate.y}-${String(selDate.m + 1).padStart(2,"0")}-${String(selDate.d).padStart(2,"0")}`
            const horaStr = `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`
            fetch(`${API_URL}/fecha-entrega?fecha=${encodeURIComponent(fechaIso)}&hora=${encodeURIComponent(horaStr)}`, { method: "POST" }).catch(() => {})
            onNext()
          }}
          disabled={!selDate}
          style={{ backgroundColor: selDate ? theme.button : "rgba(255,255,255,0.08)" }}
          className="w-72 py-3.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          Confirmar →
        </button>
        <button onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 active:scale-95 transition-all">
          ← Atrás
        </button>
      </div>
    </div>
  )
}

function Screen8({ onBack, onEditFecha, theme }: { onBack: () => void; onEditFecha: () => void; theme: Theme }) {
  const [fecha, setFecha] = useState<{ fecha: string; hora: string } | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/fecha-entrega`)
      .then(r => r.json())
      .then(d => { if (d.fecha) setFecha({ fecha: d.fecha, hora: d.hora }) })
      .catch(() => {})
  }, [])

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const labelFecha = (() => {
    if (!fecha) return null
    const [y, m, d] = fecha.fecha.split("-").map(Number)
    return `${d} de ${MONTHS[m - 1]} de ${y}`
  })()

  return (
    <div className="relative flex flex-col items-center gap-5 z-10">
      {fecha && (
        <div className="text-center">
          <p className="text-[#f0edf2]/40 text-xs tracking-widest uppercase mb-1">Entrega del regalo físico</p>
          <p className="text-[#f0edf2] text-base font-medium">{labelFecha}</p>
          <p className="text-[#e53e3e] text-2xl font-bold mt-0.5">{fecha.hora}</p>
        </div>
      )}
      <RouletteWheel />
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={onEditFecha}
          className="w-72 py-3 rounded-xl text-sm font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: "rgba(229,62,62,0.12)", border: "1px solid rgba(229,62,62,0.35)", color: "#e53e3e" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar entrega
        </button>
        <button onClick={onBack}
          className="w-72 py-3 rounded-xl text-[#f0edf2] text-sm font-medium border border-white/20 hover:border-white/40 active:scale-95 transition-all">
          ← Atrás
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const SCREEN_THEMES = ["white", "yellow", "pink", "blue", "coffee", "red", "red", "red"]

export default function Page() {
  const [screen, setScreen] = useState(0)
  const [fading, setFading] = useState(false)
  const [fechaConfirmada, setFechaConfirmada] = useState(false)
  const themeName = SCREEN_THEMES[screen] ?? "pink"
  const theme = THEMES[themeName]
  const colorsRef = useRef(theme.heartColors)

  useEffect(() => {
    // Load last screen silently (no new movement recorded)
    fetch(`${API_URL}/movimiento/ultimo`)
      .then(r => r.json())
      .then(d => {
        const s = typeof d.pantalla === "number" ? d.pantalla : 0
        colorsRef.current = THEMES[SCREEN_THEMES[s] ?? "white"].heartColors
        setScreen(s)
      })
      .catch(() => {})
    fetch(`${API_URL}/fecha-entrega`)
      .then(r => r.json())
      .then(d => { if (d.fecha) setFechaConfirmada(true) })
      .catch(() => {})
  }, [])

  const navigate = (to: number) => {
    if (to < 0 || to >= SCREEN_THEMES.length) return
    fetch(`${API_URL}/movimiento?pantalla=${to}`, { method: "POST" }).catch(() => {})
    setFading(true)
    setTimeout(() => {
      colorsRef.current = THEMES[SCREEN_THEMES[to]].heartColors
      setScreen(to)
      setFading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center overflow-hidden">
      <Background theme={theme} colorsRef={colorsRef} />
      <div
        className="transition-opacity duration-400"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {screen === 0 && <Screen1 onNext={() => navigate(1)} theme={theme} />}
        {screen === 1 && <Screen2 onNext={() => navigate(2)} onBack={() => navigate(0)} theme={theme} />}
        {screen === 2 && <Screen3 onNext={() => navigate(3)} onBack={() => navigate(1)} theme={theme} />}
        {screen === 3 && <Screen4 onNext={() => navigate(4)} onBack={() => navigate(2)} theme={theme} />}
        {screen === 4 && <Screen5 onNext={() => navigate(5)} onBack={() => navigate(3)} theme={theme} />}
        {screen === 5 && <Screen6 onNext={async () => {
          try {
            const d = await fetch(`${API_URL}/fecha-entrega`).then(r => r.json())
            if (d.fecha) { setFechaConfirmada(true); navigate(7) }
            else { setFechaConfirmada(false); navigate(6) }
          } catch { navigate(fechaConfirmada ? 7 : 6) }
        }} onBack={() => navigate(4)} theme={theme} />}
        {screen === 6 && <Screen7 onNext={() => { setFechaConfirmada(true); navigate(7) }} onBack={() => navigate(5)} theme={theme} />}
        {screen === 7 && <Screen8 onBack={() => navigate(fechaConfirmada ? 5 : 6)} onEditFecha={() => navigate(6)} theme={theme} />}
      </div>
    </div>
  )
}
