# Brewlong

Landing page for [Brewlong](https://www.instagram.com/brewlong.tea/), a Taiwanese
oolong tea bar in Seattle. Built with Next.js (App Router), Tailwind CSS and
TypeScript.

| Route           | What it is                                                    |
| --------------- | ------------------------------------------------------------- |
| `/`             | Landing page — logo, waitlist signup, about section, Instagram |
| `/api/waitlist` | Saves waitlist signups to a CSV file and a Google Sheet        |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the waitlist works without it
npm run dev
```

Open <http://localhost:3000>.

## Where everything lives

```
src/
  content/site.ts        ← ALL WEBSITE TEXT. Edit this one.
  app/
    page.tsx             the landing page layout
    layout.tsx           fonts + link-preview settings
    globals.css          the warm background wash
    icon.png             favicon (browser tab)
    apple-icon.png       icon when saved to a phone home screen
    api/waitlist/        the code that receives a signup
  components/
    waitlist-form.tsx    the email sign-up box
    instagram-link.tsx   the Instagram button, bottom-right
  lib/
    waitlist.ts          saves signups to CSV + Google Sheets
assets/brand/            original logo files (not published)
public/                  images the website serves
data/waitlist.csv        your signups (created on first signup, never committed)
```

## Editing your story and info

Open **`src/content/site.ts`**. Every word on the site is in that one file —
your story, the headline, the sign-up box wording and your Instagram link.
Change the text between the quotes, save, and the page updates instantly.

| What you want to change            | Edit this in `src/content/site.ts` |
| ---------------------------------- | ---------------------------------- |
| Your story / about text            | `about.paragraphs`                 |
| The big headline under the logo    | `hero.heading`                     |
| The sentence under the headline    | `hero.intro`                       |
| Sign-up box wording and button     | `waitlist`                         |
| Instagram link and handle          | `instagram`, `handle`              |
| The line at the very bottom        | `footer`                           |
| Google search / link-preview text  | `seo.description`                  |

To change the **logo**, replace `public/brewlong-logo.png`. The originals are
kept in `assets/brand/`. For the browser-tab icon, replace `src/app/icon.png`.

Colours and fonts live in `tailwind.config.ts`.

## Where the signups go

**Running on your computer:** every signup is written to **`data/waitlist.csv`**.
Double-click that file and it opens straight in Excel. It is ignored by git, so
customer emails are never committed or shared. Signups are also copied into a
Google Sheet — see below. If Google is misconfigured or offline the CSV still
captures everything, and the terminal prints a warning explaining what went wrong.

**Once deployed** (Vercel, Netlify, and similar hosts), the CSV safety net is
gone: those hosts give each visit a fresh, read-only filesystem, so there is no
disk to save to. **Google Sheets becomes the only place your signups are kept.**
Set `GOOGLE_SHEETS_WEBHOOK_URL` in your host's environment variables before
pointing customers at the site — without it, the form will show visitors an error
rather than pretend it saved their email.

## Connecting the waitlist to Google Sheets

Pick **one** of the two options and add the variables to `.env.local` (or to your
host's environment settings).

### Option 1 — Apps Script Web App (easiest, no API keys)

1. Create a Google Sheet and make sure the tab is named **`Sheet1`** (that name
   must match `SHEET_NAME` below).
2. In that sheet choose **Extensions → Apps Script** and replace `Code.gs` with:

   ```js
   const SHEET_NAME = 'Sheet1';

   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.waitLock(20000);
     try {
       const data = JSON.parse(e.postData.contents);
       const email = String(data.email || '').trim().toLowerCase();
       if (!email) throw new Error('Missing email');

       const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
       if (sheet.getLastRow() === 0) {
         sheet.appendRow(['Joined at', 'Name', 'Email']);
       }

       const rows = sheet.getLastRow() - 1;
       // Column 3 = Email. Must match the header order above, or duplicate
       // checking silently compares against the wrong column.
       const seen = rows > 0
         ? sheet.getRange(2, 3, rows, 1).getValues().flat()
             .map(function (v) { return String(v).trim().toLowerCase(); })
         : [];
       const duplicate = seen.indexOf(email) !== -1;

       if (!duplicate) {
         sheet.appendRow([
           data.joinedAt || new Date().toISOString(),
           data.name || '',
           email,
         ]);
       }

       return ContentService
         .createTextOutput(JSON.stringify({ result: 'success', duplicate: duplicate }))
         .setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService
         .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
     } finally {
       lock.releaseLock();
     }
   }
   ```

   The sheet columns are **Joined at | Name | Email**.

3. **Deploy → New deployment → Web app**. Set _Execute as_ to **Me** and
   _Who has access_ to **Anyone**, then authorise it.
4. Copy the `/exec` URL into `GOOGLE_SHEETS_WEBHOOK_URL` and restart `npm run dev`.

> **Editing the script later?** Saving the file is not enough — the `/exec` URL
> keeps serving the old code. Use **Deploy → Manage deployments → ✏️ Edit →
> Version: New version → Deploy**. That publishes your changes to the *same*
> URL. Choosing "New deployment" instead would hand you a different URL.

**Can't find your signups?** Check the terminal running `npm run dev`. If Google
rejected the write it prints the reason, and the signup is still safe in
`data/waitlist.csv`. Two common causes: the tab is not named `Sheet1`, or the
deployment's _Who has access_ is not set to **Anyone**.

### Option 2 — Google service account

1. In the [Google Cloud console](https://console.cloud.google.com/) create a
   project and enable the **Google Sheets API**.
2. Create a service account, then add a **JSON key** for it.
3. Share your spreadsheet with the service account's email address, as **Editor**.
4. Set the variables:

   ```bash
   GOOGLE_SHEETS_ID=<the id in /spreadsheets/d/<ID>/edit>
   GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from the JSON key>
   GOOGLE_PRIVATE_KEY="<private_key from the JSON key, quoted, \n escapes intact>"
   GOOGLE_SHEETS_TAB=Sheet1
   ```

The route writes a `Joined at | Name | Email` header row automatically
if the tab is empty, and skips emails that are already on the list.

### Verifying it works

```bash
curl -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"friend@example.com","name":"Friend"}'
```

- `{"ok":true,"duplicate":false,"mode":"webhook"}` — saved to the CSV **and** the sheet.
- `"degraded":true` — saved to the CSV, but Google refused the write. The terminal
  running `npm run dev` prints the reason.
- `"mode":"demo"` — saved to the CSV only; no Google credentials are set.
- `{"error":"We couldn't save that just now…"}` — nothing captured the signup.
  On a deployed site this almost always means `GOOGLE_SHEETS_WEBHOOK_URL` is
  missing or wrong.

## Editing the shop

See [Editing your story and info](#editing-your-story-and-info) — it all lives in
`src/content/site.ts`.

## Putting it online

The repo is a plain Next.js app, so [Vercel](https://vercel.com) can host it for
free. Import the GitHub repo and you'll be shown two settings:

| Setting | Value | Why |
| --- | --- | --- |
| **Framework Preset** | `Next.js` | Tells the host which build command and output folder to use. Detected automatically from `package.json`. |
| **Root Directory** | `./` | Where the app lives inside the repo. Ours sits at the top level, so leave the default. |

Then open **Environment Variables** and add:

```bash
GOOGLE_SHEETS_WEBHOOK_URL=<your /exec URL>   # required — see the warning below
NEXT_PUBLIC_SITE_URL=https://<your-site>     # makes shared links preview correctly
WAITLIST_TIMEZONE=America/Los_Angeles        # optional
```

> **Add the webhook URL before sharing the link.** A deployed site has no disk to
> write `data/waitlist.csv` to, so the Google Sheet is the only place signups are
> stored. Without the variable the form returns an error instead of silently
> losing emails — but that still means no one can join.

After changing an environment variable, **redeploy** — variables are baked in at
build time, so an existing deployment won't pick them up on its own.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint
```
