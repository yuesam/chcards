import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const deck = JSON.parse(html.match(/<script id="deck-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const scheduler = html.match(/<script id="scheduler">([\s\S]*?)<\/script>/)[1];
const sandbox = {};
vm.runInNewContext(scheduler + ";globalThis.api = { grade, restore };", sandbox);
const { grade, restore } = sandbox.api;

const ids = deck.map(card => card.id);

test("all 80 cards have unique IDs, Chinese and tone-marked Pinyin", () => {
  assert.equal(deck.length, 80);
  assert.equal(new Set(ids).size, 80);
  for (const card of deck) {
    assert.ok(card.english && card.chinese);
    assert.match(card.pinyin, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u);
    if (card.alternative) {
      assert.ok(card.alternative.chinese);
      assert.notEqual(card.alternative.chinese, card.chinese);
      assert.match(card.alternative.pinyin, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u);
    }
  }
  assert.equal(deck.filter(card => card.alternative).length, 6);
});

test("a missed card returns after two intervening reviews", () => {
  let study = restore(null, ids);
  const missed = study.current;
  study = grade(study, ids, false);
  assert.notEqual(study.current, missed);
  study = grade(study, ids, true);
  assert.notEqual(study.current, missed);
  study = grade(study, ids, true);
  assert.equal(study.current, missed);
});

test("consistent correct answers widen spacing and a miss resets it", () => {
  let study = restore(null, ids);
  const id = study.current;
  for (const interval of [5, 12, 30, 75, 150, 150]) {
    study = grade({ ...study, current: id }, ids, true);
    assert.equal(study.progress[id].due - study.turn, interval);
  }
  assert.equal(study.progress[id].streak, 6);
  study = grade({ ...study, current: id }, ids, false);
  assert.equal(study.progress[id].streak, 0);
  assert.equal(study.progress[id].due - study.turn, 2);
});

test("progress and the next card survive a reload", () => {
  let study = restore(null, ids);
  for (let i = 0; i < 35; i++) study = grade(study, ids, i % 3 !== 0);
  assert.deepEqual(restore(JSON.stringify(study), ids), study);
});

test("invalid storage is rejected and invalid individual entries are ignored", () => {
  assert.throws(() => restore("not json", ids));
  assert.throws(() => restore('{"turn":-1}', ids));
  const restored = restore(JSON.stringify({ turn: 2, current: "removed", progress: {
    [ids[0]]: { streak: -2, reviews: 1, due: 0 },
  } }), ids);
  assert.equal(restored.current, ids[0]);
  assert.equal(Object.keys(restored.progress).length, 0);
});

test("ongoing practice reaches every card without consecutive repeats", () => {
  let study = restore(null, ids);
  const seen = new Set();
  for (let i = 0; i < 600; i++) {
    const previous = study.current;
    seen.add(previous);
    study = grade(study, ids, i % 5 !== 0);
    assert.notEqual(study.current, previous);
  }
  assert.equal(seen.size, deck.length);
});
