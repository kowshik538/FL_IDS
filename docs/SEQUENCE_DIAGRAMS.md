# AgisFL Enterprise – Design Sequence Diagrams

Sequence diagrams for key flows in the FL-IDS platform. Use a [Mermaid](https://mermaid.js.org/) renderer (GitHub, VS Code, etc.) to view.

---

## 1. Application Startup Sequence

```mermaid
sequenceDiagram
    participant User
    participant Electron
    participant Vite
    participant Frontend
    participant Backend
    participant DB
    participant FLEngine
    participant IDSEngine

    User->>Electron: Launch app (electron:dev)
    Electron->>Vite: Load http://localhost:5173/app/
    Vite-->>Electron: Serve React app

    User->>Backend: Start (python main.py)
    Backend->>Backend: Lifespan startup
    Backend->>DB: DatabaseManager.initialize()
    DB-->>Backend: SQLite/aiosqlite ready
    Backend->>FLEngine: FederatedLearningEngine.initialize()
    FLEngine-->>Backend: FL ready
    Backend->>IDSEngine: IntrusionDetectionEngine.initialize()
    IDSEngine-->>Backend: IDS ready
    Backend->>Backend: Uvicorn.listen(8001)
    Backend-->>User: Backend running

    Frontend->>Backend: GET /api/health
    Backend-->>Frontend: 200 OK
    Frontend-->>User: Dashboard loads
```

---

## 2. Dashboard Load & Real-Time Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant API
    participant Backend
    participant MetricsCollector
    participant FLEngine
    participant IDSEngine

    User->>Dashboard: Navigate to /dashboard
    Dashboard->>API: getDashboard()
    API->>Backend: GET /api/dashboard
    Backend->>MetricsCollector: get_metrics()
    Backend->>FLEngine: get_current_metrics()
    Backend->>IDSEngine: get_current_metrics()
    MetricsCollector-->>Backend: system metrics
    FLEngine-->>Backend: FL metrics
    IDSEngine-->>Backend: IDS metrics
    Backend-->>API: JSON (overview, system, security, etc.)
    API-->>Dashboard: dashboardData

    par Parallel polling
        Dashboard->>API: getFlStatus() [every 5s]
        API->>Backend: GET /api/fl/status
        Backend-->>API: FL status
        API-->>Dashboard: flStatusData
    and
        Dashboard->>API: getRealTimeMetrics() [every 2s]
        API->>Backend: GET /api/fl-ids/metrics/real-time
        Backend-->>API: threats, throughput, latency
        API-->>Dashboard: flIdsData
    end

    Dashboard-->>User: Render metrics, charts, alerts
```

---

## 3. Federated Learning Training Start

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant API
    participant Backend
    participant FLEngine
    participant FLClient1
    participant FLClient2

    User->>Dashboard: Click "Start Training" (50 rounds)
    Dashboard->>Dashboard: confirm()
    Dashboard->>API: startTraining({ rounds: 50 })
    API->>Backend: POST /api/fl/start
    Backend->>FLEngine: start_training(rounds=50)
    
    FLEngine->>FLClient1: train() local model
    FLEngine->>FLClient2: train() local model
    FLClient1-->>FLEngine: model updates
    FLClient2-->>FLEngine: model updates
    FLEngine->>FLEngine: aggregate (FedAvg)
    FLEngine->>FLEngine: update global model

    FLEngine-->>Backend: training started
    Backend-->>API: 200 OK
    API-->>Dashboard: success
    Dashboard->>Dashboard: invalidateQueries (fl-status, dashboard)
    Dashboard-->>User: Toast "FL training started"
```

---

## 4. Dataset Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant DatasetManager
    participant API
    participant Backend
    participant Disk

    User->>DatasetManager: Select file, enter metadata
    User->>DatasetManager: Click "Upload"
    DatasetManager->>API: upload(file, metadata, onProgress)
    API->>Backend: POST /api/datasets/upload (multipart/form-data)
    
    loop Chunked write
        Backend->>Disk: write 1MB chunk
        Backend-->>API: progress (onUploadProgress)
        API-->>DatasetManager: setUploadProgress(pct)
    end

    Backend->>Backend: _estimate_csv_stats(file_path)
    Backend->>Backend: datasets_db[id] = metadata
    Backend-->>API: 200 { id, name, samples, ... }
    API-->>DatasetManager: success
    DatasetManager->>DatasetManager: invalidateQueries("datasets")
    DatasetManager->>DatasetManager: setUploadModalOpen(false)
    DatasetManager-->>User: Toast "Upload successful"
```

---

## 5. Dataset List & Preview

```mermaid
sequenceDiagram
    participant User
    participant DatasetManager
    participant API
    participant Backend

    User->>DatasetManager: Open Datasets page
    DatasetManager->>API: list({ page, page_size, q, tag, status })
    API->>Backend: GET /api/datasets?page=1&page_size=10
    Backend->>Backend: Filter & paginate datasets_db
    Backend-->>API: { total, items: Dataset[] }
    API-->>DatasetManager: dsResp
    DatasetManager-->>User: Show grid/table

    User->>DatasetManager: Click "Preview"
    DatasetManager->>API: preview(datasetId)
    API->>Backend: GET /api/datasets/{id}/preview
    Backend->>Backend: _get_preview_rows(file_path)
    Backend-->>API: { rows: [...] }
    API-->>DatasetManager: preview data
    DatasetManager-->>User: Show preview modal
```

---

## 6. Security Monitoring & Alerts

```mermaid
sequenceDiagram
    participant Network
    participant IDSEngine
    participant Backend
    participant WebSocket
    participant Frontend
    participant User

    Network->>IDSEngine: Packet stream (or simulation)
    IDSEngine->>IDSEngine: Analyze & detect threats
    IDSEngine->>Backend: recent_threats
    Backend->>Backend: Dashboard includes alerts

    Frontend->>Backend: GET /api/security/threats
    Backend->>IDSEngine: get_current_metrics()
    IDSEngine-->>Backend: threats, detection_stats
    Backend-->>Frontend: threat list

    Backend->>WebSocket: Broadcast (if connected)
    WebSocket-->>Frontend: Real-time alert
    Frontend-->>User: Notification / update UI
```

---

## 7. Web Application vs Electron Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Electron
    participant Vite
    participant Backend

    alt Web (npm run dev)
        User->>Browser: Open http://localhost:5173/app/
        Browser->>Vite: Request app
        Vite-->>Browser: React app (HTML/JS)
        Browser->>Backend: API calls (proxy /api → 8001)
        Backend-->>Browser: JSON
    else Electron (npm run electron:dev)
        User->>Electron: Launch
        Electron->>Vite: loadURL http://localhost:5173/app/
        Vite-->>Electron: React app
        Electron->>Backend: API calls (proxy or direct 8001)
        Backend-->>Electron: JSON
    end
```

---

## Component Summary

| Participant      | Role                                                |
|------------------|-----------------------------------------------------|
| **User**         | End user interacting with the application           |
| **Frontend**     | React app (Dashboard, DatasetManager, etc.)         |
| **Electron**     | Desktop shell when running as native app            |
| **Vite**         | Dev server (port 5173), serves frontend             |
| **API**          | Axios client (`frontend/src/services/api.ts`)       |
| **Backend**      | FastAPI (port 8001), routes, lifespan               |
| **FLEngine**     | Federated learning training & aggregation           |
| **IDSEngine**    | Intrusion detection, threat analysis                |
| **MetricsCollector** | System metrics (CPU, memory, etc.)              |
| **DB**           | SQLite via aiosqlite / DatabaseManager              |
