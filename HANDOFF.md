# Cascade — HANDOFF

## Current phase

**All phases complete.** Ready to deploy.

## What was completed

- ✅ Phase 1 — Pre-code declaration (plan approved)
- ✅ Phase 2 — Full scaffold: `index.html`, all 6 CSS files, `package.json`, `netlify.toml`, `_redirects`, `favicon.svg`, `.gitignore`
- ✅ Phase 3 — `parser.js` (CSS tokenizer, at-rule detection, declaration parsing) + `specificity.js` (full W3C Selectors L4 implementation including `:is()`/`:not()`/`:has()` special cases with correct max-specificity-of-list semantics)
- ✅ Phase 4 — `matcher.js` (`element.matches()` against DOMParser doc, inheritance resolution for ~60 standard inherited properties) + `cascade.js` (!important → specificity → source order)
- ✅ Phase 5 — `renderer.js` (element cards, rule rows, win/lose/inherit/important states, specificity badges, reason chips, warning banners)
- ✅ Phase 6 — Error states wired in `main.js` (empty inputs, invalid CSS, analysis failure)
- ✅ Phase 7 — Husky pre-commit hook, ESLint 9 flat config (browser globals), Stylelint 16 (alphabetical order, modern color functions), Prettier 3, EditorConfig — all passing clean
- ✅ Phase 8 — Lighthouse 100/100/100/100 (Performance/Accessibility/Best-Practices/SEO), WCAG AA contrast fixes applied, README finalized

## Lighthouse scores (local)

| Category | Score |
|----------|-------|
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

## Next task

**Deploy to Netlify.** Steps:
1. Push to GitHub (`git push origin master`)
2. Connect repo in Netlify UI → set publish directory to `.` (root) → deploy
3. Set custom subdomain: `tomdeluca-cascade.netlify.app`
4. Update `CLAUDE.md` with live URL

## Decisions made

- **Vanilla JS only** — no css-tree/postcss. `element.matches()` handles selector matching; only specificity calculation is hand-written.
- **`:is()`/`:not()`/`:has()` specificity** — correctly takes the max specificity from the selector list argument, not the sum. Critical for recruiter credibility.
- **`--c-text-dim` lightened from `#5c7190` to `#8697ae`** — original value failed WCAG AA at small font sizes (Lighthouse accessibility score was 96). All `--c-text-dim` uses now pass 4.5:1 on every background they appear on.
- **Sample content** pre-loaded into textareas demonstrates: !important override, ID + class specificity beating class-only, and body-level inheritance.
- **`?v=1` cache-busting** query params on all CSS/JS links. Increment when deploying changes.

## Gotchas to watch for

- `element.matches()` runs against a DOMParser document, which has no stylesheet. `:hover`, `:focus`, `:active` will never match (correct — cascade is static structure analysis).
- The inheritance resolver in `matcher.js` uses a `WeakMap` path cache keyed by `Element`. It depends on ancestors being processed before descendants — guaranteed by the TreeWalker depth-first traversal order.
- ESLint 9 uses flat config (`eslint.config.js`). Don't create a `.eslintrc.js` alongside it.
- Stylelint `color-function-notation: "modern"` requires `rgb(r g b / a)` syntax. Use `npx stylelint --fix` to auto-convert legacy `rgba()` if needed.

## Remaining phases

None — project is complete and audit-ready.
