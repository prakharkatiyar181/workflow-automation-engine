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

## Technical Decisions, Tradeoffs & Production Improvements

The following documents deliberate decisions made during development, their rationale, and the production-grade path forward for each.

---

### 1. Simulated Task Execution

**Current implementation:**
Tasks are executed by `SimulatedTaskRunner`, which sleeps for `estimated_duration` seconds and randomly raises an exception based on `failure_probability`. No real shell commands or external processes are run.

**Rationale:**
The assignment focuses on DAG orchestration, scheduling, concurrency, and state management — not on wrapping specific commands. A simulated runner isolates the orchestration logic from environment-specific concerns (OS paths, Docker-in-Docker, credentials).

**Production path:**
```
BaseTaskRunner (abstract)
    ├── SimulatedTaskRunner   ← current
    ├── ShellCommandRunner    ← run arbitrary shell commands
    ├── HttpTaskRunner        ← POST to an external webhook/service
    └── AwsBatchRunner        ← submit jobs to AWS Batch / ECS
```
The `BaseTaskRunner` interface is already in place. Swapping the runner requires changing a single line in `tasks.py`.

---

### 2. No Authentication

**Current implementation:**
All API endpoints are publicly accessible with no authentication or authorization layer.

**Rationale:**
The original assignment specification did not require multi-user access or authentication. Adding it would have introduced complexity (token management, middleware, test fixtures) without fulfilling a stated requirement.

**Production path:**
- JWT authentication via `djangorestframework-simplejwt`
- Each `Pipeline` and `PipelineExecution` gains a `created_by` FK to `User`
- Querysets are scoped per user: `Pipeline.objects.filter(created_by=request.user)`
- RBAC roles: `viewer`, `operator`, `admin`

---

### 3. Immutable Pipelines (No Edit/Delete)

**Current implementation:**
Pipelines cannot be modified or deleted after creation. There is no `PUT /api/pipelines/{id}/` endpoint.

**Rationale:**
Allowing edits to a pipeline while executions are in progress would corrupt the relationship between `PipelineTask` records and `TaskExecution` records. The data model treats the pipeline definition as the ground truth for any execution derived from it.

**Production path:**
Introduce pipeline versioning:
```
Pipeline
  └── PipelineVersion (immutable snapshot per version)
        └── PipelineExecution (always references a specific version)
```
This allows the pipeline definition to evolve while keeping historical executions reproducible and traceable.

---

### 4. Execution Recovery on Worker Crash

**Current limitation:**
If a Celery worker process crashes while a `chord` is in-flight (e.g., mid-task during a deployment or OOM kill), the `dispatch_next_wave` chord callback is lost. The `PipelineExecution` will remain stuck in `RUNNING` status indefinitely with no automatic recovery.

**Rationale:**
Implementing a robust recovery mechanism requires a periodic background scheduler (Celery Beat), which would add meaningful complexity. This was treated as out of scope for the take-home assessment.

The database remains fully consistent — no data is corrupted. Only the in-memory Celery state is lost.

**Production path:**
```python
# Celery Beat periodic task (runs every 5 minutes)
@shared_task
def reconcile_stuck_executions():
    cutoff = timezone.now() - timedelta(minutes=15)
    stuck = PipelineExecution.objects.filter(
        status=PipelineExecution.Status.RUNNING,
        started_at__lt=cutoff
    )
    for execution in stuck:
        # Mark as FAILED; send alert
        execution.status = PipelineExecution.Status.FAILED
        execution.save()
        send_execution_update(execution)
```
Additional hardening: Celery task `acks_late=True` + idempotency guards ensure tasks are safe to retry after a worker restart.
