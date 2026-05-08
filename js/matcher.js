import { calculateSpecificity } from "./specificity.js";

const INHERITED_PROPERTIES = new Set([
  "azimuth",
  "border-collapse",
  "border-spacing",
  "caption-side",
  "color",
  "cursor",
  "direction",
  "empty-cells",
  "font",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-language-override",
  "font-optical-sizing",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-synthesis",
  "font-variant",
  "font-variant-alternates",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-variant-position",
  "font-weight",
  "hanging-punctuation",
  "hyphens",
  "image-orientation",
  "image-rendering",
  "letter-spacing",
  "line-break",
  "line-height",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "orphans",
  "overflow-wrap",
  "pointer-events",
  "quotes",
  "ruby-align",
  "ruby-position",
  "speak",
  "speak-as",
  "tab-size",
  "text-align",
  "text-align-last",
  "text-combine-upright",
  "text-decoration-skip-ink",
  "text-indent",
  "text-justify",
  "text-orientation",
  "text-overflow",
  "text-rendering",
  "text-shadow",
  "text-transform",
  "text-underline-offset",
  "text-underline-position",
  "visibility",
  "white-space",
  "widows",
  "word-break",
  "word-spacing",
  "word-wrap",
  "writing-mode",
]);

/**
 * Matches CSS rules against every element in the parsed HTML document.
 *
 * @param {string} html
 * @param {import("./parser.js").ParsedRule[]} rules
 * @returns {MatchResult[]}
 *
 * @typedef {{
 *   elementPath: string,
 *   depth: number,
 *   matchedRules: import("./parser.js").ParsedRule[],
 *   inheritedProperties: Map<string, InheritedValue>
 * }} MatchResult
 *
 * @typedef {{ value: string, fromPath: string }} InheritedValue
 */
export function matchRules(html, rules) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);

  const results = [];
  const pathCache = new WeakMap();

  let node = walker.currentNode;

  while (node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node = walker.nextNode();
      continue;
    }

    const element = /** @type {Element} */ (node);
    const matched = [];

    for (const rule of rules) {
      let matches = false;
      try {
        matches = element.matches(rule.selector);
      } catch {
        // Invalid selector — skip silently; parser handles warnings
      }

      if (matches) {
        matched.push({
          ...rule,
          specificity: calculateSpecificity(rule.selector),
        });
      }
    }

    const depth = getDepth(element);
    const path = buildPath(element, pathCache);

    results.push({
      elementPath: path,
      depth,
      matchedRules: matched,
      inheritedProperties: resolveInheritance(element, results, pathCache),
    });

    node = walker.nextNode();
  }

  return results;
}

export { INHERITED_PROPERTIES };

function getDepth(el) {
  let d = 0;
  let cur = el.parentElement;
  while (cur) {
    d++;
    cur = cur.parentElement;
  }
  return d;
}

function buildPath(el, cache) {
  if (cache.has(el)) return cache.get(el);

  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const classes = el.classList.length ? `.${[...el.classList].join(".")}` : "";

  const parent = el.parentElement;
  const siblings = parent ? [...parent.children].filter((c) => c.tagName === el.tagName) : [el];
  const nthIdx = siblings.indexOf(el) + 1;
  const nth = siblings.length > 1 ? `:nth-child(${nthIdx})` : "";

  const segment = `${tag}${id}${classes}${nth}`;
  const parentPath = parent && parent.tagName !== "BODY" ? cache.get(parent) : null;
  const path = parentPath ? `${parentPath} > ${segment}` : segment;

  cache.set(el, path);
  return path;
}

function resolveInheritance(element, previousResults, pathCache) {
  const inherited = new Map();
  let ancestor = element.parentElement;

  while (ancestor && ancestor.tagName !== "HTML") {
    const ancestorPath = pathCache.get(ancestor);
    const ancestorResult = previousResults.find((r) => r.elementPath === ancestorPath);

    if (ancestorResult) {
      for (const rule of ancestorResult.matchedRules) {
        for (const decl of rule.declarations) {
          if (INHERITED_PROPERTIES.has(decl.property) && !inherited.has(decl.property)) {
            inherited.set(decl.property, {
              value: decl.value,
              fromPath: ancestorPath,
            });
          }
        }
      }
    }

    ancestor = ancestor.parentElement;
  }

  return inherited;
}
