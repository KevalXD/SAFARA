/* ═══════════════════════════════════════
   SAFARA — Shared Navbar injector
═══════════════════════════════════════ */
function injectNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  nav.innerHTML = `
    <a class="nb-logo" href="index.html">
      <div class="nb-mark">S</div>
      <span class="nb-name">SAFARA</span>
    </a>
    <div class="nb-links">
      <a class="nb-link" href="index.html">🏠 Home</a>
      <a class="nb-link" href="navigate.html">🧭 Navigate</a>
      <a class="nb-link" href="report.html">📋 Report</a>
      <a class="nb-link" href="ngo.html">🛡 NGO / Police</a>
      <a class="nb-link" href="about.html">ℹ️ About</a>
    </div>
    <div class="nb-right">
      <button class="nb-user" id="nav-user-btn">🔑 Login</button>
      <button class="nb-sos" onclick="triggerSOS()">🚨 SOS</button>
    </div>
  `;
  setActiveNav();
  updateNavUser();
}

/* ── SHARED TOAST HTML ── */
function injectToast() {
  if (document.getElementById('toast')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="toast" id="toast">
      <div class="toast-ico g" id="toast-ico">✅</div>
      <div>
        <div class="toast-title" id="toast-title">Done</div>
        <div class="toast-sub" id="toast-sub">Action completed.</div>
      </div>
    </div>
  `);
}

/* ── SHARED SOS MODAL ── */
function injectSOSModal() {
  if (document.getElementById('sos-modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="sos-modal">
      <div class="modal">
        <div class="modal-icon">🚨</div>
        <div class="modal-title">Emergency Alert Sent</div>
        <div class="modal-text">
          Your location has been shared with nearby authorities.<br>
          Help is on the way. Stay calm and move to a well-lit public area.<br><br>
          <strong>Your coordinates:</strong><br>
          <span id="sos-coords">Detecting location…</span><br><br>
          <strong>Police (100) has been notified.</strong>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="closeModal('sos-modal')">I'm Safe — Close</button>
        </div>
      </div>
    </div>
  `);
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
  injectToast();
  injectSOSModal();
});
