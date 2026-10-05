// @vitest-environment jsdom
import { html, LitElement, ReactiveElement } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { rendersIntoLightDom, safeDefine, tagNameOf } from './define';

describe('safeDefine', () => {
  it('defines the element when the tag is free', () => {
    class A extends HTMLElement {}
    safeDefine('x-safe-define-fresh', A);
    expect(customElements.get('x-safe-define-fresh')).toBe(A);
  });

  it('does not throw on collision and keeps the first definition', () => {
    class A extends HTMLElement {}
    class B extends HTMLElement {}
    safeDefine('x-safe-define-collision', A);
    expect(() => safeDefine('x-safe-define-collision', B)).not.toThrow();
    expect(customElements.get('x-safe-define-collision')).toBe(A);
  });
});

describe('safeDefine defer-hydration support', () => {
  // A light-DOM element like every GolemUI component, with one reactive property.
  class DeferSpecBase extends LitElement {
    static override properties = { label: {} };
    declare label: string;

    constructor() {
      super();
      this.label = 'initial';
    }

    override createRenderRoot() {
      return this;
    }

    override render() {
      return html`<span>${this.label}</span>`;
    }
  }

  // Lit renders on a microtask, a macrotask always runs after it.
  const afterLitRenderSchedule = () => new Promise((resolve) => setTimeout(resolve));

  it('renders on the usual schedule when the attribute is absent', async () => {
    safeDefine('x-defer-absent', class extends DeferSpecBase {});
    const element = document.createElement('x-defer-absent');
    document.body.appendChild(element);

    await afterLitRenderSchedule();

    expect(element.querySelector('span')?.textContent).toBe('initial');
  });

  it('holds rendering while the attribute is present and renders on removal', async () => {
    safeDefine('x-defer-held', class extends DeferSpecBase {});
    const element = document.createElement('x-defer-held') as DeferSpecBase;
    element.setAttribute('defer-hydration', '');
    document.body.appendChild(element);
    // Set while held, so the first render must already contain it.
    element.label = 'set before the removal';

    await afterLitRenderSchedule();
    expect(element.childElementCount).toBe(0);

    element.removeAttribute('defer-hydration');
    await afterLitRenderSchedule();

    expect(element.querySelector('span')?.textContent).toBe('set before the removal');
  });

  it('keeps a parsed element empty when the definition arrives after the markup', async () => {
    // The hydration flow: server markup first, the element module loads later.
    document.body.innerHTML = '<x-defer-parsed defer-hydration></x-defer-parsed>';
    safeDefine('x-defer-parsed', class extends DeferSpecBase {});
    const element = document.body.querySelector('x-defer-parsed');

    await afterLitRenderSchedule();

    expect(element?.childElementCount).toBe(0);
  });

  it('finalizes a subclass of a registered element, so its own properties work', async () => {
    class DeferSpecRegisteredBase extends DeferSpecBase {}
    safeDefine('x-defer-base', DeferSpecRegisteredBase);

    // `static properties` is only read by Lit during finalization, which the
    // `observedAttributes` override has to keep reachable for a subclass.
    class DeferSpecSubclass extends DeferSpecRegisteredBase {
      static override properties = { badge: {} };
      declare badge: string;

      override render() {
        return html`<span>${this.label}</span><b>${this.badge}</b>`;
      }
    }
    safeDefine('x-defer-sub', DeferSpecSubclass);

    expect(DeferSpecSubclass.observedAttributes).toContain('badge');
    expect(
      DeferSpecSubclass.observedAttributes.filter((a) => a === 'defer-hydration'),
    ).toHaveLength(1);

    const element = document.createElement('x-defer-sub') as DeferSpecSubclass;
    element.setAttribute('defer-hydration', '');
    document.body.appendChild(element);
    element.setAttribute('badge', 'set before the removal');

    await afterLitRenderSchedule();
    expect(element.childElementCount).toBe(0);

    element.removeAttribute('defer-hydration');
    await afterLitRenderSchedule();

    expect(element.querySelector('b')?.textContent).toBe('set before the removal');
  });
});

// Two installed versions of this package each load their own module instance. A second
// instance of this module stands in for the other install.
describe('duplicate installs of safeDefine', () => {
  const loadOtherInstall = async () => {
    vi.resetModules();
    const otherInstall = await import('./define');
    expect(otherInstall.safeDefine).not.toBe(safeDefine);
    return otherInstall;
  };

  it('shares registrations, so tagNameOf knows elements the other install registered', async () => {
    const otherInstall = await loadOtherInstall();
    class RegisteredByOtherInstall extends HTMLElement {}
    otherInstall.safeDefine('x-safe-define-other-install', RegisteredByOtherInstall);

    expect(tagNameOf(RegisteredByOtherInstall)).toBe('x-safe-define-other-install');
  });

  it('finalizes a subclass of an element the other install registered', async () => {
    const otherInstall = await loadOtherInstall();
    class CrossInstallBase extends LitElement {
      static override properties = { label: {} };
      declare label: string;
    }
    otherInstall.safeDefine('x-cross-install-base', CrossInstallBase);

    class CrossInstallSubclass extends CrossInstallBase {
      static override properties = { badge: {} };
      declare badge: string;
    }
    safeDefine('x-cross-install-sub', CrossInstallSubclass);

    expect(CrossInstallSubclass.observedAttributes).toContain('badge');
    expect(
      CrossInstallSubclass.observedAttributes.filter((a) => a === 'defer-hydration'),
    ).toHaveLength(1);
  });
});

describe('rendersIntoLightDom', () => {
  class LightElement extends LitElement {
    override createRenderRoot() {
      return this;
    }
  }
  class LightSubclass extends LightElement {}
  class ShadowElement extends LitElement {}
  class EnhancerElement extends ReactiveElement {}

  it('is true for a LitElement that renders into itself, and for its subclasses', () => {
    expect(rendersIntoLightDom(LightElement)).toBe(true);
    expect(rendersIntoLightDom(LightSubclass)).toBe(true);
  });

  it('is false for a LitElement with a shadow root and for a ReactiveElement', () => {
    expect(rendersIntoLightDom(ShadowElement)).toBe(false);
    expect(rendersIntoLightDom(EnhancerElement)).toBe(false);
  });
});
