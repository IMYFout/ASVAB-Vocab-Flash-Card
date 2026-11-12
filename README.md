VocabSwipe · ASVAB Vocab Flash Cards
A free, open-source, single-file flashcard app for ASVAB vocabulary — built for the phone, usable offline, no account, no ads, no tracking.
Try it: https://imyfout.github.io/ASVAB-Vocab-Flash-Card/
!License: MIT (add a MIT LICENSE file to the repo to make this badge true)
What you get
234 ASVAB high-frequency words, each with 6 fields: word, part of speech, Chinese meaning, English definition, example sentence, and synonyms (the synonyms are ASVAB test points).
Swipe to learn: tap a card to flip it, swipe right when you know it, swipe left to mark it for review. New / review / mastered counts and a progress bar stay visible at the top.
Review modes: study only the words you marked for review, or self-test only the ones you marked mastered. One tap resets a deck and starts over.
Custom decks: add your own word list (GRE, SAT, TOEFL, anything) by pasting JSON — no code changes needed.
Progress backup: export your progress as JSON and import it on another phone. Your data lives in your browser's localStorage — nothing is uploaded anywhere.
Phone-first design: dark theme, large tap targets, safe-area support, and an app icon for Add to Home Screen. The interface is in Chinese; the word content is English + Chinese.
Use it on your phone
Open the link above in Safari (iPhone) or Chrome (Android).
iPhone: Share → Add to Home Screen → Add. It opens from an icon like a standalone app.
No internet needed after that for the built-in deck if you save the page: because the whole app is one HTML file, you can also download index.html and open it directly in any browser — fully offline.
Add a custom deck
Tap the menu → + 添加新词库 (GRE / SAT 等), name the deck, then paste JSON in this format (6 fields per word):
[["abate", "v.", "减弱，减轻", "to become less intense", "The storm finally abated.", "diminish, lessen, subside"],
 ["candid", "adj.", "坦率的", "truthful and straightforward", "A candid answer.", "frank, honest, forthright"]]
Tech
A single index.html — vanilla HTML/CSS/JavaScript, zero dependencies, no build step, no npm install.
State is kept in localStorage (vocabswipe_* keys): per-word progress (new / review / mastered), custom decks, and the current deck.
Runs anywhere a modern browser runs: phone, tablet, or desktop.
Known scope limitations
No service worker: offline use means opening the saved single file (or the browser-cached page), not a PWA install with background sync.
Progress is stored per device/browser — use Export/Import to move it to another phone; clearing browser data erases it.
The interface is Chinese-only for now; word content is bilingual (English + Chinese).
Word list is a fixed 234-word ASVAB set; it does not cover every ASVAB Word Knowledge topic (e.g. prefixes/suffixes, antonyms as a separate drill).
License
MIT — see LICENSE once added. Contributions and forks are welcome.
