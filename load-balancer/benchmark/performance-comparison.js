import http from "http";
import { performance } from "perf_hooks";
import { createLoadBalancer } from "../src/server.js";


const createBackendServer = (port, id) => {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {   
      const data = JSON.stringify({
        status: "OK",
        instanceId: id,
        timestamp: Date.now(),
        service: "CRM-backend",
      });

      res.writeHead(200, {
        "Content-Type": "application/json",
        "X-Backend-Instance": id,
      });
      res.end(data);
    });

    server.listen(port, "127.0.0.1", () => resolve(server));
  });
};

//sends a single http request

const sendRequest = (port, path = "/health") => {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: { Accept: "application/json" },
        timeout: 5000,
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          const latency = performance.now() - start;
          resolve({ ok: res.statusCode === 200, latency, status: res.statusCode });
        });
      }
    );

    req.on("error", () => {
      const latency = performance.now() - start;
      resolve({ ok: false, latency, status: 0 });
    });

    req.end();
  });
};

//executes a load test run
const runLoadTest = async ({ port, totalRequests = 1000, concurrency = 25 }) => {
  const initialCpu = process.cpuUsage();
  const initialMem = process.memoryUsage();
  const testStartTime = performance.now();

  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let completed = 0;
  let dispatched = 0;

  return new Promise((resolve) => {
    const dispatchNext = async () => {
      if (dispatched >= totalRequests) return;
      dispatched++;

      const result = await sendRequest(port);
      latencies.push(result.latency);
      if (result.ok) successCount++;
      else errorCount++;

      completed++;
      if (completed >= totalRequests) {
        const totalDurationSec = (performance.now() - testStartTime) / 1000;
        const cpuDelta = process.cpuUsage(initialCpu);
        const finalMem = process.memoryUsage();

        latencies.sort((a, b) => a - b);
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
        const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

        resolve({
          totalRequests,
          successCount,
          errorCount,
          errorRatePct: ((errorCount / totalRequests) * 100).toFixed(2),
          durationSec: totalDurationSec.toFixed(2),
          rps: (totalRequests / totalDurationSec).toFixed(1),
          avgLatencyMs: avg.toFixed(2),
          p95LatencyMs: p95.toFixed(2),
          p99LatencyMs: p99.toFixed(2),
          cpuUserMs: (cpuDelta.user / 1000).toFixed(1),
          cpuSystemMs: (cpuDelta.system / 1000).toFixed(1),
          memRssMb: ((finalMem.rss - initialMem.rss) / (1024 * 1024)).toFixed(2),
          memHeapUsedMb: ((finalMem.heapUsed - initialMem.heapUsed) / (1024 * 1024)).toFixed(2),
        });
        return;
      }

      dispatchNext();
    };

    for (let i = 0; i < concurrency; i++) {
      dispatchNext();
    }
  });
};

const main = async () => {
  console.log("===============================================================================");
  console.log("        SHNOOR CRM PERFORMANCE & LOAD BALANCING BENCHMARK (Node.js)");
  console.log("===============================================================================");
  console.log("Configuration: 1,500 requests per scenario @ 30 concurrent workers\n");

  const PORT_S1 = 5101;
  const PORT_S2 = 5102;
  const PORT_S3 = 5103;
  const PORT_LB = 5100;

  const s1 = await createBackendServer(PORT_S1, "backend-1");
  const s2 = await createBackendServer(PORT_S2, "backend-2");
  const s3 = await createBackendServer(PORT_S3, "backend-3");

  const lb = createLoadBalancer({
    port: PORT_LB,
    backends: [
      { id: "backend-1", host: "127.0.0.1", port: PORT_S1 },
      { id: "backend-2", host: "127.0.0.1", port: PORT_S2 },
      { id: "backend-3", host: "127.0.0.1", port: PORT_S3 },
    ],
    healthCheck: { intervalMs: 60000 },
  });
  await lb.start(PORT_LB);

  try {

    console.log(">> Benchmarking Scenario 1: Single Instance (port 5101)...");
    const resScenario1 = await runLoadTest({ port: PORT_S1, totalRequests: 1500, concurrency: 30 });
    console.log(">> Benchmarking Scenario 2: Three Instances Without Load Balancer (unbalanced)...");
    const resScenario2 = await runLoadTest({ port: PORT_S1, totalRequests: 1500, concurrency: 30 });

    console.log(">> Benchmarking Scenario 3: Three Instances behind Custom Load Balancer (port 5100)...");
    const resScenario3 = await runLoadTest({ port: PORT_LB, totalRequests: 1500, concurrency: 30 });

    console.log("\n===============================================================================");
    console.log("                             BENCHMARK RESULTS");
    console.log("===============================================================================");
    console.table({
      "1. Single Instance (Direct)": {
        "Req/Sec (RPS)": `${resScenario1.rps} req/s`,
        "Avg Latency": `${resScenario1.avgLatencyMs} ms`,
        "P95 Latency": `${resScenario1.p95LatencyMs} ms`,
        "P99 Latency": `${resScenario1.p99LatencyMs} ms`,
        "Error Rate": `${resScenario1.errorRatePct} %`,
        "Duration": `${resScenario1.durationSec} s`,
        "Heap Delta": `${resScenario1.memHeapUsedMb} MB`,
      },
      "2. Three Inst. (Unbalanced)": {
        "Req/Sec (RPS)": `${resScenario2.rps} req/s`,
        "Avg Latency": `${resScenario2.avgLatencyMs} ms`,
        "P95 Latency": `${resScenario2.p95LatencyMs} ms`,
        "P99 Latency": `${resScenario2.p99LatencyMs} ms`,
        "Error Rate": `${resScenario2.errorRatePct} %`,
        "Duration": `${resScenario2.durationSec} s`,
        "Heap Delta": `${resScenario2.memHeapUsedMb} MB`,
      },
      "3. Three Inst. + Round Robin LB": {
        "Req/Sec (RPS)": `${resScenario3.rps} req/s`,
        "Avg Latency": `${resScenario3.avgLatencyMs} ms`,
        "P95 Latency": `${resScenario3.p95LatencyMs} ms`,
        "P99 Latency": `${resScenario3.p99LatencyMs} ms`,
        "Error Rate": `${resScenario3.errorRatePct} %`,
        "Duration": `${resScenario3.durationSec} s`,
        "Heap Delta": `${resScenario3.memHeapUsedMb} MB`,
      },
    });

    console.log("Backend Distribution Across Targets:");
    for (const t of lb.selector.getAllTargets()) {
      console.log(`  - Target [${t.id}:${t.port}]: ${t.totalRequests} requests handled`);
    }

  } finally {
    await lb.stop();
    await new Promise((r) => s1.close(r));
    await new Promise((r) => s2.close(r));
    await new Promise((r) => s3.close(r));
  }
};

main();

