import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Mango from './Mango'

export const shot = (name: string) => `${import.meta.env.BASE_URL}screens/${name}.webp`

const ease = [0.2, 0.8, 0.2, 1] as const

/** three dots that bounce while someone is "typing" */
function Typing({ align }: { align: 'left' | 'right' }) {
  return (
    <div className={`flex gap-1.5 rounded-2xl border-[1.5px] border-ink px-4 py-3.5 ${align === 'right' ? 'rounded-br-md bg-ink' : 'rounded-bl-md bg-paper2'}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`size-2 rounded-full ${align === 'right' ? 'bg-paper' : 'bg-ink'}`}
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

/** shows the typing dots first, then swaps in the message once it scrolls into view */
function useTypedReveal(ms: number) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -18% 0px' })
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!seen) return
    if (reduce) return setDone(true)
    const t = setTimeout(() => setDone(true), ms)
    return () => clearTimeout(t)
  }, [seen, reduce, ms])
  return { ref, seen, done }
}

/** the visitor's question, right aligned like your own messages in a chat */
export function Ask({ children }: { children: ReactNode }) {
  const { ref, seen, done } = useTypedReveal(650)
  return (
    <div ref={ref} className="flex items-end justify-end gap-3">
      <div className="min-h-[52px]">
        {seen && !done && <Typing align="right" />}
        {done && (
          <motion.p
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            style={{ transformOrigin: '100% 100%' }}
            className="max-w-[min(560px,80vw)] rounded-3xl rounded-br-md border-[1.5px] border-ink bg-ink px-5 py-3.5 text-[17px] leading-snug text-paper md:text-[19px]"
          >
            {children}
          </motion.p>
        )}
      </div>
      <span className="grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-highlight text-[11px] font-bold text-ink">You</span>
    </div>
  )
}

/** Mango's answer (Sai's cat tells the story): an avatar, a short typed line, then whatever the answer needs to show */
export function Reply({ lead, children }: { lead: ReactNode; children?: ReactNode }) {
  const { ref, seen, done } = useTypedReveal(900)
  return (
    <div ref={ref} className="mt-6 flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-ink bg-peach"><Mango className="size-9 translate-y-0.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Mango</p>
        <div className="min-h-[52px]">
          {seen && !done && <Typing align="left" />}
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="inline-block max-w-[min(720px,100%)] rounded-3xl rounded-tl-md border-[1.5px] border-ink bg-paper2 px-5 py-4 text-[17px] leading-relaxed md:text-[19px]"
            >
              {lead}
            </motion.div>
          )}
        </div>
        {done && children && (
          // on phones the answer's visuals use the full width instead of sitting beside the avatar
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.25 }} className="mt-6 -ml-[52px] sm:ml-0">
            {children}
          </motion.div>
        )}
      </div>
    </div>
  )
}

/** one exchange in the conversation */
export function Exchange({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-[clamp(16px,4vw,40px)] py-[clamp(56px,8vw,110px)]">
      {children}
    </section>
  )
}

/** a framed screenshot with a caption, all frames share one radius and shadow */
export function Frame({ src, alt, caption, className = '', fixed = false }: { src: string; alt: string; caption?: ReactNode; className?: string; fixed?: boolean }) {
  return (
    <figure className={`flex h-full flex-col ${className}`}>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border-[1.5px] border-ink bg-[#0b0b0b] shadow-hard">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2.5" aria-hidden="true">
          <i className="size-2.5 rounded-full bg-white/20" />
          <i className="size-2.5 rounded-full bg-white/20" />
          <i className="size-2.5 rounded-full bg-white/20" />
        </div>
        {/* keep the screenshot's real proportions; the black frame (Clip's own background) fills any extra height */}
        <img src={src} alt={alt} loading="lazy" className={fixed ? 'block aspect-[16/10] w-full object-cover object-top' : 'block h-auto w-full'} />
      </div>
      {caption && <figcaption className="mt-3 font-serif text-xl text-muted italic">{caption}</figcaption>}
    </figure>
  )
}
