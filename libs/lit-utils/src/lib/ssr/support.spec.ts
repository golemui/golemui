import { LitElement } from 'lit';
import { beforeAll, describe, expect, it } from 'vitest';
import { safeDefine } from '../define';
import { installLitSsrSupport } from './support';

class RegisteredBeforeInstall extends LitElement {}
class RegisteredAfterInstall extends LitElement {}
class NeverRegistered extends LitElement {}

describe('installLitSsrSupport element shim scope', () => {
  beforeAll(() => {
    safeDefine('x-shim-before-install', RegisteredBeforeInstall);
    installLitSsrSupport();
    safeDefine('x-shim-after-install', RegisteredAfterInstall);
  });

  it('defines the query methods on a class registered before the install', () => {
    const element = new RegisteredBeforeInstall() as unknown as Element;
    expect(element.querySelector('input')).toBeNull();
    expect(element.querySelectorAll('input')).toHaveLength(0);
  });

  it('defines the query methods on a class registered after the install', () => {
    const element = new RegisteredAfterInstall() as unknown as Element;
    expect(element.querySelector('input')).toBeNull();
    expect(element.querySelectorAll('input')).toHaveLength(0);
  });

  it('does not define the query methods on a Lit element that safeDefine never registered', () => {
    expect('querySelector' in NeverRegistered.prototype).toBe(false);
    expect('querySelectorAll' in NeverRegistered.prototype).toBe(false);
  });

  it('installs classList on the prototype shared with every Lit element in the process', () => {
    expect('classList' in NeverRegistered.prototype).toBe(true);
  });
});
