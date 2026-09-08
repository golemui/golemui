/**
 * WebMCP tool names: 1 to 128 ASCII alphanumerics, `_`, `-` or `.`. The base name gets 100 so
 * the `-submit` suffix and a collision suffix always fit.
 */
const BASE_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const TOOL_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

export function assertBaseName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || !BASE_NAME_PATTERN.test(name)) {
    throw new TypeError(
      `[GolemUI webmcp] "name" must be 1 to 100 characters of A-Z, a-z, 0-9, "_", "-" or "." (got ${JSON.stringify(name)}).`,
    );
  }
}

export function assertToolName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || !TOOL_NAME_PATTERN.test(name)) {
    throw new TypeError(
      `[GolemUI webmcp] a tool name must be 1 to 128 characters of A-Z, a-z, 0-9, "_", "-" or "." (got ${JSON.stringify(name)}).`,
    );
  }
}

/** The base names currently claimed by live plugins in this page. */
const claimedNames = new Set<string>();

export type NameClaim = { name: string; release(): void };

/**
 * Claims a base name for the lifetime of one plugin attachment. Two forms on one page that
 * share a name would both fail to register (a context rejects duplicate tool names), so the
 * second one gets a numeric suffix and a warning instead.
 */
export function claimBaseName(requested: string): NameClaim {
  let name = requested;
  for (let attempt = 2; claimedNames.has(name); attempt += 1) {
    name = `${requested}-${attempt}`;
  }
  if (name !== requested) {
    console.warn(
      `[GolemUI webmcp] Another form already uses the name "${requested}"; this one registers as "${name}". Give each form its own name.`,
    );
  }
  claimedNames.add(name);
  return {
    name,
    release: () => {
      claimedNames.delete(name);
    },
  };
}
