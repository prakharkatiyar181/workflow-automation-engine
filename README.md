# Workflow Automation Engine

A production-quality DAG pipeline executor inspired by Airflow / GitHub Actions.

## Stack

| Layer | Technology |
|---|---|
| Backend | Django + DRF + Django Channels (Daphne) |
| Workers | Celery + Redis |
| Database | PostgreSQL |
| Frontend | React + Vite + TypeScript + React Flow |
| Dev | Docker Compose |

## Quick Start

```bash
# One command — starts all 5 services
docker compose up --build
```

| Service | URL |
|---|---|
| React UI | http://localhost:5173 |
| Django API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
| Health check | http://localhost:8000/api/health/ |

---

## REST API Reference

### 1. Create a Pipeline

**POST** `/api/pipelines/`

Tasks and dependencies are defined by **name** in a single atomic request.
The server validates DAG correctness (no cycles, no self-loops) before saving anything.

```bash
curl -s -X POST http://localhost:8000/api/pipelines/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Genome Analysis Pipeline",
    "description": "Demo four-task DAG",
    "tasks": [
      {"name": "A: Upload Data",    "estimated_duration": 5,  "failure_probability": 0.0},
      {"name": "B: Process Data",   "estimated_duration": 10, "failure_probability": 0.1},
      {"name": "C: Validate Data",  "estimated_duration": 8,  "failure_probability": 0.0},
      {"name": "D: Generate Report","estimated_duration": 6,  "failure_probability": 0.0}
    ],
    "dependencies": [
      {"task": "B: Process Data",    "depends_on": "A: Upload Data"},
      {"task": "C: Validate Data",   "depends_on": "A: Upload Data"},
      {"task": "D: Generate Report", "depends_on": "B: Process Data"},
      {"task": "D: Generate Report", "depends_on": "C: Validate Data"}
    ]
  }' | python -m json.tool
```

**Expected:** `201 Created` with the full pipeline DAG.

---

### 2. Cycle Detection — Should Fail

```bash
curl -s -X POST http://localhost:8000/api/pipelines/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Circular Pipeline",
    "tasks": [
      {"name": "A", "estimated_duration": 5},
      {"name": "B", "estimated_duration": 5}
    ],
    "dependencies": [
      {"task": "B", "depends_on": "A"},
      {"task": "A", "depends_on": "B"}
    ]
  }' | python -m json.tool
```

**Expected:** `400 Bad Request`
```json
{"error": "Pipeline contains a circular dependency"}
```

---

### 3. List Pipelines

**GET** `/api/pipelines/`

```bash
curl -s http://localhost:8000/api/pipelines/ | python -m json.tool
```

**Response shape:**
```json
[
  {
    "id": "<uuid>",
    "name": "Genome Analysis Pipeline",
    "description": "...",
    "task_count": 4,
    "latest_execution": {
      "id": "<uuid>",
      "status": "COMPLETED"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 4. Get Pipeline DAG Detail

**GET** `/api/pipelines/{id}/`

```bash
curl -s http://localhost:8000/api/pipelines/<uuid>/ | python -m json.tool
```

**Response shape:**
```json
{
  "id": "<uuid>",
  "name": "Genome Analysis Pipeline",
  "tasks": [
    {"id": "<uuid>", "name": "A: Upload Data", "estimated_duration": 5, ...}
  ],
  "dependencies": [
    {"from": "<uuid-of-A>", "to": "<uuid-of-B>"}
  ]
}
```

> `from` = upstream prerequisite, `to` = blocked downstream task.
> This format is consumed directly by React Flow for graph rendering.

---

### 5. Execute a Pipeline

**POST** `/api/pipelines/{id}/execute/`

```bash
curl -s -X POST http://localhost:8000/api/pipelines/<uuid>/execute/ \
  -H "Content-Type: application/json" | python -m json.tool
```

**Response shape:**
```json
{
  "execution_id": "<uuid>",
  "status": "QUEUED"
}
```

> Creates a `QUEUED` PipelineExecution with one `PENDING` TaskExecution per task.
> The Celery engine (Phase 4) picks it up and transitions states automatically.

---

### 6. Get Execution Status

**GET** `/api/executions/{id}/`

```bash
curl -s http://localhost:8000/api/executions/<execution-uuid>/ | python -m json.tool
```

**Response shape:**
```json
{
  "id": "<uuid>",
  "status": "RUNNING",
  "pipeline_id": "<uuid>",
  "pipeline_name": "Genome Analysis Pipeline",
  "started_at": "2024-01-01T00:01:00Z",
  "completed_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "tasks": [
    {
      "id": "<uuid>",
      "name": "A: Upload Data",
      "status": "COMPLETED",
      "started_at": "2024-01-01T00:01:00Z",
      "completed_at": "2024-01-01T00:01:05Z",
      "duration": 5.0,
      "error_message": null
    },
    {
      "id": "<uuid>",
      "name": "B: Process Data",
      "status": "RUNNING",
      "started_at": "2024-01-01T00:01:05Z",
      "completed_at": null,
      "duration": null,
      "error_message": null
    }
  ]
}
```

---

## Architecture

```
POST /api/pipelines/         →  PipelineViewSet.create()
                             →  pipelines/services.py → create_pipeline()
                             →  pipelines/validators.py → validate_dag() (DFS)
                             →  DB transaction (Pipeline + Tasks + Dependencies)

POST /api/pipelines/{id}/execute/  →  PipelineViewSet.execute()
                                   →  executions/services.py → create_execution()
                                   →  DB transaction (PipelineExecution + TaskExecutions)

GET  /api/executions/{id}/   →  ExecutionDetailView → 3 SQL queries (no N+1)
```

### DAG Cycle Detection

Uses DFS with **WHITE / GRAY / BLACK** node coloring:

- `WHITE` — unvisited
- `GRAY` — on the current DFS stack (being visited)
- `BLACK` — fully explored

Encountering a `GRAY` node during traversal means a **back-edge exists → cycle detected**.

---

## Development

```bash
# Apply migrations after model changes
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate

# Create a Django superuser for admin access
docker compose run --rm backend python manage.py createsuperuser

# Tail all service logs
docker compose logs -f
```
