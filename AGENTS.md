# AGENTS.md

# Dynamic English Player — Master Specification

> **Purpose:** This document is the authoritative engineering specification for AI coding agents working on the Dynamic English Player project.
>
> Compatible with: **Codex, GitHub Copilot, Roo Code, and other coding agents operating inside VS Code.**

---

## 1. Role of the Coding Agent

You are an **implementation agent**, not the product owner.

Your responsibility is to:

- understand the existing project;
- preserve established product and architecture decisions;
- implement requested features incrementally;
- validate your changes;
- identify uncertainty;
- avoid inventing information;
- avoid unnecessary complexity;
- protect existing user work.

You MUST NOT silently replace product decisions with your own preferred architecture.

### Priority order

When making decisions, follow this order:

1. Explicit project-owner decisions
2. This `AGENTS.md`
3. Existing working architecture/code
4. Verified source facts
5. Conventional engineering practices
6. Agent preference

If two requirements conflict, follow the higher-priority item.

---

# 2. Project Overview

## Product

**Dynamic English Player**

A lightweight personal web application for studying the **Anh Ngữ Sinh Động / New Dynamic English** course.

The application provides:

- lesson navigation;
- audio playback;
- lesson summaries;
- key sentence patterns;
- vocabulary;
- embedded transcripts;
- progress tracking;
- search;
- desktop and mobile study experience.

The product should prioritize:

> **Lesson → Audio → Study Information → Transcript**

The application is intentionally simple and focused.

---

# 3. Source Course

Primary source:

`https://lopngoaingu.com/Dynamic_English_Study/index.php`

Course structure:

| Part | Lessons |
|---|---:|
| Part 1 | 1–100 |
| Part 2 | 101–200 |
| Part 3 | 201–300 |
| Part 4 | 301–340 |
| **Total** | **340** |

Lesson URL pattern:

`https://lopngoaingu.com/Dynamic_English_Study/index.php?id={LESSON_ID}`

Example:

`https://lopngoaingu.com/Dynamic_English_Study/index.php?id=1`

---

# 4. Important Source Validation Rule

The source website is external and may change.

Possible changes include:

- HTML structure;
- lesson content;
- audio URLs;
- navigation;
- availability;
- server behavior;
- CORS behavior.

Therefore:

## NEVER assume that an external source is stable.

## NEVER claim that all 340 lessons or audio URLs have been verified unless they have actually been live-validated.

The current data pipeline contains a **340-lesson seed manifest**, but this is NOT equivalent to successfully fetching and validating all 340 lesson pages.

The agent must clearly distinguish between:

- `seed`
- `fetched`
- `validated`
- `failed`
- `AI-enriched`

---

# 5. Product Decisions Already Confirmed

These decisions are authoritative.

## 5.1 Audio

Use:

**A — stream the original audio directly from LopNgoaiNgu.com.**

Do NOT:

- download the course audio;
- copy the audio into the repository;
- upload the audio to Vercel;
- mirror the audio;
- proxy the audio through our server;

unless the project owner explicitly approves a change.

Observed audio pattern:

`https://lopngoaingu.com/Dynamic_English_Study/audio/{lessonId}.mp3`

However:

> The actual MP3 URL should preferably be extracted from the lesson page.

The URL pattern may be used as a fallback only.

Never claim that the fallback URL has been verified unless it has actually been requested successfully.

---

# 6. Lesson Content + AI

The application uses:

**Source content + AI-generated structured study information.**

AI output may include:

- concise lesson summary;
- key sentence patterns;
- vocabulary.

AI output MUST be grounded in the source lesson.

AI MUST NOT invent:

- dialogue;
- vocabulary;
- grammar rules;
- meanings;
- examples presented as source facts;
- lesson topics;
- facts that do not appear in the source.

If the source does not contain enough information, the correct behavior is to say that the information is unavailable rather than fabricate it.

---

# 7. Transcript Architecture

Transcript must appear **inside the application**.

The user should NOT be redirected to the original website simply to read the transcript.

Do NOT use an iframe as the primary architecture.

## Required architecture

```text
Browser
   ↓
GET /api/transcript?id=N
   ↓
Vercel Serverless Function
   ↓
Fetch known source lesson URL
   ↓
Extract lesson content
   ↓
Clean / sanitize
   ↓
Return structured transcript
   ↓
Browser renders transcript
```

Transcript is:

- hidden by default;
- opened using "Show Transcript";
- loaded on demand.

Example UI:

```html
<button
  aria-expanded="false"
  aria-controls="transcript"
>
  Show Transcript
</button>
```

---

# 8. Transcript API Security

Required endpoint:

```text
GET /api/transcript?id=N
```

The endpoint MUST:

1. validate `id`;
2. require an integer;
3. require `1 <= id <= 340`;
4. resolve the ID against the known lesson dataset;
5. fetch only the known source URL;
6. extract the lesson content;
7. sanitize the result;
8. return structured data or safe HTML;
9. handle errors gracefully.

## NEVER implement:

```text
/api/transcript?url=https://example.com
```

Do not create an arbitrary remote URL proxy.

This would create an unnecessary SSRF risk.

---

# 9. Authentication / User Accounts

MVP:

**No login.**

Progress is stored locally using:

```text
localStorage
```

The architecture should remain reasonably ready for future:

- authentication;
- cloud synchronization;
- user accounts.

However:

## DO NOT implement authentication now.

## DO NOT introduce a database solely for MVP progress.

---

# 10. Privacy

The initial application is:

**Private / personal first.**

No unnecessary:

- analytics;
- tracking;
- user profiles;
- email collection;
- advertising;
- third-party tracking.

Public sharing can be considered later.

Do not implement public-user infrastructure unless explicitly requested.

---

# 11. Technology Stack

The confirmed MVP stack is:

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Hosting

**Vercel**

### Repository

**GitHub**

Do NOT migrate the project to:

- React;
- Next.js;
- Vue;
- Angular;
- Svelte;

unless the project owner explicitly approves the change.

The project should remain simple.

---

# 12. Do Not Over-Engineer

Prefer:

> **Simple + reliable**

Avoid premature introduction of:

- microservices;
- Kubernetes;
- queues;
- complex state management;
- database;
- authentication;
- CMS;
- analytics;
- payments;
- complicated build systems.

A small vanilla JS application is intentional.

---

# 13. Desktop UX

Desktop layout should contain:

## Left sidebar

- lesson search;
- progress indicator;
- Part 1;
- Part 2;
- Part 3;
- Part 4;
- lesson status.

Example:

```text
12 / 340
```

Lesson status:

```text
✓ Completed
▶ Current
○ Not started
```

## Main content

Display:

1. lesson number;
2. lesson title;
3. audio player;
4. summary;
5. key sentence patterns;
6. vocabulary;
7. Show Transcript;
8. Mark as Completed.

---

# 14. Mobile UX

Mobile must provide:

- collapsible lesson menu;
- readable lesson content;
- fixed bottom audio controls;
- no horizontal overflow;
- touch-friendly controls.

Do not simply shrink the desktop layout.

---

# 15. Audio Player Requirements

MVP audio player must support:

- Play;
- Pause;
- Previous;
- Next;
- Seek;
- Progress bar;
- Current time;
- Duration;
- Volume;
- Playback speed;
- Auto-next;
- Current lesson indicator.

Playback speeds:

```text
0.75x
1x
1.25x
1.5x
2x
```

---

# 16. Audio State Persistence

Persist playback speed:

```text
dynamicEnglishPlaybackSpeed
```

Persist current lesson:

```text
dynamicEnglishLastLesson
```

Persist playback positions:

```text
dynamicEnglishPositions
```

Example:

```js
{
  6: 124,
  7: 82,
  8: 193
}
```

This means:

```text
Lesson 6 → 124 seconds
Lesson 7 → 82 seconds
Lesson 8 → 193 seconds
```

---

# 17. Completion Behavior

Do NOT automatically mark a lesson as completed merely because audio reaches the end.

The user should explicitly select:

```text
Mark as Completed
```

A reminder near the end of a lesson is acceptable.

---

# 18. Progress Data

Suggested structure:

```js
{
  completed: [1, 2, 5, 6],
  currentLesson: 6,
  lastPosition: {
    6: 124
  }
}
```

Suggested localStorage keys:

```text
dynamicEnglishProgress
dynamicEnglishPlaybackSpeed
dynamicEnglishLastLesson
dynamicEnglishPositions
```

All localStorage access should be centralized.

The application must gracefully handle:

- missing data;
- malformed JSON;
- corrupted localStorage;
- invalid lesson IDs.

Do not allow corrupted localStorage to crash the application.

---

# 19. Lesson Data Schema

The canonical lesson record is:

```js
{
  id: 1,
  part: 1,
  lessonNumber: 1,
  title: "...",
  sourceUrl: "https://lopngoaingu.com/Dynamic_English_Study/index.php?id=1",
  audioUrl: "https://lopngoaingu.com/Dynamic_English_Study/audio/1.mp3",

  summary: null,

  keyPatterns: [],

  vocabulary: [],

  transcript: {
    mode: "source-proxy",
    endpoint: "/api/transcript?id=1"
  },

  metadata: {
    source: "lopngoaingu.com",
    fetchedAt: "...",
    contentStatus: "...",
    aiStatus: "pending"
  }
}
```

---

# 20. AI-Enriched Lesson Schema

Example:

```json
{
  "summary": "Short explanation of lesson.",
  "keyPatterns": [
    {
      "pattern": "Could you ...?",
      "meaning": "..."
    }
  ],
  "vocabulary": [
    {
      "word": "example",
      "meaning": "..."
    }
  ]
}
```

Initial target:

```text
Summary:
2–5 concise points

Key patterns:
2–5 patterns

Vocabulary:
5–10 words
```

These are defaults, not rigid limits.

The actual source should determine whether an item is useful.

---

# 21. AI Provider

The AI provider/model is NOT currently a fixed architectural decision.

If choosing an AI provider affects:

- cost;
- privacy;
- deployment;
- API architecture;
- long-term maintenance;

the agent must ask the project owner before committing to the choice.

API keys MUST NEVER be placed in frontend JavaScript.

Use server-side environment variables.

---

# 22. Existing Data Pipeline v1

The project previously established a data pipeline containing:

```text
dynamic-english-data-pipeline/
├── package.json
├── README.md
├── data/
│   └── lessons.json
└── scripts/
    ├── build-data.mjs
    └── validate-data.mjs
```

`package.json`:

```json
{
  "name": "dynamic-english-data-pipeline",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node scripts/build-data.mjs",
    "validate": "node scripts/validate-data.mjs",
    "refresh": "npm run build && npm run validate"
  }
}
```

---

# 23. Current build-data.mjs Behavior

The existing pipeline:

1. fetches the main course index;
2. extracts lesson links;
3. identifies lessons 1–340;
4. fetches lesson pages sequentially;
5. extracts lesson title;
6. attempts to extract MP3 URL;
7. creates lesson records;
8. writes `data/lessons.json`.

Audio extraction checks:

- `<audio src>`;
- `<source src>`;
- MP3 links.

Current fallback:

```text
https://lopngoaingu.com/Dynamic_English_Study/audio/{id}.mp3
```

Important:

> A fallback URL in the generated JSON does NOT mean the audio has been verified.

---

# 24. Current Validation

`validate-data.mjs` should validate:

- exactly 340 lessons;
- unique IDs;
- IDs 1–340;
- correct part mapping;
- source URLs;
- audio URL format;
- summary field;
- keyPatterns array;
- vocabulary array.

Part mapping:

```text
1–100   → Part 1
101–200 → Part 2
201–300 → Part 3
301–340 → Part 4
```

---

# 25. Data Status Rule

The current `data/lessons.json` is a:

> **340-record seed manifest**

It must NOT be described as:

> "all 340 lessons have been successfully verified"

unless a real live extraction/validation run has been completed.

The agent should preserve meaningful metadata such as:

```js
contentStatus
aiStatus
fetchedAt
```

Possible statuses include:

```text
seed
fetched
validated
failed
```

---

# 26. Source Content Extraction — Next Major Milestone

The next engineering milestone is:

> **Build a robust source-content extraction pipeline.**

Do NOT jump directly to UI polish if the underlying source data is unreliable.

The extractor should fetch each lesson page and preserve meaningful lesson content.

Expected content may include:

- lesson introduction;
- dialogue;
- vocabulary;
- explanations;
- sentence patterns;
- CUT sections;
- Vietnamese explanations;
- useful headings;
- meaningful audio/music markers where appropriate.

Remove:

- global navigation;
- unrelated menus;
- advertisements;
- footer;
- site-wide controls;
- irrelevant page chrome.

---

# 27. Extraction Output

Prefer storing source content separately, for example:

```text
data/
├── lessons.json
└── source-lessons/
    ├── 1.json
    ├── 2.json
    ├── ...
    └── 340.json
```

Possible structure:

```json
{
  "id": 1,
  "sourceUrl": "...",
  "title": "...",
  "content": "...",
  "sections": [],
  "fetchedAt": "...",
  "status": "fetched"
}
```

Do not change the canonical lesson schema unnecessarily.

---

# 28. Extraction Validation

Before running extraction across all 340 lessons:

Test against at least:

```text
Lesson 1
Lesson 113
Lesson 340
```

These are representative checkpoints.

If the extraction boundary is ambiguous:

## STOP AND ASK.

Do not guess which HTML elements constitute lesson content.

---

# 29. AI Enrichment Pipeline

Target architecture:

```text
Source lesson
     ↓
Clean extracted content
     ↓
AI processing
     ↓
Schema validation
     ↓
Enriched lesson data
```

AI should produce:

```text
summary
keyPatterns
vocabulary
```

AI output must be validated before being written into production data.

---

# 30. Frontend Architecture

Use modular vanilla JavaScript.

Logical modules should include:

```text
lessons
player
progress
transcript
ui
```

Responsibilities:

### lessons

- load lessons;
- find lesson;
- group by part;
- search lessons.

### player

- play;
- pause;
- next;
- previous;
- seek;
- speed;
- volume;
- position persistence.

### progress

- completed lessons;
- current lesson;
- localStorage.

### transcript

- request transcript;
- loading state;
- success;
- error;
- rendering.

### ui

- sidebar;
- lesson display;
- status;
- buttons;
- responsive behavior.

Do not put the entire application into one giant JavaScript file if the project has grown beyond a trivial size.

---

# 31. Performance

The application contains 340 lessons.

Therefore:

## Do

- load lesson metadata efficiently;
- render lesson details on demand;
- fetch transcript only when requested;
- preload only the current audio when appropriate;
- use efficient search/filtering.

## Do NOT

- render all detailed lesson content simultaneously;
- fetch all transcripts on startup;
- preload all 340 audio files;
- make 340 transcript requests when the app loads.

---

# 32. Accessibility

The application should support:

- semantic HTML;
- keyboard navigation;
- visible focus;
- accessible button labels;
- sufficient contrast;
- accessible audio controls;
- ARIA state where appropriate.

Transcript toggle example:

```html
<button
  aria-expanded="false"
  aria-controls="transcript"
>
  Show Transcript
</button>
```

When opened:

```html
aria-expanded="true"
```

---

# 33. Visual Design

The visual style should be:

- clean;
- lightweight;
- modern;
- study-oriented;
- focused.

Avoid:

- huge hero sections;
- excessive gradients;
- excessive animation;
- decorative clutter;
- unnecessary cards;
- excessive gamification.

The primary visual hierarchy is:

```text
Lesson
↓
Audio
↓
Study Information
↓
Transcript
```

---

# 34. Security

The agent must:

- never expose API keys;
- sanitize untrusted HTML;
- avoid unsafe HTML injection;
- validate all external data;
- validate lesson IDs;
- avoid arbitrary remote fetches;
- avoid SSRF;
- use environment variables for secrets;
- avoid unnecessary third-party scripts.

Never blindly use:

```js
element.innerHTML = untrustedContent;
```

unless the content has been properly sanitized or is known-safe static application content.

---

# 35. Git Safety

Never run destructive Git operations without explicit approval.

Do NOT automatically use:

```text
git reset --hard
git clean -fd
git checkout -- .
git restore .
```

Do not overwrite existing user work.

Before significant changes:

```text
inspect git status
inspect relevant files
understand current state
```

---

# 36. Existing Project First

Before editing the project:

1. inspect repository structure;
2. inspect `package.json`;
3. inspect existing data files;
4. inspect deployment configuration;
5. inspect Git status;
6. identify current implementation;
7. identify existing scripts;
8. identify what is already working.

Do NOT recreate files blindly.

Do NOT overwrite an existing implementation simply because a cleaner implementation is possible.

---

# 37. Dependency Policy

Before adding a dependency, ask:

1. Is it actually necessary?
2. Can native browser/Node functionality solve it?
3. What is the bundle-size impact?
4. Is the dependency actively maintained?
5. Does it complicate Vercel deployment?
6. Does it create unnecessary security or licensing concerns?

Prefer fewer dependencies.

---

# 38. No-Guessing Rule

# DO NOT GUESS.

This is one of the most important project rules.

Use only:

1. current code;
2. project files;
3. verified source website;
4. explicit decisions in this specification.

If important information is missing:

1. identify the ambiguity;
2. state the relevant options;
3. ask the project owner.

---

# 39. Decisions Requiring Owner Approval

Ask before:

- changing frontend framework;
- changing hosting;
- materially changing data schema;
- introducing a paid service;
- selecting an AI provider where cost/privacy matters;
- changing source extraction boundaries;
- adding authentication;
- making the application public;
- downloading/copying course audio;
- adding a database when it is not required;
- introducing major infrastructure;
- changing the product's core UX.

Do NOT ask about decisions that are already explicitly settled in this specification.

---

# 40. Do Not Undo Confirmed Decisions

Never silently replace:

```text
Vanilla JS
```

with:

```text
React / Next.js / Vue
```

Never silently replace:

```text
Vercel
```

with another host.

Never silently replace:

```text
Direct original audio streaming
```

with downloaded/copied audio.

Never silently replace:

```text
Embedded server-side transcript
```

with a redirect.

Never silently replace:

```text
No-login MVP
```

with authentication.

Never silently replace:

```text
localStorage progress
```

with a database.

Alternatives can be proposed, but implementation requires owner approval.

---

# 41. Source Attribution

Where appropriate, display:

```text
Source: LopNgoaiNgu.com — New Dynamic English
```

Do not claim ownership of the original course content or audio.

The architecture intentionally streams original audio rather than downloading or republishing it.

If public redistribution is considered later:

> Review rights/licensing before implementation.

---

# 42. Error Handling

The application must handle:

### Lesson data

- missing lesson;
- malformed lesson;
- invalid ID;
- missing title;
- missing audio URL.

### Audio

- audio unavailable;
- network failure;
- unsupported source;
- playback failure.

### Transcript

- invalid ID;
- source unavailable;
- timeout;
- extraction failure;
- empty content.

### AI

- API failure;
- invalid response;
- malformed JSON;
- incomplete response;
- hallucinated/unverifiable output.

Errors should be visible and understandable.

Never silently substitute fabricated content.

---

# 43. Testing Requirements

## Data

Validate:

- 340 lessons;
- IDs 1–340;
- part mapping;
- source URLs;
- audio URLs;
- schema.

## Player

Test:

- play/pause;
- next;
- previous;
- seek;
- speed;
- volume;
- position persistence;
- auto-next.

## Progress

Test:

- mark complete;
- reload;
- localStorage persistence;
- current lesson;
- corrupted localStorage.

## Transcript

Test:

- open;
- close;
- loading;
- success;
- failure;
- invalid ID.

## Responsive

Test:

- desktop;
- tablet;
- mobile;
- no horizontal overflow.

---

# 44. Development Roadmap

## Phase 0 — Repository Inspection

- inspect current repository;
- understand existing architecture;
- inspect Git status;
- inspect data pipeline.

---

## Phase 1 — Stabilize Data Pipeline

Tasks:

- verify 340 lesson manifest;
- improve lesson extraction;
- extract actual audio URLs;
- validate lessons 1, 113, 340;
- execute live extraction for all 340 in an internet-enabled environment;
- record failures;
- distinguish verified data from fallback data.

---

## Phase 2 — Source Content Extraction

Tasks:

- implement robust HTML extraction;
- remove global page chrome;
- preserve lesson-specific content;
- save structured source content;
- validate lessons 1, 113, 340;
- process all 340 after extractor is trusted.

---

## Phase 3 — Transcript API

Implement:

```text
/api/transcript?id=N
```

Requirements:

- server-side fetch;
- ID validation;
- known URL resolution;
- source extraction;
- sanitization;
- error handling;
- no arbitrary URL fetching.

---

## Phase 4 — AI Enrichment

Implement:

```text
source content
→ AI
→ schema validation
→ enriched lesson data
```

Generate:

- summary;
- key patterns;
- vocabulary.

Never generate unsupported source facts.

---

## Phase 5 — Frontend MVP

Implement:

- lesson navigation;
- search;
- part navigation;
- lesson display;
- audio player;
- transcript;
- summary;
- key patterns;
- vocabulary;
- completion;
- localStorage progress.

---

## Phase 6 — UX / Accessibility

Improve:

- responsive design;
- keyboard navigation;
- focus states;
- ARIA;
- mobile player;
- error messages;
- loading states.

---

## Phase 7 — Testing

Run:

- data validation;
- player tests;
- transcript tests;
- progress tests;
- responsive checks;
- security review.

---

## Phase 8 — Deployment

Deploy to:

**Vercel**

Then verify:

- production lesson loading;
- audio playback;
- transcript API;
- localStorage;
- mobile layout;
- error handling.

---

# 45. Roadmap Snapshot

```text
[✓] Requirements clarified
[✓] 340-lesson structure identified
[✓] Audio strategy decided
[✓] Transcript strategy decided
[✓] Local progress strategy decided
[✓] MVP technology/deployment decided
[✓] Data schema defined
[✓] Data pipeline v1 created

[ ] Run live 340-page extraction
[ ] Validate real audio URLs
[ ] Build robust source-content extractor
[ ] Validate extraction against lessons 1/113/340
[ ] Build transcript serverless API
[ ] Build AI enrichment pipeline
[ ] Validate AI-generated data
[ ] Build frontend player
[ ] Build lesson navigation/search
[ ] Build progress persistence
[ ] Integrate transcript
[ ] Responsive/mobile polish
[ ] Accessibility pass
[ ] End-to-end testing
[ ] Vercel deployment
[ ] Production verification
```

---

# 46. Current Immediate Priority

The immediate engineering priority is:

> **Source-content extraction pipeline**

Do not prioritize cosmetic frontend work over data reliability.

The correct sequence is:

```text
Reliable source data
        ↓
Reliable transcript
        ↓
Reliable AI enrichment
        ↓
Frontend
        ↓
UX polish
```

---

# 47. Agent Working Protocol

For every non-trivial task:

## Step 1 — Read this file

Read `AGENTS.md` completely.

## Step 2 — Inspect

Inspect relevant repository files.

## Step 3 — Understand

Determine:

- what exists;
- what is missing;
- what is authoritative;
- what must remain unchanged.

## Step 4 — Plan

Create a short implementation plan.

## Step 5 — Implement

Make the smallest coherent change.

## Step 6 — Validate

Run relevant:

- build;
- test;
- validation;
- lint;
- data checks.

## Step 7 — Review

Check:

- regressions;
- security;
- data integrity;
- architecture consistency;
- responsive behavior.

## Step 8 — Report

Use this format:

```text
Implemented:
- ...

Validated:
- ...

Known limitations:
- ...

Next recommended step:
- ...
```

---

# 48. Continuation Prompt

When asked to continue development, use this procedure:

```text
Read AGENTS.md completely.

Inspect the repository and determine:

1. What is already implemented?
2. What data pipeline files exist?
3. What is missing from the current milestone?
4. Which files are authoritative?
5. Which build/test/validation commands exist?

Do not make architectural changes yet.

Report the current state and propose the smallest next implementation step consistent with AGENTS.md.
```

---

# 49. Definition of Done

A task is complete only when:

1. it is implemented;
2. existing behavior is preserved;
3. relevant tests/build/validation pass;
4. errors are handled;
5. no secrets are exposed;
6. data integrity is preserved;
7. documentation is updated if architecture changed;
8. the result is usable.

Do not declare a task complete simply because code was written.

---

# 50. Reporting Verified vs Unverified Information

Agents MUST distinguish between:

### Verified

Information directly confirmed by:

- repository files;
- successful HTTP requests;
- tests;
- validation scripts;
- explicit owner decisions.

### Assumed

Information inferred from:

- URL patterns;
- conventional architecture;
- incomplete source inspection.

### Unknown

Information that cannot currently be verified.

When reporting status, prefer:

```text
Verified:
- Lesson index contains lessons 1–340.

Not yet verified:
- Successful HTTP availability of every audio file.

Assumption:
- Audio URL pattern appears to follow /audio/{id}.mp3.

Unknown:
- Whether the source HTML structure remains identical for all 340 lessons.
```

Never turn an assumption into a fact.

---

# 51. Handling Ambiguity

If ambiguity affects:

- architecture;
- data correctness;
- source extraction;
- security;
- cost;
- privacy;
- product behavior;

STOP and ask the owner.

Example:

```text
The lesson page contains two possible content containers.

Option A:
Extract container X.

Option B:
Extract container Y.

The choice affects transcript accuracy.

Which should be authoritative?
```

Do not silently choose.

---

# 52. Preserve Existing Work

Before changing an existing file:

- read it;
- understand its role;
- preserve compatible behavior;
- modify only what is necessary.

Do not rewrite working code merely for stylistic preference.

Do not delete existing scripts or data without explicit justification.

---

# 53. Backward Compatibility

When changing the data schema:

1. explain why;
2. determine whether existing data is affected;
3. update validation;
4. update frontend consumers;
5. update scripts;
6. provide migration/backward compatibility where necessary;
7. update this specification if the architecture materially changes.

Schema changes require owner approval if they are material.

---

# 54. External Source Failure

If LopNgoaiNgu.com is unavailable:

Do NOT:

- fabricate lesson content;
- fabricate transcripts;
- fabricate audio URLs;
- mark the lesson as successfully fetched.

Instead:

```text
status: "failed"
```

and record an appropriate error.

The pipeline should be retryable.

---

# 55. Audio Rights / Distribution Rule

The application is intentionally designed around:

```text
Original source audio
        ↓
Direct browser streaming
```

Do not create:

```text
Source audio
        ↓
Download
        ↓
Copy into repository
        ↓
Redistribute
```

unless explicitly approved after reviewing rights/licensing.

---

# 56. Future Features — Not MVP

Potential future features include:

- login;
- cloud sync;
- statistics;
- bookmarks;
- notes;
- vocabulary review;
- spaced repetition;
- public sharing;
- PWA;
- offline support.

These are **future possibilities**, not current requirements.

Do not implement them unless explicitly requested.

---

# 57. Final Non-Negotiable Rules

## 1. Do not guess.

## 2. Do not invent source content.

## 3. Do not silently change confirmed architecture.

## 4. Do not download or copy course audio.

## 5. Keep transcript inside the application through server-side extraction.

## 6. Keep the MVP simple.

## 7. No login initially.

## 8. Use localStorage for initial progress.

## 9. Validate all 340 lesson records.

## 10. Never claim data is verified when it has not been live-validated.

## 11. Never expose API keys in frontend code.

## 12. Never make the transcript endpoint an arbitrary URL proxy.

## 13. Preserve existing user work.

## 14. Test before declaring a task complete.

## 15. If an important decision cannot be established from this specification, the existing code, or a verified source, ask the project owner.

---

# 58. Master Principle

The most important principle for every coding agent working on this project is:

> **Preserve decisions, implement incrementally, verify facts, protect data integrity, and surface uncertainty instead of guessing.**

The agent should optimize for:

```text
Reliable
   ↓
Simple
   ↓
Maintainable
   ↓
Useful
```

—not for architectural sophistication.

---

# END OF AGENTS.md