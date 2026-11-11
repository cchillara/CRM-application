/**
 * Round Robin Selection Algorithm for backend instance rotation.
 *
 * Implements event-loop-safe index cycling over healthy backends,
 * automatically skipping unhealthy ones.
 */
export class RoundRobinSelector {
  constructor(targets = []) {
    this.targets = targets.map((t) => ({
      id: t.id,
      host: t.host || "127.0.0.1",
      port: t.port,
      protocol: t.protocol || "http:",
      healthy: t.healthy !== undefined ? t.healthy : true,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      lastChecked: null,
      lastStatus: null,
      lastLatencyMs: null,
      lastError: null,
    }));

    this.currentIndex = 0;
  }

  /**
   * Selects the next healthy backend instance using Round Robin.
   * Returns null if no healthy instances are currently available.
   */
  getNextTarget() {
    const healthyTargets = this.targets.filter((t) => t.healthy);

    if (healthyTargets.length === 0) {
      return null;
    }

    // Single-threaded event-loop safe index advancement
    const selected = healthyTargets[this.currentIndex % healthyTargets.length];
    this.currentIndex = (this.currentIndex + 1) % healthyTargets.length;
    selected.totalRequests++;

    return selected;
  }

  /**
   * Returns all registered targets and their health status.
   */
  getAllTargets() {
    return this.targets.map((t) => ({ ...t }));
  }

  /**
   * Returns a target by ID.
   */
  getTargetById(id) {
    return this.targets.find((t) => t.id === id) || null;
  }

  /**
   * Updates health status of a specific target.
   */
  setTargetHealth(id, isHealthy, details = {}) {
    const target = this.targets.find((t) => t.id === id);
    if (!target) return null;

    target.healthy = Boolean(isHealthy);
    if (details.lastStatus !== undefined) target.lastStatus = details.lastStatus;
    if (details.lastLatencyMs !== undefined) target.lastLatencyMs = details.lastLatencyMs;
    if (details.lastError !== undefined) target.lastError = details.lastError;
    target.lastChecked = new Date().toISOString();

    return target;
  }

  /**
   * Resets selection index and counters (useful for testing).
   */
  reset() {
    this.currentIndex = 0;
    for (const t of this.targets) {
      t.totalRequests = 0;
    }
  }
}

export default RoundRobinSelector;

