const AT_RULE_PATTERN =
  /^\s*@(media|layer|keyframes|supports|container|font-face|import|charset)\b/i;

/**
 * Parses a CSS string into an array of rule objects.
 *
 * @param {string} css
 * @returns {{ rules: ParsedRule[], warnings: string[] }}
 *
 * @typedef {{ selector: string, declarations: Declaration[], sourceIndex: number }} ParsedRule
 * @typedef {{ property: string, value: string, important: boolean }} Declaration
 */
export function parseCSS(css) {
  const rules = [];
  const warnings = [];
  let sourceIndex = 0;

  const stripped = stripComments(css);
  const tokens = tokenizeRules(stripped);

  for (const token of tokens) {
    if (AT_RULE_PATTERN.test(token.selector)) {
      const match = token.selector.match(/@(\S+)/i);
      warnings.push(`@${match ? match[1] : "rule"} is not supported in v1 and was skipped.`);
      sourceIndex++;
      continue;
    }

    const selectors = splitSelectors(token.selector);

    for (const selector of selectors) {
      const trimmed = selector.trim();
      if (!trimmed) continue;

      rules.push({
        selector: trimmed,
        declarations: parseDeclarations(token.block),
        sourceIndex: sourceIndex++,
      });
    }
  }

  return { rules, warnings: [...new Set(warnings)] };
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function tokenizeRules(css) {
  const tokens = [];
  let depth = 0;
  let start = 0;
  let selectorEnd = -1;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (ch === "{") {
      if (depth === 0) selectorEnd = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && selectorEnd !== -1) {
        const selector = css.slice(start, selectorEnd).trim();
        const block = css.slice(selectorEnd + 1, i).trim();
        if (selector) {
          tokens.push({ selector, block });
        }
        start = i + 1;
        selectorEnd = -1;
      }
    }
  }

  return tokens;
}

function splitSelectors(selectorStr) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < selectorStr.length; i++) {
    const ch = selectorStr[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(selectorStr.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(selectorStr.slice(start));
  return parts;
}

function parseDeclarations(block) {
  const declarations = [];

  const parts = splitDeclarations(block);

  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) continue;

    const property = part.slice(0, colonIdx).trim().toLowerCase();
    let value = part.slice(colonIdx + 1).trim();
    const important = /!important\s*$/i.test(value);

    if (important) {
      value = value.replace(/\s*!important\s*$/i, "").trim();
    }

    if (property && value) {
      declarations.push({ property, value, important });
    }
  }

  return declarations;
}

function splitDeclarations(block) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === ";" && depth === 0) {
      parts.push(block.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(block.slice(start));
  return parts;
}
