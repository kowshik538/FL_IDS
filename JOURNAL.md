# AgisFL Enterprise – Development Journal

Project journal for the IDS2 / AgisFL Enterprise Federated Learning & Intrusion Detection System.

---

## Project Overview

- **Name:** AgisFL Enterprise
- **Version:** 3.1.0
- **Description:** Enterprise-grade Federated Learning Intrusion Detection System
- **Stack:** React, Vite, Electron (frontend) | FastAPI, Python 3.12 (backend)

---

## Journal Entries

### 2026-03-07

**Session: Dataset Management & Backend Fixes**

- **Dataset Upload & Datasets Page**
  - Updated backend `api/datasets.py`:
    - `GET /api/datasets` now returns `{ total, items }` with pagination
    - `POST /api/datasets/upload` accepts optional metadata (name, description, tags)
    - Added chunked file writing for large uploads
    - Implemented CSV stats estimation (samples, features)
    - Added `GET /api/datasets/{id}/preview` and `GET /api/datasets/{id}/download`
  - Frontend: increased upload timeout for large files (up to 10 min)
  - Frontend: improved upload progress when `total` is unknown
  - UI: better error state with retry button and dark mode support

- **Backend Dependencies**
  - `sqlalchemy>=2.0.36` for Python 3.13
  - `torch==2.2.2` to match `torchvision 0.17.2`
  - Added `aiosqlite>=0.19.0` for SQLite async support
  - Fixed missing `Tuple` import in `api/datasets.py`

- **Environment Notes**
  - Python 3.12 recommended (full wheel support)
  - Python 3.13: NumPy 1.26.4 needs C compiler on Windows
  - Virtual environment: `venv` in project root

---

### 2026-03-07 (earlier)

**Session: Dashboard Documentation**

- Documented Dashboard page structure, data flow, and backend API
- Dashboard components: metrics, FL-IDS panel, charts, alerts table
- Data sources: `/api/dashboard`, `/api/fl/status`, `/api/fl-ids/metrics/real-time`

---

## Quick Reference

### Run Backend
```bash
cd backend
..\venv\Scripts\Activate.ps1
python main.py
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Run Electron
```bash
cd frontend
npm run dev          # Start Vite first
npm run electron:dev # In another terminal
```

### Key Endpoints
- Backend API: http://127.0.0.1:8001
- Frontend: http://localhost:5173/app/
- Dashboard: `GET /api/dashboard`
- Datasets: `GET /api/datasets`, `POST /api/datasets/upload`

---

## Template for New Entries

```markdown
### YYYY-MM-DD

**Session: [Brief Title]**

- **Topic 1**
  - Details...

- **Topic 2**
  - Details...
```
