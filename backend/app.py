# ═══════════════════════════════════════
# SAFARA — Flask Backend (app.py)
# Run: pip install flask flask-cors
#      python app.py
# ═══════════════════════════════════════

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json, os, hashlib, uuid
from datetime import datetime
from reputation_engine import ReputationEngine
from safety_engine import SafetyEngine

app = Flask(__name__)
app.secret_key = 'safara_secret_2024'
CORS(app, supports_credentials=True)

DB_FILE = 'database.json'
rep_engine = ReputationEngine()
safety_engine = SafetyEngine()

# ── DB HELPERS ──────────────────────────
def load_db():
    if not os.path.exists(DB_FILE):
        return default_db()
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def default_db():
    return {
        "users": [
            {"id": 1, "name": "Admin", "email": "admin@safara.in", "password": hash_pw("admin123"), "role": "admin", "reputation": 10},
            {"id": 2, "name": "Demo User", "email": "user@safara.in", "password": hash_pw("user123"), "role": "user", "reputation": 3},
            {"id": 3, "name": "Safe City NGO", "email": "ngo@safara.in", "password": hash_pw("ngo123"), "role": "ngo", "status": "approved"}
        ],
        "ngo_pending": [],
        "incidents": [],
        "next_id": 100
    }

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def find_user(email, password):
    db = load_db()
    hashed = hash_pw(password)
    return next((u for u in db['users'] if u['email'] == email and u['password'] == hashed), None)

# ── AUTH ────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = find_user(data.get('email',''), data.get('password',''))
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    session['user_id'] = user['id']
    session['role'] = user['role']
    return jsonify({"success": True, "user": {k: v for k, v in user.items() if k != 'password'}})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    db = load_db()
    if any(u['email'] == data['email'] for u in db['users']):
        return jsonify({"error": "Email already registered"}), 400
    user = {
        "id": db['next_id'], "name": data['name'], "email": data['email'],
        "password": hash_pw(data['password']), "phone": data.get('phone',''),
        "city": data.get('city',''), "role": "user", "reputation": 1,
        "joined": datetime.now().isoformat()[:10]
    }
    db['users'].append(user); db['next_id'] += 1; save_db(db)
    return jsonify({"success": True, "user": {k: v for k, v in user.items() if k != 'password'}})

@app.route('/api/ngo_signup', methods=['POST'])
def ngo_signup():
    data = request.json
    db = load_db()
    ngo = {
        "id": db['next_id'], "org": data['org'], "email": data['email'],
        "password": hash_pw(data.get('password','ngo123')),
        "phone": data.get('phone',''), "city": data.get('city',''),
        "reg_id": data.get('regId',''), "role": "ngo", "status": "pending",
        "joined": datetime.now().isoformat()[:10]
    }
    db['ngo_pending'].append(ngo); db['next_id'] += 1; save_db(db)
    return jsonify({"success": True, "message": "Registration submitted for review"})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

# ── INCIDENTS ───────────────────────────
@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    db = load_db()
    status_filter = request.args.get('status')
    incidents = db['incidents']
    if status_filter:
        incidents = [i for i in incidents if i.get('status') == status_filter]
    return jsonify(incidents)

@app.route('/api/incidents', methods=['POST'])
def add_incident():
    data = request.json
    db = load_db()
    user_id = data.get('userId', 0)
    user = next((u for u in db['users'] if u['id'] == user_id), None)
    reputation = user['reputation'] if user else 1

    incident = {
        "id": db['next_id'], "type": data.get('type','General'),
        "location": data.get('location',''), "lat": data.get('lat', 12.9716),
        "lng": data.get('lng', 77.5946), "desc": data.get('desc',''),
        "userId": user_id, "reputation": reputation,
        "credibility": reputation, "status": "pending",
        "timestamp": datetime.now().isoformat()
    }

    # Check credibility threshold
    similar = [i for i in db['incidents']
               if i.get('location') == incident['location'] and i.get('status') != 'rejected']
    total_cred = sum(i.get('credibility',1) for i in similar) + reputation

    if total_cred >= 10:
        incident['status'] = 'flagged'  # auto-flag for NGO review

    db['incidents'].append(incident); db['next_id'] += 1

    # Update user reputation
    if user:
        user['reputation'] = rep_engine.on_report_submitted(user['reputation'])
        save_db(db)
    else:
        save_db(db)

    return jsonify({"success": True, "incident": incident, "credibility_total": total_cred})

@app.route('/api/incidents/<int:inc_id>', methods=['PATCH'])
def update_incident(inc_id):
    data = request.json
    db = load_db()
    inc = next((i for i in db['incidents'] if i['id'] == inc_id), None)
    if not inc:
        return jsonify({"error": "Not found"}), 404
    inc.update(data)
    # If rejected, reduce reporter reputation
    if data.get('status') == 'rejected' and inc.get('userId'):
        user = next((u for u in db['users'] if u['id'] == inc['userId']), None)
        if user:
            user['reputation'] = rep_engine.on_report_rejected(user['reputation'])
    save_db(db)
    return jsonify({"success": True, "incident": inc})

# ── ADMIN ───────────────────────────────
@app.route('/api/pending_ngos', methods=['GET'])
def pending_ngos():
    db = load_db()
    return jsonify([n for n in db['ngo_pending'] if n.get('status') == 'pending'])

@app.route('/api/approve_ngo/<int:ngo_id>', methods=['POST'])
def approve_ngo(ngo_id):
    db = load_db()
    ngo = next((n for n in db['ngo_pending'] if n['id'] == ngo_id), None)
    if not ngo:
        return jsonify({"error": "Not found"}), 404
    ngo['status'] = 'approved'
    user = {"id": db['next_id'], "name": ngo['org'], "email": ngo['email'],
            "password": ngo['password'], "role": "ngo", "status": "approved", "org": ngo['org']}
    db['users'].append(user); db['next_id'] += 1; save_db(db)
    return jsonify({"success": True})

@app.route('/api/reject_ngo/<int:ngo_id>', methods=['POST'])
def reject_ngo(ngo_id):
    db = load_db()
    ngo = next((n for n in db['ngo_pending'] if n['id'] == ngo_id), None)
    if ngo:
        ngo['status'] = 'rejected'
        save_db(db)
    return jsonify({"success": True})

# ── SAFETY SCORE ─────────────────────────
@app.route('/api/safety_score', methods=['GET'])
def safety_score():
    lat = float(request.args.get('lat', 12.9716))
    lng = float(request.args.get('lng', 77.5946))
    db = load_db()
    score = safety_engine.calculate_area_score(lat, lng, db['incidents'])
    return jsonify({"score": score, "lat": lat, "lng": lng})

@app.route('/api/users', methods=['GET'])
def get_users():
    db = load_db()
    return jsonify([{k: v for k, v in u.items() if k != 'password'} for u in db['users']])

if __name__ == '__main__':
    if not os.path.exists(DB_FILE):
        save_db(default_db())
    print("🛡 SAFARA Backend running on http://localhost:5000")
    app.run(debug=True, port=5000)
