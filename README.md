VocabSwipe — ASVAB Vocab Flash Cards
A free, open-source, single-file flashcard app for ASVAB vocabulary. Built for the phone, usable offline. No account, no ads, no tracking. The only thing that counts is knowing the word.
!MIT License
What you get
234 ASVAB high-frequency words, each with word, part of speech, Chinese meaning, English definition, example sentence, and synonyms (the synonyms are ASVAB test points).
Swipe to learn: tap a card to flip it, swipe right when you know it, swipe left to mark it for review.
Live progress: new / review / mastered counts and a progress bar stay visible at the top of the screen.
Review modes: study only the words you marked for review, or self-test only the ones you marked mastered. One tap resets a deck and starts over.
Custom decks: add your own word list (GRE, SAT, TOEFL, anything) by pasting JSON — no code changes needed.
Progress backup: export your progress as JSON and import it on another phone. Your data lives in your browser's localStorage — nothing is uploaded anywhere.
Phone-first design: dark theme, large tap targets, safe-area support, and an app icon for Add to Home Screen.
A single index.html — no npm install or build step required.
How it works (important)
This version intentionally uses one fixed interaction model so every swipe means the same thing:
Setting
This app
Deck
234 ASVAB high-frequency words
Card fields
6 per word: word, part of speech, Chinese, English definition, example, synonyms
Tap card
Flip front / back
Swipe right
Mark mastered
Swipe left
Mark review
Progress
Saved locally (localStorage), per device and browser
New words
Shown first; reviewed words come back in later rounds
Custom decks
Added by pasting JSON, stored alongside the built-in deck
A word marked mastered leaves the current round. Words marked for review keep coming back until you mark them mastered. Resetting a deck clears its progress and starts over.
Word format
Every word is one array of 6 fields — word, part of speech, Chinese meaning, English definition, example sentence, synonyms:
["abate", "v.", "减弱，减轻", "to become less intense", "The storm finally abated.", "diminish, lessen, subside"]
Important: progress is stored per device and browser. Clearing browser data erases it — use Export to back it up before switching phones. The interface is Chinese; the word content is English + Chinese.
Try it without publishing
Download index.html and open it in a modern browser. It is a single-file app; no server is needed.
For development, inside the project folder:
python3 -m http.server 8000
# Open http://localhost:8000
The app is plain HTML/CSS/JavaScript with zero dependencies; you do not need npm to run it.
Publish to GitHub Pages (free)
Create a public repository, e.g. ASVAB-Vocab-Flash-Card, on your GitHub account. Public repositories are supported by GitHub Pages on GitHub Free.
Upload index.html to the repository root (keep it at the top level), or use Git:
cd ASVAB-Vocab-Flash-Card
git init
git add .
git commit -m "Launch VocabSwipe flashcard app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ASVAB-Vocab-Flash-Card.git
git push -u origin main
In your repository, open Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: /(root) → Save.
In Settings → Pages, select Visit site when the site is published. The conventional address is https://YOUR_GITHUB_USERNAME.github.io/ASVAB-Vocab-Flash-Card/ (replace with your account name and actual repo name).
On iPhone, open the published URL in Safari → Share → Add to Home Screen → Add. Now the app opens from an icon like a standalone app.
Official instructions: GitHub Pages publishing and Apple: turn a website into an app.
Controls
Top bar: switch decks, see the progress bar, open the menu.
Tap a card: flip between the word and its meaning.
Swipe right: mark the word mastered and move on.
Swipe left: mark the word for review and move on.
Menu → 只看"复习"标记词: study only review-marked words.
Menu → 只看"已掌握"自测: self-test only mastered words.
Menu → 重新开始本词库: reset the current deck's progress.
Menu → + 添加新词库: paste JSON to add a custom deck (GRE / SAT, etc.).
Menu → 导出进度备份: copy your progress JSON; paste it back via Import on another phone.
Testing
No automated test suite yet. Before publishing, open the page and check: a card flips on tap, swiping left and right updates the counts, the progress bar moves, a custom deck saves and appears in the deck list, and Export produces JSON that Import accepts.
Known scope limitations
A single HTML file, not an Apple App Store IPA or Google Play app.
No service worker: offline use means opening the saved single file (or the browser-cached page), not a PWA install with background sync.
Progress is stored on the device and isn't shared between devices. Use Export/Import to move it; clearing browser data erases it.
The interface is Chinese-only for now; word content is bilingual (English + Chinese).
The word list is a fixed 234-word ASVAB set; it does not cover every ASVAB Word Knowledge topic (e.g. prefixes/suffixes, or antonyms as a separate drill).
License
MIT (see LICENSE). Contributions and forks are welcome.
