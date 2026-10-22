import { motion } from 'motion/react'

/** Mango's head, the same orange cat as on the portfolio, cropped for an avatar. Blinks now and then. */
export default function Mango({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="30 14 140 120" className={className} aria-hidden="true">
      <path d="M64 76L54 20l42 26z" fill="#f08a24" />
      <path d="M66 54l-3-21 21 13z" fill="#f4a6a0" />
      <path d="M136 76l10-56-42 26z" fill="#f08a24" />
      <path d="M134 54l3-21-21 13z" fill="#f4a6a0" />
      <circle cx="100" cy="90" r="46" fill="#f08a24" />
      <path d="M100 46v16M86 49l3 14M114 49l-3 14" fill="none" stroke="#c9631a" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="100" cy="108" rx="28" ry="19" fill="#fbe3c0" />
      {[80, 120].map((x) => (
        <motion.g key={x} style={{ originY: '88px', originX: `${x}px` }} animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4.5, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity, delay: x === 80 ? 0 : 0.02 }}>
          <ellipse cx={x} cy="88" rx="11" ry="12" fill="#fff" />
          <circle cx={x} cy="88" r="8" fill="#6aa84f" />
          <ellipse cx={x} cy="88" rx="3.2" ry="6.6" fill="#1c1b18" />
          <circle cx={x - 2.6} cy="84.8" r="2" fill="#fff" />
        </motion.g>
      ))}
      <ellipse cx="67" cy="106" rx="8" ry="5" fill="#f4a6a0" />
      <ellipse cx="133" cy="106" rx="8" ry="5" fill="#f4a6a0" />
      <path d="M94 98h12l-6 7z" fill="#f4a6a0" />
      <path d="M100 105q-5 8-12 4M100 105q5 8 12 4" fill="none" stroke="#1c1b18" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M68 108L36 101M68 113L34 114M132 108l32-7M132 113l34 1" fill="none" stroke="#1c1b18" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}
