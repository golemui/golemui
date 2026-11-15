/** The release types that the release workflow offers. */
export const RELEASE_TYPES = ['alpha', 'beta', 'rc', 'stable'] as const;

/** One of the release types: a pre-release name (`alpha`, `beta`, `rc`) or `stable`. */
export type ReleaseType = (typeof RELEASE_TYPES)[number];

interface ParsedVersion {
  /** The version as it was given, for example `v1.2.1-rc.0`. Used in error messages. */
  text: string;
  major: number;
  minor: number;
  patch: number;
  /** The parts of the pre-release, for example `['rc', '0']`. Empty for a stable version. */
  prerelease: string[];
}

/**
 * Reads the release type from the value of the `RELEASE_TYPE` environment variable.
 *
 * @param value - The value of the variable.
 * @returns The release type.
 * @throws When the value is missing or is not one of {@link RELEASE_TYPES}. A fallback to
 * `stable` would publish a misspelled pre-release type as a stable version.
 */
export function parseReleaseType(value: string | undefined): ReleaseType {
  const releaseType = RELEASE_TYPES.find((candidate) => candidate === value);
  if (!releaseType) {
    throw new Error(
      `Unknown release type "${value ?? ''}". Set RELEASE_TYPE to one of: ${RELEASE_TYPES.join(', ')}.`,
    );
  }
  return releaseType;
}

/**
 * Reads a version or a version tag. Returns null for a text that is not one, so that a git tag
 * with another purpose is ignored.
 */
function parseVersion(version: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(version);
  if (!match) {
    return null;
  }
  return {
    text: version,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] === undefined ? [] : match[4].split('.'),
  };
}

function parseVersionOrThrow(version: string): ParsedVersion {
  const parsed = parseVersion(version);
  if (!parsed) {
    throw new Error(`Cannot read the version "${version}".`);
  }
  return parsed;
}

/** The order of two parts of a pre-release, by the rules of semantic versioning. */
function comparePrereleaseParts(first: string, second: string): number {
  const firstIsNumber = /^\d+$/.test(first);
  const secondIsNumber = /^\d+$/.test(second);
  if (firstIsNumber && secondIsNumber) {
    return Number(first) - Number(second);
  }
  // A number is lower than a name.
  if (firstIsNumber !== secondIsNumber) {
    return firstIsNumber ? -1 : 1;
  }
  if (first === second) {
    return 0;
  }
  return first < second ? -1 : 1;
}

/**
 * The order of two versions, by the rules of semantic versioning: negative when the first is
 * lower, zero when they are equal, positive when the first is higher.
 */
function compareVersions(first: ParsedVersion, second: ParsedVersion): number {
  if (first.major !== second.major) {
    return first.major - second.major;
  }
  if (first.minor !== second.minor) {
    return first.minor - second.minor;
  }
  if (first.patch !== second.patch) {
    return first.patch - second.patch;
  }
  // A stable version is higher than its pre-releases.
  if (first.prerelease.length === 0 || second.prerelease.length === 0) {
    return second.prerelease.length - first.prerelease.length;
  }
  const sharedLength = Math.min(first.prerelease.length, second.prerelease.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const difference = comparePrereleaseParts(first.prerelease[index], second.prerelease[index]);
    if (difference !== 0) {
      return difference;
    }
  }
  return first.prerelease.length - second.prerelease.length;
}

/**
 * Checks that the computed version has the shape of the requested release type: no pre-release
 * part for `stable`, and the pre-release name of the type for the other types.
 *
 * @param version - The version that the release computed, for example `2.0.0-alpha.0`.
 * @param releaseType - The requested release type.
 * @returns True when the version belongs to the release type.
 * @example
 * versionMatchesReleaseType('1.2.1-rc.0', 'rc'); // true
 * versionMatchesReleaseType('1.2.1-rc.0', 'stable'); // false
 */
export function versionMatchesReleaseType(version: string, releaseType: ReleaseType): boolean {
  const { prerelease } = parseVersionOrThrow(version);
  if (releaseType === 'stable') {
    return prerelease.length === 0;
  }
  return prerelease[0] === releaseType;
}

/**
 * Chooses the npm dist-tag of a release.
 *
 * `npm install <package>` installs the version with the tag `latest`, and `<package>@next`
 * installs the newest pre-release. A release of an older major must not take these two tags
 * from the newer major, so it gets a tag with its major in the name.
 *
 * - A stable version gets `latest`, or `latest-<major>` when a stable version of a higher major
 *   exists.
 * - A pre-release gets `next`, or `next-<major>` when any version of a higher major exists.
 *
 * @param version - The version to publish.
 * @param existingVersions - The versions that exist already, as versions or as version tags
 * (`1.2.0` or `v1.2.0`). A text that is not a version is ignored.
 * @returns The npm dist-tag.
 * @throws When an existing version of the same major is equal to or higher than the version to
 * publish, for example an alpha after a beta of the same version. The tag would move back to an
 * older version.
 * @example
 * npmTagForVersion('1.2.1', ['v1.2.0', 'v2.0.0-beta.1']); // 'latest'
 * npmTagForVersion('1.2.2', ['v1.2.1', 'v2.0.0']); // 'latest-1'
 * npmTagForVersion('1.2.2-rc.0', ['v1.2.1', 'v2.0.0-alpha.0']); // 'next-1'
 */
export function npmTagForVersion(version: string, existingVersions: readonly string[]): string {
  const released = parseVersionOrThrow(version);
  const existing = existingVersions
    .map((existingVersion) => parseVersion(existingVersion))
    .filter((parsed): parsed is ParsedVersion => parsed !== null);

  const notLowerInSameMajor = existing.find(
    (other) => other.major === released.major && compareVersions(other, released) >= 0,
  );
  if (notLowerInSameMajor) {
    throw new Error(
      `The version ${version} is not higher than the existing version ${notLowerInSameMajor.text}. ` +
        'Its npm tag would move back to an older version, so nothing is published.',
    );
  }

  if (released.prerelease.length > 0) {
    const newerMajorExists = existing.some((other) => other.major > released.major);
    return newerMajorExists ? `next-${released.major}` : 'next';
  }

  const newerStableMajorExists = existing.some(
    (other) => other.prerelease.length === 0 && other.major > released.major,
  );
  return newerStableMajorExists ? `latest-${released.major}` : 'latest';
}
