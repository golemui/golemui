import { Component, input, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type FormHealth,
  type FormInitConfig,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormCoreComponent } from './components/form/form.component';
import { buildConfig, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubConfig = FormInitConfig<Type<WithWidget>>;

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const validConfig = (): StubConfig => buildConfig();

const duplicateUidConfig = (): StubConfig => ({
  ...validConfig(),
  formDef: rootLayout([
    { uid: 'same', kind: 'input', type: 'textinput', path: 'firstName' },
    { uid: 'same', kind: 'input', type: 'textinput', path: 'lastName' },
  ]),
});

const duplicateUidHealth: FormHealth = {
  status: 'errored',
  code: 21,
  message:
    '[21] Duplicate UID "same": Assigned to widget "textinput" at "firstName" and "textinput" at "lastName".',
};

/** Records the health on every check of its template. */
@Component({
  standalone: true,
  selector: 'gui-custom-boundary',
  template: `<p class="custom-health" [attr.data-status]="recordHealth().status">
    {{ errorMessage() }}
  </p>`,
})
class CustomBoundaryComponent {
  static receivedHealths: FormHealth[] = [];
  health = input.required<FormHealth>();

  protected recordHealth() {
    CustomBoundaryComponent.receivedHealths.push(this.health());
    return this.health();
  }

  protected errorMessage() {
    const health = this.health();
    return health.status === 'errored' ? health.message : '';
  }
}

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config()"
    [validators]="validators"
    [formHealthBoundary]="boundary()"
    (formHealth)="healths.push($event)"
  />`,
})
class FormHostComponent {
  config = signal<StubConfig>(validConfig());
  boundary = signal<Type<unknown> | undefined>(undefined);
  validators = noopValidators;
  healths: FormHealth[] = [];
}

let fixture: ComponentFixture<FormHostComponent>;

const mountForm = (config: StubConfig, boundary?: Type<unknown>) => {
  fixture = TestBed.createComponent(FormHostComponent);
  fixture.componentInstance.config.set(config);
  fixture.componentInstance.boundary.set(boundary);
  fixture.detectChanges();
};

const setConfig = (config: StubConfig) => {
  fixture.componentInstance.config.set(config);
  fixture.detectChanges();
};

const query = (selector: string) => fixture.nativeElement.querySelector(selector) as Element | null;

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

beforeEach(() => {
  // The errored health is logged, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  CustomBoundaryComponent.receivedHealths = [];
});

afterEach(() => {
  fixture.destroy();
  vi.restoreAllMocks();
});

describe('the health of a form with an invalid definition', () => {
  it('reports only the errored health at mount', () => {
    mountForm(duplicateUidConfig());

    expect(fixture.componentInstance.healths).toEqual([duplicateUidHealth]);
  });

  it('shows the default banner as an alert with the message', () => {
    mountForm(duplicateUidConfig());

    const banner = query('.gui-form-health-error');
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain(duplicateUidHealth.message);
  });

  it('removes the default banner when a new config has a valid definition', () => {
    mountForm(duplicateUidConfig());
    expect(query('.gui-form-health-error')).not.toBeNull();

    setConfig(validConfig());

    expect(query('.gui-form-health-error')).toBeNull();
    expect(query('input[name="firstName"]')).not.toBeNull();
    expect(fixture.componentInstance.healths.at(-1)).toEqual({ status: 'ok' });
  });
});

describe('a custom form health boundary', () => {
  it('receives the health, renders next to the form, and the form stays mounted', () => {
    mountForm(validConfig(), CustomBoundaryComponent);
    const form = query('form');
    expect(query('gui-custom-boundary')).not.toBeNull();
    expect(CustomBoundaryComponent.receivedHealths.at(-1)).toEqual({ status: 'ok' });

    setConfig(duplicateUidConfig());

    expect(CustomBoundaryComponent.receivedHealths.at(-1)).toEqual(duplicateUidHealth);
    expect(query('.custom-health')?.textContent?.trim()).toBe(duplicateUidHealth.message);
    expect(query('form')).toBe(form);
    expect(query('.gui-form-health-error')).toBeNull();
  });
});
