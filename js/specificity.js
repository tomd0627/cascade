/**
 * Calculates CSS specificity for a selector string per W3C Selectors Level 4.
 *
 * Returns [a, b, c] where:
 *   a = ID selectors
 *   b = class, attribute, and pseudo-class selectors (excl. :where)
 *   c = type selectors and pseudo-elements
 *
 * @param {string} selector
 * @returns {[number, number, number]}
 */
export function calculateSpecificity(selector) {
  let a = 0;
  let b = 0;
  let c = 0;

  const tokens = tokenizeSelector(selector);

  for (const token of tokens) {
    switch (token.type) {
      case "id":
        a++;
        break;

      case "class":
      case "attribute":
        b++;
        break;

      case "pseudo-class": {
        const name = token.name.toLowerCase();
        if (name === "where") break;
        if (name === "is" || name === "not" || name === "has") {
          const inner = maxSpecificityOfList(token.argument ?? "");
          a += inner[0];
          b += inner[1];
          c += inner[2];
        } else {
          b++;
        }
        break;
      }

      case "type":
        c++;
        break;

      case "pseudo-element":
        c++;
        break;

      default:
        break;
    }
  }

  return [a, b, c];
}

/**
 * For :is(), :not(), :has() — the specificity is that of the MOST SPECIFIC
 * selector in the argument list (per W3C Selectors Level 4).
 *
 * @param {string} selectorList  comma-separated selector list
 * @returns {[number, number, number]}
 */
function maxSpecificityOfList(selectorList) {
  let max = /** @type {[number, number, number]} */ ([0, 0, 0]);
  const parts = splitTopLevelCommas(selectorList);
  for (const part of parts) {
    const spec = calculateSpecificity(part.trim());
    if (compareSpecificity(spec, max) > 0) max = spec;
  }
  return max;
}

function splitTopLevelCommas(s) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(" || s[i] === "[") depth++;
    else if (s[i] === ")" || s[i] === "]") depth--;
    else if (s[i] === "," && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/**
 * Compares two specificity tuples lexicographically.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 *
 * @param {[number, number, number]} specA
 * @param {[number, number, number]} specB
 * @returns {number}
 */
export function compareSpecificity(specA, specB) {
  for (let i = 0; i < 3; i++) {
    if (specA[i] !== specB[i]) return specA[i] > specB[i] ? 1 : -1;
  }
  return 0;
}

/**
 * Formats a specificity tuple as "(a, b, c)".
 *
 * @param {[number, number, number]} spec
 * @returns {string}
 */
export function formatSpecificity(spec) {
  return `(${spec.join(", ")})`;
}

function tokenizeSelector(selector) {
  const tokens = [];
  let i = 0;
  const s = selector.trim();

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch) || ch === ">" || ch === "+" || ch === "~") {
      i++;
      continue;
    }

    if (ch === "#") {
      const end = indexOfNonIdent(s, i + 1);
      if (end > i + 1) {
        tokens.push({ type: "id" });
        i = end;
        continue;
      }
    }

    if (ch === ".") {
      const end = indexOfNonIdent(s, i + 1);
      if (end > i + 1) {
        tokens.push({ type: "class" });
        i = end;
        continue;
      }
    }

    if (ch === "[") {
      const end = findClosing(s, i, "[", "]");
      tokens.push({ type: "attribute" });
      i = end + 1;
      continue;
    }

    if (ch === ":" && s[i + 1] === ":") {
      const end = indexOfNonIdent(s, i + 2);
      const funcEnd = s[end] === "(" ? findClosing(s, end, "(", ")") + 1 : end;
      tokens.push({ type: "pseudo-element" });
      i = funcEnd;
      continue;
    }

    if (ch === ":") {
      const nameEnd = indexOfNonIdent(s, i + 1);
      const name = s.slice(i + 1, nameEnd);

      if (s[nameEnd] === "(") {
        const argEnd = findClosing(s, nameEnd, "(", ")");
        const argument = s.slice(nameEnd + 1, argEnd);
        tokens.push({ type: "pseudo-class", name, argument });
        i = argEnd + 1;
      } else {
        tokens.push({ type: "pseudo-class", name, argument: "" });
        i = nameEnd;
      }
      continue;
    }

    if (ch === "*") {
      i++;
      continue;
    }

    if (isIdentStart(ch)) {
      const end = indexOfNonIdent(s, i);
      tokens.push({ type: "type" });
      i = end;
      continue;
    }

    i++;
  }

  return tokens;
}

function isIdentStart(ch) {
  return /[a-zA-Z_-]/.test(ch);
}

function indexOfNonIdent(s, start) {
  let i = start;
  while (i < s.length && /[\w-]/.test(s[i])) i++;
  return i;
}

function findClosing(s, open, openCh, closeCh) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === openCh) depth++;
    else if (s[i] === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return s.length - 1;
}
