import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import AnimatedContent from './components/AnimatedContent'
import BlurText from './components/BlurText'
import ClickSpark from './components/ClickSpark'
import CountUp from './components/CountUp'
import DecryptedText from './components/DecryptedText'
import LogoLoop from './components/LogoLoop'
import ScrollReveal from './components/ScrollReveal'
import ScrollStack, { ScrollStackItem } from './components/ScrollStack'
import SplitText from './components/SplitText'
import { BorderBeam } from './components/ui/border-beam'
import { Iphone } from './components/ui/iphone'
import { AnimatedSpan, Terminal, TypingAnimation } from './components/ui/terminal'
import {
  BatteryLow, Boxes, Braces, Cable, ClipboardPaste, CodeXml, Database, EyeOff, FileArchive, FolderUp, GitCommitHorizontal,
  HardDriveUpload, KeyRound, Link2, Lock, QrCode, ShieldAlert, Sigma, Smartphone, UserX, type LucideIcon,
} from 'lucide-react'
import { siCloudflare, siCloudflareworkers, siHono, siReact, siTypescript, siVite } from 'simple-icons'
import LabPC from './story/LabPC'
import Mango from './story/Mango'
import { Ask, Exchange, Frame, Reply, shot } from './story/chat'

gsap.registerPlugin(ScrollTrigger)

const LIVE = 'https://clip.foo.ng'
const CODE = 'https://github.com/WillyEverGreen/clip'

/* the real ciphertext the local server stored for the encrypted viva notes */
const CIPHER = '+R60qhnMIiLmpzDv5LRGgU5qTFvQyOaGniPPZfGnC02mlI/26Dd9YsrvvZek9Ds+H7gZrXoUdPBHn/ps9vk2A4RA4R1oOjTf637gosY9sTAIvwiP5HKqi5QZQcK+VANi1+r9OoG8oGLDdHblv21RbPU5HmWA67U8gxQnVvZ+vW3Zu9tuFcl'
const NOTES = ['OS Lab 6 viva notes', '- FCFS has the convoy effect', '- SJF gives the minimum average waiting time', '- Round robin quantum = 4 ms', '- Starvation in priority scheduling, fix with ageing']

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
)

function Btn({ href, children, solid = false }: { href: string; children: React.ReactNode; solid?: boolean }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener"
      className={`group inline-flex h-12 items-center gap-2.5 rounded-full border-[1.5px] border-ink px-6 font-medium transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-0 active:shadow-none ${solid ? 'bg-ink text-paper' : 'bg-paper2'}`}
    >
      {children} <Arrow />
    </a>
  )
}

/* ---------- top of the page ---------- */

/** the portfolio's theme switch: the new theme grows out of the toggle as a circle (View Transitions) */
function ThemeToggle() {
  const btn = useRef<HTMLButtonElement>(null)
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')
  const flip = () => {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    const apply = () => {
      root.setAttribute('data-theme', next)
      try { localStorage.setItem('theme', next) } catch { /* storage can be blocked */ }
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#151412' : '#f3ede2')
      setDark(next === 'dark')
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce || !btn.current) return apply()
    const r = btn.current.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = document.startViewTransition(apply)
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.65, 0, .25, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    }).catch(() => {})
  }
  return (
    <button ref={btn} type="button" onClick={flip} className="theme-btn" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <svg className="theme-btn__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></svg>
      <svg className="theme-btn__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5 8.6 8.6 0 1 0 20.5 14.2z" /></svg>
    </button>
  )
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] py-3.5">
        <a href="/index.html" className="font-serif text-[26px] leading-none">Sai Balkawade</a>
        <nav className="hidden items-center gap-8 text-[15px] md:flex" aria-label="Main">
          <a href="/index.html" className="hover:text-accent">Portfolio</a>
          <a href="/projects.html" className="hover:text-accent">More projects</a>
          <a href="/index.html#contact" className="hover:text-accent">Contact</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <a href="/projects.html" className="rounded-full border-[1.5px] border-ink px-4 py-2 text-[15px] transition-colors hover:bg-ink hover:text-paper">All projects</a>
        </div>
      </div>
      <Progress />
    </header>
  )
}

function Progress() {
  const bar = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    gsap.to(bar.current, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } })
  })
  return <div ref={bar} className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-accent" aria-hidden="true" />
}

function Hero() {
  const reduce = useReducedMotion()
  return (
    <section className="mx-auto grid max-w-[1400px] grid-cols-1 items-stretch gap-[clamp(32px,5vw,72px)] px-[clamp(16px,4vw,40px)] pt-[clamp(110px,14vh,150px)] pb-16 lg:grid-cols-[1fr_1.15fr]">
      <div className="flex flex-col justify-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-bold tracking-[0.14em] text-accent uppercase">
          Case study 01 &middot; As told by Mango, Sai's cat
        </motion.p>
        <SplitText text="Clip." tag="h1" className="mt-3 font-serif text-[clamp(110px,15vw,230px)] leading-[0.82] tracking-[-0.02em]" splitType="chars" delay={70} duration={0.9} from={{ opacity: 0, y: 80 }} to={{ opacity: 1, y: 0 }} textAlign="left" trigger="load" />
        <BlurText text="One lab assignment, one shared computer, and the ten seconds in between." animateBy="words" delay={60} trigger="load" className="mt-4 max-w-[520px] font-serif text-[clamp(26px,2.6vw,38px)] leading-[1.1] text-muted italic" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.9, duration: 0.6 }}>
          <dl className="mt-8 grid max-w-[560px] grid-cols-3 gap-4 border-t-[1.5px] border-ink pt-5 text-[14px]">
            <div><dt className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Role</dt><dd className="mt-1">Solo build</dd></div>
            <div><dt className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Built</dt><dd className="mt-1">August 2026</dd></div>
            <div><dt className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Runs on</dt><dd className="mt-1">Cloudflare edge</dd></div>
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn href={LIVE} solid>Open Clip</Btn>
            <Btn href={CODE}>Read the code</Btn>
          </div>
        </motion.div>
      </div>

      {/* the product, straight on: the app in a browser and the same clip on a phone */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: reduce ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }} className="relative flex items-center pb-10 lg:pr-[12%]">
        <div className="relative w-full overflow-hidden rounded-2xl border-[1.5px] border-ink bg-[#0b0b0b] shadow-hard-lg">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <i className="size-2.5 rounded-full bg-white/20" /><i className="size-2.5 rounded-full bg-white/20" /><i className="size-2.5 rounded-full bg-white/20" />
            <span className="ml-3 flex-1 truncate rounded-md bg-white/8 px-3 py-1 text-center font-mono text-[11px] text-white/60">clip.foo.ng/dsa-lab-4</span>
          </div>
          <img src={shot('dsa-lab-4-clip')} alt="A DSA lab assignment shared on Clip, with the C++ code syntax highlighted" className="block aspect-[16/10] w-full object-cover object-top" />
          <BorderBeam size={120} duration={7} colorFrom="#ff7a4d" colorTo="#f0d98a" />
        </div>
        <div className="absolute right-0 bottom-0 w-[24%] min-w-[110px]">
          <Iphone src={shot('phone-dsa-lab-4')} />
        </div>
      </motion.div>
    </section>
  )
}

/* ---------- the conversation ---------- */

function ChatHeader() {
  return (
    <div className="border-y border-line bg-paper2">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-[clamp(16px,4vw,40px)] py-3">
        <span className="relative grid size-10 place-items-center rounded-full border-[1.5px] border-ink bg-peach">
          <Mango className="size-9 translate-y-0.5" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-paper2 bg-green" />
        </span>
        <div className="leading-tight">
          <p className="font-bold">Mango, Sai's cat</p>
          <p className="text-[13px] text-muted">online &middot; watched him build all of it</p>
        </div>
        <span className="ml-auto hidden text-[13px] text-muted sm:block">Scroll down to read the chat</span>
      </div>
    </div>
  )
}

const PAINS = [
  { icon: QrCode, k: 'QR, again', t: 'Every lab PC, every library visit: open WhatsApp Web, find the phone, scan the QR before it expires. Every single time.' },
  { icon: BatteryLow, k: 'Battery drain', t: 'His phone has to be out and awake for all of it, and it is always on 4% when he needs it most.' },
  { icon: ShieldAlert, k: 'Privacy leak', t: 'Forget to log out once and the next student at that PC can read his chats, OTPs and Aadhaar photos.' },
]

function Why() {
  return (
    <Exchange id="why">
      <Ask>Why did Sai even build this?</Ask>
      <Reply lead={<>Because I heard about this every single week. He would come home from the college lab grumbling about WhatsApp Web all over again.</>}>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.15fr_1fr]">
          <LabPC />
          <div className="flex h-full flex-col gap-4">
            {PAINS.map((p, i) => (
              <AnimatedContent key={p.k} distance={40} direction="horizontal" delay={i * 0.12} className="flex-1">
                <div className="flex h-full gap-4 rounded-2xl border-[1.5px] border-ink bg-paper2 p-5 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard">
                  <span className="font-serif text-4xl leading-none text-accent">0{i + 1}</span>
                  <div>
                    <p className="flex items-center gap-2 text-lg font-bold"><span className="grid size-8 place-items-center rounded-lg bg-peach text-accent"><p.icon className="size-[18px]" strokeWidth={2.2} /></span>{p.k}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted">{p.t}</p>
                  </div>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
        <div className="mt-14 max-w-[900px]">
          <ScrollReveal baseOpacity={0.12} enableBlur blurStrength={4} baseRotation={0} textClassName="font-serif text-[clamp(30px,3.6vw,52px)] leading-[1.1] [text-wrap:pretty]">
            So he built the shortest path from one screen to another. Paste or drop, get a link, walk away. Nothing to log in to, so nothing to forget to log out of.
          </ScrollReveal>
        </div>
      </Reply>
    </Exchange>
  )
}

const STEPS = [
  { icon: ClipboardPaste, n: '01', t: 'Paste the code', d: 'Open clip.foo.ng on the lab PC, paste the assignment, pick a name like dsa-lab-4 and a timer. No account, no email.', img: 'paste-lab-code', alt: 'Clip with a C++ lab assignment pasted in, a custom URL dsa-lab-4 and a six hour timer' },
  { icon: FolderUp, n: '02', t: 'Drop the files too', d: 'The write-up PDF, the zipped project, the output graph. Drag them in or press Ctrl+V on a screenshot. Up to 25 MB.', img: 'drop-lab-files', alt: 'Clip with three lab files selected: a PDF write-up, a zip and a PNG chart' },
  { icon: Link2, n: '03', t: 'One link holds it all', d: 'Code highlighted, every file with its own preview and download, and a timer until it deletes itself.', img: 'lab-week-7-files', alt: 'The lab-week-7 clip showing three attached files with preview and download buttons' },
  { icon: Smartphone, n: '04', t: 'Open it anywhere', d: 'Type the link on your phone or laptop, or scan the QR. Your classmate needs nothing installed either.', img: 'viva-notes-opened', alt: 'The encrypted viva notes, decrypted and readable in the browser' },
]

function HowItMoves() {
  // every step card takes the height of the tallest one, so the stack stays even at any width.
  // a callback ref, because the cards only mount once Mango's reply has finished "typing"
  const observer = useRef<ResizeObserver | null>(null)
  const wrap = (root: HTMLDivElement | null) => {
    observer.current?.disconnect()
    if (!root) return
    const even = () => {
      const cards = [...root.querySelectorAll<HTMLElement>('[data-step-card]')]
      cards.forEach((c) => (c.style.minHeight = ''))
      const tallest = Math.max(...cards.map((c) => c.offsetHeight))
      cards.forEach((c) => (c.style.minHeight = `${tallest}px`))
    }
    even()
    observer.current = new ResizeObserver(() => requestAnimationFrame(even))
    observer.current.observe(root)
  }
  useEffect(() => () => observer.current?.disconnect(), [])
  return (
    <Exchange id="how">
      <Ask>Okay, show me. How does a lab assignment get across?</Ask>
      <Reply lead={<>Here is a real one: Sai's DSA Lab 4, from the lab PC to his phone. Four steps, about ten seconds. Faster than I finish my dinner.</>}>
        <div ref={wrap}>
        <ScrollStack useWindowScroll smoothScroll={false} itemDistance={60} itemStackDistance={22} stackPosition="22%" baseScale={0.88} itemScale={0.03} dimAmount={0.12}>
          {STEPS.map((s) => (
            <ScrollStackItem key={s.n} itemClassName="!h-auto !rounded-3xl !border-[1.5px] !border-ink !bg-paper2 !p-[clamp(18px,3vw,32px)] !text-ink shadow-hard">
              <div data-step-card className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-6xl leading-none text-accent">{s.n}</span>
                    <span className="grid size-12 place-items-center rounded-2xl border-[1.5px] border-ink bg-highlight text-ink"><s.icon className="size-6" strokeWidth={2} /></span>
                  </div>
                  <p className="mt-4 font-serif text-[clamp(30px,3vw,42px)] leading-tight">{s.t}</p>
                  <p className="mt-3 text-[16px] leading-relaxed text-muted">{s.d}</p>
                </div>
                <Frame src={shot(s.img)} alt={s.alt} fixed />
              </div>
            </ScrollStackItem>
          ))}
        </ScrollStack>
        </div>
      </Reply>
    </Exchange>
  )
}

function Unlock({ unlocked, onUnlock, onLock }: { unlocked: boolean; onUnlock: () => void; onLock: () => void }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(0)
  if (unlocked) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-green px-4 py-2.5 font-medium text-green">Decrypted on this device</span>
        <button type="button" onClick={() => { setValue(''); onLock() }} className="rounded-full border-[1.5px] border-ink px-5 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-hard">Lock it again</button>
      </div>
    )
  }
  return (
    <form
      className="mt-4 flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim() === 'banana42') onUnlock()
        else setWrong((w) => w + 1)
      }}
    >
      <motion.input
        key={wrong}
        animate={wrong ? { x: [0, -8, 8, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter password…"
        aria-label="Password for the viva notes clip"
        className={`h-12 w-[min(260px,100%)] rounded-full border-[1.5px] bg-paper2 px-5 font-mono outline-none focus:border-accent ${wrong ? 'border-accent' : 'border-ink'}`}
      />
      <button type="submit" className="h-12 rounded-full border-[1.5px] border-ink bg-ink px-6 text-paper transition-all hover:-translate-y-0.5 hover:shadow-hard">Unlock</button>
      <p className="w-full text-[14px] text-muted">{wrong ? 'Nope. Psst, Sai uses banana42. Do not tell him I told you.' : 'Try it. The password is banana42.'}</p>
    </form>
  )
}

function Private() {
  const [locked, setLocked] = useState(true)
  return (
    <Exchange id="private">
      <Ask>But a shared PC is the problem. Can't the server or the next person read it?</Ask>
      <Reply lead={<>Not if he locks it. Tick Encrypt and the browser scrambles the text before it leaves the computer. The server only ever stores noise. Even I can't read it, and I sit on his keyboard a lot.</>}>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          <div className="flex h-full flex-col gap-4">
            <div className="flex-1 rounded-2xl border-[1.5px] border-ink bg-[#0b0b0b] p-5 font-mono text-[13px] leading-[1.8] text-[#ededed] shadow-hard">
              <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">What Sai typed</p>
              {NOTES.map((l, i) => (
                <div key={l}>
                  <DecryptedText text={l} animateOn="view" sequential revealDirection="start" speed={18 + i * 4} encryptedClassName="text-[#ff7a4d]" />
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-2xl border-[1.5px] border-dashed border-ink bg-paper2 p-5">
              <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">What the server actually stores</p>
              <p className="font-mono text-[12.5px] leading-relaxed break-all text-muted">{'{ "encrypted": true, "iv": "wki/CqgSgHahzR0/", "salt": "57g4teAIy0qHLgV5eBJ5rg==", "ciphertext": "'}<span className="text-accent">{CIPHER}…</span>{'" }'}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: KeyRound, to: 250000, label: 'PBKDF2 rounds' },
                { icon: Lock, to: 256, label: 'bit AES-GCM key' },
                { icon: EyeOff, to: 0, label: 'passwords stored' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border-[1.5px] border-ink bg-paper2 p-4">
                  <s.icon className="mb-2 size-5 text-accent" strokeWidth={2.2} />
                  <p className="font-serif text-[clamp(26px,2.6vw,38px)] leading-none"><CountUp to={s.to} duration={1.6} separator="," /></p>
                  <p className="mt-1.5 text-[13px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-full flex-col">
            <div className="relative flex-1">
              <motion.div key={locked ? 'l' : 'u'} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="h-full">
                <Frame src={shot(locked ? 'viva-notes-locked' : 'viva-notes-unlocked')} alt={locked ? 'The viva notes clip asking for its password' : 'The viva notes decrypted after entering the password'} />
              </motion.div>
            </div>
            <Unlock unlocked={!locked} onUnlock={() => setLocked(false)} onLock={() => setLocked(true)} />
          </div>
        </div>
      </Reply>
    </Exchange>
  )
}

function Together() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const q = gsap.utils.selector(root)
    gsap.from(q('[data-side="a"]'), { xPercent: -12, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%' } })
    gsap.from(q('[data-side="b"]'), { xPercent: 12, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%' } })
  }, { scope: root })
  return (
    <Exchange id="live">
      <Ask>It's a group project. Can his lab partners type in it too?</Ask>
      <Reply lead={<>That's the Live Pad. Everyone on the link types into the same notes at once, each with a cute cursor name, and nobody's edit gets lost. One of the 64 names is Mango. Sai says it's a coincidence. It is not.</>}>
        <div ref={root} className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          <div data-side="a" className="h-full"><Frame src={shot('livepad-pepper')} alt="Live Pad on the first laptop, with Pretzel's cursor visible" caption="Laptop one, signed in as Pepper" /></div>
          <div data-side="b" className="h-full"><Frame src={shot('livepad-pretzel')} alt="The same Live Pad on the second laptop, with Pepper's cursor visible" caption="Laptop two, signed in as Pretzel" /></div>
        </div>
        <p className="mt-6 max-w-[760px] text-[16px] leading-relaxed text-muted">Each keystroke goes over a WebSocket to a Cloudflare Durable Object, and operational transform merges edits that land at the same moment. Phones join by scanning a QR, and the room tidies itself away after 24 hours.</p>
      </Reply>
    </Exchange>
  )
}

function Terminalish() {
  return (
    <Exchange id="cli">
      <Ask>What if he's on a lab server with no browser?</Ask>
      <Reply lead={<>Every clip has a plain URL for curl. This is the real output. I don't understand it, but Sai gets very excited about it.</>}>
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <Terminal className="!h-full !max-w-none !rounded-2xl !border-[1.5px] !border-ink !bg-[#0b0b0b] !text-[#ededed] shadow-hard [&_code>*]:break-all [&_code>*]:whitespace-pre-wrap">
            <TypingAnimation duration={22}>$ curl -sL https://clip.foo.ng/r/dsa-lab-4</TypingAnimation>
            <AnimatedSpan className="text-[#a3a3a3]">## DSA Lab 4: reverse a linked list</AnimatedSpan>
            <AnimatedSpan className="text-[#a3a3a3]">Iterative and recursive, both tested.</AnimatedSpan>
            <AnimatedSpan className="text-[#a3a3a3]">#include &lt;iostream&gt;</AnimatedSpan>
            <AnimatedSpan className="text-[#a3a3a3]">Node* reverseIterative(Node* head) {'{'} …</AnimatedSpan>
            <TypingAnimation duration={22}>$ curl -fLO https://clip.foo.ng/z/lab-week-7.zip</TypingAnimation>
            <AnimatedSpan className="text-[#34d399]">✓ lab-week-7.zip saved: write-up, project zip and graph</AnimatedSpan>
          </Terminal>
          <Frame src={shot('terminal-commands')} alt="Clip's Terminal CLI panel listing curl commands for every attached file" caption="The app writes the commands for you" />
        </div>
      </Reply>
    </Exchange>
  )
}

/* a bento that fills its grid exactly, so every row and the bottom edge line up.
   phones: 2 columns, desktop: 4 columns by 4 rows of equal height */
const GALLERY: { id: string; title: string; cls: string; pos?: string }[] = [
  { id: 'dsa-lab-4-clip', title: 'DSA Lab 4, rendered', cls: 'col-span-2 md:row-span-2' },
  { id: 'phone-lab-week-7', title: 'Lab files on a phone', cls: 'row-span-2' },
  { id: 'phone-dsa-lab-4', title: 'The same code on a phone', cls: 'row-span-2' },
  { id: 'os-lab-chart-preview', title: 'OS Lab 6 graph, in the lightbox', cls: 'col-span-2' },
  { id: 'zip-inspector', title: 'Peek inside a zip', cls: 'col-span-2' },
  { id: 'livepad-pepper', title: 'A group project in a Live Pad', cls: 'col-span-2' },
  { id: 'viva-notes-locked', title: 'What everyone else sees', cls: '', pos: 'object-center' },
  { id: 'clip-landing', title: 'The front door', cls: '', pos: 'object-center' },
]

function Gallery() {
  const [open, setOpen] = useState<number | null>(null)
  const item = open === null ? null : GALLERY[open]
  const go = (d: number) => setOpen((i) => (i === null ? i : (i + d + GALLERY.length) % GALLERY.length))
  return (
    <Exchange id="gallery">
      <Ask>Show me everything.</Ask>
      <Reply lead={<>Every one of these is the real app with Sai's real lab work in it. Tap one to see it big.</>}>
        <div className="grid grid-flow-dense auto-rows-[184px] grid-cols-2 gap-3 sm:auto-rows-[224px] md:auto-rows-[234px] md:grid-cols-4 md:gap-4">
          {GALLERY.map((g, i) => (
            <AnimatedContent key={g.id} distance={30} delay={(i % 4) * 0.06} className={`${g.cls} h-full`}>
              <button type="button" onClick={() => setOpen(i)} className="group flex size-full flex-col text-left focus-visible:outline-none">
                <span className="block min-h-0 flex-1 overflow-hidden rounded-2xl border-[1.5px] border-ink bg-[#0b0b0b] transition-all group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-hard group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent">
                  <img src={shot(g.id)} alt={g.title} loading="lazy" className={`size-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${g.pos ?? 'object-left-top'}`} />
                </span>
                {/* the caption sits under the picture, in the same italic as every other caption here */}
                <span className="mt-2 block h-6 truncate font-serif text-[17px] leading-6 text-muted italic">{g.title}</span>
              </button>
            </AnimatedContent>
          ))}
        </div>
      </Reply>
      <AnimatePresence>
        {item && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(null)
              if (e.key === 'ArrowRight') go(1)
              if (e.key === 'ArrowLeft') go(-1)
            }}
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <motion.figure key={item.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="flex max-h-full max-w-[1200px] flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img src={shot(item.id)} alt={item.title} className="max-h-[78vh] w-auto rounded-xl border-[1.5px] border-white/20" />
              <figcaption className="mt-3 text-center text-[15px] text-white">{item.title}</figcaption>
            </motion.figure>
            <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-3 grid size-11 place-items-center rounded-full border border-white/30 text-xl text-white hover:bg-white/10 sm:left-6">‹</button>
            <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-3 grid size-11 place-items-center rounded-full border border-white/30 text-xl text-white hover:bg-white/10 sm:right-6">›</button>
            <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full border border-white/30 text-xl text-white hover:bg-white/10">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </Exchange>
  )
}

type Brand = { path: string; hex: string }
const STACK: { label: string; brand?: Brand; icon?: LucideIcon }[] = [
  { label: 'React', brand: siReact },
  { label: 'TypeScript', brand: siTypescript },
  { label: 'Vite', brand: siVite },
  { label: 'Web Crypto', icon: Lock },
  { label: 'Cloudflare Workers', brand: siCloudflareworkers },
  { label: 'Hono', brand: siHono },
  { label: 'Workers KV', icon: Database },
  { label: 'Durable Objects', icon: Boxes },
  { label: 'WebSockets', icon: Cable },
  { label: 'fflate', icon: FileArchive },
  { label: 'KaTeX', icon: Sigma },
  { label: 'Prism', icon: Braces },
  { label: 'Cloudflare', brand: siCloudflare },
]

function StackItem({ item }: { item: (typeof STACK)[number] }) {
  return (
    <span className="flex items-center gap-3 font-serif text-[clamp(26px,3vw,40px)] whitespace-nowrap">
      {item.brand ? (
        <svg viewBox="0 0 24 24" className="size-[0.85em] shrink-0" style={{ fill: `#${item.brand.hex}` }} aria-hidden="true"><path d={item.brand.path} /></svg>
      ) : item.icon ? (
        <item.icon className="size-[0.85em] shrink-0 text-accent" strokeWidth={2} />
      ) : null}
      {item.label}
    </span>
  )
}

function Built() {
  return (
    <Exchange id="stack">
      <Ask>What is it built on?</Ask>
      <Reply lead={<>All of it runs on Cloudflare's edge, so Sai has no server to babysit. More time to babysit me.</>}>
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink py-5 text-paper">
          <LogoLoop
            logos={STACK.map((s) => ({ node: <StackItem item={s} />, title: s.label }))}
            speed={60}
            gap={48}
            logoHeight={44}
            pauseOnHover
            fadeOut
            fadeOutColor="var(--ink)"
            ariaLabel="Clip tech stack"
          />
        </div>
        <div className="mt-6 grid grid-cols-2 items-stretch gap-4 md:grid-cols-4">
          {[
            { icon: HardDriveUpload, to: 25, suffix: ' MB', label: 'per file' },
            { icon: GitCommitHorizontal, to: 77, suffix: '', label: 'commits so far' },
            { icon: CodeXml, to: 40, suffix: '+', label: 'languages highlighted' },
            { icon: UserX, to: 0, suffix: '', label: 'accounts needed' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border-[1.5px] border-ink bg-paper2 p-5">
              <s.icon className="mb-3 size-6 text-accent" strokeWidth={2} />
              <p className="font-serif text-[clamp(38px,4vw,56px)] leading-none"><CountUp to={s.to} duration={1.6} suffix={s.suffix} /></p>
              <p className="mt-2 text-[14px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Reply>
    </Exchange>
  )
}

function Next() {
  return (
    <Exchange id="next">
      <Ask>What's next for Clip?</Ask>
      <Reply lead={<><b>Clip Beam.</b> Files from 500 MB to 100 GB, sent straight from one browser to the other over WebRTC, with the server only doing the introductions. He has been muttering about it for weeks.</>}>
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1.4fr_1fr]">
          <ClickSpark sparkColor={['#d9481c', '#f0d98a', '#1c1b18']} sparkCount={12} sparkRadius={40}>
            <a href={LIVE} target="_blank" rel="noopener" className="group flex h-full flex-col justify-between gap-6 rounded-3xl border-[1.5px] border-ink bg-accent p-8 text-accent-ink shadow-hard-lg transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[14px_14px_0_var(--ink)]">
              <span className="text-[13px] font-bold tracking-[0.12em] uppercase opacity-85">Next time you are on a shared PC</span>
              <span className="flex items-center justify-between gap-4 font-serif text-[clamp(38px,4.6vw,68px)] leading-none">open clip.foo.ng <Arrow /></span>
            </a>
          </ClickSpark>
          <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border-[1.5px] border-ink bg-paper2 p-8">
            <p className="font-serif text-[clamp(26px,2.4vw,34px)] leading-tight">Want to see how it is put together?</p>
            <div className="flex flex-wrap gap-3">
              <Btn href={CODE} solid>Read the code</Btn>
              <Btn href="/projects.html">More projects</Btn>
            </div>
          </div>
        </div>
      </Reply>
      <div className="mt-14 flex justify-end">
        <p className="rounded-3xl rounded-br-md border-[1.5px] border-ink bg-ink px-5 py-3.5 text-[17px] text-paper">That's actually really useful. Tell Sai I'm bookmarking it.</p>
      </div>
    </Exchange>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ChatHeader />
        <Why />
        <HowItMoves />
        <Private />
        <Together />
        <Terminalish />
        <Gallery />
        <Built />
        <Next />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-[clamp(16px,4vw,40px)] py-7 text-[14px] text-muted">
          <span>Sai Balkawade, 2026</span>
          <a href="/projects.html" className="hover:text-accent">Back to all projects</a>
        </div>
      </footer>
    </>
  )
}
