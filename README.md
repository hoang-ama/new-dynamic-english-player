# Dynamic English — Data Pipeline

This pipeline builds the 340-lesson catalog for the Dynamic English player.

## What it collects

- lesson ID: 1–340
- part: 1–4
- lesson number
- lesson title
- source lesson URL
- direct audio URL
- transcript endpoint placeholder
- AI enrichment placeholders

It does **not** copy audio files.

## Confirmed source structure

- Part 1: 1–100
- Part 2: 101–200
- Part 3: 201–300
- Part 4: 301–340

The current source exposes lesson audio using:

`https://lopngoaingu.com/Dynamic_English_Study/audio/{lessonId}.mp3`

## Run

Requires Node.js 18.17+.

```bash
npm install
npm run refresh
```

The output is:

`data/lessons.json`

## Run the player

Start the local Vanilla JavaScript app and Vercel-function-compatible transcript route with:

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The player loads lesson metadata on startup, streams the selected lesson's original audio directly, and requests a transcript only when opened. Completion, current lesson, playback speed, and audio positions are stored in browser `localStorage`.

Lesson summaries, patterns, and vocabulary remain visibly unavailable when the canonical manifest has no reviewed enrichment; the player does not invent replacements.

Vercel uses `npm run build:vercel`, which validates the checked-in lesson manifest and stages it at `public/data/lessons.json`, along with the browser modules from `src/`, for static delivery. It does not fetch the course or rewrite the canonical data. These generated public copies are git-ignored. `npm run build` remains reserved for the separate catalog refresh pipeline.

## Deploy through GitHub Actions

`.github/workflows/vercel.yml` runs unit tests, manifest validation, browser E2E, and axe checks before deploying. Pushes to feature branches create Vercel Preview deployments; pushes to `main` create Production deployments. Pull requests run the checks but do not receive deployment secrets. `vercel.json` disables Vercel's automatic Git deployment so the same commit is not deployed twice.

Before the first deployment:

1. Create/link this project in Vercel with `vercel link` and note `orgId` and `projectId` from the generated local `.vercel/project.json`.
2. In GitHub, open **Settings → Secrets and variables → Actions** and add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as repository secrets.
3. Push a branch for Preview; merge/push to `main` for Production.

The `.vercel/` directory and credentials are ignored and must not be committed. A separate `GEMINI_API_KEY` is only needed if/when a server-side AI feature is deployed; the current player does not call Gemini at runtime.

## Extract lesson content

The source-content extractor uses the lesson article body and removes the embedded source audio controls and lesson-menu link. By default it fetches only the representative checkpoints (lessons 1, 113, and 340):

```bash
npm run extract
```

Records are written locally to `data/source-lessons/{id}.json` with a fetch timestamp and `fetched` or `failed` status. This course-derived content is excluded from the public repository. After reviewing the checkpoint output, pass `--all` to fetch all 340 lessons:

```bash
npm run extract -- --all
```

Failed requests are recorded and are not replaced with fabricated content. Audio is not downloaded.

## Transcript API

The Vercel function `GET /api/transcript?id=N` resolves the lesson in `data/lessons.json`, fetches only that record's fixed LopNgoaiNgu lesson URL, extracts the article, and returns structured JSON (`id`, `sourceUrl`, `title`, `content`, `sections`, `fetchedAt`, and `status`). The endpoint rejects invalid IDs and methods, does not accept a remote URL parameter, and returns an error when the source is unavailable or cannot be extracted. Transcript content is returned as text, not source HTML.

Run the request-handler tests with:

```bash
npm test
```

## Responsive and end-to-end checks

The Playwright suite covers lesson search/selection, completion persistence across reloads, transcript loading/cache/error retry, mobile drawer keyboard focus, responsive widths, and axe WCAG checks. Install Chromium once, then run:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright reports are written under `test-results/` and are git-ignored.

## AI enrichment

The enrichment pipeline uses Google's Gemini API with the pinned model ID `gemini-3.6-flash`. It reads only successful records from `data/source-lessons/`, requests structured JSON, and checks every evidence excerpt against the source text. Temporary `408`, `429`, and `5xx` responses are retried up to three total attempts, respecting `Retry-After` when provided. Results are staged in `data/ai-enrichment/` with `reviewStatus: "pending"`; generation alone does not modify `data/lessons.json`.

Set `GEMINI_API_KEY` in the root `.env` file (the file is git-ignored):

```dotenv
GEMINI_API_KEY=your_Gemini_API_key
```

The enrichment script loads `.env` on supported Node versions. Do not commit the key or expose it in browser code. In Vercel, configure the same variable through Project Settings → Environment Variables. The default command processes checkpoint lessons 1, 113, and 340:

```bash
npm run enrich -- --ids=1,113,340
```

To process all lessons after reviewing the checkpoint candidates, use `npm run enrich -- --all`. Existing outputs are skipped unless `--force` is passed. Use `npm test` to run the enrichment validation tests.

Apply validated enrichment candidates to the lesson manifest with:

```bash
npm run apply-enrichment
```

The apply step copies only the public study-note fields (`summary`, `keyPatterns`, and `vocabulary`) into `data/lessons.json` and records AI metadata. Evidence excerpts remain in the local candidate files.

Review Google's [Gemini pricing and data-use terms](https://ai.google.dev/gemini-api/docs/pricing) before sending lesson content: Google's current documentation distinguishes the free tier (submitted content may be used to improve products) from paid tier (content is not used for product improvement).

## Important

The included `data/lessons.json` remains the canonical 340-record lesson manifest. Source extraction results and their per-lesson statuses are stored separately in `data/source-lessons/`.

`npm run refresh` rebuilds the canonical manifest and requires outbound access to the course source.

## Next pipeline stage

After the AI enrichment candidates are reviewed:

1. Review each candidate's summary, patterns, vocabulary, and cited source excerpts.
2. Promote approved content to `data/lessons.json` with a deliberate data update.
3. Validate the canonical lesson manifest again.
