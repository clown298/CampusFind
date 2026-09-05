import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeMatch,
  findPossibleMatches,
  normalizeText,
  scoreDates,
  scoreItemNames,
  MATCH_THRESHOLD,
  STRONG_MATCH_SCORE,
} from "../src/utils/matching.js";

const lostWallet = {
  itemName: "Black Leather Wallet",
  category: "Accessories",
  location: "Library",
  dateLost: "2026-08-29",
  description:
    "Black leather bifold wallet with card slots and a small coin pocket.",
};

const foundWalletExact = {
  itemName: "Black Leather Wallet",
  category: "Accessories",
  location: "Library",
  dateFound: "2026-08-30",
  description:
    "Black leather bifold wallet with card slots and a small coin pocket.",
};

const foundWalletVariation = {
  itemName: "Black Wallet",
  category: "Accessories",
  location: "Library",
  dateFound: "2026-08-30",
  description: "Black wallet with several card slots.",
};

const lostCalculator = {
  itemName: "Silver Scientific Calculator",
  category: "Electronics",
  location: "Mechanical Department",
  dateLost: "2026-08-21",
  description: "Silver scientific calculator with a lightly scratched screen.",
};

const foundNotebook = {
  itemName: "Brown Notebook",
  category: "Books",
  location: "Library",
  dateFound: "2026-08-20",
  description: "Brown spiral notebook with graph paper pages and notes.",
};

const foundWalletOtherLocation = {
  itemName: "Black Leather Wallet",
  category: "Accessories",
  location: "Canteen",
  dateFound: "2026-08-30",
  description:
    "Black leather bifold wallet with card slots and a small coin pocket.",
};

const foundWalletTooEarly = {
  itemName: "Black Leather Wallet",
  category: "Accessories",
  location: "Library",
  dateFound: "2026-06-18",
  description:
    "Black leather bifold wallet with card slots and a small coin pocket.",
};

describe("normalizeText", () => {
  it("lowercases, trims, and strips punctuation", () => {
    assert.equal(normalizeText("  Black-L.eather  Wallet! "), "black l eather wallet");
    assert.equal(normalizeText("Mechanical Department"), "mechanical department");
    assert.equal(normalizeText(""), "");
  });
});

describe("scoreItemNames", () => {
  it("returns 1 for identical names", () => {
    assert.ok(scoreItemNames("black leather wallet", "black leather wallet") >= 0.99);
  });

  it("gives a high score to variations like Black Wallet vs Black Leather Wallet", () => {
    const score = scoreItemNames("black leather wallet", "black wallet");
    assert.ok(score >= 0.7, `expected high score, got ${score}`);
  });

  it("returns 0 for unrelated names", () => {
    assert.equal(scoreItemNames("silver scientific calculator", "brown notebook"), 0);
  });
});

describe("scoreDates", () => {
  it("scores close dates high", () => {
    const result = scoreDates("2026-08-29", "2026-08-30");
    assert.equal(result.rejected, false);
    assert.ok(result.score >= 0.95);
  });

  it("rejects a found date well before the lost date", () => {
    const result = scoreDates("2026-08-29", "2026-06-18");
    assert.equal(result.rejected, true);
    assert.equal(result.score, 0);
  });

  it("penalizes dates far apart but keeps one day close", () => {
    const far = scoreDates("2026-08-29", "2026-09-20");
    const near = scoreDates("2026-08-29", "2026-08-30");
    assert.ok(far.score < near.score);
  });
});

describe("computeMatch", () => {
  it("CASE 1: strong match for identical items", () => {
    const result = computeMatch(lostWallet, foundWalletExact);
    assert.ok(result.score >= STRONG_MATCH_SCORE, `score=${result.score}`);
    assert.equal(result.level, "strong");
    assert.ok(result.reasons.includes("Same category"));
    assert.ok(result.reasons.includes("Same location"));
  });

  it("CASE 2: reasonable variation Black Wallet is still a match", () => {
    const result = computeMatch(lostWallet, foundWalletVariation);
    assert.ok(result.score >= MATCH_THRESHOLD, `score=${result.score}`);
    assert.ok(["strong", "possible"].includes(result.level));
    assert.ok(result.reasons.some((r) => r.includes("Similar name")));
  });

  it("CASE 3: different category/object is not a match", () => {
    const result = computeMatch(lostCalculator, foundNotebook);
    assert.ok(result.score < MATCH_THRESHOLD, `score=${result.score}`);
    assert.equal(result.level, "none");
  });

  it("CASE 4: different location reduces the score appropriately", () => {
    const same = computeMatch(lostWallet, foundWalletExact);
    const diff = computeMatch(lostWallet, foundWalletOtherLocation);
    assert.ok(diff.score < same.score);
    assert.ok(diff.score >= MATCH_THRESHOLD, `score=${diff.score}`);
    assert.ok(!diff.reasons.includes("Same location"));
  });

  it("CASE 5: found date significantly before lost date is rejected", () => {
    const result = computeMatch(lostWallet, foundWalletTooEarly);
    assert.equal(result.rejected, true);
    assert.equal(result.score, 0);
    assert.equal(result.level, "none");
  });
});

describe("findPossibleMatches", () => {
  const foundCandidates = [
    foundWalletExact,
    foundNotebook,
    foundWalletOtherLocation,
  ];
  const lostCandidates = [lostWallet, lostCalculator];

  it("finds matching found items for a lost item and sorts by score", () => {
    const matches = findPossibleMatches(lostWallet, foundCandidates, false);
    assert.ok(matches.length >= 1);
    const scores = matches.map((m) => m.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(matches.every((m) => m.score >= MATCH_THRESHOLD));
  });

  it("does not return a lost calculator when finding matching lost items for a notebook", () => {
    const matches = findPossibleMatches(foundNotebook, lostCandidates, true);
    assert.deepEqual(matches, []);
  });
});