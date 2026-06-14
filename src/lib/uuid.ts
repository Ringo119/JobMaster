/**
 * Generate a UUID v4.
 *
 * `crypto.randomUUID()` is only defined in a *secure context* (HTTPS or
 * localhost) and only on iOS Safari 15.4+. When the app is opened over plain
 * http on a LAN IP (e.g. testing on a tablet via `npm run dev -- --host`),
 * `crypto.randomUUID` is undefined and throws — which previously broke seeding
 * and every create operation. We therefore fall back to `crypto.getRandomValues`
 * (available in non-secure contexts) and finally to Math.random.
 */
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;

  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return (
      hex.slice(0, 4).join('') +
      '-' +
      hex.slice(4, 6).join('') +
      '-' +
      hex.slice(6, 8).join('') +
      '-' +
      hex.slice(8, 10).join('') +
      '-' +
      hex.slice(10, 16).join('')
    );
  }

  // Last resort — not cryptographically strong, but fine for local record IDs.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
