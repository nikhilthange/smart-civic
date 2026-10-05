# 🚀 Smart Civic AI Platform — Production Deployment Runbook

This guide covers deployment procedures, security verification, database indexing, and observability for deploying **Smart Civic AI (CityOS)** to production environments.

---

## 📋 Pre-Flight Architecture Checklist

- [x] **Zero TypeScript Errors**: 3,335 frontend modules compiled via `tsc -b && vite build`
- [x] **Automated Regression Suite**: 42/42 backend test suites passing (100% zero-mock Mongoose persistence)
- [x] **K8s Declarative Schema Compliance**: 15/15 manifests passing schema validation (`scripts/deploy-k8s.sh`)
- [x] **Compound Database Indexing**: Spatial `2dsphere` + compound indexes synchronized on MongoDB Atlas
- [x] **Security Hardening**: Helmet HTTP headers, CORS whitelisting, PII scrubbing, rate limiting, and RBAC zero-trust matrix (30/30 passing)
- [x] **Graceful Shutdown**: 10-second drain guard for WebSockets, HTTP connections, and MongoDB connection pool

---

## ☸️ Option A: Kubernetes Production Deployment (GitOps)

Deploy the declarative production topology across 15 Kubernetes manifests.

### 1. Execute Automated Deploy Script
```bash
# Run the end-to-end topological rollout runner
./scripts/deploy-k8s.sh
```

### 2. Manual Step-by-Step Rollout (Alternative)
```bash
# Step 1: Create Namespace & Core Secrets/Config
kubectl create namespace smart-civic --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/configmap.yaml -n smart-civic
kubectl apply -f k8s/secrets-template.yaml -n smart-civic

# Step 2: Stateful Layer (Redis StatefulSet & Cache)
kubectl apply -f k8s/redis-deployment.yaml -n smart-civic

# Step 3: Workload Deployments
kubectl apply -f k8s/backend-deployment.yaml -n smart-civic
kubectl apply -f k8s/frontend-deployment.yaml -n smart-civic
kubectl apply -f k8s/worker-deployment.yaml -n smart-civic
kubectl apply -f k8s/ai-inference-deployment.yaml -n smart-civic

# Step 4: Network Policies & Ingress Routing
kubectl apply -f k8s/network-policy.yaml -n smart-civic
kubectl apply -f k8s/ingress.yaml -n smart-civic
kubectl apply -f k8s/hpa.yaml -n smart-civic

# Step 5: SRE Observability & Automated Backup CronJobs
kubectl apply -f k8s/prometheus-rules.yaml -n smart-civic
kubectl apply -f k8s/alertmanager-config.yaml -n smart-civic
kubectl apply -f k8s/grafana-dashboards.yaml -n smart-civic
kubectl apply -f k8s/sre-cronjob.yaml -n smart-civic
kubectl apply -f k8s/backup-cronjob.yaml -n smart-civic
```

### 3. Verify Pod Convergence
```bash
kubectl get pods -n smart-civic -w
kubectl get hpa -n smart-civic
```

---

## 🐳 Option B: Docker Compose Multi-Container Deployment

To spin up the containerized production stack (Nginx, Node Backend, React Frontend, Redis, MongoDB):

```bash
# 1. Build and start containers in detached mode
docker-compose up -d --build

# 2. Check service health
docker-compose ps

# 3. View unified logs
docker-compose logs -f backend
```

Exposed Endpoints:
- **Web App (Nginx Reverse Proxy & Static SPA)**: `http://localhost:80`
- **Backend API Gateway**: `http://localhost:5001` (mapped to internal `5000`)
- **MongoDB**: `mongodb://localhost:27017`

---

## ⚡ Option C: Bare-Metal / VM PM2 Production Cluster

For high-concurrency bare-metal or cloud instances (AWS EC2 / DigitalOcean / GCP Compute):

```bash
# 1. Install dependencies
cd server
npm ci --omit=dev

# 2. Synchronize database indexes
node scripts/create_production_indexes.js

# 3. Run pre-flight environment security audit
node scripts/verify_production_env.js

# 4. Start PM2 cluster across all CPU cores
npm run start:prod

# 5. Monitor cluster status
pm2 status
pm2 logs bmc-smart-civic-api
```

---

## 🗄️ Database Compound Index Maintenance

Run this script to guarantee that all 2dsphere and high-frequency read queries utilize background compound indexes:

```bash
node server/scripts/create_production_indexes.js
```

Synchronized Indexes:
- `complaints`: `{"location.coordinates": "2dsphere", "category": 1, "status": 1}`
- `complaints`: `{"ward": 1, "status": 1, "createdAt": -1}`
- `complaints`: `{"citizen": 1, "createdAt": -1}`
- `contractors`: `{"escrowBalance": 1, "uncollectedDeficit": 1}`
- `auditlogs`: `{"timestamp": -1, "entityId": 1}`

---

## 📡 Observability, Telemetry & Health Probes

| Probe Endpoint | Purpose | SLA Benchmark |
| :--- | :--- | :--- |
| `GET /api/live` | Kubernetes Liveness Probe | Responds `HTTP 200` with uptime |
| `GET /api/health` | Kubernetes Readiness Probe | Validates MongoDB pool connection & RSS memory |
| `GET /metrics` | Prometheus Metrics Scraper | CoreOS PrometheusRule compatible metrics |
| `GET /api/ping` | External Uptime Monitor | Fast ping response |

---

## 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| 🛡️ **Municipal Admin** | `admin@bmc.gov.in` | `password123` | Executive SITREP Briefings, Contractor Escrow Slashing, Audit Ledger, Legal Orders |
| 📋 **Ward Officer** | `officer@bmc.gov.in` | `password123` | Ward Assignment, Statutory Escalation Ladder, AI Remediation Copilot |
| 👷 **Field Worker** | `worker@bmc.gov.in` | `password123` | TSP Route Optimization, 100m Geofence Unlock + Urban Canyon Exemption, Resolution Proof Upload |
| 👤 **Citizen** | `citizen@bmc.gov.in` | `password123` | QuickReport Snap & Send, Marathi/Hindi Voice Dictation, 48h Appeal Window, Karma Rewards |
