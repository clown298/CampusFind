export const MATCH_WEIGHTS = {
  name: 0.4,
  category: 0.2,
  location: 0.2,
  date: 0.1,
  description: 0.1,
};

export const STRONG_MATCH_SCORE = 75;
export const MATCH_THRESHOLD = 60;
export const DATE_WINDOW_DAYS = 30;
export const MAX_DAYS_BEFORE_LOST = 14;
export const NAME_OVERLAP_REQUIRED = 0.35;

const STOPWORDS = new Set([
  "a", "an", "and", "are", "at", "be", "by", "for", "from", "in",
  "is", "it", "of", "on", "or", "the", "to", "was", "were", "with",
  "this", "that", "these", "those",
]);

export function normalizeText(value) {
  const text = String(value || "");
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .filter((token) => token !== "" && !STOPWORDS.has(token));
}

function tokenSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  const intersection = new Set(tokensA.filter((token) => setB.has(token)));
  if (intersection.size === 0) return 0;
  const union = new Set([...tokensA, ...tokensB]);
  const jaccard = intersection.size / union.size;
  const containment =
    intersection.size / Math.min(tokensA.length, tokensB.length);
  return (jaccard + containment) / 2;
}

export function scoreItemNames(nameA, nameB) {
  return tokenSimilarity(tokenize(nameA), tokenize(nameB));
}

export function scoreCategory(categoryA, categoryB) {
  const a = normalizeText(categoryA);
  const b = normalizeText(categoryB);
  if (!a || !b) return 0;
  return a === b ? 1 : 0;
}

export function scoreLocation(locationA, locationB) {
  const a = normalizeText(locationA);
  const b = normalizeText(locationB);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const allInB = tokensA.every((token) => setB.has(token));
  const allInA = tokensB.every((token) => setA.has(token));
  return allInB || allInA ? 0.6 : 0;
}

export function scoreDescription(descriptionA, descriptionB) {
  return tokenSimilarity(
    tokenize(descriptionA),
    tokenize(descriptionB)
  );
}

function parseDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function scoreDates(dateLost, dateFound) {
  const lost = parseDate(dateLost);
  const found = parseDate(dateFound);
  if (!lost || !found) return { score: 0, rejected: false };

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((found - lost) / msPerDay);

  if (diffDays < -MAX_DAYS_BEFORE_LOST) {
    return { score: 0, rejected: true };
  }

  const gap = Math.max(0, diffDays);
  const score = Math.max(0, 1 - gap / DATE_WINDOW_DAYS);
  return { score, rejected: false };
}

export function computeMatch(lostItem, foundItem) {
  const lostName = lostItem && (lostItem.itemName || lostItem.item_name);
  const foundName = foundItem && (foundItem.itemName || foundItem.item_name);
  const lostCategory = lostItem && lostItem.category;
  const foundCategory = foundItem && foundItem.category;
  const lostLocation = lostItem && lostItem.location;
  const foundLocation = foundItem && foundItem.location;
  const lostDescription = lostItem && lostItem.description;
  const foundDescription = foundItem && foundItem.description;
  const lostDate = lostItem && (lostItem.dateLost || lostItem.date_lost);
  const foundDate = foundItem && (foundItem.dateFound || foundItem.date_found);

  const nameScore = scoreItemNames(lostName, foundName);
  const categoryScore = scoreCategory(lostCategory, foundCategory);
  const locationScore = scoreLocation(lostLocation, foundLocation);
  const dateResult = scoreDates(lostDate, foundDate);
  const descriptionScore = scoreDescription(lostDescription, foundDescription);

  if (dateResult.rejected) {
    return { score: 0, level: "none", reasons: [], rejected: true };
  }

  if (categoryScore === 0 && nameScore < NAME_OVERLAP_REQUIRED) {
    return { score: 0, level: "none", reasons: [], rejected: true };
  }

  const rawScore =
    nameScore * MATCH_WEIGHTS.name +
    categoryScore * MATCH_WEIGHTS.category +
    locationScore * MATCH_WEIGHTS.location +
    dateResult.score * MATCH_WEIGHTS.date +
    descriptionScore * MATCH_WEIGHTS.description;

  const score = Math.round(rawScore * 100);
  const level =
    score >= STRONG_MATCH_SCORE
      ? "strong"
      : score >= MATCH_THRESHOLD
      ? "possible"
      : "none";

  const reasons = [];
  if (categoryScore === 1) reasons.push("Same category");
  if (locationScore === 1) reasons.push("Same location");
  else if (locationScore >= 0.6) reasons.push("Similar location");
  if (nameScore >= 0.6) reasons.push("Similar name");
  else if (nameScore >= 0.3) {
    reasons.push("Some matching words in the item name");
  }
  if (dateResult.score >= 0.8) reasons.push("Dates are close");
  if (descriptionScore >= 0.35) reasons.push("Similar description");

  return { score, level, reasons, rejected: false };
}

export function findPossibleMatches(currentItem, candidates, currentIsFound) {
  const items = candidates || [];
  return items
    .map((candidate) => {
      const result = currentIsFound
        ? computeMatch(candidate, currentItem)
        : computeMatch(currentItem, candidate);
      return {
        item: candidate,
        score: result.score,
        level: result.level,
        reasons: result.reasons,
      };
    })
    .filter((match) => match.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}