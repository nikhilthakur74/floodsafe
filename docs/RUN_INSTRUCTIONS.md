# How to Run FloodSafe (Backend + Frontend)

## Prerequisites
- Node.js v18+
- npm v9+

---

## 1. Backend Setup & Startup

```powershell
# Navigate to backend directory
cd c:\hack\floodsafe\backend

# Install dependencies if needed
npm install

# Start backend development server (Runs on http://localhost:5000)
npm run dev
```

### `.env` Configuration (`backend/.env`)
```env
PORT=5000
OPENROUTESERVICE_API_KEY=your_key_here
```

---

## 2. Frontend Setup & Startup

```powershell
# Navigate to frontend directory
cd c:\hack\floodsafe\frontend

# Install dependencies if needed
npm install

# Start frontend Vite development server (Runs on http://localhost:5173)
npm run dev
```

---

## 3. Running Both Concurrently

To start both servers concurrently in separate terminals:

**Terminal 1 (Backend):**
```powershell
cd c:\hack\floodsafe\backend; npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd c:\hack\floodsafe\frontend; npm run dev
```

Then open `http://localhost:5173` in your browser.
