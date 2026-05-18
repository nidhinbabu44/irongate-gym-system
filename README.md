# 🏋️ IronGate GYM Entry System

A full-stack **GYM Entry System** with **Face Recognition** built with React.js, Node.js, and Microsoft SQL Server.

---

## ✨ Features

- 🎥 **Face Detection Entry** — Members check in/out automatically via webcam
- 💳 **Payment-Based Access** — Expired memberships are automatically denied entry
- ⏱️ **Auto-Expiry** — Daily cron job disables members with expired memberships
- 👥 **Member Management** — Full CRUD with photo + face enrollment
- 📊 **Dashboard** — Real-time stats, entry charts, revenue tracking
- 🔐 **Admin Panel** — JWT-secured admin dashboard
- 📋 **Entry Logs** — Full audit trail of all entries/exits

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, face-api.js, Recharts   |
| Backend   | Node.js, Express.js               |
| Database  | Microsoft SQL Server (MSSQL)      |
| Auth      | JWT (jsonwebtoken)                |
| Face AI   | face-api.js (TensorFlow.js)       |
| Scheduler | node-cron                         |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Microsoft SQL Server (local or remote)
- Chrome/Edge (for camera access)

---

### 1. Clone & Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MSSQL connection details

# Setup database (creates tables + seed data)
npm run setup-db

# Start backend
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Download face-api.js models (required!)
mkdir -p public/models
```

**Download these model files** into `frontend/public/models/`:

Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Download these files:
- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `ssd_mobilenetv1_model-shard2`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

```bash
# Start frontend
npm start
```

---

## 📁 Project Structure

```
gym-entry-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MSSQL connection pool
│   │   │   └── setupDatabase.js     # DB init + seed
│   │   ├── controllers/
│   │   │   ├── authController.js    # Login/auth
│   │   │   ├── memberController.js  # CRUD members + faces
│   │   │   ├── paymentController.js # Payments + plans
│   │   │   └── entryController.js   # Entry verification + logs
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT middleware
│   │   ├── routes/
│   │   │   └── index.js             # All API routes
│   │   ├── services/
│   │   │   └── expiryService.js     # Cron job for auto-disable
│   │   └── server.js                # Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── index.html
    │   └── models/                  # face-api.js model files (add manually)
    ├── src/
    │   ├── components/
    │   │   └── Layout.js            # Sidebar navigation
    │   ├── hooks/
    │   │   ├── useAuth.js           # Auth context
    │   │   └── useFaceDetection.js  # face-api.js wrapper
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── Dashboard.js
    │   │   ├── MembersPage.js
    │   │   ├── MemberDetail.js      # + payment + face enrollment
    │   │   ├── AddMember.js         # + live face capture
    │   │   ├── EntryKiosk.js        # 🎥 Main face recognition terminal
    │   │   ├── PaymentsPage.js
    │   │   ├── EntryLogs.js
    │   │   └── PlansPage.js
    │   ├── utils/
    │   │   └── api.js               # Axios instance
    │   ├── App.js
    │   ├── index.css                # Global dark theme
    │   └── index.js
    └── package.json
```

---

## 🌐 URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000/login | Admin login |
| http://localhost:3000/dashboard | Admin dashboard |
| http://localhost:3000/kiosk | Entry kiosk (face scanner) |
| http://localhost:5000/api | Backend API |

---

## 🔑 Default Credentials

```
Username: admin
Password: Admin@123456
```
> Change immediately after first login!

---

## 📱 Entry Kiosk Flow

1. Member walks up to kiosk at `http://localhost:3000/kiosk`
2. Camera auto-scans every 1.5 seconds
3. Face matched against enrolled members
4. Server checks: Is member active? Is membership still valid?
5. **GREEN** = Access granted + entry logged
6. **RED** = Denied (expired/disabled) with reason shown

---

## ⏰ Auto-Expiry Logic

The backend runs a **daily cron job at midnight** that:
1. Marks all `Memberships` past their `EndDate` as `Expired`
2. Disables (`IsActive = 0`) any member with no active membership
3. When a new payment is recorded → member is automatically re-enabled

You can also trigger it manually from the Dashboard → "Run Expiry Check" button.

---

## 🔧 Environment Variables

```env
PORT=5000
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=GymEntrySystem
DB_USER=sa
DB_PASSWORD=YourPassword
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
JWT_SECRET=change-this-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123456
```

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/members` | List all members |
| POST | `/api/members` | Create member + face |
| GET | `/api/members/faces` | Get all face descriptors |
| PUT | `/api/members/:id/face` | Update face enrollment |
| POST | `/api/payments` | Record payment + activate |
| GET | `/api/plans` | List plans |
| POST | `/api/entry/verify` | Verify face entry |
| GET | `/api/entry/logs` | Entry log history |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/admin/run-expiry` | Manual expiry check |
