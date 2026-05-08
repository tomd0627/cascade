import { formatSpecificity } from "./specificity.js";

const ICONS = {
  win: "✓",
  lose: "✕",
  important: "!",
  inherit: "↑",
};

const REASON_LABELS = {
  specificity: "higher specificity",
  "source-order": "source order",
  important: "!important",
};

/**
 * Renders cascade analysis results into the given container element.
 *
 * @param {HTMLElement} container
 * @param {import("./cascade.js").ElementResult[]} elementResults
 * @param {string[]} warnings
 */
export function renderResults(container, elementResults, warnings) {
  container.innerHTML = "";

  if (warnings.length) {
    container.appendChild(renderWarnings(warnings));
  }

  const hasResults = elementResults.some((r) => r.propertyResults.size > 0);

  if (!hasResults) {
    const msg = document.createElement("p");
    msg.className = "no-rules-matched";
    msg.textContent = "No CSS rules matched any elements in the provided HTML.";
    container.appendChild(msg);
    return;
  }

  const header = buildResultsHeader(elementResults);
  container.appendChild(header);

  const list = document.createElement("div");
  list.className = "element-list";

  for (const result of elementResults) {
    if (result.propertyResults.size === 0) continue;
    list.appendChild(renderElementCard(result));
  }

  container.appendChild(list);
}

/**
 * Renders an error state into the container.
 *
 * @param {HTMLElement} container
 * @param {string} title
 * @param {string} message
 */
export function renderError(container, title, message) {
  container.innerHTML = "";
  const banner = document.createElement("div");
  banner.className = "error-banner";
  banner.setAttribute("role", "alert");
  banner.innerHTML = `
    <span class="error-banner-icon" aria-hidden="true">✕</span>
    <div class="error-banner-content">
      <p class="error-banner-title">${escHtml(title)}</p>
      <p class="error-banner-message">${escHtml(message)}</p>
    </div>
  `;
  container.appendChild(banner);
}

function buildResultsHeader(elementResults) {
  const totalElements = elementResults.filter((r) => r.propertyResults.size > 0).length;
  const totalProps = elementResults.reduce((n, r) => n + r.propertyResults.size, 0);

  const header = document.createElement("div");
  header.className = "results-header";
  header.innerHTML = `
    <span class="results-title">Results</span>
    <div class="stats-bar">
      <span class="stat-item">
        <span class="stat-value">${totalElements}</span>
        <span class="stat-label">element${totalElements !== 1 ? "s" : ""}</span>
      </span>
      <span class="stat-item">
        <span class="stat-value">${totalProps}</span>
        <span class="stat-label">propert${totalProps !== 1 ? "ies" : "y"}</span>
      </span>
    </div>
  `;
  return header;
}

function renderElementCard(result) {
  const card = document.createElement("div");
  card.className = "element-card";

  const header = document.createElement("div");
  header.className = "element-card-header";
  header.innerHTML = `<span class="element-path">${formatPath(result.elementPath)}</span>`;
  card.appendChild(header);

  const body = document.createElement("div");
  body.className = "element-card-body";

  for (const [property, propResult] of result.propertyResults) {
    body.appendChild(renderPropGroup(property, propResult));
  }

  card.appendChild(body);
  return card;
}

function renderPropGroup(property, propResult) {
  const group = document.createElement("div");
  group.className = "prop-group";

  const groupHeader = document.createElement("div");
  groupHeader.className = "prop-group-header";
  groupHeader.innerHTML = `<span class="prop-name">${escHtml(property)}</span>`;
  group.appendChild(groupHeader);

  if (propResult.inherited) {
    group.appendChild(renderInheritRow(property, propResult.inherited));
    return group;
  }

  if (propResult.winner) {
    const state = propResult.winner.declaration.important ? "important" : "win";
    group.appendChild(renderRuleRow(propResult.winner, state, null));
  }

  for (const loser of propResult.losers) {
    group.appendChild(renderRuleRow(loser, "lose", loser.reason));
  }

  return group;
}

function renderRuleRow(contestant, state, reason) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.dataset.state = state;

  const icon = document.createElement("span");
  icon.className = "rule-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS[state];

  const content = document.createElement("div");
  content.className = "rule-content";

  const main = document.createElement("div");
  main.className = "rule-main";

  const selectorEl = document.createElement("span");
  selectorEl.className = "rule-selector";
  selectorEl.textContent = contestant.rule.selector;

  const valueEl = document.createElement("span");
  valueEl.className = "rule-value";
  const important = contestant.declaration.important ? " !important" : "";
  valueEl.textContent = `→ ${contestant.declaration.value}${important}`;

  main.appendChild(selectorEl);
  main.appendChild(valueEl);
  content.appendChild(main);

  const meta = document.createElement("div");
  meta.className = "rule-meta";

  const badge = document.createElement("span");
  badge.className = "badge-specificity";
  badge.setAttribute("aria-label", `specificity ${formatSpecificity(contestant.rule.specificity)}`);
  badge.textContent = formatSpecificity(contestant.rule.specificity);
  meta.appendChild(badge);

  if (reason) {
    const chip = document.createElement("span");
    chip.className = "chip-reason";
    chip.dataset.reason = reason;
    chip.textContent = `lost: ${REASON_LABELS[reason] ?? reason}`;
    meta.appendChild(chip);
  }

  content.appendChild(meta);
  row.appendChild(icon);
  row.appendChild(content);
  return row;
}

function renderInheritRow(property, inherited) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.dataset.state = "inherit";

  const icon = document.createElement("span");
  icon.className = "rule-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS.inherit;

  const content = document.createElement("div");
  content.className = "rule-content";

  const main = document.createElement("div");
  main.className = "rule-main";

  const valueEl = document.createElement("span");
  valueEl.className = "rule-value";
  valueEl.textContent = inherited.value;
  main.appendChild(valueEl);
  content.appendChild(main);

  const meta = document.createElement("div");
  meta.className = "rule-meta";

  const fromEl = document.createElement("span");
  fromEl.className = "inherit-from";
  fromEl.innerHTML = `inherited from <span class="inherit-path">${escHtml(inherited.fromPath)}</span>`;
  meta.appendChild(fromEl);
  content.appendChild(meta);

  row.appendChild(icon);
  row.appendChild(content);
  return row;
}

function renderWarnings(warnings) {
  const list = document.createElement("div");
  list.className = "warning-list";

  for (const warning of warnings) {
    const item = document.createElement("div");
    item.className = "warning-item";
    item.setAttribute("role", "status");
    item.innerHTML = `
      <span class="warning-item-icon" aria-hidden="true">⚠</span>
      <span class="warning-item-text">${escHtml(warning)}</span>
    `;
    list.appendChild(item);
  }

  return list;
}

function formatPath(path) {
  return path.replace(
    /([a-z][\w-]*)|(#[\w-]+)|(\.[\w-]+)|(:[:\w-]+(?:\([^)]*\))?)/gi,
    (match, tag, id, cls) => {
      if (tag) return `<span class="part-tag">${escHtml(tag)}</span>`;
      if (id) return `<span class="part-id">${escHtml(id)}</span>`;
      if (cls) return `<span class="part-class">${escHtml(cls)}</span>`;
      return `<span class="part-nth">${escHtml(match)}</span>`;
    },
  );
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
