# Chore Board

A family chore chart. Parents assign chores to family members; kids check them
off on a wall-mounted tablet or a phone. Each chore earns stars, and kids trade
stars for rewards. Airtable is the database.

## Stack

- Next.js (App Router) + TypeScript (strict), deployed to Vercel
- Tailwind CSS
- Airtable REST API, called only from server-side route handlers / Server Actions
- SWR for client data fetching with optimistic updates
- Vitest for unit tests
- date-fns / date-fns-tz, all dates handled in the household time zone

## Airtable setup

The Airtable Free plan blocks creating bases through the API, so the base and
its tables must be created by hand in the Airtable UI. Use these **exact**
table and field names and types — the app does not use any Airtable formula
fields, and `npm run check:airtable` will flag anything that doesn't match.

All dates are stored as **local-date text** (`YYYY-MM-DD`), not Airtable's
native Date field type, so time zones can't shift them.

### Profiles

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Role | Single select: `parent`, `child` | |
| Color | Single line text | Hex, e.g. `#4F9DDE` |
| Emoji | Single line text | Avatar |
| SortOrder | Number (integer) | Column order |
| Active | Checkbox | Inactive profiles are hidden everywhere |

### Chores

| Field | Type | Notes |
|---|---|---|
| Title | Single line text | Primary field |
| Emoji | Single line text | Optional icon |
| Assignee | Link to Profiles (single) | Required |
| Stars | Number (integer, ≥0) | Stars earned per completion |
| TimeOfDay | Single select: `morning`, `afternoon`, `evening`, `anytime` | Default `anytime` |
| DueTime | Single line text | Optional `HH:mm`; display only |
| RepeatMode | Single select: `none`, `schedule`, `after_completion` | |
| StartDate | Single line text | `YYYY-MM-DD` |
| Frequency | Single select: `daily`, `weekly`, `monthly` | `schedule` only |
| Interval | Number (integer, ≥1) | `schedule` only |
| DaysOfWeek | Multiple select: `SU MO TU WE TH FR SA` | `schedule` + `weekly` only |
| EndDate | Single line text | Optional `YYYY-MM-DD`, `schedule` only |
| DelayDays | Number (integer, ≥0) | `after_completion` only |
| NextDueDate | Single line text | `after_completion` only; the app updates it |
| Archived | Checkbox | Soft delete |

### Completions

| Field | Type | Notes |
|---|---|---|
| Key | Single line text | Primary field. `{choreId}:{occurrenceDate}` |
| Chore | Link to Chores (single) | |
| Profile | Link to Profiles (single) | |
| OccurrenceDate | Single line text | `YYYY-MM-DD` |
| CompletedDate | Single line text | `YYYY-MM-DD` |
| StarsAwarded | Number (integer) | Frozen at completion time |

### Rewards

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Emoji | Single line text | |
| Cost | Number (integer, ≥1) | Price in stars |
| Profile | Link to Profiles (single) | Optional. Empty = available to all children |
| Archived | Checkbox | |

### Redemptions

| Field | Type | Notes |
|---|---|---|
| Label | Single line text | Primary field. `{rewardName} – {profileName}` |
| Reward | Link to Rewards (single) | |
| Profile | Link to Profiles (single) | |
| Cost | Number (integer) | Frozen at redemption time |
| RedeemedDate | Single line text | `YYYY-MM-DD` |

### Verifying the schema

Once the base and tables exist, create a Personal Access Token with scopes
`data.records:read`, `data.records:write`, `schema.bases:read`, add it to
your `.env.local`, and run:

```bash
npm run check:airtable
```

This reads the base schema through the Airtable Metadata API and reports any
table or field that's missing, mistyped, or missing an expected select
choice.

## Environment variables

Create `.env.local` with:

```
AIRTABLE_PAT=            # Personal access token (scopes above), with this base added under "Access"
AIRTABLE_BASE_ID=
HOUSEHOLD_TZ=America/Denver
HOUSEHOLD_PIN=            # 4–6 digits; unlocks the app on a new device
PARENT_PIN=               # 4–6 digits; unlocks management and redemption
SESSION_SECRET=           # signs cookies
```

## Local development

```bash
npm install
npm run check:airtable   # once AIRTABLE_PAT / AIRTABLE_BASE_ID are set
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm test        # run the unit test suite once
npm run test:watch
npm run lint
npx tsc --noEmit
```

## Deployment

1. Push this repo to GitHub (or GitLab/Bitbucket) and import it in
   [Vercel](https://vercel.com/new). Framework preset: Next.js (auto-detected).
2. In the Vercel project's **Settings → Environment Variables**, add all six
   variables from [Environment variables](#environment-variables) above, for
   both Production and Preview.
3. Deploy. No build-time Airtable access is required —
   `npm run check:airtable` is a local/CI verification step, not part of the
   build.
4. After the first deploy, run `npm run check:airtable` locally (with
   `AIRTABLE_PAT`/`AIRTABLE_BASE_ID` pointed at the production base) to
   confirm the hand-built schema still matches.

### Setting up the wall tablet

1. On the tablet's browser, open the deployed URL and enter the household PIN.
2. Install it as an app: Chrome/Android → menu → "Add to Home screen"; Safari/iPad →
   Share → "Add to Home Screen". This uses the manifest's `standalone` display mode,
   so it opens without browser chrome.
3. Open the installed app, go to **Manage → Kiosk mode**, and turn it on. This is a
   per-device `localStorage` flag, so it only affects that tablet.
4. Leave it on the Today screen. Kiosk mode keeps the screen awake, hides the tab
   bar behind a small floating button, returns to Today after 2 minutes idle, and
   reloads once daily at 3:00 AM device-local time.
