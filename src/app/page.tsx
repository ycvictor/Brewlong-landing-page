import type { Metadata } from "next";
import Image from "next/image";
import { InstagramLink } from "@/components/instagram-link";
import { WaitlistForm } from "@/components/waitlist-form";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.seo.description,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <div
        aria-hidden="true"
        className="tea-wash pointer-events-none fixed inset-0 -z-10"
      />

      <main className="mx-auto w-full max-w-xl px-[max(1.5rem,env(safe-area-inset-left))] pb-[max(7rem,calc(env(safe-area-inset-bottom)+7rem))] pt-[clamp(2.5rem,7vh,4.5rem)] text-center">
        <section className="animate-rise-in">
          <Image
            src="/brewlong-logo.png"
            alt={`${SITE.name} — a hand-drawn teapot and cup`}
            width={500}
            height={439}
            priority
            className="mx-auto h-auto w-[clamp(9rem,28vw,12.5rem)]"
          />

          <h1 className="mt-[clamp(1.25rem,4vw,2rem)] font-hand text-[clamp(2rem,7.5vw,2.9rem)] leading-[1.35] text-cobalt-700">
            {SITE.hero.heading}
          </h1>

          <p className="mx-auto mt-[clamp(1rem,3vw,1.5rem)] max-w-md text-pretty font-serif text-[clamp(1.02rem,2.6vw,1.2rem)] leading-[1.7] text-steep-800/85">
            {SITE.hero.intro}
          </p>
        </section>

        <section id="waitlist" className="mt-[clamp(1.75rem,5vw,2.75rem)]">
          <WaitlistForm />
        </section>

        <SteamDivider />

        <section id="about">
          <h2 className="font-hand text-[clamp(1.6rem,5.5vw,2.1rem)] leading-[1.4] text-cobalt-700">
            {SITE.about.heading}
          </h2>

          <div className="mx-auto mt-[clamp(1rem,3vw,1.5rem)] max-w-lg space-y-5 text-pretty font-serif text-[clamp(1.02rem,2.6vw,1.2rem)] leading-[1.85] text-steep-800/85">
            {SITE.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <footer className="mt-[clamp(2.5rem,7vw,4rem)] border-t border-steep-300/40 pt-8">
          <p className="font-hand text-[1.25rem] text-cobalt-700/70">
            {SITE.footer}
          </p>
        </footer>
      </main>

      <InstagramLink />
    </div>
  );
}

/** A wisp of steam rising between the sign-up and the story. */
function SteamDivider() {
  return (
    <div
      aria-hidden="true"
      className="my-[clamp(2.5rem,8vw,4.5rem)] flex justify-center gap-2"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-9 w-[3px] animate-steam rounded-full bg-steep-300"
          style={{ animationDelay: `${index * 0.6}s` }}
        />
      ))}
    </div>
  );
}
