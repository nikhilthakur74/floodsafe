# FloodSafe 🌊📍

> **Know the risk before you travel.**

FloodSafe is an environmental safety platform designed to estimate road waterlogging and flood risk using rainfall forecasts, terrain elevation, historical patterns, and route alternatives.

---

## 🚀 Milestone 1: Project Foundation

This milestone establishes the base full-stack architecture for FloodSafe:

- **Frontend**: React + Vite + Tailwind CSS + React Leaflet
- **Backend**: Node.js + Express REST API with modular structure (`routes/`, `services/`, `data/`, `utils/`)

---

## 📁 Project Structure

```text
floodsafe/
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── routes/
│       │   └── health.routes.js
│       ├── services/
│       ├── data/
│       └── utils/
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Header.jsx
        │   ├── RouteForm.jsx
        │   └── MapView.jsx
        ├── routes/
        ├── services/
        ├── data/
        └── utils/
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

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend application runs on `http://localhost:5173`.
