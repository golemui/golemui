// Pure helpers behind `gui-file-upload` / `gui-multi-file-upload`. Kept out
// of the component so they can be unit-tested without a custom element.

/** Rounds a progress value into 0..100; anything non-finite reads as 0. */
export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * A synthetic `FileItem.id`. `crypto.randomUUID` is missing on non-secure
 * (http) origins, so a time + random fallback keeps uploads working there.
 */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return `f_${c.randomUUID()}`;
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** The human-readable text of a rejection, or `fallback` when there is none. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

/**
 * Manual `accept` matching: `.ext`, an exact MIME type, or a `type/*`
 * wildcard. The input's own `accept` attribute is only a picker hint and drag
 * & drop bypasses it entirely.
 */
export function matchesAccept(file: File, accept: string[]): boolean {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return accept.some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule === '*/*' || rule === '*') return true;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}
