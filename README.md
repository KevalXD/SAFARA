# SAFARA — Safety Aware Route Assistant
## Navigate Smart. Travel Safe.

---

## Project Structure

```
safara-project/
│
├── frontend/
│   ├── index.html           ← Home (split screen with live map)
│   ├── navigate.html        ← Full map navigation + routing
│   ├── report.html          ← Incident reporting form
│   ├── ngo.html             ← Emergency contacts + SOS
│   ├── about.html           ← About SAFARA + SDGs
│   ├── login.html           ← User login
│   ├── signup.html          ← User registration
│   ├── ngo_signup.html      ← NGO registration
│   ├── ngo_dashboard.html   ← NGO incident verification panel
│   ├── admin_dashboard.html ← Admin panel (NGO approvals, users)
│   │
│   ├── css/
│   │   └── styles.css       ← All styles
│   │
│   └── js/
│       ├── utils.js         ← Shared: toast, auth, DB, geocode, map helpers
│       └── navbar.js        ← Shared navbar + SOS modal injector
│
└── backend/
    ├── app.py               ← Flask REST API
    ├── reputation_engine.py ← User trust scoring logic
    ├── safety_engine.py     ← Route safety score calculation
    └── database.json        ← Auto-created on first run
```

---

## Quick Start (Frontend Only — No Backend Required)

1. Open `frontend/` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The app works fully using `localStorage` as database

**Demo Login Credentials:**
| Role  | Email | Password |
|-------|-------|----------|
| User  | user@safara.in | user123 |
| NGO   | ngo@safara.in  | ngo123  |
| Admin | admin@safara.in | admin123 |

---

## Backend Setup (Optional — for full API)

```bash
cd backend
pip install flask flask-cors
python app.py
```

Backend runs on: `http://localhost:5000`

---

## Demo Flow

1. Open `index.html` — map loads immediately
2. Enter destination → real road route drawn
3. Safety score shown (calm, no danger markers)
4. Go to Report → submit incident
5. Login as NGO → verify incident in dashboard
6. Login as Admin → approve NGO registrations
7. SOS button available on every page

---

## Key Features

- ✅ Live Leaflet.js map on home screen (split layout)
- ✅ Real OSRM road routing (no API key needed)
- ✅ Auto-detect user location / fallback Bengaluru
- ✅ Multi-level incident verification (User → NGO → Confirmed)
- ✅ User reputation system (1–10 score)
- ✅ Role-based access: User / NGO / Admin
- ✅ NGO dashboard with confirm/reject/flag
- ✅ Admin dashboard with NGO approval system
- ✅ Safety score engine (decay-based)
- ✅ SOS system with location sharing
- ✅ No danger zones shown to users
- ✅ Fully offline-capable (localStorage DB)
- ✅ SDG 5 + SDG 11 aligned

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML, CSS, JavaScript |
| Maps     | Leaflet.js + OpenStreetMap |
| Routing  | OSRM (free, no API key) |
| Backend  | Python + Flask |
| Database | JSON / SQLite |
