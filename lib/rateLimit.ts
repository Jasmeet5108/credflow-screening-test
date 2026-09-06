type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const requests = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export function checkRateLimit(apiKey: string) {
  const now = Date.now();
  const existing = requests.get(apiKey);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    requests.set(apiKey, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
  };
}
