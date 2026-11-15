import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { npmTagForVersion, parseReleaseType, versionMatchesReleaseType } from './release-rules';

describe('parseReleaseType', () => {
  it('returns each of the four release types', () => {
    assert.equal(parseReleaseType('alpha'), 'alpha');
    assert.equal(parseReleaseType('beta'), 'beta');
    assert.equal(parseReleaseType('rc'), 'rc');
    assert.equal(parseReleaseType('stable'), 'stable');
  });

  it('throws for a value that is not a release type', () => {
    assert.throws(() => parseReleaseType('apha'), /Unknown release type "apha"/);
    assert.throws(() => parseReleaseType('Stable'), /Unknown release type "Stable"/);
  });

  it('throws when the value is missing', () => {
    assert.throws(() => parseReleaseType(undefined), /Unknown release type ""/);
    assert.throws(() => parseReleaseType(''), /Unknown release type ""/);
  });
});

describe('versionMatchesReleaseType', () => {
  it('accepts a version with the pre-release name of its type', () => {
    assert.equal(versionMatchesReleaseType('2.0.0-alpha.0', 'alpha'), true);
    assert.equal(versionMatchesReleaseType('2.0.0-beta.12', 'beta'), true);
    assert.equal(versionMatchesReleaseType('1.2.1-rc.0', 'rc'), true);
    assert.equal(versionMatchesReleaseType('1.2.1', 'stable'), true);
  });

  it('rejects a pre-release version for a stable release', () => {
    assert.equal(versionMatchesReleaseType('1.2.1-rc.0', 'stable'), false);
  });

  it('rejects a stable version for a pre-release type', () => {
    assert.equal(versionMatchesReleaseType('1.2.1', 'rc'), false);
  });

  it('rejects the pre-release name of another type', () => {
    assert.equal(versionMatchesReleaseType('2.0.0-alpha.0', 'beta'), false);
    assert.equal(versionMatchesReleaseType('2.0.0-rc.0', 'alpha'), false);
  });

  it('throws for a text that is not a version', () => {
    assert.throws(() => versionMatchesReleaseType('next', 'stable'), /Cannot read the version/);
  });
});

describe('npmTagForVersion', () => {
  const tagsOf1x = ['v1.1.2', 'v1.2.0-rc.0', 'v1.2.0-rc.1', 'v1.2.0'];

  describe('while no higher major exists', () => {
    it('gives latest to a stable version', () => {
      assert.equal(npmTagForVersion('1.2.1', tagsOf1x), 'latest');
    });

    it('gives next to an alpha, a beta and a release candidate', () => {
      assert.equal(npmTagForVersion('1.2.1-alpha.0', tagsOf1x), 'next');
      assert.equal(npmTagForVersion('1.2.1-beta.0', tagsOf1x), 'next');
      assert.equal(npmTagForVersion('1.2.1-rc.0', tagsOf1x), 'next');
    });

    it('gives next to the first pre-release of a new major', () => {
      assert.equal(npmTagForVersion('2.0.0-alpha.0', tagsOf1x), 'next');
    });

    it('gives latest to the first stable version of a new major', () => {
      assert.equal(npmTagForVersion('2.0.0', [...tagsOf1x, 'v2.0.0-rc.0']), 'latest');
    });

    it('gives latest and next when no version exists yet', () => {
      assert.equal(npmTagForVersion('1.0.0', []), 'latest');
      assert.equal(npmTagForVersion('1.0.0-rc.0', []), 'next');
    });
  });

  describe('while a higher major has only pre-releases', () => {
    const tags = [...tagsOf1x, 'v2.0.0-alpha.0', 'v2.0.0-beta.1'];

    it('still gives latest to a stable version of the older major', () => {
      assert.equal(npmTagForVersion('1.2.2', tags), 'latest');
    });

    it('gives a pre-release of the older major a next tag with its major', () => {
      assert.equal(npmTagForVersion('1.2.2-rc.0', tags), 'next-1');
    });

    it('gives next to a pre-release of the higher major', () => {
      assert.equal(npmTagForVersion('2.0.0-beta.2', tags), 'next');
    });
  });

  describe('after a stable version of a higher major exists', () => {
    const tags = [...tagsOf1x, 'v2.0.0-rc.0', 'v2.0.0'];

    it('gives a stable version of the older major a latest tag with its major', () => {
      assert.equal(npmTagForVersion('1.2.3', tags), 'latest-1');
    });

    it('gives a pre-release of the older major a next tag with its major', () => {
      assert.equal(npmTagForVersion('1.2.3-rc.0', tags), 'next-1');
    });

    it('gives latest and next to the higher major', () => {
      assert.equal(npmTagForVersion('2.0.1', tags), 'latest');
      assert.equal(npmTagForVersion('2.1.0-rc.0', tags), 'next');
    });
  });

  it('reads versions with and without the v prefix', () => {
    assert.equal(npmTagForVersion('1.2.3', ['1.2.2', '2.0.0']), 'latest-1');
    assert.equal(npmTagForVersion('v1.2.3', ['v1.2.2', 'v2.0.0']), 'latest-1');
  });

  it('ignores a tag that is not a version', () => {
    assert.equal(
      npmTagForVersion('1.2.1', [...tagsOf1x, 'nightly', 'v9', 'release-9.0.0']),
      'latest',
    );
  });

  it('throws for a version that it cannot read', () => {
    assert.throws(() => npmTagForVersion('latest', tagsOf1x), /Cannot read the version/);
  });

  describe('the order of the versions of one major', () => {
    it('accepts a beta after the alphas, a release candidate after the betas, and the stable version after them', () => {
      const alphas = ['v2.0.0-alpha.0', 'v2.0.0-alpha.3'];
      const betas = [...alphas, 'v2.0.0-beta.0', 'v2.0.0-beta.1'];
      const releaseCandidates = [...betas, 'v2.0.0-rc.0'];
      assert.equal(npmTagForVersion('2.0.0-beta.0', alphas), 'next');
      assert.equal(npmTagForVersion('2.0.0-rc.0', betas), 'next');
      assert.equal(npmTagForVersion('2.0.0', releaseCandidates), 'latest');
    });

    it('compares the counter of a pre-release as a number', () => {
      assert.equal(npmTagForVersion('1.2.1-rc.10', ['v1.2.0', 'v1.2.1-rc.9']), 'next');
    });

    it('throws for an alpha after a beta of the same version', () => {
      assert.throws(
        () => npmTagForVersion('2.0.0-alpha.4', ['v2.0.0-alpha.3', 'v2.0.0-beta.0']),
        /not higher than the existing version v2\.0\.0-beta\.0/,
      );
    });

    it('throws for a pre-release of a version that has a release candidate of a later type', () => {
      assert.throws(
        () => npmTagForVersion('1.2.1-alpha.0', ['v1.2.0', 'v1.2.1-rc.0']),
        /not higher than the existing version v1\.2\.1-rc\.0/,
      );
    });

    it('throws for a pre-release of a version that is stable already', () => {
      assert.throws(
        () => npmTagForVersion('1.2.0-rc.3', tagsOf1x),
        /not higher than the existing version v1\.2\.0/,
      );
    });

    it('throws for a stable version that is lower than a stable version of the same major', () => {
      assert.throws(
        () => npmTagForVersion('1.1.3', tagsOf1x),
        /not higher than the existing version v1\.2\.0-rc\.0/,
      );
    });

    it('throws for a version that exists already', () => {
      assert.throws(
        () => npmTagForVersion('1.2.0', tagsOf1x),
        /not higher than the existing version v1\.2\.0/,
      );
    });

    it('does not compare with the versions of another major', () => {
      assert.equal(npmTagForVersion('1.2.1', [...tagsOf1x, 'v0.9.9', 'v2.4.0']), 'latest-1');
    });
  });
});
