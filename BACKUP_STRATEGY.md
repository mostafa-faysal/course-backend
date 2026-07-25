# Production Database Backup & Disaster Recovery Strategy

This document outlines the standard production procedures for backing up, maintaining, and recovering the PostgreSQL database (hosted on Neon PostgreSQL).

---

## 1. Cloud-Managed Backup Strategy (Neon PostgreSQL)

### **Automated Snapshots & Point-in-Time Recovery (PITR)**
- **Neon Cloud Protection:** Neon PostgreSQL continuously maintains write-ahead logs (WAL) and automated storage backups.
- **Retention Schedule:** In Pro/Enterprise tiers, continuous PITR is configured for up to 30 days, allowing reversion of database state to any specific second prior to accidental mutations or catastrophic drops.
- **Verification:** Always monitor database storage metrics and snapshot schedules from the Neon control dashboard weekly.

---

## 2. Manual Backup Strategy (`pg_dump`)

To maintain offline redundancy and prevent vendor lock-in, automated daily offline dumps must be exported and transferred to secure encrypted storage (e.g., AWS S3 or Glacier).

### **Executing a Full Database Dump**

Run the standard PostgreSQL utility against your `DIRECT_URL` (direct connection string without Neon PgBouncer/Serverless query pooling):

```bash
# Dump complete database structure and data in compressed binary custom format (-Fc)
pg_dump --dbname="postgresql://neondb_owner:YOUR_PASSWORD@your-direct-host.aws.neon.tech/neondb?sslmode=require" \
  --format=custom \
  --compress=9 \
  --file="backup_courses_$(date +%Y%m%d_%H%M%S).dump"
```

### **Schema-Only Dump (For Verification & Staging Replication)**
```bash
pg_dump --dbname="YOUR_DIRECT_DATABASE_URL" --schema-only --file="schema_only_backup.sql"
```

---

## 3. Restore Procedure (`pg_restore` and `psql`)

In the event of database migration, rollback, or provisioning a recovery server, follow these steps:

### **Step 1: Terminate Active Connections**
Ensure all running API container clusters (Docker / PM2 / Express) are gracefully offline or pointing to maintenance landing pages so no partial write-states occur during restoration.

### **Step 2: Execute `pg_restore` (For Custom Format Dumps)**
```bash
# Restore directly to a newly provisioned Neon PostgreSQL database
pg_restore --dbname="postgresql://neondb_owner:YOUR_PASSWORD@your-new-host.aws.neon.tech/neondb?sslmode=require" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  "backup_courses_20260725_120000.dump"
```

*Explanation of critical flags:*
- `--clean`: Drops existing database objects before recreating them.
- `--if-exists`: Suppresses error warnings when dropping objects that do not yet exist on fresh installations.
- `--no-owner / --no-privileges`: Avoids permission crashes if the target cloud instance uses a different administrative role name than the origin.

---

## 4. Disaster Recovery (DR) Protocol

When experiencing a critical database outage or accidental data wipe:
1. **Identify the Failure Domain:** Determine whether the incident is hardware/network degradation (Cloud issue) vs data loss/corruption (Application issue).
2. **Engage PITR if Application Corruption:** If data was modified erroneously by application software within the window, use the Neon console to roll back to timestamp `T_incident - 1 minute`.
3. **Failover Provisioning if Outage:** If primary zone is unresponsive:
   - Provision a fresh Neon PostgreSQL DB on a secondary cluster/region.
   - Run `pg_restore` with the latest automated S3 nightly `.dump` file.
   - Update `DATABASE_URL` and `DIRECT_URL` in environment secrets (Render / Railway / Docker Compose / PM2) and redeploy.
4. **Post-Recovery Verification:** 
   - Execute `GET /api/health` or `GET /health` to verify runtime database connectivity.
   - Run integration verification scripts against auth and dashboard endpoints.
