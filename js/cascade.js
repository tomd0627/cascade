import { compareSpecificity } from "./specificity.js";
import { INHERITED_PROPERTIES } from "./matcher.js";

/**
 * @typedef {{ property: string, value: string, important: boolean }} Declaration
 * @typedef {{ selector: string, declarations: Declaration[], sourceIndex: number, specificity: [number,number,number] }} MatchedRule
 * @typedef {{ rule: MatchedRule, declaration: Declaration }} Contestant
 * @typedef {{ winner: Contestant, losers: Array<Contestant & { reason: string }>, inherited: null }} DirectResult
 * @typedef {{ winner: null, losers: [], inherited: { value: string, fromPath: string } }} InheritedResult
 * @typedef {DirectResult | InheritedResult} PropertyResult
 */

/**
 * Resolves the cascade for a matched set of rules on one element.
 *
 * @param {MatchedRule[]} matchedRules
 * @param {Map<string, { value: string, fromPath: string }>} inheritedProperties
 * @returns {Map<string, PropertyResult>}
 */
export function resolveCascade(matchedRules, inheritedProperties) {
  /** @type {Map<string, Contestant[]>} */
  const byProperty = new Map();

  for (const rule of matchedRules) {
    for (const decl of rule.declarations) {
      if (!byProperty.has(decl.property)) byProperty.set(decl.property, []);
      byProperty.get(decl.property).push({ rule, declaration: decl });
    }
  }

  /** @type {Map<string, PropertyResult>} */
  const results = new Map();

  for (const [property, contestants] of byProperty) {
    const sorted = sortContestants(contestants);
    const [winner, ...rest] = sorted;

    const losers = rest.map((c) => ({
      ...c,
      reason: getReason(c, winner),
    }));

    results.set(property, { winner, losers, inherited: null });
  }

  for (const [property, info] of inheritedProperties) {
    if (!results.has(property) && INHERITED_PROPERTIES.has(property)) {
      results.set(property, { winner: null, losers: [], inherited: info });
    }
  }

  return results;
}

/**
 * Sorts contestants by cascade priority: !important > specificity > source order.
 * Higher priority = earlier in the returned array (index 0 is the winner).
 *
 * @param {Contestant[]} contestants
 * @returns {Contestant[]}
 */
function sortContestants(contestants) {
  return [...contestants].sort((a, b) => {
    const aImp = a.declaration.important;
    const bImp = b.declaration.important;

    if (aImp !== bImp) return aImp ? -1 : 1;

    const specCmp = compareSpecificity(a.rule.specificity, b.rule.specificity);
    if (specCmp !== 0) return -specCmp;

    return b.rule.sourceIndex - a.rule.sourceIndex;
  });
}

/**
 * Determines the human-readable reason a contestant lost.
 *
 * @param {Contestant} loser
 * @param {Contestant} winner
 * @returns {string}
 */
function getReason(loser, winner) {
  if (winner.declaration.important && !loser.declaration.important) return "important";

  const specCmp = compareSpecificity(winner.rule.specificity, loser.rule.specificity);
  if (specCmp !== 0) return "specificity";

  return "source-order";
}
