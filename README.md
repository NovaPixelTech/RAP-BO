# RAP Coach

[![Deploy to GitHub Pages](https://github.com/NovaPixelTech/RAP-BO/actions/workflows/deploy.yml/badge.svg)](https://github.com/NovaPixelTech/RAP-BO/actions/workflows/deploy.yml)

A local-first study app for **SAP RAP Business Objects** (ABAP RESTful Application Programming Model). It combines a structured course, spaced-repetition flashcards, quizzes, a RAP scaffolder, a heuristic code doctor, a reference library, and a place to keep your own code examples.

No install, no server, no account. Everything runs in the browser and your progress stays on your machine.

**Live app:** https://novapixeltech.github.io/RAP-BO/

---

## Quick start

1. Open the folder.
2. Double-click **`index.html`**.
3. That's it.

Works in current Chrome, Edge, Firefox and Safari. It loads from `file://`, needs no network connection, and has no build step.

> If your browser is configured to block local storage for local files, progress will not persist. Use a normal browser profile, or serve the folder with any static file server (`python -m http.server`) and open `http://localhost:8000`.

---

## Deployment

The app is plain static HTML, CSS and JavaScript, so GitHub Pages can host it directly with no build step.

- **Live site:** https://novapixeltech.github.io/RAP-BO/
- **Repository:** https://github.com/NovaPixelTech/RAP-BO
- **Pipeline:** every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), uploads the repository as a Pages artifact and publishes it.
- **Pages source:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- **Base path:** all asset URLs are relative, so the site works correctly under the `/RAP-BO/` project path.
- **Manual deploy:** Actions → **Deploy to GitHub Pages** → **Run workflow**.

To publish changes, commit and push to `main`:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

---

## What is inside

| Area | What it does |
| --- | --- |
| **Dashboard** | Daily goal, streak, next lesson, due cards, quick entry points. |
| **Learn** | 6 modules, 27 lessons, from RAP fundamentals to practice and debugging. Filter by level, module or text. |
| **Lesson** | Full lesson text, code samples, comparison tables, key points becoming flashcards, per-lesson quiz, personal notes, completion tracking. |
| **Practice** | Due-first flashcard review with SM-2-style scheduling (Again / Hard / Good / Easy), mixed quizzes, and your own cards. |
| **Lab** | RAP generator and code doctor. |
| **Examples** | Personal library of code examples (create, edit, delete, filter, copy). |
| **Reference** | Annotations, BDEF keywords, EML, naming conventions, snippets, glossary, curated SAP links. |
| **Troubleshoot** | Searchable library of 20 common RAP failures with symptom, cause, fix and code. |
| **Settings** | Name, daily goal, new-card limit, theme, JSON export/import, reset, study stats. |
| **Command palette** | `Ctrl/Cmd + K` (or `/`) searches lessons, examples and references. Prefix with `>` to run commands only. |

### Curriculum

1. **Foundations** — what RAP is, the artifact map, managed vs unmanaged, the end-to-end build flow.
2. **CDS data model** — view entities, associations and compositions, annotations, access control, metadata extensions.
3. **Behavior** — behavior definitions, CRUD, determinations, validations, actions, draft, locking, feature control, behavior pools.
4. **Business services** — service definitions and bindings, OData V4 vs V2, UI annotations, value helps, Fiori elements.
5. **Advanced** — unmanaged BOs, EML, side effects, messages, authorization, extensibility, performance.
6. **Practice** — testing, debugging, activation order, code review checklist.

### RAP generator

Produces a consistent set of artifacts from a short description:

- Database table DDL (optional)
- Interface CDS view entity (`ZI_*`)
- Projection view entity (`ZC_*`) with UI annotations
- Child interface/projection views (optional composition)
- Behavior definition (managed or unmanaged, draft, auth, validation, action)
- Behavior implementation class skeleton
- Service definition and service binding
- Step-by-step creation order and caveats

### Code doctor

Paste a behavior definition (or a mix of RAP source) and get heuristic findings: draft without draft table, validations declared `on modify`, missing lock/authorization, child `create;` misuse, strict-mode issues, missing `mapping for`, and more. It is a linting aid, not a compiler.

---

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Ctrl/Cmd + K` or `/` | Open command palette |
| `↑` / `↓` | Move in palette |
| `Enter` | Open selection / next quiz question |
| `Esc` | Close palette, modal or mobile nav |
| `1`–`4` | Answer a quiz question |
| `Space` | Reveal the flashcard |
| `1`–`4` | Grade a revealed card (Again / Hard / Good / Easy) |

---

## Your data

- Stored in `localStorage` under the key **`rapcoach.v1`**.
- Nothing is uploaded anywhere. There is no telemetry and no network call.
- **Settings → Export** downloads a JSON snapshot. **Import** restores one. Export before clearing the browser profile.
- **Settings → Reset** clears progress and personal content after a confirmation.

The snapshot contains your profile and settings, lesson progress and notes, card schedule, custom cards, examples, quiz history, streak/activity, the last route, and generator settings.

---

## Project layout

```text
index.html              App shell + script load order
assets/styles.css       Design tokens, layout, components, responsive rules
js/store.js             State, persistence, SRS, streaks, examples, import/export
js/reference.js         Annotations, snippets, glossary, troubleshooting, links
js/code.js              Syntax highlighting, generator, linter, copy registry
js/ui.js                Shell, markdown-lite renderer, palette, modal, toast
js/views.js             One function per route
js/app.js               Boot, hash routing, global keys, palette sources
js/content/01-foundations.js … 06-practice.js
                        Course modules and lessons (data only)
```

Load order matters: content files must load **before** `store.js`, because the store builds the lesson/card index at startup. `store.js` must load before the UI and views.

---

## Adding content

### A lesson

Append an object to a module's `lessons` array in the relevant `js/content/*.js` file:

```js
{
  id: 'my-lesson',                 // unique, used in #/lesson/my-lesson
  title: 'My lesson',
  level: 'beginner',               // beginner | intermediate | advanced
  minutes: 8,
  summary: 'One or two sentences shown on cards and search results.',
  tags: ['draft', 'bdef'],
  sections: [
    { t: 'p', cls: 'lead', text: 'Opening paragraph. **Bold**, *italic* and `inline code` work.' },
    { t: 'h', text: 'A section heading' },
    { t: 'list', items: ['Point one', 'Point two with `code`'] },
    { t: 'code', lang: 'abap', title: 'Optional title', code: 'CLASS ... ENDCLASS.' },
    { t: 'table', head: ['A', 'B'], rows: [['1', '2']] },
    { t: 'callout', tone: 'tip', title: 'Note', text: 'Body text.' }
  ],
  keyPoints: [
    { front: 'Question shown on the card', back: 'Answer shown after reveal' }
  ],
  quiz: [
    { q: 'Question?', options: ['A', 'B', 'C', 'D'], answer: 0, why: 'Why A is right.' }
  ],
  resources: [
    { label: 'SAP Help', url: 'https://help.sap.com/…' }
  ]
}
```

Available section types: `p` (with optional `cls: 'lead'`), `h`, `list` (optional `ordered` or `checked`), `steps`, `table`, `callout` (tones: `info`, `tip`, `why`, `warn`, `danger`), `code`, and `compare`.

Rules of thumb:

- `id` must be unique across all modules. It is also the key for progress and card IDs.
- `answer` is a zero-based index into `options`.
- Every key point becomes a flashcard automatically.
- Lesson quizzes are self-contained; the mixed quiz samples across the curriculum.

### A module

Add a file such as `js/content/07-extra.js`:

```js
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm7',
  title: 'Extra',
  tagline: 'Short subtitle.',
  description: 'Longer description used on the Learn page.',
  lessons: [ /* … */ ]
});
```

Then add `<script src="js/content/07-extra.js"></script>` **before** `js/store.js` in `index.html`. The Learn page, dashboard counts, mixed quiz and search pick it up automatically.

### Reference and troubleshooting entries

Edit `js/reference.js`:

```js
// RC.reference.troubleshooting
{
  title: 'Short problem name',
  symptom: 'What you observe.',
  cause: 'Why it happens.',
  fix: 'What to change.',
  code: 'Optional snippet'
}
```

Snippets, annotations, glossary entries and resources use the same file. Keep the existing shapes; the views read those fields directly.

### Your own examples and cards

Use the app: **Examples → New example** and **Practice → My cards**. These are stored in your local snapshot, survive reloads, and are included in export/import. No code change needed.

---

## Design notes

- Vanilla JavaScript, classic `<script>` tags. No modules, bundler or package manager, so it opens directly from disk.
- Hash routing (`#/lesson/why-rap`) keeps deep links and back/forward working.
- The store emits synchronously on save; only the shell (streak, due counts, sidebar) refreshes, so typing in a form is never interrupted.
- Scheduling uses a simplified SM-2: four grades, an interval in days, an ease factor, and a `YYYY-MM-DD` due date. New cards are throttled by `settings.newPerDay`.
- All content is plain data so it can be edited without touching the UI code.

---

## Limits

- The generator emits a sensible starting point, not compilable production code for every release. Adjust names, types and annotations to your system.
- The code doctor is pattern-based. It catches common mistakes but does not replace ADT activation or the ABAP compiler.
- Content reflects RAP as of ABAP Platform 2023/SAP BTP ABAP Environment and later. Check SAP Help for release-specific syntax.
- This is an independent study tool, not an SAP product. SAP, S/4HANA, ABAP and Fiori are trademarks of SAP SE.
