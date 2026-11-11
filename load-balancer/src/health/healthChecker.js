import http from "http";
import EventEmitter from "events";
import logger from "../logger/logger.js";

/**
 * HealthChecker monitors backend instance health via periodic HTTP probes.
 */
export class HealthChecker extends EventEmitter {
  constructor(selector, config = {}) {
    super();
    this.selector = selector;
    this.path = config.path || "/health";
    this.intervalMs = config.intervalMs || 5000;
    this.timeoutMs = config.timeoutMs || 2000;
    this.unhealthyThreshold = config.unhealthyThreshold || 2;
    this.healthyThreshold = config.healthyThreshold || 1;

    this.timer = null;
    this.isRunning = false;
    this.isChecking = false;
  }

  /**
   * Starts periodic health monitoring.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run an immediate check on startup
    this.checkAll();

    this.timer = setInterval(() => {
      this.checkAll();
    }, this.intervalMs);

    // Allow process to exit cleanly if only health checker timer is pending
    if (this.timer.unref) {
      this.timer.unref();
    }

    logger.info("Health monitoring started", {
      path: this.path,
      intervalMs: this.intervalMs,
      timeoutMs: this.timeoutMs,
      unhealthyThreshold: this.unhealthyThreshold,
      healthyThreshold: this.healthyThreshold,
    });
  }

  /**
   * Stops periodic health monitoring.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info("Health monitoring stopped");
  }

  /**
   * Probes all targets concurrently.
   */
  async checkAll() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const targets = this.selector.getAllTargets();
      await Promise.all(targets.map((t) => this.checkTarget(t.id)));
      this.emit("checkComplete", this.selector.getAllTargets());
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Probes a single backend target.
   */
  async checkTarget(targetId) {
    const target = this.selector.getTargetById(targetId);
    if (!target) return null;

    const startTime = Date.now();

    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: target.host,
          port: target.port,
          path: this.path,
          method: "GET",
          timeout: this.timeoutMs,
          headers: {
            "User-Agent": "SHNOOR-CRM-LoadBalancer-HealthChecker/1.0",
            Accept: "application/json",
          },
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });

          res.on("end", () => {
            const latencyMs = Date.now() - startTime;
            const isOk = res.statusCode >= 200 && res.statusCode < 400;

            if (isOk) {
              this.handleSuccess(target, res.statusCode, latencyMs);
            } else {
              this.handleFailure(
                target,
                new Error(`HTTP status ${res.statusCode}`),
                res.statusCode,
                latencyMs
              );
            }
            resolve(target);
          });
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error(`Health check timed out after ${this.timeoutMs}ms`));
      });

      req.on("error", (err) => {
        const latencyMs = Date.now() - startTime;
        this.handleFailure(target, err, 0, latencyMs);
        resolve(target);
      });

      req.end();
    });
  }

  /**
   * Handles a successful health probe.
   */
  handleSuccess(target, statusCode, latencyMs) {
    target.consecutiveFailures = 0;
    target.consecutiveSuccesses++;
    target.lastStatus = statusCode;
    target.lastLatencyMs = latencyMs;
    target.lastError = null;
    target.lastChecked = new Date().toISOString();

    if (!target.healthy && target.consecutiveSuccesses >= this.healthyThreshold) {
      target.healthy = true;
      logger.info(
        `Backend recovered: [${target.id}:${target.port}] restored to rotation`,
        {
          targetId: target.id,
          port: target.port,
          latencyMs,
          consecutiveSuccesses: target.consecutiveSuccesses,
        }
      );
      this.emit("targetUp", target);
    }
  }

  /**
   * Handles a failed health probe.
   */
  handleFailure(target, error, statusCode = 0, latencyMs = 0) {
    target.consecutiveSuccesses = 0;
    target.consecutiveFailures++;
    target.lastStatus = statusCode;
    target.lastLatencyMs = latencyMs;
    target.lastError = error.message;
    target.lastChecked = new Date().toISOString();

    if (target.healthy && target.consecutiveFailures >= this.unhealthyThreshold) {
      target.healthy = false;
      logger.warn(
        `Backend down: [${target.id}:${target.port}] removed from rotation`,
        {
          targetId: target.id,
          port: target.port,
          reason: error.message,
          consecutiveFailures: target.consecutiveFailures,
        }
      );
      this.emit("targetDown", target);
    }
  }

  /**
   * Returns current health overview.
   */
  getStatus() {
    return {
      active: this.isRunning,
      intervalMs: this.intervalMs,
      targets: this.selector.getAllTargets(),
    };
  }
}

export default HealthChecker;

