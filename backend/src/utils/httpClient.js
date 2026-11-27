/**
 * Resilient HTTP fetch wrapper with AbortController timeout, exponential backoff,
 * and circuit-breaker state to avoid blocking UI requests during upstream outages.
 */
export class CircuitBreaker {
  constructor({ failureThreshold = 2, cooldownMs = 60_000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.openUntil = 0;
  }

  isOpen() {
    if (Date.now() < this.openUntil) return true;
    if (this.openUntil && Date.now() >= this.openUntil) {
      this.openUntil = 0;
      this.failures = 0;
    }
    return false;
  }

  recordSuccess() {
    this.failures = 0;
    this.openUntil = 0;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openUntil = Date.now() + this.cooldownMs;
    }
  }
}

export async function fetchJsonWithRetry(
  url,
  { timeoutMs = 2800, retries = 1, backoffMs = 250, headers = {}, breaker = null } = {}
) {
  if (breaker?.isOpen()) {
    throw new Error(`Circuit open for ${new URL(url).hostname}`);
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
      }
      const json = await response.json();
      breaker?.recordSuccess();
      return json;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  breaker?.recordFailure();
  throw lastError;
}
