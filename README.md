# Fraud Detection Rule Engine (FinTech)

A near real-time fraud decision engine for digital transactions.  
It evaluates every transaction against configurable PostgreSQL-backed rules, computes a weighted risk score, and returns an explainable decision.

## Why This Project

- **Project Type:** OJT Application Developer
- **Team:** Sriram Varun Kumar, Binayak Das
- **Stack:** Node.js, TypeScript, Express.js, PostgreSQL, Zod, Jest

The goal is simple: keep fraud logic dynamic (DB-driven, not hardcoded), deterministic, and explainable so teams can adapt quickly as fraud behavior changes.

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
├── frontend/           # dashboard and simulation UI scaffold
├── docs/               # PRD/API/DB docs
└── postman/            # Postman collection
```

## Quick Start

```bash
git clone https://github.com/varunkumar-22/Fraud-Detection-Rule-Engine-FinTech-.git
cd Fraud-Detection-Rule-Engine-FinTech-/backend
npm install
cp .env.example .env
```

Set values in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fraud_detection
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
```

Run database setup and start the service:

```bash
npm run migrate
npm run seed
npm run dev
```

## Scripts

- `npm run dev` - start server in watch mode
- `npm run start` - start server once
- `npm run migrate` - run DB migrations
- `npm run seed:rules` - seed fraud rules
- `npm run seed:transactions` - seed transactions
- `npm run seed` - run all seed scripts
- `npm test` - run test suite

## Testing

Current test strategy:

- unit tests for rule evaluation and scoring correctness
- scenario-based tests for expected fraud outcomes
- integration tests for end-to-end API and persistence behavior

Target outcome: deterministic decisions, explainable traces, and near real-time response latency.

## Roadmap (Next)

Planned extensions from the PRD:

- rule versioning and audit trail
- authentication and role-based access control
- containerized deployment readiness

## API Testing

Use `postman/FraudDetectionAPI.collection.json` to verify API flows and demo scenarios.
