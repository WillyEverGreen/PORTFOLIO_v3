import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useMemo, useRef } from 'react'

/* WhatsApp Web's own palette, so the scene reads as the real thing */
const WA = { green: '#00a884', badge: '#25d366', panel: '#f0f2f5', line: '#e9edef', text: '#111b21', sub: '#667781', out: '#d9fdd3', wall: '#efeae2' }

/** a decorative QR-like grid: three finder squares and a seeded scatter (not scannable) */
function FakeQR({ seed = 11 }: { seed?: number }) {
  const cells = useMemo(() => {
    let s = seed
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
    const out: [number, number][] = []
    for (let y = 0; y < 29; y++)
      for (let x = 0; x < 29; x++) {
        const finder = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20)
        if (!finder && rnd() > 0.5) out.push([x, y])
      }
    return out
  }, [seed])
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill={WA.text} />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill={WA.text} />
    </g>
  )
  return (
    <svg viewBox="0 0 29 29" className="block size-full" shapeRendering="crispEdges">
      <rect width="29" height="29" fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" fill={WA.text} />)}
      {finder(0, 0)}
      {finder(22, 0)}
      {finder(0, 22)}
    </svg>
  )
}

const CHATS = [
  { who: 'Mom', msg: 'Photo: Aadhaar_front.jpg', time: '4:41 PM', unread: 2, color: '#f4a6a0' },
  { who: 'DSA Lab Batch B', msg: 'Sai: sending the lab 4 code now', time: '4:38 PM', unread: 0, color: '#a5d6a7' },
  { who: 'Riya', msg: 'the portal password is in my notes, use that', time: '4:20 PM', unread: 1, color: '#b39ddb' },
  { who: 'Placement Cell', msg: 'Interview link + your roll number', time: '3:55 PM', unread: 3, color: '#90caf9' },
  { who: 'Bank alerts', msg: 'OTP for ₹2,400 is 48•••3. Do not share.', time: '3:12 PM', unread: 0, color: '#ffcc80' },
]

/**
 * The pain point, as Mango saw it, in three beats on a loop: the library PC wants the
 * WhatsApp Web QR again, Sai's phone battery drains while he fights it, and when he
 * forgets to log out the next student at the same PC can read everything.
 */
export default function LabPC() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const q = gsap.utils.selector(root)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const set = (sel: string, text: string) => q(sel).forEach((el) => (el.textContent = text))
    const battery = { v: 4 }
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
    tl.set(q('[data-expired]'), { autoAlpha: 0 })
      .set(q('[data-qr]'), { filter: 'blur(0px)', opacity: 1 })
      .fromTo(q('[data-scan]'), { yPercent: -100 }, { yPercent: 100, duration: 1.6, ease: 'none', repeat: 1 })
      .to(q('[data-qr]'), { filter: 'blur(3px)', opacity: 0.35, duration: 0.4 })
      .to(q('[data-expired]'), { autoAlpha: 1, duration: 0.3 }, '<')
      .to(q('[data-reload]'), { rotate: 360, duration: 0.8, ease: 'power2.inOut' }, '+=0.9')
      .to(battery, {
        v: '-=1',
        duration: 0.6,
        onUpdate: () => {
          const v = Math.max(1, Math.round(battery.v))
          set('[data-batt]', `${v}%`)
          q('[data-batt-bar]').forEach((el) => ((el as HTMLElement).style.width = `${v * 6}%`))
        },
        onComplete: () => { if (battery.v <= 1) battery.v = 4 },
      }, '<')
      .to(q('[data-toast]'), { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' }, '<')
      .to(q('[data-toast]'), { y: 16, autoAlpha: 0, duration: 0.3 }, '+=1.4')
      // Sai leaves in a hurry, still logged in, and someone else sits down
      .call(() => { set('[data-clock]', '5:10 PM'); set('[data-status]', 'Logged in') })
      .to(q('[data-leak]'), { autoAlpha: 1, duration: 0.5 }, '+=0.2')
      .fromTo(q('[data-leak-row]'), { x: -12, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.1, duration: 0.3 }, '<0.2')
      .fromTo(q('[data-leak-msg]'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.2, duration: 0.3 }, '<0.3')
      .fromTo(q('[data-leak-banner]'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, '+=0.3')
      .to(q('[data-leak]'), { autoAlpha: 0, duration: 0.4 }, '+=2.8')
      .call(() => { set('[data-clock]', '4:52 PM'); set('[data-status]', 'Not logged in') })
  }, { scope: root })

  return (
    <div ref={root} className="flex h-full flex-col">
      {/* monitor */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border-[1.5px] border-ink bg-paper2 shadow-hard-lg">
        <div className="flex items-center gap-2 border-b-[1.5px] border-ink px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] text-muted">
          <span className="size-2.5 shrink-0 rounded-full border-[1.5px] border-ink" />
          <span className="size-2.5 shrink-0 rounded-full border-[1.5px] border-ink" />
          <span className="size-2.5 shrink-0 rounded-full border-[1.5px] border-ink" />
          <span className="ml-2 truncate">LAB PC 14 &middot; LIBRARY</span>
          <span data-clock className="ml-auto shrink-0">4:52 PM</span>
        </div>
        <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 font-mono text-[12px] text-muted">
          <span className="truncate rounded-md border border-line px-2 py-0.5">web.whatsapp.com</span>
          <span data-status className="hidden shrink-0 sm:inline">Not logged in</span>
        </div>

        <div className="relative flex min-h-[360px] flex-1 flex-col sm:min-h-[400px]" style={{ background: '#dddbd1', color: WA.text }}>
          {/* beat 1: the classic WhatsApp Web log in screen */}
          <div className="absolute inset-x-0 top-0 h-[46%]" style={{ background: '#00bfa5' }} aria-hidden="true" />
          <p className="relative flex items-center gap-2.5 px-5 pt-4 text-[13px] font-bold tracking-[0.04em] text-white sm:px-8">
            <span className="grid size-7 place-items-center rounded-full border-2 border-white"><svg viewBox="0 0 24 24" className="size-[55%] fill-current" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg></span>
            WHATSAPP WEB
          </p>
          <div className="relative mx-3 mt-4 mb-4 flex-1 rounded-[3px] bg-white p-5 shadow-[0_17px_50px_rgba(11,20,26,0.19)] sm:mx-8 sm:p-8">
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[clamp(19px,2vw,26px)] font-light" style={{ color: '#41525d' }}>To use WhatsApp on your computer:</p>
                <ol className="mt-5 space-y-3.5 text-[14px] sm:text-[15px]" style={{ color: '#3b4a54' }}>
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Tap <b>Menu</b> or <b>Settings</b> and select <b>WhatsApp Web</b></li>
                  <li>3. Point your phone to this screen to capture the code</li>
                </ol>
                <p className="mt-6 text-[14px]" style={{ color: '#008069' }}>Need help to get started?</p>
              </div>
              <div className="mx-auto w-[min(200px,56vw)]">
                <div className="relative aspect-square">
                  <div data-qr className="size-full"><FakeQR /></div>
                  {/* a plain phone glyph where the real QR has its logo */}
                  <span className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full border-[3px] border-white text-white" style={{ background: WA.text }} aria-hidden="true"><svg viewBox="0 0 24 24" className="size-[55%] fill-current" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg></span>
                  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div data-scan className="h-full" style={{ background: `linear-gradient(transparent 60%, ${WA.green}55)` }} />
                  </div>
                  <div data-expired className="invisible absolute inset-0 grid place-items-center bg-white/80">
                    <div className="grid justify-items-center gap-2 text-center">
                      <span data-reload className="grid size-16 place-items-center rounded-full text-3xl text-white" style={{ background: '#00bfa5' }}>↻</span>
                      <span className="text-[13px]" style={{ color: '#3b4a54' }}>Click to reload QR code</span>
                    </div>
                  </div>
                </div>
                <label className="mt-4 flex items-center justify-center gap-2 text-[13px]" style={{ color: WA.sub }}>
                  <span className="grid size-4 place-items-center rounded-[2px] text-[10px] text-white" style={{ background: '#8696a0' }}>✓</span>
                  Keep me signed in
                </label>
              </div>
            </div>
          </div>

          {/* beat 3: still logged in when the next student sits down */}
          <div data-leak className="invisible absolute inset-0 flex bg-white">
            <div className="flex w-full flex-col border-r sm:w-[44%]" style={{ borderColor: WA.line }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: WA.panel }}>
                <span className="grid size-8 place-items-center rounded-full text-[12px] font-bold" style={{ background: '#dfe5e7' }}>S</span>
                <span className="text-[12px]" style={{ color: WA.sub }}>Sai &middot; logged in</span>
              </div>
              <div className="px-3 py-2"><div className="rounded-lg px-3 py-1.5 text-[12px]" style={{ background: WA.panel, color: WA.sub }}>Search or start a new chat</div></div>
              <div className="flex gap-1.5 px-3 pb-2 text-[11px]">
                {['All', 'Unread', 'Groups'].map((c, i) => (
                  <span key={c} className="rounded-full px-2.5 py-1" style={i === 0 ? { background: '#d9fdd3', color: '#008069' } : { background: WA.panel, color: WA.sub }}>{c}</span>
                ))}
              </div>
              {CHATS.map((c, i) => (
                <div data-leak-row key={c.who} className="flex items-center gap-3 px-3 py-2" style={{ background: i === 0 ? WA.panel : undefined }}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white" style={{ background: c.color }}>{c.who[0]}</span>
                  <div className="min-w-0 flex-1 border-b pb-2" style={{ borderColor: WA.line }}>
                    <div className="flex items-baseline justify-between gap-2"><p className="truncate text-[14px]">{c.who}</p><span className="shrink-0 text-[11px]" style={{ color: c.unread ? WA.badge : WA.sub }}>{c.time}</span></div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px]" style={{ color: WA.sub }}>{c.msg}</p>
                      {c.unread > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: WA.badge }}>{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* the open chat, only where there is room */}
            <div className="hidden flex-1 flex-col sm:flex" style={{ background: WA.wall }}>
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: WA.panel }}>
                <span className="grid size-8 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: CHATS[0].color }}>M</span>
                <span className="text-[14px]">Mom</span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-2 p-4 pb-24 text-[13px]">
                <p data-leak-msg className="max-w-[80%] self-start rounded-lg rounded-tl-none bg-white px-3 py-1.5 shadow-sm">Did you reach college? Eat something first</p>
                <p data-leak-msg className="max-w-[80%] self-end rounded-lg rounded-tr-none px-3 py-1.5 shadow-sm" style={{ background: WA.out }}>Yes ma, in the library</p>
                <div data-leak-msg className="max-w-[80%] self-start rounded-lg rounded-tl-none bg-white p-1.5 shadow-sm">
                  <div className="grid h-16 w-44 place-items-center rounded bg-[#dfe5e7] text-[11px]" style={{ color: WA.sub }}>Aadhaar_front.jpg</div>
                  <p className="px-1.5 pt-1">For the scholarship form, send to the office</p>
                </div>
              </div>
            </div>
            <div data-leak-banner className="absolute inset-x-3 bottom-3 rounded-xl border-[1.5px] border-ink bg-accent px-4 py-3 text-[14px] font-bold text-accent-ink shadow-hard sm:inset-x-6">
              5:10 PM. Sai forgot to log out, and the next student at PC 14 can read all of it.
            </div>
          </div>
        </div>

        {/* beat 2: phone battery */}
        <div data-toast className="invisible absolute right-4 bottom-4 flex translate-y-4 items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-paper px-4 py-3 shadow-hard">
          <span className="relative h-4 w-8 rounded-[4px] border-[1.5px] border-ink after:absolute after:top-1/2 after:-right-1 after:h-1.5 after:w-[3px] after:-translate-y-1/2 after:rounded-r-sm after:bg-ink">
            <span data-batt-bar className="absolute inset-y-0.5 left-0.5 rounded-[2px] bg-accent" style={{ width: '24%' }} />
          </span>
          <span className="text-sm"><b>Sai's phone</b> &middot; <span data-batt>4%</span></span>
        </div>
      </div>
      {/* stand */}
      <div className="mx-auto h-8 w-28 border-x-[1.5px] border-b-[1.5px] border-ink bg-paper2 [clip-path:polygon(22%_0,78%_0,100%_100%,0_100%)]" aria-hidden="true" />
    </div>
  )
}
