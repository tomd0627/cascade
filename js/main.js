import { parseCSS } from "./parser.js";
import { matchRules } from "./matcher.js";
import { resolveCascade } from "./cascade.js";
import { renderResults, renderError } from "./renderer.js";

const btnAnalyze = /** @type {HTMLButtonElement} */ (document.getElementById("btn-analyze"));
const inputCSS = /** @type {HTMLTextAreaElement} */ (document.getElementById("input-css"));
const inputHTML = /** @type {HTMLTextAreaElement} */ (document.getElementById("input-html"));
const resultsEmpty = /** @type {HTMLElement} */ (document.getElementById("results-empty"));
const resultsContent = /** @type {HTMLElement} */ (document.getElementById("results-content"));

const SAMPLE_CSS = `body {
  color: #94a3b8;
  font-family: system-ui, sans-serif;
  font-size: 16px;
}

h1 {
  color: #e8f1ff;
  font-size: 2rem;
}

.card {
  color: #c5d0e8;
  padding: 1rem;
}

/* Higher specificity: ID + class beats class alone */
#featured .card {
  color: #5ef0c8;
}

/* !important overrides everything */
.card.highlight {
  color: #fbbf24 !important;
}`;

const SAMPLE_HTML = `<div id="featured">
  <div class="card highlight">
    <h1>Featured Card</h1>
    <p>Highlighted — !important wins over everything.</p>
  </div>
  <div class="card">
    <h1>Regular Card</h1>
    <p>ID + class selector wins here.</p>
  </div>
</div>`;

function init() {
  inputCSS.value = SAMPLE_CSS;
  inputHTML.value = SAMPLE_HTML;

  btnAnalyze.addEventListener("click", analyze);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      analyze();
    }
  });

  document.querySelectorAll(".btn-clear").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const panel = /** @type {HTMLElement} */ (e.currentTarget).closest(".panel");
      const textarea = panel?.querySelector("textarea");
      if (textarea) {
        textarea.value = "";
        textarea.focus();
      }
    });
  });
}

function showResults() {
  resultsEmpty.hidden = true;
  resultsContent.hidden = false;
}

function showEmpty() {
  resultsEmpty.hidden = false;
  resultsContent.hidden = true;
}

function analyze() {
  const css = inputCSS.value.trim();
  const html = inputHTML.value.trim();

  if (!css && !html) {
    showEmpty();
    return;
  }

  if (!css) {
    showResults();
    renderError(
      resultsContent,
      "No CSS provided",
      "Paste some CSS into the left panel to analyze.",
    );
    return;
  }

  if (!html) {
    showResults();
    renderError(
      resultsContent,
      "No HTML provided",
      "Paste some HTML markup into the right panel to analyze.",
    );
    return;
  }

  btnAnalyze.dataset.loading = "true";
  btnAnalyze.disabled = true;

  setTimeout(() => {
    try {
      const { rules, warnings } = parseCSS(css);
      const elementMatches = matchRules(html, rules);

      const elementResults = elementMatches.map(
        ({ elementPath, matchedRules, inheritedProperties }) => ({
          elementPath,
          propertyResults: resolveCascade(matchedRules, inheritedProperties),
        }),
      );

      showResults();
      renderResults(resultsContent, elementResults, warnings);
    } catch (err) {
      showResults();
      renderError(
        resultsContent,
        "Analysis failed",
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      btnAnalyze.dataset.loading = "false";
      btnAnalyze.disabled = false;
    }
  }, 0);
}

init();
