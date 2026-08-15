import { SITE } from "@/content/site";

/**
 * Fixed to the bottom-right corner on every screen size, so the shop's Instagram
 * is always one tap away without competing with the waitlist form.
 */
export function InstagramLink() {
  return (
    <a
      href={SITE.instagram}
      target="_blank"
      rel="noreferrer"
      aria-label={`${SITE.name} on Instagram, ${SITE.handle}`}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex items-center gap-2 rounded-full border border-steep-300/60 bg-cream-50/90 px-3.5 py-2.5 text-cobalt-700 shadow-[0_8px_24px_-12px_rgba(95,57,33,0.5)] backdrop-blur transition hover:-translate-y-0.5 hover:border-steep-300 hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-steep-300/40 sm:bottom-6 sm:right-6"
    >
      <InstagramIcon className="h-5 w-5" />
      <span className="hidden font-hand text-[1.05rem] leading-none sm:inline">
        {SITE.handle}
      </span>
    </a>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}
