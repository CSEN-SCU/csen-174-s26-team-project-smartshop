const panels = {
  intro: document.getElementById("panel-intro"),
  list: document.getElementById("panel-list"),
  clean: document.getElementById("panel-clean"),
  compare: document.getElementById("panel-compare"),
  result: document.getElementById("panel-result"),
};

const stepOrder = ["intro", "list", "clean", "compare", "result"];

let normalizedItems = [];

function setStep(step) {
  for (const [key, el] of Object.entries(panels)) {
    const on = key === step;
    el.hidden = !on;
    el.classList.toggle("hidden", !on);
    el.setAttribute("aria-hidden", on ? "false" : "true");
  }

  const idx = stepOrder.indexOf(step);
  document.querySelectorAll("[data-step-indicator]").forEach((li) => {
    const key = li.getAttribute("data-step-indicator");
    const i = stepOrder.indexOf(key);
    li.classList.remove("active", "done");
    if (i === idx) li.classList.add("active");
    else if (idx > i) li.classList.add("done");
  });
}

function renderWhy(htmlFromApi) {
  const el = document.getElementById("result-why");
  const parts = String(htmlFromApi).split(/\*\*(.+?)\*\*/g);
  el.innerHTML = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const s = document.createElement("strong");
      s.textContent = parts[i];
      el.appendChild(s);
    } else {
      el.appendChild(document.createTextNode(parts[i]));
    }
  }
}

document.getElementById("btn-start").addEventListener("click", () => {
  setStep("list");
});

document.getElementById("btn-back-intro").addEventListener("click", () => {
  setStep("intro");
});

document.getElementById("btn-back-list").addEventListener("click", () => {
  setStep("list");
});

document.getElementById("btn-normalize").addEventListener("click", async () => {
  const raw = document.getElementById("raw-list").value;
  document.getElementById("normalize-error").hidden = true;

  const btn = document.getElementById("btn-normalize");
  btn.disabled = true;
  btn.textContent = "Working…";

  try {
    const res = await fetch("/api/normalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawList: raw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");

    normalizedItems = data.items || [];
    const ul = document.getElementById("normalized-items");
    ul.innerHTML = "";
    normalizedItems.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });

    const mode = data.mode || "offline";
    const modeLabel =
      mode === "ai"
        ? "Cleaned with the AI API (your key in .env)."
        : mode === "fallback"
          ? "AI response was unclear; used offline cleanup."
          : "Offline cleanup (set OPENAI_API_KEY in .env for AI).";
    document.getElementById("clean-mode").textContent = modeLabel;

    setStep("clean");
  } catch (e) {
    const err = document.getElementById("normalize-error");
    err.textContent = e.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Clean up my list";
  }
});

document.getElementById("btn-compare").addEventListener("click", async () => {
  setStep("compare");
  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: normalizedItems }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not compare stores");
    }

    const best = data.best;
    document.getElementById("result-store-name").textContent = best.name;
    document.getElementById("result-total").textContent = `$${best.totalPrice.toFixed(2)}`;
    document.getElementById("result-distance").textContent = `${best.distanceMiles} mi`;
    document.getElementById("result-score").textContent = best.score.toFixed(2);

    renderWhy(data.why);
    document.getElementById("result-formula").textContent = `Scoring: ${data.scoring.formula}`;

    const lines = document.getElementById("result-lines");
    lines.innerHTML = "";
    best.lineItems.forEach((row) => {
      const li = document.createElement("li");
      li.textContent = `${row.label} — $${row.price.toFixed(2)}`;
      lines.appendChild(li);
    });

    const alts = document.getElementById("result-alts");
    alts.innerHTML = "";
    (data.alternatives || []).forEach((a) => {
      const li = document.createElement("li");
      li.textContent = `${a.name} — $${a.totalPrice.toFixed(2)} · ${a.distanceMiles} mi · score ${a.score.toFixed(2)}`;
      alts.appendChild(li);
    });

    setStep("result");
  } catch (e) {
    alert(e.message);
    setStep("clean");
  }
});

document.getElementById("btn-restart").addEventListener("click", () => {
  normalizedItems = [];
  document.getElementById("raw-list").value = "";
  document.getElementById("normalized-items").innerHTML = "";
  document.getElementById("normalize-error").hidden = true;
  setStep("intro");
});

setStep("intro");
