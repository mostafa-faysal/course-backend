<div align="center">
  <h1>🚀 Enterprise Online Learning Platform API (Courses Backend)</h1>
  <p><strong>A robust, secure, and highly-scalable backend engine inspired by Udemy & Coursera. Built with Node.js, TypeScript, Express, Prisma, and Neon PostgreSQL.</strong></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
    <img src="https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/PM2-Clustered-2B037A?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2 Cluster" />
  </p>
</div>

---

## 🌟 Overview

The **Courses Backend Engine** is an enterprise-grade backend service designed to power high-concurrency online education platforms. Engineered with strict **Clean Architecture**, SOLID principles, and zero technical debt, it offers a scalable infrastructure featuring real-time analytics, course management, automated grading workflows, dynamic notifications, and hardened security protections.

---

## 🏛️ Architecture & Lifecycle Diagram

The API implements a predictable request lifecycle with strict layer separation: **Thin Controllers**, **Dedicated Business Services**, **Strong Zod Validation**, and **Centralized Error Orchestration**.

```mermaid
graph TD
    Client[Client Request / SPA] -->|HTTPS / Bearer Token| RL[Rate Limiter & Security Helmet]
    RL --> CORS[CORS Filter & Payload Compression]
    CORS --> REQ_ID[X-Request-ID Injector]
    REQ_ID --> ZOD[Zod Runtime Validator & Auth Middleware]
    
    ZOD -->|Valid| CTRL[Thin Route Controller]
    ZOD -->|Invalid| ERR_MIDDLEWARE[Centralized Error Middleware]
    
    CTRL --> SERV[Service Layer Business Logic]
    SERV --> ORM[Prisma Client Pool]
    ORM --> DB[(Neon Cloud PostgreSQL)]
    
    SERV --> LOGS[Winston Structured Logger]
    SERV --> NOTIF[Realtime Notification Helper]
    
    SERV -->|Success JSON| Client
    SERV -->|CustomError / Prisma Exception| ERR_MIDDLEWARE
    ERR_MIDDLEWARE -->|Safe HTTP Response 4xx/5xx + X-Request-ID| Client
```

---

## 💎 Key Enterprise Features

- **🔐 Robust RBAC Authentication:** JWT-driven authorization supporting granular roles (`ADMIN`, `INSTRUCTOR`, `STUDENT`) with token verification and automated account lockout shielding.
- **📚 Advanced Course & Lesson Engine:** Categorization, modular sections, embedded preview video URLs, pricing discounts, and draft/published/rejected administrative workflows.
- **📝 Git-Style Assignment Submissions:** Multi-attempt submission tracking (`AssignmentSubmissionAttempt`), overdue vs. late calculations, grade audit logs (`AssignmentGradeHistory`), and instructor automated/manual scoring.
- **🛡️ High-Security Production Shield:** 
  - Hardened headers via `Helmet`.
  - Dynamic whitelist CORS policies via environment variables.
  - Global API rate limiting & strict brute-force throttle on login endpoints.
  - Startup Zod Environment Validation (fast-fail crash on invalid secrets).
- **📡 Observability & Telemetry:** 
  - **Structured JSON Logging:** High-performance logs via **Winston** with stack trace mapping.
  - **Request Correlation:** Guaranteed `X-Request-ID` attached to all HTTP headers, logs, and error telemetry.
  - **Real Database Probes:** Lively `/api/health` diagnostics querying actual PostgreSQL reachability and reporting uptime metrics.
- **📦 Deployment Ready:** Features a multi-stage optimized `Dockerfile`, non-root execution permissions, `.dockerignore` pruning, and a production PM2 `ecosystem.config.js` for CPU core clustering.

---

## 🛠️ Tech Stack & Quality Matrix

| Layer | Technology / Practice | Why Used |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (20.x Alpine) + TypeScript | Strong typing, async event loop efficiency, zero silent runtime casting. |
| **Database & ORM** | Neon PostgreSQL + Prisma | Cloud-native serverless Postgres storage, relational integrity, type-safe queries. |
| **Validation** | Zod + Joi | Declarative request payload inspection and environment boot safety. |
| **Documentation** | Swagger / OpenAPI 3.0 | Live interactive API exploration accessible at `/api/docs`. |
| **Process Control** | Docker & PM2 Cluster | Zero-downtime reloads, memory limit restarts, multi-core parallelism. |
| **Logging & Crash Handling** | Winston + Graceful Shutdown Hooks | Safe termination via `SIGINT/SIGTERM`, ensuring clean database pool closures. |

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- Node.js version >= 18.x (Recommended: Node 20 LTS)
- Git & npm
- A cloud PostgreSQL instance via [Neon.tech](https://neon.tech) (or local Postgres)

### 2. Clone & Install
```bash
git clone https://github.com/mostafa-faysal/course-backend.git
cd course-backend
npm install
```

### 3. Environment Variables (.env)
Create a `.env` file in the root directory. **Note:** The application will refuse to boot if any required variable is omitted:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Neon PostgreSQL Connection Strings
DATABASE_URL="postgresql://neondb_owner:PASSWORD@your-host.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:PASSWORD@your-host.aws.neon.tech/neondb?sslmode=require"

# Security Secrets
JWT_SECRET="super-secure-production-random-secret-key"
JWT_EXPIRES_IN="7d"

# Storage Support (Optional/Legacy)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
```

### 4. Database Sync & Generation
```bash
# Generate Prisma bindings and align database schema
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
# Server boots at http://localhost:5000
# Swagger API docs accessible at http://localhost:5000/api/docs
```

---

## 🐳 Docker & Production Execution

### Option A: Multi-Stage Docker Deployment
```bash
# 1. Build optimized production container image (~120MB compressed)
docker build -t courses-api:latest .

# 2. Run container with environment file and auto-restart policy
docker run -d --name courses-backend -p 5000:5000 --env-file .env --restart unless-stopped courses-api:latest
```

### Option B: PM2 Cluster Execution
```bash
# 1. Compile TypeScript to dist/ directory
npm run build

# 2. Launch production multi-core cluster
pm2 start ecosystem.config.js --env production

# 3. Save process state and stream real-time logs
pm2 save
pm2 logs courses-backend
```

---

## 🧪 Verification & Health Check

You can ping the production diagnostics endpoint without credentials:
```http
GET http://localhost:5000/api/health
```

**Expected 200 OK Response (Healthy Engine):**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 2451.89,
  "timestamp": "2026-07-25T16:35:00.000Z",
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

## 📖 Complete Documentation & Backup Strategies
- [📖 Detailed Endpoint API Reference (API_DOCUMENTATION.md)](./API_DOCUMENTATION.md)
- [🛡️ Postgres Disaster Recovery & PITR Backup Protocol (BACKUP_STRATEGY.md)](./BACKUP_STRATEGY.md)
- [🔄 Project Development Timeline & Phase Highlights (CHANGELOG.md)](./CHANGELOG.md)

---
<p align="center">
  Built with ❤️ by <strong>Mostafa Faysal</strong> for modern production environments.
</p>
