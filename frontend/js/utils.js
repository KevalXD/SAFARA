/* ═══════════════════════════════════════
   SAFARA — Shared Utilities (utils.js)
═══════════════════════════════════════ */

/* ── TOAST ── */
let toastTimer;
function showToast(icon, type, title, sub) {
  clearTimeout(toastTimer);
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-ico').textContent = icon;
  document.getElementById('toast-ico').className = 'toast-ico ' + type;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent = sub;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

/* ── MODAL ── */
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

/* ── SOS ── */
function triggerSOS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      document.getElementById('sos-coords').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }, () => {
      document.getElementById('sos-coords').textContent = 'Bengaluru (fallback)';
    });
  }
  openModal('sos-modal');
  showToast('🚨', 'r', 'SOS Activated', 'Emergency alert sent to nearby authorities.');
}

/* ── SESSION / AUTH ── */
const Auth = {
  save(user) { localStorage.setItem('safara_user', JSON.stringify(user)); },
  get()      { try { return JSON.parse(localStorage.getItem('safara_user')); } catch(e) { return null; } },
  clear()    { localStorage.removeItem('safara_user'); },
  isLoggedIn(){ return !!this.get(); },
  role()     { const u = this.get(); return u ? u.role : null; },
  require(role) {
    const u = this.get();
    if (!u) { window.location.href = 'login.html'; return false; }
    if (role && u.role !== role) { window.location.href = 'index.html'; return false; }
    return true;
  }
};

/* ── DB (JSON localStorage simulation) ── */
const DB = {
  _key: 'safara_db',
  get() {
    try {
      return JSON.parse(localStorage.getItem(this._key)) || this._default();
    } catch(e) { return this._default(); }
  },
  save(data) { localStorage.setItem(this._key, JSON.stringify(data)); },
  _default() {
    return {
      users: [
        { id:1, name:'Admin User', email:'admin@safara.in', password:'admin123', role:'admin', reputation:10, joined:'2024-01-01' },
        { id:2, name:'Demo User', email:'user@safara.in', password:'user123', role:'user', reputation:3, joined:'2024-06-01' },
        { id:3, name:'Safe City NGO', email:'ngo@safara.in', password:'ngo123', role:'ngo', status:'approved', org:'Safe City NGO', joined:'2024-03-01' }
      ],
      ngoPending: [
        { id:10, org:'Suraksha Foundation', email:'suraksha@ngo.in', phone:'9876543210', city:'Bengaluru', regId:'NGO-KA-2024-001', status:'pending', joined:'2024-11-01' },
        { id:11, org:'Mahila Shakti Trust', email:'mahila@trust.in', phone:'9123456789', city:'Mumbai', regId:'NGO-MH-2024-042', status:'pending', joined:'2024-11-10' }
      ],
      incidents: [
        { id:1, type:'Harassment', location:'MG Road Bus Stop', lat:12.9756, lng:77.6099, desc:'Verbal harassment near bus stop', userId:2, reputation:3, timestamp:'2024-11-20T08:30:00', status:'confirmed', credibility:9 },
        { id:2, type:'Suspicious Activity', location:'Koramangala 5th Block', lat:12.9352, lng:77.6245, desc:'Suspicious individual following commuter', userId:2, reputation:3, timestamp:'2024-11-21T21:00:00', status:'pending', credibility:6 },
        { id:3, type:'Unsafe Environment', location:'Hebbal Flyover', lat:13.0358, lng:77.5970, desc:'Poor lighting and isolated stretch', userId:2, reputation:3, timestamp:'2024-11-22T19:00:00', status:'flagged', credibility:8 }
      ],
      nextId: 100
    };
  },
  addUser(user) {
    const d = this.get(); user.id = d.nextId++; d.users.push(user); this.save(d); return user;
  },
  addNGO(ngo) {
    const d = this.get(); ngo.id = d.nextId++; d.ngoPending.push(ngo); this.save(d); return ngo;
  },
  addIncident(inc) {
    const d = this.get(); inc.id = d.nextId++; d.incidents.push(inc); this.save(d); return inc;
  },
  updateIncident(id, changes) {
    const d = this.get();
    const i = d.incidents.findIndex(x => x.id == id);
    if (i >= 0) { d.incidents[i] = { ...d.incidents[i], ...changes }; this.save(d); }
  },
  approveNGO(id) {
    const d = this.get();
    const i = d.ngoPending.findIndex(x => x.id == id);
    if (i >= 0) {
      const ngo = d.ngoPending[i];
      ngo.status = 'approved';
      d.users.push({ id: d.nextId++, name: ngo.org, email: ngo.email, password: ngo.password || 'ngo123', role:'ngo', status:'approved', org: ngo.org, joined: ngo.joined });
      d.ngoPending.splice(i, 1);
      this.save(d);
    }
  },
  rejectNGO(id) {
    const d = this.get();
    const i = d.ngoPending.findIndex(x => x.id == id);
    if (i >= 0) { d.ngoPending[i].status = 'rejected'; this.save(d); }
  },
  findUser(email, password) {
    const d = this.get();
    return d.users.find(u => u.email === email && u.password === password) || null;
  },
  emailExists(email) {
    const d = this.get();
    return d.users.some(u => u.email === email);
  },
  updateReputation(userId, delta) {
    const d = this.get();
    const i = d.users.findIndex(u => u.id == userId);
    if (i >= 0) { d.users[i].reputation = Math.max(1, (d.users[i].reputation || 1) + delta); this.save(d); }
  }
};

/* ── REPUTATION ENGINE ── */
const Reputation = {
  label(score) {
    if (score >= 8) return { text:'Verified', cls:'badge-green' };
    if (score >= 5) return { text:'Trusted', cls:'badge-blue' };
    if (score >= 3) return { text:'Active', cls:'badge-orange' };
    return { text:'New', cls:'badge-red' };
  },
  renderPips(score, container) {
    if (!container) return;
    const maxPips = 10;
    container.innerHTML = '';
    for (let i = 0; i < maxPips; i++) {
      const pip = document.createElement('div');
      pip.className = 'rep-pip' + (i < score ? ' fill' : '');
      container.appendChild(pip);
    }
  }
};

/* ── SAFETY ENGINE ── */
const Safety = {
  calculateScore(incidents) {
    if (!incidents || incidents.length === 0) return 9;
    const confirmedCount = incidents.filter(i => i.status === 'confirmed').length;
    const score = Math.max(4, 10 - confirmedCount);
    return score;
  },
  routeScore() {
    // For demo: return a high safety score (8-9)
    return Math.random() > 0.3 ? 9 : 8;
  }
};

/* ── GEOCODE ── */
async function geocode(query) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Karnataka, India')}&limit=1`);
    const d = await r.json();
    if (d && d.length) return [parseFloat(d[0].lat), parseFloat(d[0].lon)];
  } catch(e) {}
  return null;
}

/* ── LEAFLET HELPERS ── */
const BENGALURU = [12.9716, 77.5946];

function makeMap(containerId, center, zoom) {
  const map = L.map(containerId, { zoomControl:true }).setView(center || BENGALURU, zoom || 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);
  return map;
}

function getUserLocation(map, inputId) {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(BENGALURU); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      map.setView(ll, 14);
      L.circleMarker(ll, { radius:9, color:'#1b3a6b', fillColor:'#2851a3', fillOpacity:.9, weight:2 })
        .addTo(map).bindPopup('<b>📍 You are here</b>').openPopup();
      if (inputId) document.getElementById(inputId).value = 'My Location';
      resolve(ll);
    }, () => resolve(BENGALURU));
  });
}

async function drawOSRMRoute(map, startCoord, endCoord) {
  const url = `https://router.project-osrm.org/route/v1/foot/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes.length) return null;

  const route = data.routes[0];
  const layer = L.geoJSON(route.geometry, {
    style:{ color:'#1a7a52', weight:5, opacity:.88, lineCap:'round', lineJoin:'round' }
  }).addTo(map);

  const mkBlue = L.divIcon({ html:`<div style="background:#1b3a6b;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3)">📍</div>`, className:'', iconAnchor:[14,14] });
  const mkGrn  = L.divIcon({ html:`<div style="background:#1a7a52;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3)">🎯</div>`, className:'', iconAnchor:[14,14] });
  L.marker(startCoord, {icon:mkBlue}).addTo(map);
  L.marker(endCoord,   {icon:mkGrn}).addTo(map);
  map.fitBounds(layer.getBounds(), { padding:[50,50] });

  return {
    layer,
    distKm: (route.distance / 1000).toFixed(1),
    timeMin: Math.ceil(route.duration / 60)
  };
}

/* ── NAV ACTIVE LINK ── */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nb-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === page);
  });
}

/* ── UPDATE USER INFO IN NAV ── */
function updateNavUser() {
  const u = Auth.get();
  const el = document.getElementById('nav-user-btn');
  if (!el) return;
  if (u) {
    el.textContent = '👤 ' + u.name.split(' ')[0];
    el.onclick = () => {
      Auth.clear();
      window.location.href = 'login.html';
    };
    el.title = 'Click to logout';
  } else {
    el.textContent = '🔑 Login';
    el.onclick = () => window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  updateNavUser();
});
