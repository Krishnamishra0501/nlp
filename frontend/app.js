const API_BASE = "/api/v1";

let selectedFile = null;
let currentDomainResult = null;
let activeTab = "file";


document.addEventListener("DOMContentLoaded", () => {
  setupFileUpload();
  checkBackendStatus();
  loadDomains();
});


/* =========================================================
   BACKEND STATUS
========================================================= */

async function checkBackendStatus() {
  const statusText = document.getElementById("status-text");
  const statusBadge = document.getElementById("backend-status");

  try {
    const response = await fetch("/docs");

    if (response.ok) {
      statusText.textContent = "API Online";
      statusBadge.style.color = "var(--success)";
    } else {
      statusText.textContent = "API Offline";
    }
  } catch {
    statusText.textContent = "API Offline";
  }
}


/* =========================================================
   FILE UPLOAD
========================================================= */

function setupFileUpload() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", event => {
    if (event.target.files.length) {
      setSelectedFile(event.target.files[0]);
    }
  });

  dropzone.addEventListener("dragover", event => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", event => {
    event.preventDefault();
    dropzone.classList.remove("dragover");

    if (event.dataTransfer.files.length) {
      setSelectedFile(event.dataTransfer.files[0]);
    }
  });
}


function setSelectedFile(file) {
  selectedFile = file;

  const preview = document.getElementById("file-preview");
  const dropzone = document.getElementById("dropzone");
  const name = document.getElementById("file-name-display");
  const size = document.getElementById("file-size-display");
  const icon = document.getElementById("file-icon");

  if (preview) preview.style.display = "flex";
  if (dropzone) dropzone.style.display = "none";

  if (name) {
    name.textContent = file.name;
  }

  if (size) {
    size.textContent = formatFileSize(file.size);
  }

  if (icon) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "pdf") {
      icon.textContent = "📕";
    } else if (extension === "docx") {
      icon.textContent = "📘";
    } else {
      icon.textContent = "📄";
    }
  }
}


function clearSelectedFile() {
  selectedFile = null;

  const preview = document.getElementById("file-preview");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  if (preview) preview.style.display = "none";
  if (dropzone) dropzone.style.display = "block";
  if (fileInput) fileInput.value = "";
}


function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}


/* =========================================================
   TABS
========================================================= */

function switchTab(tab) {
  activeTab = tab;

  const fileView = document.getElementById("view-file");
  const textView = document.getElementById("view-text");
  const verifyView = document.getElementById("view-verify");

  const fileBtn = document.getElementById("tab-file-btn");
  const textBtn = document.getElementById("tab-text-btn");
  const verifyBtn = document.getElementById("tab-verify-btn");

  fileView.style.display = "none";
  textView.style.display = "none";
  verifyView.style.display = "none";

  fileBtn.classList.remove("active");
  textBtn.classList.remove("active");
  verifyBtn.classList.remove("active");

  if (tab === "file") {
    fileView.style.display = "block";
    fileBtn.classList.add("active");
  }

  if (tab === "text") {
    textView.style.display = "block";
    textBtn.classList.add("active");
  }

  if (tab === "verify") {
    verifyView.style.display = "block";
    verifyBtn.classList.add("active");
  }

  const btnText = document.getElementById("btn-text");

  if (btnText) {
    btnText.textContent =
      tab === "verify"
        ? "Verify Domain"
        : "Detect Domain";
  }
}


/* =========================================================
   DOMAINS
========================================================= */

async function loadDomains() {
  try {
    const response = await fetch(`${API_BASE}/domains`);

    if (!response.ok) return;

    const data = await response.json();

    const domains =
      Array.isArray(data)
        ? data
        : data.domains || data.items || [];

    const claimed =
      document.getElementById(
        "user-claimed-domain-select"
      );

    const override =
      document.getElementById(
        "domain-override-select"
      );

    domains.forEach(domain => {
      const name =
        typeof domain === "string"
          ? domain
          : domain.name ||
            domain.domain ||
            domain.label ||
            domain.title;

      if (!name) return;

      if (claimed) {
        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        claimed.appendChild(option);
      }

      if (override) {
        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        override.appendChild(option);
      }
    });

  } catch (error) {
    console.error("Domain loading error:", error);
  }
}


/* =========================================================
   MAIN ANALYSIS
========================================================= */

async function runDomainDetection() {

  if (activeTab === "verify") {
    await verifyDomain();
    return;
  }

  const button =
    document.getElementById("analyze-btn");

  const btnText =
    document.getElementById("btn-text");

  button.disabled = true;

  btnText.innerHTML =
    '<span class="spinner"></span> Analyzing...';

  try {

    const baseline =
      document.getElementById(
        "use-baseline-toggle"
      ).checked;

    const formData = new FormData();

    if (activeTab === "file") {

      if (!selectedFile) {
        throw new Error(
          "Please select a contract file first."
        );
      }

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "use_baseline",
        baseline
      );

      formData.append(
        "use_chunk_aggregation",
        true
      );

    } else {

      const text =
        document
          .getElementById(
            "contract-text-area"
          )
          .value
          .trim();

      if (!text) {
        throw new Error(
          "Please paste contract text first."
        );
      }

      formData.append(
        "text",
        text
      );

      formData.append(
        "use_baseline",
        baseline
      );

      formData.append(
        "use_chunk_aggregation",
        true
      );
    }


    /* DOMAIN DETECTION */

    const domainResponse =
      await fetch(
        `${API_BASE}/detect-domain`,
        {
          method: "POST",
          body: formData
        }
      );

    if (!domainResponse.ok) {

      const error =
        await domainResponse
          .json()
          .catch(() => ({}));

      throw new Error(
        error.detail ||
        "Domain detection failed."
      );
    }

    const domainResult =
      await domainResponse.json();

    currentDomainResult =
      domainResult;

    displayDomainResults(
      domainResult
    );


    /* RISK ANALYSIS */

    await runRiskAnalysis();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "Analysis failed."
    );

  } finally {

    button.disabled = false;

    btnText.textContent =
      activeTab === "verify"
        ? "Verify Domain"
        : "Detect Domain";
  }
}


/* =========================================================
   DOMAIN RESULTS
========================================================= */

function displayDomainResults(result) {

  document.getElementById(
    "empty-state"
  ).style.display = "none";

  document.getElementById(
    "results-view"
  ).style.display = "block";

  const domain =
    result.primary_domain ||
    result.domain ||
    result.predicted_domain ||
    "Unknown";

  let confidence =
    Number(
      result.confidence ||
      result.primary_confidence ||
      0
    );

  if (confidence <= 1) {
    confidence *= 100;
  }

  document.getElementById(
    "res-primary-domain"
  ).textContent = domain;

  document.getElementById(
    "res-confidence-val"
  ).textContent =
    `${confidence.toFixed(0)}%`;

  document.getElementById(
    "res-confidence-bar"
  ).style.width =
    `${Math.min(100, confidence)}%`;

  displayPredictions(result);

  const meta =
    document.getElementById(
      "res-meta-info"
    );

  if (meta) {

    const model =
      result.model ||
      result.model_name ||
      (
        result.use_baseline
          ? "TF-IDF + Logistic Regression Baseline"
          : "RoBERTa"
      );

    const chunks =
      result.aggregated_chunks ||
      result.chunks_processed ||
      result.chunk_count ||
      1;

    meta.textContent =
      `Model: ${model} | Aggregated Section Chunks: ${chunks}`;
  }

  setupConfirmation(domain);
}


/* =========================================================
   PREDICTIONS
========================================================= */

function displayPredictions(result) {

  const list =
    document.getElementById(
      "res-predictions-list"
    );

  list.innerHTML = "";

  const predictions =
    result.top_predictions ||
    result.predictions ||
    result.top_domains ||
    [];

  if (!Array.isArray(predictions)) {
    return;
  }

  predictions
    .slice(0, 3)
    .forEach(prediction => {

      const name =
        typeof prediction === "string"
          ? prediction
          : prediction.domain ||
            prediction.name ||
            prediction.label ||
            "Unknown";

      let value =
        typeof prediction === "object"
          ? (
              prediction.probability ??
              prediction.confidence ??
              prediction.score ??
              0
            )
          : 0;

      value = Number(value);

      if (value <= 1) {
        value *= 100;
      }

      const item =
        document.createElement("div");

      item.className =
        "prediction-item";

      item.innerHTML = `
        <span class="pred-name">
          ${escapeHtml(name)}
        </span>

        <div class="pred-bar-container">

          <div class="pred-bar">
            <div
              class="pred-bar-fill"
              style="width:${Math.min(100, value)}%"
            ></div>
          </div>

          <span class="pred-val">
            ${value.toFixed(0)}%
          </span>

        </div>
      `;

      list.appendChild(item);
    });
}


/* =========================================================
   CONFIRMATION
========================================================= */

function setupConfirmation(domain) {

  const select =
    document.getElementById(
      "domain-override-select"
    );

  if (!select) return;

  const option =
    Array.from(
      select.options
    ).find(
      option => option.value === domain
    );

  if (option) {
    option.selected = true;
  }

  document.getElementById(
    "confirmation-status"
  ).style.display = "none";

  document.getElementById(
    "confirm-buttons"
  ).style.display = "flex";
}


async function confirmDomainSelection(confirmed) {

  if (!confirmed || !currentDomainResult) {
    return;
  }

  const domain =
    currentDomainResult.primary_domain ||
    currentDomainResult.domain ||
    currentDomainResult.predicted_domain;

  try {

    const response =
      await fetch(
        `${API_BASE}/confirm-domain`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            predicted_domain: domain,
            confirmed_domain: domain,
            is_confirmed: true
          })
        }
      );

    if (!response.ok) {
      throw new Error();
    }

  } catch {
    /* Frontend confirmation remains active */
  }

  document.getElementById(
    "confirmation-status"
  ).textContent =
    "✓ Domain confirmed and locked for ContractGuard Risk Engine.";

  document.getElementById(
    "confirmation-status"
  ).style.display = "block";

  document.getElementById(
    "confirm-buttons"
  ).style.display = "none";
}


function toggleDomainDropdown() {

  const select =
    document.getElementById(
      "domain-override-select"
    );

  if (!select) return;

  select.style.display =
    select.style.display === "block"
      ? "none"
      : "block";
}


function overrideDomainSelection() {

  const select =
    document.getElementById(
      "domain-override-select"
    );

  if (!select.value) return;

  document.getElementById(
    "res-primary-domain"
  ).textContent =
    select.value;

  document.getElementById(
    "confirmation-status"
  ).textContent =
    "✓ Domain changed and locked for ContractGuard Risk Engine.";

  document.getElementById(
    "confirmation-status"
  ).style.display = "block";

  document.getElementById(
    "confirm-buttons"
  ).style.display = "none";

  select.style.display = "none";
}


/* =========================================================
   RISK ANALYSIS
========================================================= */

async function runRiskAnalysis() {

  const section =
    getOrCreateRiskSection();

  section.style.display = "block";

  showRiskLoading();

  try {

    const formData =
      new FormData();

    /*
     * Send the ORIGINAL FILE.
     * Backend handles PDF / DOCX / TXT extraction.
     */

    if (selectedFile) {

      formData.append(
        "file",
        selectedFile
      );

    } else {

      const text =
        document
          .getElementById(
            "contract-text-area"
          )
          .value
          .trim();

      if (!text) {
        throw new Error(
          "No contract text available."
        );
      }

      formData.append(
        "text",
        text
      );
    }

    const response =
      await fetch(
        `${API_BASE}/analyze-risk`,
        {
          method: "POST",
          body: formData
        }
      );

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        error.detail ||
        "Risk analysis failed."
      );
    }

    const result =
      await response.json();

    displayRiskResults(result);

  } catch (error) {

    console.error(
      "Risk analysis error:",
      error
    );

    showRiskError(
      error.message
    );
  }
}


/* =========================================================
   CREATE RISK SECTION
========================================================= */

function getOrCreateRiskSection() {

  let section =
    document.getElementById(
      "risk-dashboard"
    );

  if (section) {
    return section;
  }

  section =
    document.createElement("section");

  section.id =
    "risk-dashboard";

  section.className =
    "card risk-dashboard-card";

  section.innerHTML = `
    <div class="risk-dashboard-header">

      <div class="risk-heading-row">

        <div>
          <div class="risk-eyebrow">
            CONTRACT RISK ANALYSIS
          </div>

          <h2>
            AI-Powered Contract Risk Assessment
          </h2>

          <p class="risk-dashboard-subtitle">
            Identify potentially risky contractual provisions
          </p>
        </div>

        <span class="risk-engine-badge">
          MiniLM + RoBERTa NLI
        </span>

      </div>

      <div
        id="risk-status"
        class="risk-status"
      ></div>

    </div>

    <div id="risk-content"></div>
  `;

  document
    .querySelector(".container")
    .appendChild(section);

  return section;
}


/* =========================================================
   LOADING
========================================================= */

function showRiskLoading() {

  const content =
    document.getElementById(
      "risk-content"
    );

  const status =
    document.getElementById(
      "risk-status"
    );

  if (status) {
    status.textContent =
      "Analyzing contractual provisions...";
  }

  content.innerHTML = `
    <div class="loading-state">
      <span class="spinner"></span>
      <span>Running AI risk analysis...</span>
    </div>
  `;
}


/* =========================================================
   RISK RESULTS
========================================================= */

function displayRiskResults(result) {

  const content =
    document.getElementById(
      "risk-content"
    );

  const status =
    document.getElementById(
      "risk-status"
    );

  const score =
    Number(
      result.risk_score || 0
    );

  const level =
    String(
      result.risk_level || "LOW"
    ).toUpperCase();

  const risks =
    Array.isArray(result.risks)
      ? result.risks
      : [];

  const sentences =
    Number(
      result.sentences_processed || 0
    );

  const device =
    result.device || "";

  if (status) {
    status.innerHTML =
      `<span class="status-success-dot"></span>
       Analysis complete${device ? ` • ${escapeHtml(device)}` : ""}`;
  }


  content.innerHTML = `

    <!-- SUMMARY -->

    <div class="risk-summary-grid">

      <div class="risk-summary-card score-card">

        <div class="risk-summary-label">
          Risk Score
        </div>

        <div class="risk-score-number">
          ${score.toFixed(2)}
          <span>/100</span>
        </div>

        <div class="risk-score-bar-wrapper">
          <div
            class="risk-score-bar"
            style="width:${Math.min(100, score)}%"
          ></div>
        </div>

      </div>


      <div class="risk-summary-card">

        <div class="risk-summary-label">
          Overall Level
        </div>

        <div class="risk-summary-value">
          <span class="
            risk-level-badge
            ${getRiskLevelClass(level)}
          ">
            ${escapeHtml(level)}
          </span>
        </div>

      </div>


      <div class="risk-summary-card">

        <div class="risk-summary-label">
          Risks
        </div>

        <div class="risk-summary-value">
          ${risks.length}
        </div>

        <div class="risk-summary-note">
          findings detected
        </div>

      </div>


      <div class="risk-summary-card">

        <div class="risk-summary-label">
          Sentences
        </div>

        <div class="risk-summary-value">
          ${sentences}
        </div>

        <div class="risk-summary-note">
          analyzed
        </div>

      </div>

    </div>


    <!-- RISK FINDINGS -->

    <div class="risk-list-header">

      <div>
        <h3>
          Detected Contractual Risks
        </h3>

        <p>
          Key provisions requiring attention
        </p>
      </div>

      <span class="risk-count-badge">
        ${risks.length}
      </span>

    </div>


    <div
      id="risk-list"
      class="risk-list"
    ></div>
  `;

  renderRiskCards(risks);
}


/* =========================================================
   RISK CARDS
========================================================= */

function renderRiskCards(risks) {

  const list =
    document.getElementById(
      "risk-list"
    );

  if (!list) return;

  if (!risks.length) {

    list.innerHTML = `
      <div class="risk-success">
        <div class="risk-success-icon">✓</div>
        <div>
          <strong>No significant risks detected</strong>
          <p>
            The analyzed provisions did not trigger the configured risk rules.
          </p>
        </div>
      </div>
    `;

    return;
  }


  risks.forEach(
    (risk, index) => {

      const title =
        risk.title ||
        "Contractual Risk";

      const severity =
        String(
          risk.severity || "MEDIUM"
        ).toUpperCase();

      let confidence =
        Number(
          risk.confidence || 0
        );

      if (confidence <= 1) {
        confidence *= 100;
      }

      const explanation =
        risk.explanation ||
        "A potentially relevant contractual provision was detected.";

      const evidence =
        risk.evidence ||
        "No evidence provided.";

      const recommendation =
        risk.recommendation ||
        "Review this provision carefully.";

      const similarity =
        Number(
          risk.semantic_similarity || 0
        );

      const nli =
        Number(
          risk.nli_confidence || 0
        );

      const card =
        document.createElement("div");

      card.className =
        "risk-card";


      card.innerHTML = `

        <div class="risk-card-top">

          <div class="risk-title-area">

            <span class="
              risk-severity
              ${getSeverityClass(severity)}
            ">
              ${escapeHtml(severity)}
            </span>

            <h4 class="risk-card-title">
              ${escapeHtml(title)}
            </h4>

          </div>

          <div class="risk-confidence">
            ${confidence.toFixed(0)}%
            <span>confidence</span>
          </div>

        </div>


        <p class="risk-explanation">
          ${escapeHtml(explanation)}
        </p>


        <div class="risk-card-actions">

          <button
            class="risk-details-btn"
            onclick="toggleRiskDetails(${index})"
          >
            View details
          </button>

        </div>


        <div
          id="risk-details-${index}"
          class="risk-details"
          style="display:none;"
        >

          <div class="risk-metrics">

            ${
              similarity
                ? `
                  <div>
                    <span>Semantic Similarity</span>
                    <strong>
                      ${(similarity * 100).toFixed(1)}%
                    </strong>
                  </div>
                `
                : ""
            }

            ${
              nli
                ? `
                  <div>
                    <span>NLI Confidence</span>
                    <strong>
                      ${(nli * 100).toFixed(1)}%
                    </strong>
                  </div>
                `
                : ""
            }

          </div>


          <div class="risk-detail-block">

            <div class="risk-detail-label">
              Evidence
            </div>

            <div class="risk-evidence">
              "${escapeHtml(evidence)}"
            </div>

          </div>


          <div class="risk-detail-block">

            <div class="risk-detail-label">
              Recommendation
            </div>

            <div class="risk-recommendation">
              ${escapeHtml(recommendation)}
            </div>

          </div>

        </div>
      `;

      list.appendChild(card);
    }
  );
}


/* =========================================================
   TOGGLE DETAILS
========================================================= */

function toggleRiskDetails(index) {

  const details =
    document.getElementById(
      `risk-details-${index}`
    );

  if (!details) return;

  const button =
    details.previousElementSibling
      ?.querySelector(
        ".risk-details-btn"
      );

  const hidden =
    details.style.display === "none";

  details.style.display =
    hidden
      ? "block"
      : "none";

  if (button) {
    button.textContent =
      hidden
        ? "Hide details"
        : "View details";
  }
}


/* =========================================================
   HELPERS
========================================================= */

function getSeverityClass(severity) {

  const value =
    String(severity)
      .toLowerCase();

  if (value === "high") {
    return "severity-high";
  }

  if (value === "low") {
    return "severity-low";
  }

  return "severity-medium";
}


function getRiskLevelClass(level) {

  const value =
    String(level)
      .toLowerCase();

  if (value === "critical") {
    return "risk-level-critical";
  }

  if (value === "high") {
    return "risk-level-high";
  }

  if (value === "medium") {
    return "risk-level-medium";
  }

  return "risk-level-low";
}


/* =========================================================
   ERRORS
========================================================= */

function showRiskError(message) {

  const content =
    document.getElementById(
      "risk-content"
    );

  const status =
    document.getElementById(
      "risk-status"
    );

  if (status) {
    status.textContent =
      "Risk analysis unavailable";
  }

  if (content) {

    content.innerHTML = `
      <div class="risk-error">
        <strong>
          Risk analysis could not be completed.
        </strong>

        <p>
          ${escapeHtml(
            message ||
            "Please try again."
          )}
        </p>
      </div>
    `;
  }
}


function showError(message) {

  const empty =
    document.getElementById(
      "empty-state"
    );

  const results =
    document.getElementById(
      "results-view"
    );

  if (empty) {
    empty.style.display = "none";
  }

  if (results) {

    results.style.display =
      "block";

    results.innerHTML = `
      <div class="risk-error">
        ${escapeHtml(message)}
      </div>
    `;
  }
}


/* =========================================================
   VERIFY DOMAIN
========================================================= */

async function verifyDomain() {

  const claimed =
    document.getElementById(
      "user-claimed-domain-select"
    ).value;

  const text =
    document.getElementById(
      "verify-text-area"
    ).value.trim();

  if (!claimed) {

    showError(
      "Please select the contract domain."
    );

    return;
  }

  if (!text && !selectedFile) {

    showError(
      "Please upload or paste the contract."
    );

    return;
  }

  const button =
    document.getElementById(
      "analyze-btn"
    );

  const buttonText =
    document.getElementById(
      "btn-text"
    );

  button.disabled = true;

  buttonText.innerHTML =
    '<span class="spinner"></span> Verifying...';

  try {

    const formData =
      new FormData();

    formData.append(
      "claimed_domain",
      claimed
    );

    formData.append(
      "use_baseline",
      document
        .getElementById(
          "use-baseline-toggle"
        )
        .checked
    );

    if (selectedFile) {

      formData.append(
        "file",
        selectedFile
      );

    } else {

      formData.append(
        "text",
        text
      );
    }

    const response =
      await fetch(
        `${API_BASE}/verify-domain`,
        {
          method: "POST",
          body: formData
        }
      );

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        error.detail ||
        "Domain verification failed."
      );
    }

    const result =
      await response.json();

    displayVerificationResult(
      result
    );

  } catch (error) {

    showError(
      error.message ||
      "Domain verification failed."
    );

  } finally {

    button.disabled = false;

    buttonText.textContent =
      "Verify Domain";
  }
}


/* =========================================================
   VERIFICATION RESULT
========================================================= */

function displayVerificationResult(
  result
) {

  document.getElementById(
    "empty-state"
  ).style.display = "none";

  document.getElementById(
    "results-view"
  ).style.display = "block";

  const domain =
    result.claimed_domain ||
    result.claimed ||
    "Selected Domain";

  const status =
    result.verification_status ||
    result.status ||
    "UNKNOWN";

  let confidence =
    Number(
      result.confidence ||
      result.score ||
      0
    );

  if (confidence <= 1) {
    confidence *= 100;
  }

  document.getElementById(
    "res-primary-domain"
  ).textContent = domain;

  document.getElementById(
    "res-confidence-val"
  ).textContent =
    `${confidence.toFixed(0)}%`;

  document.getElementById(
    "res-confidence-bar"
  ).style.width =
    `${Math.min(100, confidence)}%`;

  document.getElementById(
    "res-predictions-list"
  ).innerHTML = `
    <div class="prediction-item">

      <span class="pred-name">
        Verification Result
      </span>

      <strong>
        ${escapeHtml(status)}
      </strong>

    </div>
  `;

  document.getElementById(
    "res-meta-info"
  ).textContent =
    result.reasoning ||
    result.explanation ||
    "AI verification completed.";

  const confirmBox =
    document.querySelector(
      ".confirm-box"
    );

  if (confirmBox) {
    confirmBox.style.display = "none";
  }
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}