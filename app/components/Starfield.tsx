'use client'

import { useEffect, useRef } from 'react'

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    function resize() {
      w = canvas!.width = window.innerWidth
      h = canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Twinkling stars — scattered across viewport
    interface Star {
      x: number; y: number; r: number; alpha: number;
      speed: number; dir: number; gold: boolean;
    }
    const stars: Star[] = []
    for (let i = 0; i < 120; i++) {
      const isGold = Math.random() > 0.6
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.8 + 0.2,
        alpha: Math.random(),
        speed: Math.random() * 0.015 + 0.003,
        dir: Math.random() > 0.5 ? 1 : -1,
        gold: isGold
      })
    }

    // Shooting stars — spawn from top-left quadrant, streak at ~45 degrees
    interface Shooter {
      x: number; y: number; len: number; speed: number;
      angle: number; alpha: number; life: number; maxLife: number; width: number;
    }
    const shooters: Shooter[] = []
    function spawnShooter() {
      const fromTop = Math.random() > 0.3
      const startX = fromTop ? (Math.random() * w * 0.7) : -10
      const startY = fromTop ? -10 : (Math.random() * h * 0.4)
      const angle = Math.PI / 4 + (Math.random() * 0.52 - 0.26)
      shooters.push({
        x: startX, y: startY,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 8 + 5,
        angle: angle,
        alpha: 1, life: 0,
        maxLife: Math.random() * 60 + 40,
        width: Math.random() * 1.5 + 0.5
      })
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      // Twinkling stars
      for (const s of stars) {
        s.alpha += s.speed * s.dir
        if (s.alpha >= 1 || s.alpha <= 0.05) s.dir *= -1
        s.alpha = Math.max(0.05, Math.min(1, s.alpha))
        if (s.gold) {
          ctx!.fillStyle = `rgba(201,165,78,${s.alpha * 0.7})`
        } else {
          ctx!.fillStyle = `rgba(216,224,237,${s.alpha * 0.35})`
        }
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()

        // Sparkle cross on bright gold stars
        if (s.gold && s.alpha > 0.8 && s.r > 1.2) {
          const sparkle = (s.alpha - 0.8) * 5
          ctx!.strokeStyle = `rgba(201,165,78,${sparkle * 0.4})`
          ctx!.lineWidth = 0.3
          const arm = s.r * 4
          ctx!.beginPath()
          ctx!.moveTo(s.x - arm, s.y); ctx!.lineTo(s.x + arm, s.y)
          ctx!.moveTo(s.x, s.y - arm); ctx!.lineTo(s.x, s.y + arm)
          const d = arm * 0.6
          ctx!.moveTo(s.x - d, s.y - d); ctx!.lineTo(s.x + d, s.y + d)
          ctx!.moveTo(s.x + d, s.y - d); ctx!.lineTo(s.x - d, s.y + d)
          ctx!.stroke()
        }
      }

      // Shooting stars
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i]
        sh.life++
        const progress = sh.life / sh.maxLife
        if (progress < 0.1) sh.alpha = progress * 10
        else if (progress < 0.6) sh.alpha = 1
        else sh.alpha = 1 - (progress - 0.6) / 0.4

        sh.x += Math.cos(sh.angle) * sh.speed
        sh.y += Math.sin(sh.angle) * sh.speed

        // Trail gradient
        const tailX = sh.x - Math.cos(sh.angle) * sh.len
        const tailY = sh.y - Math.sin(sh.angle) * sh.len
        const grad = ctx!.createLinearGradient(sh.x, sh.y, tailX, tailY)
        grad.addColorStop(0, `rgba(240,243,248,${sh.alpha * 0.9})`)
        grad.addColorStop(0.08, `rgba(201,165,78,${sh.alpha * 0.7})`)
        grad.addColorStop(0.4, `rgba(201,165,78,${sh.alpha * 0.25})`)
        grad.addColorStop(1, 'rgba(201,165,78,0)')

        ctx!.strokeStyle = grad
        ctx!.lineWidth = sh.width
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(sh.x, sh.y)
        ctx!.lineTo(tailX, tailY)
        ctx!.stroke()

        // Glowing head
        const headGlow = ctx!.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 4)
        headGlow.addColorStop(0, `rgba(255,255,255,${sh.alpha * 0.8})`)
        headGlow.addColorStop(0.5, `rgba(201,165,78,${sh.alpha * 0.3})`)
        headGlow.addColorStop(1, 'rgba(201,165,78,0)')
        ctx!.fillStyle = headGlow
        ctx!.beginPath()
        ctx!.arc(sh.x, sh.y, 4, 0, Math.PI * 2)
        ctx!.fill()

        if (sh.life >= sh.maxLife || sh.x > w + 50 || sh.y > h + 50) shooters.splice(i, 1)
      }

      // Spawn rate: ~1 every 2 seconds
      if (Math.random() < 0.055) spawnShooter()

      requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50, opacity: 0.8, width: '100vw', height: '100vh' }}
    />
  )
}
