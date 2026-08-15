"use client";

import { useRef, useState } from "react";
import { SITE } from "@/content/site";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "joined"; duplicate: boolean }
  | { kind: "error"; message: string };

const FIELD =
  "w-full min-w-0 rounded-full border border-steep-300/55 bg-cream-50 px-6 py-4 text-center font-serif text-base text-steep-800 shadow-[inset_0_1px_3px_rgba(95,57,33,0.06)] transition placeholder:text-steep-800/35 hover:border-steep-300 focus:border-steep-600/50 focus:outline-none focus:ring-4 focus:ring-steep-300/30 sm:text-left sm:text-[1.05rem]";

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  async function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;

    const data = new FormData(event.currentTarget);
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        duplicate?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Something went wrong on our end.");
      }

      formRef.current?.reset();
      setStatus({ kind: "joined", duplicate: result.duplicate === true });
    } catch (caught) {
      setStatus({
        kind: "error",
        message: caught instanceof Error ? caught.message : "Something went wrong.",
      });
    }
  }

  if (status.kind === "joined") {
    return (
      <div
        role="status"
        className="animate-rise-in rounded-[2rem] border border-steep-300/50 bg-cream-50/85 px-6 py-9 shadow-[0_16px_44px_-30px_rgba(95,57,33,0.55)]"
      >
        <p className="font-hand text-[clamp(1.5rem,5vw,1.9rem)] leading-[1.4] text-cobalt-700">
          {status.duplicate
            ? SITE.waitlist.duplicateHeading
            : SITE.waitlist.successHeading}
        </p>
        <p className="mx-auto mt-3 max-w-sm font-serif text-[clamp(0.98rem,2.5vw,1.1rem)] leading-[1.75] text-steep-800/80">
          {status.duplicate
            ? SITE.waitlist.duplicateBody
            : SITE.waitlist.successBody}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-5 rounded-full px-3 py-1 font-serif text-sm text-steep-600 underline underline-offset-4 transition hover:text-steep-800"
        >
          add another email
        </button>
      </div>
    );
  }

  const isSending = status.kind === "sending";

  return (
    <form
      ref={formRef}
      onSubmit={join}
      noValidate
      className="relative rounded-[2rem] border border-steep-300/50 bg-cream-50/85 p-6 shadow-[0_16px_44px_-30px_rgba(95,57,33,0.55)] sm:p-7"
    >
      <p className="font-hand text-[clamp(1.5rem,5vw,1.9rem)] leading-[1.4] text-cobalt-700">
        {SITE.waitlist.heading}
      </p>
      <p className="mx-auto mt-2 max-w-sm font-serif text-[clamp(0.95rem,2.4vw,1.05rem)] leading-[1.7] text-steep-800/70">
        {SITE.waitlist.intro}
      </p>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="waitlist-name" className="sr-only">
          First name (optional)
        </label>
        <input
          id="waitlist-name"
          name="name"
          type="text"
          autoComplete="given-name"
          maxLength={80}
          placeholder="first name"
          className={`${FIELD} sm:w-[38%]`}
        />

        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@email.com"
          className={`${FIELD} sm:flex-1`}
        />
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="mt-2.5 w-full rounded-full bg-cobalt-700 px-6 py-4 font-hand text-[1.2rem] leading-none text-cream-50 shadow-[0_10px_24px_-14px_rgba(11,44,137,0.9)] transition hover:-translate-y-px hover:bg-cobalt-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt-600/30 disabled:translate-y-0 disabled:opacity-60"
      >
        {isSending ? "steeping…" : SITE.waitlist.button}
      </button>

      {status.kind === "error" ? (
        <p role="alert" className="mt-3 font-serif text-sm text-red-700">
          {status.message}
        </p>
      ) : (
        <p className="mt-3 font-serif text-xs leading-relaxed text-steep-800/50">
          {SITE.waitlist.disclaimer}
        </p>
      )}
    </form>
  );
}
