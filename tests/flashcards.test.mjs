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

test("all 92 cards have unique IDs, Chinese and tone-marked Pinyin", () => {
  assert.equal(deck.length, 92);
  assert.equal(new Set(ids).size, 92);
  for (const card of deck) {
    assert.ok(card.english && card.chinese);
    assert.match(card.pinyin, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u);
    assert.ok(card.alternative, "Missing second answer: " + card.english);
    if (card.alternative) {
      assert.ok(card.alternative.chinese);
      assert.notEqual(card.alternative.chinese, card.chinese);
      assert.match(card.alternative.pinyin, /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u);
    }
  }
  assert.equal(deck.filter(card => card.alternative).length, 92);
});


const ordered = () => 0.999999;
const json = value => JSON.parse(JSON.stringify(value));

test("Got it never repeats a card until the entire deck is reviewed", () => {
  let study = restore(null, ids, ordered);
  for (let round = 1; round <= 3; round++) {
    const seen = new Set();
    let last;
    for (let i = 0; i < ids.length; i++) {
      assert.equal(study.round, round);
      assert.ok(!seen.has(study.current));
      seen.add(study.current);
      last = study.current;
      study = grade(study, ids, true, ordered);
    }
    assert.equal(seen.size, ids.length);
    assert.equal(study.round, round + 1);
    assert.notEqual(study.current, last);
  }
});

test("missed cards return after two reviews without reintroducing correct cards", () => {
  let study = restore(null, ids, ordered);
  const missed = study.current;
  study = grade(study, ids, false, ordered);
  const retired = new Set();
  for (let i = 0; i < 2; i++) {
    assert.notEqual(study.current, missed);
    retired.add(study.current);
    study = grade(study, ids, true, ordered);
  }
  assert.equal(study.current, missed);
  while (study.round === 1) {
    assert.ok(!retired.has(study.current));
    retired.add(study.current);
    study = grade(study, ids, true, ordered);
  }
  assert.equal(retired.size, ids.length);
});

test("reloading reshuffles all cards while preserving saved learning history", () => {
  let study = restore(null, ids, ordered);
  study = grade(study, ids, true, ordered);
  const first = restore(JSON.stringify(study), ids, () => 0);
  const second = restore(JSON.stringify(study), ids, ordered);
  assert.deepEqual(json(first.progress), json(study.progress));
  assert.deepEqual(json(second.progress), json(study.progress));
  assert.equal(first.turn, study.turn);
  assert.notDeepEqual(json(first.queue), json(second.queue));
  for (const restored of [first, second]) {
    assert.equal(restored.round, 1);
    assert.equal(restored.queue.length, ids.length);
    assert.deepEqual([...restored.queue].sort(), [...ids].sort());
    assert.equal(restored.current, restored.queue[0]);
  }
});

test("the default shuffle uses randomness without losing or duplicating cards", () => {
  const orders = new Set(Array.from({ length: 10 }, () => {
    const study = restore(null, ids);
    assert.deepEqual([...study.queue].sort(), [...ids].sort());
    return JSON.stringify(study.queue);
  }));
  assert.ok(orders.size > 1);
});

test("legacy saves retain streaks and review counts, not their old order", () => {
  const restored = restore(JSON.stringify({ turn: 20, current: ids[15], progress: {
    [ids[0]]: { streak: 3, reviews: 6, due: 90 },
  } }), ids, ordered);
  assert.deepEqual(json(restored.progress[ids[0]]), { streak: 3, reviews: 6 });
  assert.equal(restored.turn, 20);
  assert.equal(restored.current, ids[0]);
});

test("streaks increase for correct answers and reset after a miss", () => {
  const small = ["a"];
  let study = restore(null, small);
  for (let i = 1; i <= 3; i++) {
    study = grade(study, small, true);
    assert.equal(study.progress.a.streak, i);
  }
  study = grade(study, small, false);
  assert.equal(study.progress.a.streak, 0);
  assert.equal(study.progress.a.reviews, 4);
  assert.equal(study.current, "a");
});

test("a final missed card remains available without bringing back retired cards", () => {
  let study = restore(null, ["a", "b", "c"], ordered);
  study = grade(study, ["a", "b", "c"], true, ordered);
  study = grade(study, ["a", "b", "c"], true, ordered);
  study = grade(study, ["a", "b", "c"], false, ordered);
  assert.equal(study.current, "c");
  assert.equal(study.round, 1);
  assert.deepEqual(json(study.queue), ["c"]);
});

test("invalid storage is rejected and invalid individual entries are ignored", () => {
  assert.throws(() => restore("not json", ids));
  assert.throws(() => restore('{"turn":-1}', ids));
  const restored = restore(JSON.stringify({ turn: 2, current: "removed", progress: {
    [ids[0]]: { streak: -2, reviews: 1, due: 0 },
  } }), ids, ordered);
  assert.equal(restored.current, ids[0]);
  assert.equal(Object.keys(restored.progress).length, 0);
});
