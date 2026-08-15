import { createSign } from "node:crypto";

/**
 * Waitlist storage backed by Google Sheets.
 *
 * Two ways to connect, so the shop can pick whichever is less hassle:
 *
 *   1. Apps Script  — set GOOGLE_SHEETS_WEBHOOK_URL to a deployed Web App URL.
 *      No keys, no Cloud console, ~2 minutes to set up. See README.
 *   2. Service account — set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and
 *      GOOGLE_PRIVATE_KEY. Talks to the Sheets REST API directly.
 *
 * With neither configured the route runs in demo mode: signups are logged to the
 * server console so local development works without any Google setup at all.
 */

export type Signup = {
  email: string;
  name: string;
  source: string;
};

export type SaveResult = {
  mode: "webhook" | "sheets" | "demo";
  duplicate: boolean;
  /** True when Google rejected the write but the signup is safe in the CSV. */
  degraded?: boolean;
};

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
/** Column order shared by the CSV backup and the Google Sheet. */
const HEADER_ROW = ["Joined at", "Name", "Email"];
/** Zero-based index of Email within HEADER_ROW — keep the two in step. */
const EMAIL_COLUMN = 2;

/** The shop's own clock, so "Joined at" reads the way the shop experienced it. */
const TIMEZONE = process.env.WAITLIST_TIMEZONE || "America/Los_Angeles";

/**
 * Formats a signup time as "2026/08/15 13:23".
 *
 * Both Google Sheets and Excel recognise this shape as a real date-time, so the
 * column stays sortable instead of becoming plain text.
 */
export function formatJoinedAt(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Deliberately permissive — the real check is whether the confirmation lands. */
const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@.,;]+\.[^\s@,;]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function normalizeName(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export async function saveSignup(signup: Signup): Promise<SaveResult> {
  // Always land the signup on disk first. Google can be misconfigured, offline
  // or mid-redeploy, and an email typed by a real person must never be lost.
  const duplicateLocally = await recordLocally(signup);

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      return { mode: "webhook", duplicate: await sendToWebhook(webhookUrl, signup) };
    } catch (error) {
      warnSheetsFailed(error);
      return { mode: "webhook", duplicate: duplicateLocally, degraded: true };
    }
  }

  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = readPrivateKey();

  if (sheetId && clientEmail && privateKey) {
    try {
      return {
        mode: "sheets",
        duplicate: await appendViaServiceAccount({ sheetId, clientEmail, privateKey }, signup),
      };
    } catch (error) {
      warnSheetsFailed(error);
      return { mode: "sheets", duplicate: duplicateLocally, degraded: true };
    }
  }

  console.info(`[waitlist] saved to ${LOCAL_FILE} (no Google Sheets configured):`, signup.email);
  return { mode: "demo", duplicate: duplicateLocally };
}

function warnSheetsFailed(error: unknown): void {
  console.warn(
    `\n[waitlist] ⚠️  Google Sheets write FAILED — the signup is safe in ${LOCAL_FILE}\n` +
      `[waitlist]     reason: ${error instanceof Error ? error.message : String(error)}\n`,
  );
}

/* -------------------------------------------------------------------------- */
/* Durable local backup — a CSV that opens straight into Excel                */
/* -------------------------------------------------------------------------- */

const LOCAL_FILE = "data/waitlist.csv";

/** Escapes a value for CSV, defusing the =/+/-/@ formula-injection prefixes. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Reads one row written by csvCell, honouring "" as an escaped quote. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

async function recordLocally(signup: Signup): Promise<boolean> {
  const { mkdir, appendFile, readFile } = await import("node:fs/promises");
  const { dirname, resolve } = await import("node:path");

  const file = resolve(process.cwd(), LOCAL_FILE);
  await mkdir(dirname(file), { recursive: true });

  let existing = "";
  try {
    existing = await readFile(file, "utf8");
  } catch {
    // First signup — the file is created below, complete with a header row.
  }

  if (existing === "") {
    await appendFile(file, `${HEADER_ROW.map(csvCell).join(",")}\n`, "utf8");
  }

  const duplicate = existing
    .split("\n")
    .slice(1)
    .some((line) => {
      if (line.trim() === "") return false;
      const email = parseCsvLine(line)[EMAIL_COLUMN];
      return email !== undefined && email.trim().toLowerCase() === signup.email;
    });

  if (!duplicate) {
    const row = [formatJoinedAt(), signup.name, signup.email];
    await appendFile(file, `${row.map(csvCell).join(",")}\n`, "utf8");
  }

  return duplicate;
}

/* -------------------------------------------------------------------------- */
/* Option 1 — Apps Script Web App                                             */
/* -------------------------------------------------------------------------- */

async function sendToWebhook(url: string, signup: Signup): Promise<boolean> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...signup, joinedAt: formatJoinedAt() }),
    // Apps Script answers with a 302 to script.googleusercontent.com.
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const text = (await response.text()).trim();

  // A sign-in page means the deployment isn't public. Google serves it with a
  // 200, so without this check we would report a save that never happened.
  if (/^<(!doctype|html)/i.test(text) || text.includes("accounts.google.com/v3/signin")) {
    throw new Error(
      "Apps Script returned a Google sign-in page instead of JSON. Re-deploy the " +
        'Web App with "Who has access" set to "Anyone" (Deploy > Manage deployments > ' +
        "Edit > Version: New version), then update GOOGLE_SHEETS_WEBHOOK_URL.",
    );
  }

  if (!response.ok) {
    throw new Error(`Apps Script responded ${response.status}: ${text.slice(0, 200)}`);
  }

  let parsed: { result?: string; duplicate?: boolean };
  try {
    parsed = JSON.parse(text) as { result?: string; duplicate?: boolean };
  } catch {
    // Older versions of the script replied with a bare "OK".
    if (/^ok$/i.test(text)) return false;
    throw new Error(`Apps Script returned unreadable output: ${text.slice(0, 200)}`);
  }

  if (parsed.result === "error") {
    throw new Error(`Apps Script error: ${text.slice(0, 200)}`);
  }

  return parsed.duplicate === true;
}

/* -------------------------------------------------------------------------- */
/* Option 2 — Sheets REST API with a service account                          */
/* -------------------------------------------------------------------------- */

type Credentials = { sheetId: string; clientEmail: string; privateKey: string };

async function appendViaServiceAccount(
  credentials: Credentials,
  signup: Signup,
): Promise<boolean> {
  const token = await getAccessToken(credentials);
  const tab = process.env.GOOGLE_SHEETS_TAB?.trim() || "Sheet1";
  const existing = await readColumns(credentials.sheetId, tab, token);

  if (existing.length === 0) {
    await appendRows(credentials.sheetId, tab, token, [HEADER_ROW]);
  } else if (
    existing.some((row) => (row[EMAIL_COLUMN] ?? "").trim().toLowerCase() === signup.email)
  ) {
    // Already on the list — treat as success so the visitor sees no error.
    return true;
  }

  await appendRows(credentials.sheetId, tab, token, [
    [formatJoinedAt(), signup.name, signup.email],
  ]);
  return false;
}

async function readColumns(sheetId: string, tab: string, token: string): Promise<string[][]> {
  const range = encodeURIComponent(`${tab}!A:C`);
  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

async function appendRows(
  sheetId: string,
  tab: string,
  token: string,
  values: string[][],
): Promise<void> {
  const range = encodeURIComponent(`${tab}!A:C`);
  const query = "valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}:append?${query}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    },
  );
}

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

async function getAccessToken({ clientEmail, privateKey }: Credentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };

  const payload = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256").update(payload);
  const assertion = `${payload}.${base64Url(signer.sign(privateKey))}`;

  const response = await googleFetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google returned no access token.");

  // Refresh a minute early so an in-flight request never uses an expired token.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken.value;
}

async function googleFetch(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    // A stale cached token would otherwise keep failing for its full hour.
    if (response.status === 401) cachedToken = null;
    throw new Error(`Google API ${response.status} for ${new URL(url).pathname}: ${detail.slice(0, 300)}`);
  }
  return response;
}

/** Env vars flatten newlines, so accept both real and escaped line breaks. */
function readPrivateKey(): string | undefined {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return key ? key.replace(/\\n/g, "\n").trim() : undefined;
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
