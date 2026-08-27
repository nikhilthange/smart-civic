# Smart Civic Platform: Production Operations Manual & Incident Runbooks

**Document Version**: 1.0.0  
**Target Audience**: Site Reliability Engineers, DevOps Engineers, System Administrators, Incident Commanders  
**Platform Namespace**: `smart-civic`

---

## 1. Standard Operating Procedures (SOPs)

### SOP-01: Deploying Production Updates & Manifest Rollouts
To deploy or update declarative workloads in the cluster:
```bash
# Execute the automated deployment runner
./scripts/deploy-k8s.sh
```
**Verification Checklist**:
1. Check pod status: `kubectl get pods -n smart-civic`
2. Confirm rollout convergence: `kubectl rollout status deployment/smart-civic-backend -n smart-civic`
3. Verify zero restarts on all replicas.

---

### SOP-02: Performing Database Backups & Restores
#### Automated Backup Execution:
```bash
# Run manual on-demand backup
./scripts/backup_cluster_data.sh
```
Backups are archived in `/var/backups/smart-civic` with SHA-256 manifests (`backup_YYYYMMDD_HHMMSS.sha256`) and AES-256 encryption.

#### Disaster Recovery Restore Procedure:
1. Identify the target archive: `ls -lt /var/backups/smart-civic/mongo_backup_*.archive.gz`
2. Verify archive SHA-256 checksum against manifest:
   ```bash
   sha256sum -c backup_YYYYMMDD_HHMMSS.sha256
   ```
3. Decrypt archive (if encrypted):
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -in mongo_backup_*.archive.gz.enc -out mongo_backup_restored.archive.gz -pass pass:"$BACKUP_ENCRYPTION_KEY"
   ```
4. Restore into MongoDB instance:
   ```bash
   mongorestore --uri="$MONGODB_URI" --archive=mongo_backup_restored.archive.gz --gzip --drop
   ```
5. Execute DR parity audit drill:
   ```bash
   node server/scripts/test_disaster_recovery_restore.js
   ```

---

### SOP-03: Conducting Daily SRE Health Checks
To perform a complete cluster and service mesh diagnostic:
```bash
node server/scripts/daily_sre_health_check.js
```
**Subsystems Audited**:
- MongoDB connection pool & ping latency (<50ms).
- Redis key-value cache and pub/sub engine.
- API service health (`/api/health` and `/api/live`).
- Socket.IO WebSocket gateway connectivity.
- Background worker queue throughput.

---

## 2. Production Incident Runbooks

### Runbook 1: `DatabaseDown` (Severity: CRITICAL)
- **PromQL Alert Expression**: `mongodb_connection_status == 0` for `30s`
- **Symptom**: Pods degrade to HTTP 503 and automatically detach from Ingress service endpoints.
- **Triage Steps**:
  1. Check MongoDB pod status: `kubectl get pods -n smart-civic -l app.kubernetes.io/name=mongodb`
  2. Inspect backend logs for connection pool exhaustion:
     ```bash
     kubectl logs -n smart-civic -l app.kubernetes.io/name=smart-civic-backend --tail=100
     ```
  3. Verify database connectivity: `node server/scripts/test_db_disconnect_chaos_drill.js`
  4. If database crashed, trigger failover or restore from snapshot via SOP-02.

---

### Runbook 2: `HighLatencyP95Breach` (Severity: WARNING)
- **PromQL Alert Expression**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.25` for `2m`
- **Symptom**: API response time exceeded 250ms SLA over 5-minute rolling window.
- **Triage Steps**:
  1. Check Horizontal Pod Autoscaler status: `kubectl get hpa -n smart-civic`
  2. Inspect CPU/Memory utilization in Grafana: `smart-civic-production-overview` dashboard.
  3. Verify Redis cache hit ratio; check if queries are hitting unindexed Mongo collections.
  4. Run load benchmark to isolate slow routes:
     ```bash
     node server/scripts/test_surge_benchmark.js
     ```

---

### Runbook 3: `ContractorEscrowDeficitSurge` (Severity: WARNING)
- **PromQL Alert Expression**: `increase(smart_civic_escrow_deficit_penalties_total[1h]) > 50000` for `5m`
- **Symptom**: Contractor penalty deficit surge exceeding ₹50,000 in a 1-hour window.
- **Triage Steps**:
  1. Query active contractor deficits:
     ```bash
     node server/scripts/test_sla_escrow_deficit_smoke.js
     ```
  2. Check for contractor SLA breach clusters in specific municipal wards.
  3. Dispatch automated notice to Municipal Commissioner and freeze contractor bidding eligibility until escrow balance is replenished.

---

### Runbook 4: `PodCrashLooping` (Severity: CRITICAL)
- **PromQL Alert Expression**: `rate(kube_pod_container_status_restarts_total{namespace="smart-civic"}[15m]) > 0` for `5m`
- **Symptom**: Container repeatedly terminating and restarting.
- **Triage Steps**:
  1. Identify crashing pods: `kubectl get pods -n smart-civic | grep -E "CrashLoop|Error"`
  2. Inspect previous container logs:
     ```bash
     kubectl logs -n smart-civic <pod-name> --previous
     ```
  3. Inspect termination reason: `kubectl describe pod -n smart-civic <pod-name>`
  4. Validate all Kubernetes manifests against schema:
     ```bash
     node server/scripts/test_k8s_manifest_validation.js
     ```
