import { NextResponse } from "next/server";
import { normalizeEmail, normalizeName, saveSignup } from "@/lib/waitlist";

// node:crypto signs the service-account JWT, so this cannot run on the edge.
export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

export async function POST(request: Request) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { error: "That's a few too many tries. Give it a minute and try again." },
      { status: 429 },
    );
  }

  let body: { email?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json(
      { error: "That email doesn't look right — mind checking it?" },
      { status: 400 },
    );
  }

  try {
    const { mode, duplicate, degraded } = await saveSignup({
      email,
      name: normalizeName(body.name),
      source: "landing-page",
    });
    return NextResponse.json({ ok: true, duplicate, mode, ...(degraded ? { degraded } : {}) });
  } catch (error) {
    console.error("[waitlist] could not save signup:", error);
    return NextResponse.json(
      { error: "We couldn't save that just now. Please try again in a moment." },
      { status: 502 },
    );
  }
}

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);

  // The map lives in memory on a single instance, so prune it as we go.
  if (recent.size > 500) {
    for (const [entry, times] of recent) {
      if (times.every((at) => now - at >= WINDOW_MS)) recent.delete(entry);
    }
  }

  return hits.length > MAX_PER_WINDOW;
}
