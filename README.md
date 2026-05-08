# Cascade

A browser-based CSS specificity and cascade visualizer. Paste a stylesheet and HTML markup — Cascade computes specificity scores, resolves the cascade, and renders a clear visual breakdown of which rules win, which rules lose, and why.

## What it does

- **Parses CSS** into discrete rule objects (selector + declarations)
- **Matches selectors** to each element in your HTML using the browser's own `element.matches()` — no selector-matching reinvention
- **Calculates specificity** per the [W3C Selectors Level 4 spec](https://www.w3.org/TR/selectors-4/#specificity-rules), displaying `(a, b, c)` tuples
- **Resolves the cascade** in the correct order: `!important` → specificity → source order
- **Traces inheritance** for standard inherited properties (color, font-size, etc.), showing which ancestor element the value comes from
- **Visualizes results** with color-coded rule rows: mint for winning rules, red for losing rules, amber for `!important`, blue for inherited values

## Setup

```bash
npm install        # installs dev tooling only — no runtime dependencies
```

To run locally, any static file server works (ES module scripts require a server origin):

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:3000` (or `http://localhost:8080`).

## Linting

```bash
npx eslint js/                    # JS: no unused vars, no console.log, strict ===
npx stylelint "css/**/*.css"      # CSS: no duplicate selectors, alphabetical order
npx prettier --check "**/*.{html,css,js}" --ignore-path .gitignore
```

All three run automatically as a pre-commit hook via Husky + lint-staged.

## Supported CSS features (v1)

| Feature | Supported |
|---------|-----------|
| Type selectors (`div`, `p`, `h1`) | ✓ |
| Class selectors (`.foo`, `.foo.bar`) | ✓ |
| ID selectors (`#bar`) | ✓ |
| Universal selector (`*`) | ✓ |
| Attribute selectors (`[attr=val]`, `[attr^=val]`, etc.) | ✓ |
| Pseudo-classes (`:hover`, `:nth-child()`, `:first-child`, etc.) | ✓ |
| `:not()`, `:is()`, `:has()`, `:where()` | ✓ |
| Pseudo-elements (`::before`, `::after`, `::placeholder`, etc.) | ✓ |
| Combinators (` `, `>`, `+`, `~`) | ✓ |
| `!important` declarations | ✓ |
| Inherited properties (color, font-*, line-height, etc.) | ✓ |

## Known limitations (out of scope for v1)

- `@media`, `@supports`, `@container` queries — skipped with a warning
- `@layer` cascade layers — skipped with a warning
- `@keyframes` / animations
- CSS nesting (`&`)
- Inline `style=""` attributes
- Shadow DOM / `::slotted()` / `::part()`
- Dynamic pseudo-classes (`:hover`, `:focus`) match structurally only — the tool analyzes static structure, not interactive state

## Specificity algorithm

Follows [W3C Selectors Level 4](https://www.w3.org/TR/selectors-4/#specificity-rules):

- **a** — ID selectors
- **b** — class selectors, attribute selectors, pseudo-classes (excluding `:where()`)
- **c** — type selectors, pseudo-elements

`:is()`, `:not()`, `:has()` contribute the specificity of their **most specific argument** (not the sum). `:where()` contributes zero.

## Tech stack

- Vanilla HTML/CSS/JS — zero runtime dependencies, no build step
- `DOMParser` for HTML parsing
- `element.matches()` for selector matching (browser handles all edge cases)
- Hand-written specificity calculator per W3C spec
- Deployed to Netlify as static files

## Deployment

Deploying to Netlify is automatic on push. The `netlify.toml` configures:

- Long-lived `Cache-Control` headers for all static assets (`/css/*`, `/js/*`, `/favicon.svg`)
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

When deploying a new version, increment the `?v=N` query parameter on CSS/JS references in `index.html` to bust the cache.
