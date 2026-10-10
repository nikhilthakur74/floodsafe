# FloodSafe 🌊📍

> **Know the risk before you travel.**

FloodSafe is an environmental safety platform designed to estimate road waterlogging and flood risk using rainfall indicators, terrain elevation profiles, historical similarity, coordinate-backed waterlogging evidence, and route alternatives.

---

## 🚀 Project Architecture

FloodSafe provides an explainable route comparison interface for urban flood risk:

- **Frontend**: React + Vite + Vanilla CSS / Tailwind CSS + React Leaflet
- **Backend**: Node.js + Express REST API with modular architecture (`routes/`, `services/`, `data/`)

---

## 📁 Project Structure

```text
floodsafe/
├── README.md
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── routes/
│       │   ├── health.routes.js
│       │   └── routes.routes.js
│       ├── services/
│       │   ├── routeRisk.service.js
│       │   ├── routing.service.js
│       │   ├── weather.service.js
│       │   ├── elevation.service.js
│       │   ├── risk.service.js
│       │   └── historicalIntelligence.service.js
│       └── data/
│           ├── historicalEvents.js
│           └── verifiedReplayRoutes.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── components/
│           ├── Header.jsx
│           ├── MapView.jsx
│           ├── RouteForm.jsx
│           ├── RouteResultsPanel.jsx
│           ├── RiskSummaryCard.jsx
│           └── ScenarioSelector.jsx
└── scratch/
    ├── test_stage1_correctness.js
    └── test_stage2_correctness.js
```

---

## 🛠️ How to Run

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev # or npm start
```

The backend server runs on `http://localhost:5000`.

- **Health Check Endpoint**: `GET http://localhost:5000/api/health`
- **Route Analysis Endpoint**: `POST http://localhost:5000/api/routes/analyze`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend application runs on `http://localhost:5173`.

---

## 🧪 Running Verification Tests

To run the automated Stage 1 and Stage 2 correctness regression suites:

```bash
cd backend
npm test
```

Or run directly from the project root:

```bash
node scratch/test_stage1_correctness.js
node scratch/test_stage2_correctness.js
```
