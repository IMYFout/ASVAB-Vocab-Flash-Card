# Vocab Lab — ASVAB Word Knowledge Trainer

An open-source, bilingual vocabulary practice web app optimized for mobile and desktop. The redesign preserves all 234 original entries from VocabSwipe.

## Features
- **Flashcards** with word, part of speech, English meaning, Chinese translation, example and synonyms.
- **Four recall ratings** (Again / Hard / Good / Easy) using a simple spaced-review schedule.
- **Unlimited multiple-choice practice** with answer explanations, immediate feedback, streak and accuracy.
- **Word library** with text search and learning-status filters.
- **Learning dashboard**, deck progress, all-time quiz accuracy and review counts.
- **Browser speech synthesis** (device and browser support required).
- **Legacy migration**: preserves the old `vocabswipe_progress`, `vocabswipe_customCats`, and `vocabswipe_currentCat` stored in the same browser and origin. Migrated "mastered" becomes a scheduled learned card, "review" remains review-due; migration cannot reconstruct historical repetitions.
- **Custom decks** with original six-field JSON row format, and progress import/export.
- **Installable PWA**: web manifest + service worker, caches app assets for offline study after initial successful load. No account or remote data store.

## Run locally

From the repository folder, run:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. ES modules and service workers work best over HTTP(S), not `file://`.

## GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/(root)`.

Deployment URL: https://imyfout.github.io/ASVAB-Vocab-Flash-Card/

On iOS, open in Safari → Share → Add to Home Screen. Install availability and offline behavior depend on browser features. Before switching devices, export a backup.

## Source layout

- `index.html`: accessible page structure.
- `src/styles.css`: layout, components and responsive styles.
- `src/words.js`: original 234 bilingual vocabulary rows, unmodified in meaning.
- `src/app.js`: scheduling, app state, migration, UI, quiz and events.
- `manifest.webmanifest`, `sw.js`, `assets/icon.svg`: install and offline assets.

## Review rules
- Again: due in one minute; repetitions reset.
- Hard: due in one day.
- Good: due in at least three days, increasing for previously reviewed words.
- Easy: due in at least seven days, increasing thereafter.

Mastered means at least three successful repetition credits. The schedule is a simple learning heuristic, **not** an evidence-backed calibrated SRS algorithm.

## Data & privacy

Data is stored in browser localStorage. It is **not automatically synced between devices**. Export backups before resetting storage. No analytics, tracking or accounts.

The 234 original entries include a duplicated headword. They are retained for backward-compatible progress indexing. The quiz uses locally authored definitions and distractors and is not a validated official ASVAB practice test; no GT score prediction is provided.

## License

MIT — see [LICENSE](./LICENSE).
