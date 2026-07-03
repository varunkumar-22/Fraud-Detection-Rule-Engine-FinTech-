# Fraud Detection Rule Engine (FinTech)

A near real-time fraud decision engine for digital transactions.  
It evaluates every transaction against configurable PostgreSQL-backed rules, computes a weighted risk score, and returns an explainable decision.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express.js, PostgreSQL, Zod
- **Frontend:** React 18, Vite, React Router v6
- **Testing:** Jest, ts-jest, Supertest
- **Dev tooling:** ts-node, ts-node-dev, Docker (local PostgreSQL)

## At a Glance

- **What it does:** evaluates each transaction and classifies it as `ALLOW`, `REVIEW`, or `BLOCK`
- **How rules are managed:** rules live in PostgreSQL and can be changed via APIs without changing code
- **Why it is useful:** faster fraud-logic updates, deterministic behavior, and explainable outcomes
- **Who this is for:** developers building or extending fintech risk controls and rule operations

## Why This Project

Fraud patterns evolve faster than release cycles in most transactional systems. Hardcoded fraud checks make updates slow, risky, and difficult to scale across teams.

This project is built to solve that by making fraud logic configurable, deterministic, and explainable:

- **Configurable:** rules are managed in the database and can be updated without changing application code
- **Deterministic:** the same input and same active rules always produce the same result
- **Explainable:** every decision includes triggered-rule reasoning and score contribution for auditability

## Problem It Solves

Hardcoded fraud checks are expensive to maintain and slow to evolve.  
This system addresses that by:

- storing rule definitions in the database
- evaluating incoming transactions in near real-time
- applying temporal and velocity checks
- producing consistent `ALLOW` / `REVIEW` / `BLOCK` outcomes
- exposing triggered-rule reasoning in API responses

## What Is Built

- Transaction evaluation API
- Configurable fraud rule management (create/update/toggle/delete)
- Deterministic rule engine (threshold, temporal, velocity rules)
- Weighted risk scoring and decision mapping
- Explainable output with triggered rule details
- Structured logging and alerting for high-risk cases
- Transaction simulation endpoint for scenario testing
- Evaluation result history APIs

## Rule Engine Deep Dive

The engine supports 3 rule families:

- **Threshold rules:** evaluate transaction fields like `amount`, `location`, and `device_id`
- **Temporal rules:** evaluate time-derived values such as `hour_of_day` and `day_of_week`
- **Velocity rules:** evaluate rolling-window behavior such as transaction counts/amounts

Supported operators include:

- `gt`, `lt`, `gte`, `lte`, `eq`, `neq`
- `in`, `not_in` (set-based matching)
- `range` (min-max)
- `regex` (pattern match)

Rules are prioritized and evaluated deterministically. Triggered rules contribute their `weight` to the final risk score.

## How It Works

```text
Transaction Input (API/UI)
-> Request Validation (Zod)
-> Load Active Rules (PostgreSQL)
-> Rule Evaluation Engine
-> Temporal + Velocity Analysis
-> Risk Score Aggregation
-> Decision (ALLOW / REVIEW / BLOCK)
-> Explainable Response
-> Persist Results (risk logs + rule trace)
```

## Decision Model

- Final risk score = sum of weights of triggered rules
- Decision thresholds:
  - `ALLOW`: score < 30
  - `REVIEW`: score >= 30 and < 70
  - `BLOCK`: score >= 70
- Alert generated for high-risk transactions (`score >= 70`)
- Idempotent handling to prevent duplicate evaluation of the same transaction

## Request and Response Example

Example evaluation request (uses Alice — a user created by `npm run seed`):

```json
{
  "user_id": "a1b2c3d4-0001-0001-0001-000000000001",
  "amount": 15000,
  "location": "RU",
  "device_id": "device-001",
  "transaction_time": "2026-04-12T02:30:00Z"
}
```

Typical successful API response:

```json
{
  "success": true,
  "data": {
    "tx_id": "7a1cfde9-b4f2-4e2e-8fa5-36f94fdf640f",
    "decision": "BLOCK",
    "risk_score": 90,
    "triggered_rules": [
      {
        "rule_id": "rule-001",
        "rule_name": "High Amount",
        "rule_type": "threshold",
        "weight_applied": 50,
        "reason": "amount (15000) gt 10000"
      }
    ],
    "score_breakdown": [
      {
        "rule_name": "High Amount",
        "weight": 50,
        "reason": "amount (15000) gt 10000"
      }
    ],
    "evaluation_time": "2026-04-12T02:30:01.000Z",
    "is_alert_generated": true
  }
}
```

## API Endpoints

Base URL: `http://localhost:3000`

- `GET /health`
- `POST /api/transactions/evaluate`
- `GET /api/rules`
- `GET /api/rules/:id`
- `POST /api/rules`
- `PUT /api/rules/:id`
- `PATCH /api/rules/:id`
- `DELETE /api/rules/:id`
- `POST /api/simulate`
- `GET /api/results`
- `GET /api/results/:txId`

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── api/        # routes, controllers, middlewares
│   │   ├── engine/     # rule evaluation, scoring, explainability
│   │   ├── services/   # business orchestration layer
│   │   ├── db/         # client, migrations, seed scripts
│   │   └── schemas/    # Zod request schemas
│   └── tests/          # unit, scenario, integration tests
├── frontend/           # React 18 + Vite UI — Dashboard, Rules Management, Simulate pages
├── docs/               # PRD/API/DB docs
└── postman/            # Postman collection
```

## Key Database Entities

- `transactions`: raw incoming transaction records
- `fraud_rules`: active/inactive rule definitions with type, operator, threshold, weight, and priority
- `risk_logs`: final decision outputs per evaluated transaction
- `rule_evaluation_trace`: triggered-rule audit trail for explainability
- `velocity_tracking` and related stats tables: supports temporal/velocity checks

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Docker](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- Git

### Step 1 — Clone the repository

```bash
git clone https://github.com/varunkumar-22/Fraud-Detection-Rule-Engine-FinTech-.git
cd Fraud-Detection-Rule-Engine-FinTech-
```

### Step 2 — Start PostgreSQL via Docker

```bash
docker run -d \
  --name fraud-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fraud_detection \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 3 — Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

The default `.env` values match the Docker container above — no changes needed if you used the command as-is:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fraud_detection
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
```

Run migrations, seed data, and start the server:

```bash
npm run migrate
npm run seed
npm run dev
```

Backend runs at `http://localhost:3000`. Quick health check:

```bash
curl http://localhost:3000/health
```

### Step 4 — Set up the frontend

Open a new terminal tab and navigate to the repo root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` — open that in your browser.  
It proxies all `/api` calls to the backend automatically.

## Scripts

All scripts run from the `backend/` directory:

- `npm run dev` - start server in watch mode
- `npm run start` - start server once
- `npm run migrate` - run DB migrations
- `npm run seed:rules` - seed fraud rules
- `npm run seed:transactions` - seed transactions
- `npm run seed` - run all seed scripts
- `npm test` - run test suite

## Testing

Current test strategy — **105 tests** across 3 layers:

- **Unit tests** — rule evaluation and scoring correctness
- **Scenario tests** — expected fraud outcomes end-to-end
- **Integration tests** — all 4 API endpoints (`/evaluate`, `/simulate`, `/rules`, `/results`) covering response shape, decision correctness, validation errors, pagination, and DB persistence guarantees

Target outcome: deterministic decisions, explainable traces, and near real-time response latency.

To run tests:

```bash
cd backend
npm test
```

## Roadmap (Next)

Planned extensions from the PRD:

- rule versioning and audit trail
- authentication and role-based access control
- containerized deployment readiness

## API Testing

Use `postman/FraudDetectionAPI.collection.json` to verify API flows and demo scenarios.

## Contributor Onboarding (Recommended Path)

If you are new to the project, follow this order:

1. Run `Quick Start` and verify `/health`
2. Read `backend/src/app.ts` to understand route wiring
3. Read `backend/src/services/transaction.service.ts` for end-to-end orchestration
4. Read `backend/src/engine/decisionEngine.ts` and `backend/src/engine/ruleEvaluator.ts`
5. Run `npm test` and inspect scenario tests under `backend/tests/scenarios`
