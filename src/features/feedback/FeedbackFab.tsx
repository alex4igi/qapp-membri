import { useState } from 'react'
import { FeedbackModal } from './FeedbackModal'

// Buton flotant, prezent pe toate paginile. NU în header: pe mobil acolo sunt deja
// temă + clopoțel + switcher + avatar. Ridicat deasupra bottom-nav-ului pe mobil.
export function FeedbackFab() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Trimite-ne o părere"
        title="Trimite-ne o părere"
        className="fixed bottom-[86px] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surf text-ink shadow-lg lg:bottom-6 lg:right-6"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.6 9.6 0 0 1-3.2-.5L3 21l1.7-4.6A8.2 8.2 0 0 1 3.6 11 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
        </svg>
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
