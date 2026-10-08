You are the senior implementation agent for the Dynamic English Player project.

IMPORTANT:
Before making any changes, read the complete `AGENTS.md` file at the repository root. Treat it as the master specification and source of truth.

The project has now been successfully deployed to Vercel:

https://new-dynamic-english-player-ashen.vercel.app/

The current problem is:

- The web app is deployed successfully.
- Some lessons, for example Lesson 01 and Lesson 302, can display Transcript and/or AI Enriched content.
- However, many other lessons do NOT display Transcript and/or AI Enriched content.
- The goal now is to fully audit the existing implementation and then complete Phase 5 (Transcript API) and Phase 6 (AI Enrichment) for all 340 lessons.

DO NOT assume that the problem is only a frontend problem.

The failure may exist in:
- source HTML extraction
- lesson data
- audio/source URL resolution
- transcript extraction
- serverless API
- Vercel runtime
- AI enrichment pipeline
- generated JSON data
- frontend rendering
- environment variables
- caching
- deployment configuration
- differences between lesson page structures

==================================================
1. NON-NEGOTIABLE RULES
==================================================

DO NOT GUESS.

DO NOT invent lesson content.

DO NOT invent transcript content.

DO NOT invent vocabulary, grammar explanations, summaries, or sentence patterns.

DO NOT silently change the architecture defined in AGENTS.md.

DO NOT migrate Vanilla JavaScript to React, Next.js, Vue, or another framework.

DO NOT replace Vercel.

DO NOT download or copy the original course audio.

DO NOT introduce authentication.

DO NOT introduce a database unless explicitly approved.

DO NOT expose Gemini/API keys in frontend code.

DO NOT create an arbitrary URL proxy.

DO NOT make destructive Git operations.

DO NOT delete working functionality without understanding it.

DO NOT rewrite large parts of the application simply for stylistic reasons.

Prefer the smallest reliable fix.

If an important architectural decision is unclear, STOP and ask the project owner.

==================================================
2. CURRENT PROJECT STATE
==================================================

The project is the Dynamic English Player for:

https://lopngoaingu.com/Dynamic_English_Study/index.php

There are 340 lessons:

Part 1: 1–100
Part 2: 101–200
Part 3: 201–300
Part 4: 301–340

Lesson URL:

https://lopngoaingu.com/Dynamic_English_Study/index.php?id={LESSON_ID}

The application should provide:

- lesson navigation
- audio playback
- lesson summary
- key sentence patterns
- vocabulary
- transcript
- progress tracking
- responsive UI

Audio should continue to stream directly from the original source.

==================================================
3. FIRST: COMPLETE REPOSITORY AUDIT
==================================================

Before modifying anything, inspect the entire repository.

Inspect at minimum:

- AGENTS.md
- package.json
- README.md
- all frontend HTML files
- all CSS files
- all JavaScript files
- data/
- scripts/
- API/serverless functions
- Vercel configuration
- generated lesson data
- transcript-related code
- AI enrichment-related code
- validation scripts
- build scripts
- environment variable usage
- deployment configuration

Also inspect the Git status.

Do not modify anything during the first audit.

Produce an initial report containing:

### A. Architecture
What is the current architecture?

### B. Data pipeline
How are the 340 lessons currently represented?

### C. Transcript
How is Transcript currently implemented?

### D. AI enrichment
How is AI Enrichment currently implemented?

### E. Frontend
How does the frontend load and display transcript and AI data?

### F. Deployment
How does the application behave on Vercel?

### G. Environment variables
Which environment variables are expected?

Do NOT reveal the values of secrets.

### H. Known failures
Identify exactly which lessons currently fail and how.

### I. Root-cause hypotheses
List evidence-based possible causes.

Do not immediately implement fixes based only on assumptions.

==================================================
4. USE WORKING LESSONS AS CONTROL CASES
==================================================

This is extremely important.

The current application has at least:

- Lesson 01 that works
- Lesson 302 that works

Use these as control cases.

Compare working and failing lessons.

Test at least:

- Lesson 1
- Lesson 2
- Lesson 10
- Lesson 50
- Lesson 100
- Lesson 101
- Lesson 113
- Lesson 150
- Lesson 200
- Lesson 201
- Lesson 250
- Lesson 300
- Lesson 301
- Lesson 302
- Lesson 303
- Lesson 340

If possible, also test all 340 lessons.

For each lesson determine:

- source page accessible?
- source HTML fetched?
- title extracted?
- audio URL extracted?
- transcript extracted?
- source content extracted?
- AI enrichment available?
- frontend rendering successful?

Create a diagnostic matrix such as:

| Lesson | Source | Content | Transcript | AI | Frontend |
|---|---|---|---|---|---|
| 1 | PASS | PASS | PASS | PASS | PASS |
| 2 | PASS | PASS | FAIL | FAIL | FAIL |
| 302 | PASS | PASS | PASS | PASS | PASS |

Do not claim PASS unless it was actually verified.

==================================================
5. PHASE 5 — TRANSCRIPT API
==================================================

The target architecture is:

Browser
    ↓
GET /api/transcript?id=N
    ↓
Vercel Serverless Function
    ↓
Known lesson URL
    ↓
Fetch source page
    ↓
Extract lesson-specific content
    ↓
Clean / sanitize
    ↓
Return transcript/content
    ↓
Browser renders it

The endpoint MUST accept only a lesson ID.

Correct:

/api/transcript?id=113

Incorrect:

/api/transcript?url=https://example.com

The endpoint must:

1. Validate the lesson ID.
2. Require an integer.
3. Require 1 <= id <= 340.
4. Resolve the lesson ID against known lesson data.
5. Fetch the known source URL.
6. Extract the correct lesson content.
7. Remove irrelevant website navigation/ads/footer.
8. Preserve meaningful lesson structure.
9. Sanitize output.
10. Return useful structured data.
11. Handle timeout/fetch errors.
12. Handle extraction failures.
13. Return meaningful HTTP status codes.
14. Never fabricate transcript content.

==================================================
6. INVESTIGATE SOURCE HTML DIFFERENCES
==================================================

This is likely one of the most important debugging tasks.

Do NOT assume every lesson page has identical HTML.

Compare the source HTML of:

- Lesson 1
- Lesson 302
- one or more failing lessons

Look for differences in:

- HTML containers
- IDs
- classes
- headings
- tables
- paragraphs
- dialogue sections
- vocabulary sections
- nested elements
- audio elements
- encoding
- whitespace
- special characters
- page templates

If the current extractor depends on one CSS selector that only works for some lessons, improve it using evidence from the actual source pages.

Prefer robust extraction based on the actual lesson structure.

Do NOT solve the problem by simply selecting a larger parent container if that would include navigation, advertisements, unrelated content, or duplicated material.

==================================================
7. TRANSCRIPT RESPONSE CONTRACT
==================================================

Prefer a structured API response rather than returning uncontrolled raw HTML.

For example:

{
  "id": 113,
  "title": "...",
  "sourceUrl": "...",
  "content": "...",
  "sections": [
    {
      "title": "...",
      "content": "..."
    }
  ],
  "status": "success"
}

If the existing project already has a good response schema, preserve it rather than unnecessarily changing it.

The frontend must correctly handle:

- loading
- success
- empty response
- source unavailable
- extraction failure
- invalid lesson
- server error

The UI must not silently fail.

==================================================
8. PHASE 6 — AI ENRICHMENT
==================================================

The AI enrichment pipeline should be:

Source lesson
    ↓
Clean source content
    ↓
AI
    ↓
Structured JSON
    ↓
Schema validation
    ↓
Store enriched result
    ↓
Frontend

The AI must generate only information grounded in the source lesson.

Expected output:

{
  "summary": "...",
  "keyPatterns": [
    {
      "pattern": "...",
      "meaning": "..."
    }
  ],
  "vocabulary": [
    {
      "word": "...",
      "meaning": "..."
    }
  ]
}

Initial target:

Summary:
2–5 concise points

Key sentence patterns:
2–5 useful patterns

Vocabulary:
5–10 useful words

These are targets, not mandatory numbers.

If a lesson contains fewer useful items, do not invent additional items.

==================================================
9. AI PROVIDER
==================================================

Inspect the existing implementation first.

If the project is already using Gemini, preserve the existing Gemini architecture unless there is a demonstrated technical problem.

Do NOT switch AI providers simply because you prefer another provider.

The API key must remain server-side.

Use environment variables.

Never expose:

GEMINI_API_KEY

or any other secret in:

- frontend JavaScript
- HTML
- generated public JSON
- GitHub
- client-side network requests

If the current AI implementation is calling Gemini directly from the browser, identify this as a security issue and fix it using a server-side API/serverless function.

Do not expose the API key.

==================================================
10. AI ENRICHMENT DATA STRATEGY
==================================================

The preferred approach for this project is:

Generate AI enrichment as data rather than generating it repeatedly every time a user opens a lesson.

Avoid this architecture:

User opens lesson
    ↓
Call AI API
    ↓
Generate summary
    ↓
Display

for every page visit.

Prefer:

Source lesson
    ↓
AI enrichment pipeline
    ↓
Validated lesson data
    ↓
Frontend reads existing data

This reduces:

- API cost
- latency
- quota problems
- inconsistent output
- production failures

If the current architecture is already different, inspect it first and determine whether it should be repaired or incrementally improved.

Do not redesign it unnecessarily.

==================================================
11. COMPLETE ALL 340 LESSONS
==================================================

After fixing the pipeline, process ALL 340 lessons.

Do not stop after fixing Lessons 1 and 302.

Every lesson should have a clear status.

For example:

{
  "id": 1,
  "contentStatus": "validated",
  "aiStatus": "completed"
}

Possible AI states:

- pending
- processing
- completed
- failed
- skipped

Possible content states:

- seed
- fetched
- validated
- failed

Do not mark a lesson as completed unless the operation actually succeeded.

==================================================
12. VALIDATION MATRIX
==================================================

Create a validation process that checks all 340 lessons.

At minimum validate:

### Source

- source URL exists
- source page can be fetched

### Lesson data

- lesson ID correct
- part correct
- title exists

### Audio

- audio URL exists
- do not claim HTTP success unless actually tested

### Transcript

- transcript endpoint resolves
- content is non-empty
- content belongs to the correct lesson
- no obvious site-wide navigation pollution

### AI

- summary exists
- keyPatterns is an array
- vocabulary is an array
- JSON schema is valid
- no empty malformed objects

### Frontend

- lesson loads
- transcript button works
- AI content renders

==================================================
13. IMPORTANT: DO NOT HIDE FAILURES
==================================================

If a lesson cannot be processed:

DO NOT fabricate data.

DO NOT copy another lesson's data.

DO NOT mark it as completed.

Record the failure.

For example:

{
  "id": 147,
  "contentStatus": "failed",
  "error": "Source content container not found"
}

This makes the pipeline recoverable.

==================================================
14. VERCEL-SPECIFIC CHECKS
==================================================

Inspect the Vercel deployment configuration.

Verify:

- serverless functions are located correctly
- runtime is compatible
- Node version is supported
- build command is correct
- output directory is correct
- environment variables are available to server-side functions
- no local filesystem assumptions exist in production
- no dependency is unavailable in Vercel
- API routes work in production

Test the production deployment:

https://new-dynamic-english-player-ashen.vercel.app/

Do not assume that local development behavior equals Vercel behavior.

If something works locally but fails on Vercel, investigate the runtime difference.

==================================================
15. CACHING AND PERFORMANCE
==================================================

Transcript should not unnecessarily fetch the source page multiple times for every request if caching can safely be used.

However, do not introduce complicated infrastructure.

Use a simple reliable caching strategy compatible with Vercel if appropriate.

Do not cache incorrect or failed extraction results permanently.

AI enrichment should preferably be precomputed rather than generated on every page load.

==================================================
16. FRONTEND ERROR UX
==================================================

When Transcript is unavailable, the user should see a useful message.

For example:

"Transcript is currently unavailable for this lesson."

Not:

- blank section
- silent failure
- JavaScript exception visible only in console

Similarly for AI:

"AI-enriched content is not available for this lesson yet."

The UI should distinguish between:

- loading
- available
- unavailable
- error

==================================================
17. DO NOT CHANGE THE PRODUCT DESIGN UNNECESSARILY
==================================================

The current task is primarily:

1. audit
2. fix Transcript API
3. fix source extraction
4. complete AI enrichment
5. validate all 340 lessons

Do not spend time redesigning the UI unless a UI problem directly prevents Transcript or AI Enrichment from working.

Preserve the existing visual design.

==================================================
18. TESTING STRATEGY
==================================================

Use three levels of testing.

LEVEL 1 — Local

Run the project locally.

Test API routes and frontend.

LEVEL 2 — Data pipeline

Run the data extraction and validation scripts.

Verify all 340 records.

LEVEL 3 — Production

Test:

https://new-dynamic-english-player-ashen.vercel.app/

Verify representative lessons and then all lessons if practical.

At minimum production-test:

1
2
10
50
100
101
113
150
200
201
250
300
301
302
303
340

==================================================
19. SUCCESS CRITERIA
==================================================

Phase 5 is complete only when:

- Transcript API works reliably;
- valid IDs 1–340 work;
- invalid IDs are rejected;
- source content is extracted correctly;
- Lessons 1 and 302 continue working;
- previously failing lessons are repaired;
- no arbitrary URL proxy exists;
- production Vercel API works;
- frontend displays transcript correctly.

Phase 6 is complete only when:

- AI enrichment pipeline works;
- output is schema-valid;
- content is grounded in source lessons;
- API keys remain server-side;
- all processable lessons 1–340 are enriched;
- failures are explicitly recorded;
- frontend displays AI content correctly;
- production deployment contains the enriched data.

==================================================
20. REQUIRED WORKFLOW
==================================================

Follow this exact order.

STEP 1
Audit the entire repository.

STEP 2
Identify the actual root cause(s).

STEP 3
Show me the audit findings.

STEP 4
Implement the smallest reliable fix for Transcript/source extraction.

STEP 5
Test against working and failing lessons.

STEP 6
Run the full 340-lesson content validation.

STEP 7
Fix remaining extraction failures.

STEP 8
Implement/fix AI enrichment.

STEP 9
Run AI enrichment for all 340 lessons.

STEP 10
Validate the generated data.

STEP 11
Integrate/fix frontend rendering.

STEP 12
Run production tests against Vercel.

STEP 13
Provide a final report.

==================================================
21. FINAL REPORT FORMAT
==================================================

At the end, report:

## Implemented

- ...

## Root Causes Found

- ...

## Transcript

- Working lessons:
- Failed lessons:
- Fixed lessons:
- Remaining failures:

## AI Enrichment

- Total lessons:
- Successfully enriched:
- Failed:
- Skipped:

## Production Validation

- Local:
- Vercel:
- API:
- Frontend:

## Files Changed

- ...

## Environment Variables Required

List variable NAMES only.
Never print secret values.

## Known Limitations

- ...

## Recommended Next Step

- ...

==================================================
22. MOST IMPORTANT PRINCIPLE
==================================================

Do not optimize for "making the UI appear to work."

Optimize for:

Reliable source extraction
        ↓
Reliable transcript
        ↓
Validated AI enrichment
        ↓
Reliable lesson data
        ↓
Correct frontend rendering
        ↓
Production verification

If the source data is wrong, fixing the frontend is not a real solution.

If the AI data is fabricated, displaying it is not a successful implementation.

If a lesson cannot be verified, report it as failed rather than guessing.

You are an implementation agent.

Preserve the established architecture.

Do not guess.

Inspect first.

Fix systematically.

Validate all 340 lessons.

Only declare completion after production verification.


----

Review verdict
Hạng mục	Đánh giá
Core architecture	🟢 Tốt
Vanilla JS / simplicity	🟢 Tốt
Frontend study-note rendering	🟢 Tốt
Transcript security	🟢 Tốt
Data separation	🟢 Tốt
Enrichment workflow clarity	🟠 Cần cải thiện
AI candidate validation	🟠 Thiếu validation command riêng
Pending → production control	🔴 Cần sửa
Nguyên nhân NOT ENRICHED	Đã xác định