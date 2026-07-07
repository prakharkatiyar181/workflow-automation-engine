# Workflow Automation Engine

A production-quality DAG-based workflow automation system inspired by Apache Airflow and GitHub Actions.

Users can create pipelines, define task dependencies, execute workflows, and monitor execution progress in real time.

---

## Features

- Visual pipeline creation with task dependency management
- Directed Acyclic Graph (DAG) validation
- Cycle and invalid dependency detection
- Dependency-aware task scheduling
- Parallel execution of independent tasks
- Asynchronous execution using Celery workers
- Real-time task status updates using WebSockets
- Interactive DAG visualization using React Flow
- Execution inspection with:
  - task status
  - start time
  - completion time
  - duration
  - error details
- Failure propagation with downstream task skipping
- Responsive UI for desktop, tablet, and mobile
- Loading, empty, and error states
- Single-command Docker-based setup

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| UI | TailwindCSS + React Flow |
| State | React Query |
| Backend | Django + Django REST Framework |
| Real-time | Django Channels + WebSockets |
| Worker | Celery |
| Broker | Redis |
| Database | PostgreSQL |
| Deployment | Docker Compose |

---

# Quick Start

The entire system runs locally using one command.

```bash
docker compose up --build
```

Services:

| Service | URL |
|-|-|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin | http://localhost:8000/admin/ |
| Health Check | http://localhost:8000/api/health/ |

No manual package installation is required.

---

# System Architecture

```
                 React UI
                    |
                    |
              Django REST API
                    |
          ----------------------
          |                    |
     PostgreSQL              Redis
          |                    |
          |                    |
       Celery Worker <---------
          |
          |
    DAG Execution Engine


Real-time:

Celery
  |
  |
Django Channels
  |
  |
WebSocket
  |
  |
React Query Cache
```

---

# Pipeline Model

A pipeline consists of tasks connected through dependencies.

Example:

```
        Upload Data

        /       \

 Process Data   Validate Data

        \       /

       Generate Report
```

Independent branches execute concurrently.

---

# Execution Engine

The scheduler uses topological sorting (Kahn's Algorithm).

Tasks are grouped into execution waves.

Example DAG:

```
        A

      /   \

     B     C

      \   /

        D
```

Execution:

```
Wave 1:

A


Wave 2:

B + C


Wave 3:

D
```

Each wave is dispatched asynchronously using Celery.

---

# Failure Handling

Task failures are handled explicitly.

Example:

```
A
|
B (fails)
|
C
```

Result:

```
A → COMPLETED

B → FAILED

C → SKIPPED

Pipeline → FAILED
```

Failures:

- store error details
- prevent invalid downstream execution
- keep pipeline state consistent

---

# Real-Time Updates

Execution monitoring is powered by Django Channels.

Flow:

```
Celery Task Executes

        |

Update Database

        |

Send WebSocket Event

        |

React receives update

        |

React Query cache updates

        |

UI refreshes automatically
```

No polling is used.

Users can watch:

- task starting
- task completion
- task failure
- pipeline completion

without refreshing the browser.

---

# Frontend

The frontend provides:

## Dashboard

- Pipeline list
- Current execution status
- Run pipeline action
- Real-time status updates


## Pipeline Builder

Supports:

- adding tasks
- configuring duration
- configuring failure probability
- creating dependencies
- validation feedback


## Execution View

Shows:

- live DAG graph
- task state changes
- execution progress
- timestamps
- duration
- errors

---

# API Reference

## Create Pipeline

```http
POST /api/pipelines/
```

Example:

```json
{
  "name": "Genome Pipeline",

  "tasks": [
    {
      "name": "Upload",
      "estimated_duration": 5
    },
    {
      "name": "Process",
      "estimated_duration": 10
    }
  ],

  "dependencies": [
    {
      "task": "Process",
      "depends_on": "Upload"
    }
  ]
}
```

---

## List Pipelines

```http
GET /api/pipelines/
```

Returns:

```json
[
  {
    "id": "uuid",
    "name": "Pipeline",
    "task_count": 4,
    "latest_execution": {
      "status": "COMPLETED"
    }
  }
]
```

---

## Execute Pipeline

```http
POST /api/pipelines/{id}/execute/
```

Returns:

```json
{
  "execution_id": "uuid",
  "status": "QUEUED"
}
```

---

## Inspect Execution

```http
GET /api/executions/{id}/
```

Returns:

```json
{
  "status": "RUNNING",

  "tasks": [
    {
      "name": "Upload",
      "status": "COMPLETED",
      "started_at": "...",
      "completed_at": "...",
      "duration": 5,
      "error_message": null
    }
  ]
}
```

---

# Validation

The system prevents invalid DAGs.

Handled cases:

## Circular Dependency

Invalid:

```
A → B
↑   |
|___|
```

Rejected.

---

## Self Dependency

Invalid:

```
A → A
```

Rejected.

---

## Duplicate Dependency

Invalid:

```
A → B

A → B
```

Rejected.

---

# Development Commands


Run migrations:

```bash
docker compose exec backend python manage.py migrate
```


Create migrations:

```bash
docker compose exec backend python manage.py makemigrations
```


Backend check:

```bash
docker compose exec backend python manage.py check
```


Frontend build:

```bash
docker compose exec frontend npm run build
```


View logs:

```bash
docker compose logs -f
```

---

# Testing Checklist

Tested scenarios:

- Linear DAG execution

```
A → B → C
```


- Parallel DAG execution

```
        A

      /   \

     B     C

      \   /

        D
```


- Independent branches

```
A → B


C → D
```


- Task failure propagation


- Browser refresh during execution


- Multiple browser windows receiving WebSocket updates


- Mobile responsive layouts


- Fresh Docker startup

---

# Technical Decisions, Tradeoffs & Future Improvements


## 1. Simulated Task Execution

Current:

Tasks execute using a simulated runner.

It supports:

- configurable duration
- configurable failure probability


Reason:

The focus of the assessment is:

- orchestration
- scheduling
- concurrency
- state handling


Future:

The runner abstraction allows:

```
BaseTaskRunner

    ├── ShellCommandRunner

    ├── HTTPRunner

    └── AWS Batch Runner
```

without changing the DAG engine.

---

# 2. Authentication

Current:

Authentication is intentionally not implemented.

Reason:

The assignment does not require multi-user behavior.

Future:

Add:

- JWT authentication
- user-owned pipelines
- role-based access control

---

# 3. Immutable Pipelines

Current:

Created pipelines cannot be edited.

Reason:

Changing a DAG while executions exist creates consistency issues.

Production approach:

```
Pipeline

    |

Pipeline Version

    |

Execution
```

Each execution references a fixed version.

---

# 4. Worker Crash Recovery

Current limitation:

If a Celery worker crashes during an active task, an execution may remain RUNNING.

The database remains consistent, but recovery is manual.

Production improvement:

Add:

- Celery Beat reconciliation job
- execution timeout monitoring
- worker heartbeat tracking
- retry policies

---

# Repository Notes

The project contains:

- incremental git history
- documented decisions
- Docker environment
- production-style architecture

The system is designed to demonstrate scalable full-stack architecture rather than only CRUD functionality.