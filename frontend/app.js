// ContractGuard Model 1 - Interactive Application Logic

const API_BASE = "http://localhost:8000/api/v1";

let selectedFile = null;
let currentPrediction = null;
let configuredDomains = [];
let contractIdCounter = 100;

document.addEventListener("DOMContentLoaded", () => {
  initBackendConnection();
  setupDropzone();
});

async function initBackendConnection() {
  const statusText = document.getElementById("status-text");
  try {
    const res = await fetch(`${API_BASE}/domains`);
    if (res.ok) {
      const data = await res.json();
      configuredDomains = data.domains;
      statusText.innerText = `API Online (${data.total_domains} Domains Loaded)`;
      populateDomainDropdown();
    } else {
      statusText.innerText = "API Offline (Check Uvicorn)";
    }
  } catch (err) {
    statusText.innerText = "Backend Disconnected";
    console.error("Backend connection failed:", err);
  }
}

function populateDomainDropdown() {
  const select = document.getElementById("domain-override-select");
  const claimedSelect = document.getElementById("user-claimed-domain-select");
  
  select.innerHTML = '<option value="" disabled selected>Select alternative legal domain...</option>';
  claimedSelect.innerHTML = '<option value="" disabled selected>-- Select Your Intended Legal Domain --</option>';

  configuredDomains.forEach(dom => {
    const opt = document.createElement("option");
    opt.value = dom.name;
    opt.innerText = dom.name;
    select.appendChild(opt);

    const opt2 = document.createElement("option");
    opt2.value = dom.name;
    opt2.innerText = dom.name;
    claimedSelect.appendChild(opt2);
  });
}

function switchTab(tab) {
  const tabFile = document.getElementById("tab-file-btn");
  const tabText = document.getElementById("tab-text-btn");
  const tabVerify = document.getElementById("tab-verify-btn");

  if (tabFile) tabFile.classList.toggle("active", tab === "file");
  if (tabText) tabText.classList.toggle("active", tab === "text");
  if (tabVerify) tabVerify.classList.toggle("active", tab === "verify");

  document.getElementById("view-file").style.display = tab === "file" ? "block" : "none";
  document.getElementById("view-text").style.display = tab === "text" ? "block" : "none";
  document.getElementById("view-verify").style.display = tab === "verify" ? "block" : "none";

  const btnText = document.getElementById("btn-text");
  if (btnText) {
    btnText.innerText = tab === "verify" ? "Verify My Selection with AI" : "Detect Domain";
  }
}

function setupDropzone() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });
}

function handleFileSelected(file) {
  selectedFile = file;
  document.getElementById("dropzone").style.display = "none";
  document.getElementById("file-preview").style.display = "flex";
  document.getElementById("file-name-display").innerText = file.name;
  document.getElementById("file-size-display").innerText = `${(file.size / 1024).toFixed(1)} KB`;

  const ext = file.name.split('.').pop().toLowerCase();
  const icon = ext === 'pdf' ? '📕' : ext === 'docx' ? '📘' : '📄';
  document.getElementById("file-icon").innerText = icon;
}

function clearSelectedFile() {
  selectedFile = null;
  document.getElementById("file-input").value = "";
  document.getElementById("dropzone").style.display = "block";
  document.getElementById("file-preview").style.display = "none";
}

async function runDomainDetection() {
  const isFileTab = document.getElementById("tab-file-btn").classList.contains("active");
  const isVerifyTab = document.getElementById("tab-verify-btn").classList.contains("active");
  const textInput = document.getElementById("contract-text-area").value.trim();
  const verifyTextInput = document.getElementById("verify-text-area").value.trim();
  const claimedDomain = document.getElementById("user-claimed-domain-select").value;
  const useBaseline = document.getElementById("use-baseline-toggle").checked;

  if (isVerifyTab) {
    if (!claimedDomain) {
      alert("Please select the domain you believe this contract belongs to from the dropdown.");
      return;
    }
    if (!verifyTextInput && !selectedFile) {
      alert("Please paste contract text or select a contract file to verify.");
      return;
    }
  } else {
    if (isFileTab && !selectedFile) {
      alert("Please select or drop a contract file (.txt, .pdf, .docx).");
      return;
    }
    if (!isFileTab && !textInput) {
      alert("Please paste contract text to classify.");
      return;
    }
  }

  const analyzeBtn = document.getElementById("analyze-btn");
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="spinner"></span> ' + (isVerifyTab ? 'Verifying with AI...' : 'Detecting Domain...');

  try {
    let res;
    if (isVerifyTab) {
      const formData = new FormData();
      formData.append("claimed_domain", claimedDomain);
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("text", verifyTextInput);
      }
      formData.append("use_baseline", useBaseline);

      res = await fetch(`${API_BASE}/verify-domain`, {
        method: "POST",
        body: formData
      });
    } else if (isFileTab) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("use_baseline", useBaseline);
      formData.append("use_chunk_aggregation", true);
      res = await fetch(`${API_BASE}/detect-domain`, {
        method: "POST",
        body: formData
      });
    } else {
      const formData = new FormData();
      formData.append("text", textInput);
      formData.append("use_baseline", useBaseline);
      formData.append("use_chunk_aggregation", true);
      res = await fetch(`${API_BASE}/detect-domain`, {
        method: "POST",
        body: formData
      });
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Domain request failed.");
    }

    const data = await res.json();
    if (isVerifyTab) {
      renderVerificationResults(data);
    } else {
      currentPrediction = data;
      renderDetectionResults(data);
    }
  } catch (err) {
    alert(`Request Error: ${err.message}`);
    console.error(err);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<span>' + (isVerifyTab ? 'Verify My Selection with AI' : 'Detect Domain') + '</span>';
  }
}

function renderVerificationResults(data) {
  document.getElementById("empty-state").style.display = "none";
  const resultsView = document.getElementById("results-view");
  resultsView.style.display = "block";

  // Create verification status banner if not exists
  let verifyBanner = document.getElementById("res-verify-banner");
  if (!verifyBanner) {
    verifyBanner = document.createElement("div");
    verifyBanner.id = "res-verify-banner";
    verifyBanner.style.marginBottom = "1.5rem";
    verifyBanner.style.padding = "1.2rem";
    verifyBanner.style.borderRadius = "var(--radius-md)";
    verifyBanner.style.fontWeight = "600";
    resultsView.insertBefore(verifyBanner, resultsView.firstChild);
  }

  verifyBanner.style.display = "block";
  if (data.match_status === "MATCH") {
    verifyBanner.style.background = "rgba(16, 185, 129, 0.15)";
    verifyBanner.style.border = "1px solid rgba(16, 185, 129, 0.4)";
    verifyBanner.style.color = "#34d399";
  } else if (data.match_status === "PARTIAL_MATCH") {
    verifyBanner.style.background = "rgba(245, 158, 11, 0.15)";
    verifyBanner.style.border = "1px solid rgba(245, 158, 11, 0.4)";
    verifyBanner.style.color = "#fbbf24";
  } else {
    verifyBanner.style.background = "rgba(239, 68, 68, 0.15)";
    verifyBanner.style.border = "1px solid rgba(239, 68, 68, 0.4)";
    verifyBanner.style.color = "#f87171";
  }
  verifyBanner.innerText = data.message;

  // Primary Domain & Confidence
  document.getElementById("res-primary-domain").innerText = `${data.primary_domain} (AI Prediction)`;
  const confPct = Math.round(data.confidence * 100);
  document.getElementById("res-confidence-val").innerText = `${confPct}%`;

  const confBar = document.getElementById("res-confidence-bar");
  confBar.style.width = `${confPct}%`;

  // Alternatives
  const predList = document.getElementById("res-predictions-list");
  predList.innerHTML = "";
  data.top_predictions.forEach(p => {
    const item = document.createElement("div");
    item.className = "prediction-item";
    const pct = Math.round(p.probability * 100);
    const isClaimed = p.domain === data.claimed_domain;
    item.innerHTML = `
      <span class="pred-name">${p.domain} ${isClaimed ? '<strong style="color:var(--accent);">(Your Selection)</strong>' : ''}</span>
      <div class="pred-bar-container">
        <div class="pred-bar">
          <div class="pred-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <span class="pred-val">${pct}%</span>
      </div>
    `;
    predList.appendChild(item);
  });

  // Metadata
  document.getElementById("res-meta-info").innerText = 
    `Verification Mode | User Selected Domain: ${data.claimed_domain} (${Math.round(data.claimed_domain_probability*100)}% score)`;

  // Hide confirmation box in verify mode
  document.getElementById("confirm-buttons").style.display = "none";
  document.getElementById("domain-override-select").style.display = "none";
  const status = document.getElementById("confirmation-status");
  status.innerText = `✓ Domain active tag set to "${data.claimed_domain}" for ContractGuard Risk Engine.`;
  status.style.display = "block";
}

function renderDetectionResults(data) {
  document.getElementById("empty-state").style.display = "none";
  const resultsView = document.getElementById("results-view");
  resultsView.style.display = "block";

  // Primary Domain & Confidence
  document.getElementById("res-primary-domain").innerText = data.domain;
  const confPct = Math.round(data.confidence * 100);
  document.getElementById("res-confidence-val").innerText = `${confPct}%`;

  const confBar = document.getElementById("res-confidence-bar");
  confBar.style.width = `${confPct}%`;
  
  // Color coding
  if (confPct >= 75) {
    confBar.style.background = "linear-gradient(90deg, #10b981, #34d399)";
  } else if (confPct >= 50) {
    confBar.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
  } else {
    confBar.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
  }

  // Alternatives
  const predList = document.getElementById("res-predictions-list");
  predList.innerHTML = "";
  data.top_predictions.forEach(p => {
    const item = document.createElement("div");
    item.className = "prediction-item";
    const pct = Math.round(p.probability * 100);
    item.innerHTML = `
      <span class="pred-name">${p.domain}</span>
      <div class="pred-bar-container">
        <div class="pred-bar">
          <div class="pred-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <span class="pred-val">${pct}%</span>
      </div>
    `;
    predList.appendChild(item);
  });

  // Metadata
  document.getElementById("res-meta-info").innerText = 
    `Model: ${data.model_used} | Aggregated Section Chunks: ${data.num_chunks_processed}`;

  // Reset confirmation state
  document.getElementById("confirm-buttons").style.display = "flex";
  document.getElementById("domain-override-select").style.display = "none";
  document.getElementById("confirmation-status").style.display = "none";
}

function toggleDomainDropdown() {
  const select = document.getElementById("domain-override-select");
  select.style.display = select.style.display === "none" ? "block" : "none";
}

async function confirmDomainSelection(isAutoConfirmed) {
  const activeDomain = isAutoConfirmed ? currentPrediction.domain : document.getElementById("domain-override-select").value;
  if (!activeDomain) return;

  const contractId = `CTR-${contractIdCounter++}`;

  try {
    const res = await fetch(`${API_BASE}/confirm-domain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contractId,
        confirmed_domain: activeDomain,
        notes: isAutoConfirmed ? "User confirmed automatic prediction" : "User manually selected domain override"
      })
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById("confirm-buttons").style.display = "none";
      document.getElementById("domain-override-select").style.display = "none";
      const status = document.getElementById("confirmation-status");
      status.innerText = `✓ Active Domain locked to "${data.active_domain}" for ContractGuard Risk Engine.`;
      status.style.display = "block";
    }
  } catch (err) {
    console.error("Confirmation error:", err);
  }
}

function overrideDomainSelection() {
  confirmDomainSelection(false);
}
