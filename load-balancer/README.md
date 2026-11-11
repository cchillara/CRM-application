# SHNOOR CRM - Custom Node.js Round Robin Load Balancer

A production-grade, application-level HTTP Load Balancer built purely with native Node.js (no Nginx, HAProxy, Docker, or external proxy binaries).

## Architecture

```
React Client Admin (5173) + Super Admin
                  |
                  v
       Node.js Load Balancer
             Port 5000
                  |
            Round Robin
                  |
     +------------+------------+
     |            |            |
     v            v            v
  Backend 1    Backend 2    Backend 3
  Port 5001    Port 5002    Port 5003
     |            |            |
     +------------+------------+
                  |
                  v
       Shared PostgreSQL + Firebase
```

## Features

1. **Round Robin Algorithm**: Sequential index distribution across active backends. Event-loop-safe, atomic selection.
2. **Health Monitoring & Auto-Failover**:
   - Active periodic background probes to `GET /health`.
   - Configurable failure threshold (`unhealthyThreshold: 2`) and recovery threshold (`healthyThreshold: 1`).
   - Dynamically removes unhealthy instances from rotation.
   - Automatically restores recovered instances without service interruption.
   - Returns clean HTTP `503 Service Unavailable` if all backend instances fail.
3. **Safe Request Proxying**:
   - Preserves HTTP methods, paths, and raw query parameters.
   - Safe header forwarding: adds `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-Port`.
   - Strips hop-by-hop headers (`connection`, `keep-alive`, `transfer-encoding`, etc.).
   - Full streaming support for JSON, multipart form data, file uploads, and chunked response streaming.
   - Preserves `X-Request-ID` or generates a standard UUIDv4.
   - Forwards `Authorization` Bearer tokens without mutation or leakage.
   - Handles client disconnections (`res.on("close")`) and upstream timeouts (`504 Gateway Timeout`).
   - Does NOT retry non-idempotent operations (POST, PUT, DELETE) blindly.
4. **Internal Management Endpoints**:
   - `GET /lb-status`: Real-time health statistics, latency, and request distribution per backend.
   - `GET /lb-health`: 200 OK if healthy backends are available, 503 if all are down.

## Quick Start Instructions

### 1. Start the 3 Backend Instances
From `CRM-application/backend`:

```bash
# Start all 3 backend instances (Ports 5001, 5002, 5003) concurrently
npm run start:cluster
```

Or start each instance independently in separate terminals:
```bash
# Terminal 1 (Instance 1)
PORT=5001 INSTANCE_ID=backend-1 node src/index.js

# Terminal 2 (Instance 2)
PORT=5002 INSTANCE_ID=backend-2 node src/index.js

# Terminal 3 (Instance 3)
PORT=5003 INSTANCE_ID=backend-3 node src/index.js
```

### 2. Start the Load Balancer (Port 5000)
From `CRM-application/load-balancer`:

```bash
node src/index.js
```

The load balancer is now running on port `5000` and directing traffic to `5001`, `5002`, and `5003`.

### 3. Graceful Shutdown
Send `SIGINT` (Ctrl+C) or `SIGTERM` to either the load balancer or the cluster manager. Both cleanly finish pending connections and exit.

## Running Tests

### Automated Unit and Integration Tests
```bash
# From workspace root
node CRM-application/backend/node_modules/vitest/vitest.mjs run --dir CRM-application/load-balancer/tests

# Run existing CRM backend tests
npm --prefix CRM-application/backend test
```

### Performance & Load Benchmark
```bash
node CRM-application/load-balancer/benchmark/performance-comparison.js
```

