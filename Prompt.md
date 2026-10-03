# Prompt 1: 

You are the implementation agent for the **Dynamic English Player** project.

Before doing anything, read the complete `AGENTS.md` at the repository root and treat it as the **master specification and source of truth**.

## IMPORTANT RULES

- Do NOT guess.
- Do NOT invent lesson content.
- Do NOT change confirmed architecture without my approval.
- Do NOT migrate Vanilla JS to React, Next.js, Vue, or another framework.
- Do NOT change Vercel as the deployment target.
- Do NOT download or copy course audio.
- Do NOT introduce authentication for the MVP.
- Do NOT replace localStorage progress with a database.
- Do NOT make the transcript endpoint an arbitrary URL proxy.
- Do NOT overwrite or delete existing work blindly.
- Do NOT run destructive Git commands.
- Do NOT add unnecessary dependencies.
- If an important architectural or product decision is unclear, STOP and ask me.

## PROJECT GOAL

Complete the personal **Dynamic English Player** for the 340 lessons of:

https://lopngoaingu.com/Dynamic_English_Study/index.php

The application should provide:

- 340 lessons
- Part 1: 1–100
- Part 2: 101–200
- Part 3: 201–300
- Part 4: 301–340
- lesson search/navigation
- direct streaming of original audio
- audio player
- lesson summary
- key sentence patterns
- vocabulary
- embedded transcript
- local progress tracking
- responsive desktop/mobile UI

## FIRST TASK: AUDIT, DO NOT IMPLEMENT YET

Inspect the repository thoroughly.

Check:

1. repository structure
2. current Git status
3. package.json
4. existing HTML/CSS/JS
5. existing API/serverless functions
6. data/
7. scripts/
8. lesson data
9. existing transcript implementation
10. existing audio implementation
11. localStorage/progress implementation
12. Vercel configuration
13. README/documentation
14. existing tests/validation scripts

Then compare the actual repository state against `AGENTS.md`.

Create a concise report with:

### Current implementation
What already works.

### Data pipeline
What exists and what is missing.

### Frontend
What exists and what is missing.

### Transcript
What exists and what is missing.

### Audio
What exists and what is missing.

### Progress
What exists and what is missing.

### Deployment
What exists and what is missing.

### Risks / inconsistencies
Anything that conflicts with AGENTS.md.

### Recommended next step
Identify the **smallest logical implementation step**.

DO NOT modify files during this initial audit.

After the audit, wait for my approval before making the first implementation change.


-----
# Prompt 2: 

Based on your previous repository audit, proceed with the next approved milestone:

# SOURCE CONTENT EXTRACTION PIPELINE

Read `AGENTS.md` again before implementation.

The goal is to build a reliable extraction pipeline for the 340 Dynamic English lessons.

## Requirements

Source:

https://lopngoaingu.com/Dynamic_English_Study/index.php

Lesson URL:

https://lopngoaingu.com/Dynamic_English_Study/index.php?id={LESSON_ID}

The extractor must:

1. Fetch a lesson page.
2. Extract the actual lesson-specific content.
3. Remove unrelated global navigation/menu/footer/advertisements/site controls.
4. Preserve meaningful lesson content, including where available:
   - lesson introduction
   - dialogue
   - vocabulary
   - explanations
   - sentence patterns
   - CUT sections
   - Vietnamese explanations
   - meaningful headings
5. Normalize whitespace without destroying structure.
6. Preserve enough structure for transcript rendering and AI enrichment.
7. Record source URL and fetch timestamp.
8. Record extraction status.
9. Handle fetch failures gracefully.
10. Never fabricate missing content.

## IMPORTANT

Before processing all 340 lessons, validate the extractor against:

- Lesson 1
- Lesson 113
- Lesson 340

Do not assume that the same HTML structure is correct for every lesson.

If the extraction boundary is ambiguous, STOP and show me the relevant HTML/content alternatives instead of guessing.

## Output

Prefer a structure such as:

data/source-lessons/{id}.json

Example:

{
  "id": 1,
  "sourceUrl": "...",
  "title": "...",
  "content": "...",
  "sections": [],
  "fetchedAt": "...",
  "status": "fetched"
}

Preserve the existing canonical lesson schema unless a schema change is genuinely necessary.

## Validation

After implementation:

- run the existing data validation;
- test lessons 1, 113 and 340;
- report what was extracted;
- report any extraction differences;
- report failures;
- do not claim all 340 lessons are validated unless they were actually fetched successfully.

Use the project reporting format:

Implemented:
- ...

Validated:
- ...

Known limitations:
- ...

Next recommended step:
- ...


-----------

Next Steps: 

1. Repository audit (done)
        ↓
2. Source-content extraction (done)
        ↓
3. Validate 1 / 113 / 340 (done)
        ↓
4. Run extraction for all 340 (done)
        ↓
5. Transcript API
        ↓
6. AI enrichment
        ↓
7. Frontend player
        ↓
8. Progress + search
        ↓
9. Responsive/accessibility
        ↓
10. End-to-end testing
        ↓
11. Vercel deployment


Summary, patterns và vocabulary còn trống cho đến khi có AI enrichment được duyệt.

GEMINI_API_KEY chưa được cấu hình