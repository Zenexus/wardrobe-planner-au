/**
 * Generate a design code.
 * - Starts with uppercase 'W'
 * - Remaining characters are uppercase alphanumeric (A-Z, 0-9)
 * - Default total length is 8 characters (e.g., W3K8ZQ12)
 */
export function generateDesignCode(totalLength: number = 8): string {
  const PREFIX = "W";
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const bodyLength = Math.max(0, totalLength - PREFIX.length);
  let body = "";
  for (let i = 0; i < bodyLength; i += 1) {
    const index = getSecureRandomInt(CHARSET.length);
    body += CHARSET[index];
  }
  return PREFIX + body;
}

// Prefer secure randomness when available, fallback to Math.random
function getSecureRandomInt(maxExclusive: number): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}
