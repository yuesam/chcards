# Mandarin Flashcards

A minimalist white-on-black study page, copied from the Model Comparison flashcard page. All CSS, card data, and JavaScript are embedded in **index.html**. No dependencies, build step, account, backend, or external requests are required.

## Use

Open index.html in a browser, or serve this repository using any static web server.

- 80 English prompts with Chinese characters and tone-marked Pinyin.
- Six cards include two Chinese versions, with the most common phrasing first.
- Click the card (or focus it and press Space/Enter) to reveal the answer.
- Choose **Again** or **Got it** to move on.
- Missed cards return sooner; correct streaks increase the review interval. Every fifth review reserves a slot for an unseen card when available.
- Three consecutive correct answers mark a card confident. Review intervals are measured in cards studied, not elapsed time.
- Progress saves in localStorage in the current browser. Storage failures show a warning while allowing study to continue.

Progress from another domain, including the original app, does not automatically transfer. Clearing browser site data clears saved progress. Direct file access may have browser-specific storage behavior; use the published site for regular study.

## GitHub Pages

In this repository, open **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/ (root)** and save.

The default project URL is https://yuesam.github.io/chcards/ after deployment finishes. The included .nojekyll file keeps this a plain static site. Pages settings have not been enabled by this copy operation.

## Edit cards

Edit the JSON inside the script element with id="deck-data" in index.html. Each card has id, english, chinese, and pinyin; an optional alternative object contains a second chinese/pinyin pair. Preserve existing IDs so saved progress continues to match its cards.

## Checks

With Node.js installed, run:

```sh
node --test tests/flashcards.test.mjs
```

Tests exercise the actual embedded deck and scheduler, including missed-card repetition, increasing intervals, saved progress, invalid storage, and coverage of the entire deck.
