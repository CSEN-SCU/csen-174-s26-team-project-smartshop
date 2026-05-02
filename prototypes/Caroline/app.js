const shoppingListEl = document.querySelector("#shopping-list");
const maxDistanceEl = document.querySelector("#max-distance");
const locationQueryEl = document.querySelector("#location-query");
const distanceValueEl = document.querySelector("#distance-value");
const compareBtnEl = document.querySelector("#compare-btn");
const savePurchaseBtnEl = document.querySelector("#save-purchase-btn");
const statusLineEl = document.querySelector("#status-line");
const resultsEl = document.querySelector("#results");
const frequentItemsEl = document.querySelector("#frequent-items");
const categoryCountsEl = document.querySelector("#category-counts");
const alternativeDescriptionEl = document.querySelector("#alternative-description");
const alternativeImageEl = document.querySelector("#alternative-image");
const findAlternativesBtnEl = document.querySelector("#find-alternatives-btn");
const alternativeResultsEl = document.querySelector("#alternative-results");
const templateEl = document.querySelector("#store-card-template");

const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function parseShoppingList(text) {
  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}

function getUserId() {
  return "default-user";
}

function renderEmpty(message) {
  resultsEl.innerHTML = `<div class="empty-state">${message}</div>`;
}

function setStatus(message) {
  statusLineEl.textContent = message;
}

function renderFrequentItems(items) {
  frequentItemsEl.innerHTML = "";
  if (!items.length) {
    frequentItemsEl.innerHTML = `<span class="freq-chip">No purchases saved yet</span>`;
    return;
  }

  items.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = "freq-chip";
    chip.textContent = `${entry.item} (${entry.count})`;
    frequentItemsEl.appendChild(chip);
  });
}

function renderCategoryCounts(categoryCounts) {
  categoryCountsEl.innerHTML = "";
  const entries = Object.entries(categoryCounts || {});
  if (!entries.length) {
    categoryCountsEl.innerHTML = `<span class="freq-chip">No categories yet</span>`;
    return;
  }

  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const chip = document.createElement("span");
      chip.className = "freq-chip";
      chip.textContent = `${category}: ${count}`;
      categoryCountsEl.appendChild(chip);
    });
}

function renderResults(options) {
  resultsEl.innerHTML = "";

  if (!options.length) {
    renderEmpty("No stores match your distance preference.");
    return;
  }

  const bestTotal = Math.min(...options.map((option) => option.total));

  options.forEach((option) => {
    const fragment = templateEl.content.cloneNode(true);
    const card = fragment.querySelector(".store-card");
    const name = fragment.querySelector(".store-name");
    const distance = fragment.querySelector(".distance-pill");
    const total = fragment.querySelector(".total-price");
    const coverage = fragment.querySelector(".coverage-line");
    const itemList = fragment.querySelector(".item-prices");

    name.textContent = option.storeName;
    distance.textContent = `${option.distanceMi.toFixed(1)} mi`;
    total.textContent = fmtCurrency.format(option.total);
    const addressSuffix = option.storeAddress ? ` · ${option.storeAddress}` : "";
    coverage.textContent = `Source: ${option.source || "unknown"} · Priced ${option.knownCount}/${option.totalCount} items from known data${addressSuffix}`;

    if (option.total === bestTotal) {
      card.classList.add("best");
    }

    option.itemBreakdown.forEach((entry) => {
      const li = document.createElement("li");
      const suffix = entry.estimated ? " (estimated)" : "";
      li.textContent = `${entry.item}: ${fmtCurrency.format(entry.price)}${suffix}`;
      itemList.appendChild(li);
    });

    resultsEl.appendChild(fragment);
  });
}

async function runComparison() {
  const items = parseShoppingList(shoppingListEl.value);
  const maxDistance = Number(maxDistanceEl.value);
  const userId = getUserId();
  const locationQuery = locationQueryEl.value.trim();

  if (!items.length) {
    renderEmpty("Add at least one item to compare store totals.");
    return;
  }

  setStatus("Comparing stores...");

  try {
    const normalizeRes = await fetch("/api/normalize-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: shoppingListEl.value }),
    });
    const normalizePayload = await normalizeRes.json();
    const normalizedItems = Array.isArray(normalizePayload.items) && normalizePayload.items.length
      ? normalizePayload.items
      : items.map((name) => ({ name, category: "other" }));

    const compareRes = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        items: normalizedItems,
        maxDistance,
        storeMode: "real",
        userLocation: { locationQuery }
      }),
    });
    const comparePayload = await compareRes.json();
    if (!compareRes.ok) {
      throw new Error(comparePayload.error || "Unable to compare stores.");
    }

    shoppingListEl.value = normalizedItems.map((item) => item.name).join("\n");
    renderResults(comparePayload.options || []);
    renderFrequentItems(comparePayload.frequentItems || []);
    renderCategoryCounts(comparePayload.categoryCounts || {});
    const sourceCounts = comparePayload.sourceCounts || {};
    const realCount = sourceCounts["real-store-estimated-price"] || 0;
    const warningText = Array.isArray(comparePayload.warnings) && comparePayload.warnings.length
      ? ` Warning: ${comparePayload.warnings[0]}`
      : "";
    const estimationNote = " Prices are still estimated until retailer price feeds are connected.";
    setStatus(
      normalizePayload.source === "openai"
        ? `Compared with OpenAI normalization. Results: ${realCount} real store entries.${warningText}${estimationNote}`
        : `Compared with local normalization. Results: ${realCount} real store entries.${warningText}${estimationNote}`,
    );
  } catch (error) {
    renderEmpty("Could not compare stores. Check server/API configuration.");
    setStatus(error.message);
  }
}

function updateDistanceLabel() {
  distanceValueEl.textContent = `${maxDistanceEl.value} mi`;
}

async function saveAsPurchased() {
  const items = parseShoppingList(shoppingListEl.value).map((name) => ({ name, category: "other" }));
  const userId = getUserId();

  if (!items.length) {
    setStatus("Add items before saving purchases.");
    return;
  }

  setStatus("Saving purchase history...");
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || "Failed to save purchase history.");
    }
    renderFrequentItems(payload.frequentItems || []);
    setStatus("Purchase history saved.");
  } catch (error) {
    setStatus(error.message);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAlternatives(alternatives, source) {
  alternativeResultsEl.innerHTML = "";
  if (!alternatives.length) {
    alternativeResultsEl.innerHTML = `<div class="empty-state">No alternatives found.</div>`;
    return;
  }

  alternatives.forEach((alternative) => {
    const card = document.createElement("article");
    card.className = "alternative-card";
    card.innerHTML = `
      <strong>${alternative.name}</strong>
      <p>Estimated price: ${fmtCurrency.format(Number(alternative.estimatedPrice || 0))}</p>
      <p>${alternative.reason || ""}</p>
    `;
    alternativeResultsEl.appendChild(card);
  });
  if (source !== "openai") {
    const sourceLine = document.createElement("p");
    sourceLine.className = "status-line";
    sourceLine.textContent = "Alternatives generated with fallback mode.";
    alternativeResultsEl.appendChild(sourceLine);
  }
}

async function runAlternativeSearch() {
  const description = alternativeDescriptionEl.value.trim();
  if (!description) {
    setStatus("Add a description to find alternatives.");
    return;
  }

  setStatus("searching...");
  try {
    const imageFile = alternativeImageEl.files?.[0];
    const imageDataUrl = await fileToDataUrl(imageFile);
    const res = await fetch("/api/find-alternatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, imageDataUrl })
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || "Could not find alternatives.");
    }
    renderAlternatives(payload.alternatives || [], payload.source);
    setStatus("Search complete");
  } catch (error) {
    setStatus(error.message);
    alternativeResultsEl.innerHTML = `<div class="empty-state">Could not run alternative search.</div>`;
  }
}


maxDistanceEl.addEventListener("input", () => {
  updateDistanceLabel();
  runComparison();
});

compareBtnEl.addEventListener("click", runComparison);
savePurchaseBtnEl.addEventListener("click", saveAsPurchased);
findAlternativesBtnEl.addEventListener("click", runAlternativeSearch);

updateDistanceLabel();
