# Cascade — CLAUDE.md

## Project overview

Browser-based CSS specificity and cascade visualizer. Paste a stylesheet and HTML markup; the tool computes specificity scores, resolves the cascade, and renders a visual breakdown of which rules win and why. Portfolio project demonstrating deep CSS knowledge.

**Live URL (target):** `https://tomdeluca-cascade.netlify.app/` (deploy pending)

## Tech stack

- **Vanilla HTML/CSS/JS** — no runtime dependencies, no build step
- `index.html` loads CSS/JS directly via `<link>`/`<script type="module">`
- **Google Fonts** — Plus Jakarta Sans + Inter, `font-display: swap`
- **Deployment** — Netlify static hosting (`netlify.toml` + `_redirects`)
- **Dev tooling only** — Husky, lint-staged, ESLint 9, Stylelint 16, Prettier 3

## File structure

```
cascade/
├── index.html
├── favicon.svg
├── netlify.toml
├── _redirects
├── css/
│   ├── tokens.css          # All CSS custom properties
│   ├── reset.css           # Modern CSS reset
│   ├── layout.css          # App shell, header, panels grid, results
│   ├── panels.css          # Input panel, textarea, clear button
│   ├── visualization.css   # Element cards, rule rows, badges, chips
│   └── components.css      # Analyze button, error banner, kbd, stats
├── js/
│   ├── main.js             # App entry: UI wiring, analyze orchestration
│   ├── parser.js           # CSS tokenizer → rule objects
│   ├── specificity.js      # Specificity calculator + formatter
│   ├── matcher.js          # element.matches() against DOM, inheritance
│   ├── cascade.js          # Sort by !important > specificity > source order
│   └── renderer.js         # Build and inject results HTML
├── package.json            # devDependencies only
├── .eslintrc.js / eslint.config.js
├── .stylelintrc.js
├── .prettierrc
├── .editorconfig
└── .husky/
```

## Design system

All tokens are in `css/tokens.css`. Key semantic colors:

| Token | Hex | Meaning |
|-------|-----|---------|
| `--c-win` | `#5ef0c8` | Applied/winning rule |
| `--c-lose` | `#ff6b6b` | Overridden/losing rule |
| `--c-important` | `#fbbf24` | `!important` declarations |
| `--c-specificity` | `#a78bfa` | Specificity score badges |
| `--c-inherit` | `#60a5fa` | Inherited value chains |

## Supported CSS features (v1)

Type selectors, class selectors, ID selectors, universal selector (`*`), attribute selectors, pseudo-classes (`:hover`, `:nth-child()`, `:not()`, `:is()`, `:has()`, `:where()` etc.), pseudo-elements (`::before`, `::after`), all combinators, `!important`, inheritance for standard inherited properties.

**Not supported (shown as warnings):** `@media`, `@layer`, `@keyframes`, `@supports`, `@container`, CSS nesting (`&`), inline `style=""` attributes, Shadow DOM.

## Specificity algorithm

Per W3C Selectors Level 4 — `[a, b, c]` tuple:
- a = ID selectors
- b = class / attribute / pseudo-class (excl. `:where()`)
- c = type / pseudo-element

`:is()`, `:not()`, `:has()` → specificity of most specific argument.
`:where()` → zero.

## Cascade resolution order

1. `!important` declarations
2. Specificity (descending)
3. Source order (last rule wins)

## Development

```bash
npm install          # installs dev tooling only
# Open index.html directly in browser — no server needed for local dev
# (module scripts require a server; use any static file server)
npx serve .          # or: python -m http.server 8080
```

## Linting

```bash
npx eslint js/       # JS linting
npx stylelint css/   # CSS linting
npx prettier --check .  # format check
```

Pre-commit hooks run all three automatically via Husky + lint-staged.
