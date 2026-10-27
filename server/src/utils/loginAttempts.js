const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

const attempts = new Map();

const keyFor = (req) => {
  const ip = req.ip || 'unknown';
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${ip}:${email}`;
};

export const isLocked = (key) => {
  const entry = attempts.get(key);
  if (!entry) return false;

  if (Date.now() - entry.firstAt >= WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return entry.count >= MAX_FAILURES;
};

export const recordFailure = (key) => {
  const entry = attempts.get(key);

  if (!entry || Date.now() - entry.firstAt >= WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }

  entry.count += 1;
};

export const clearFailures = (key) => {
  attempts.delete(key);
};

export { keyFor, MAX_FAILURES };
