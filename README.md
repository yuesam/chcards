# Mandarin Flashcards

A minimalist white-on-black study page, copied from the Model Comparison flashcard page. All CSS, card data, and JavaScript are embedded in **index.html**. No dependencies, build step, account, backend, or external requests are required.

## Use

Open index.html in a browser, or serve this repository using any static web server.

- 92 English prompts with Chinese characters and tone-marked Pinyin.
- Every card includes two Chinese versions, with the most common phrasing first. Brief notes identify alternatives that are formal, regional, or specific to a context.
- Click the card (or focus it and press Space/Enter) to reveal the answer.
- Choose **Again** or **Got it** to move on.
- Every page load starts a fresh shuffled round containing all 92 cards.
- **Got it** removes a card for the rest of the round, so it cannot return before every other card has been shown.
- **Again** puts a missed card back after two other cards when possible. If fewer remain, it returns sooner.
- Once every card is marked **Got it**, a new shuffled round starts automatically. The last card is not immediately repeated at the round boundary.
- Three consecutive correct answers mark a card confident. Streaks and review counts survive reloads; the current round does not.
- Progress saves in localStorage in the current browser. Storage failures show a warning while allowing study to continue.

Progress from another domain, including the original app, does not automatically transfer. Clearing browser site data clears saved progress. Direct file access may have browser-specific storage behavior; use the published site for regular study.

## GitHub Pages

In this repository, open **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/ (root)** and save.

The default project URL is https://yuesam.github.io/chcards/ after deployment finishes. The included .nojekyll file keeps this a plain static site. Pages settings have not been enabled by this copy operation.

## Edit cards

Edit the JSON inside the script element with id="deck-data" in index.html. Each card has id, english, chinese, and pinyin; an alternative object contains a second chinese/pinyin pair and, where useful, a note explaining its usage. Preserve existing IDs so saved progress continues to match its cards.

## Checks

With Node.js installed, run:

```sh
node --test tests/flashcards.test.mjs
```

Tests exercise the actual embedded deck and scheduler, including shuffling, full-round coverage, correct-card exclusion, missed-card repetition, saved learning history, and invalid storage.
