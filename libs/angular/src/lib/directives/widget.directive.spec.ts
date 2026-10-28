import { Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { type FormHealth, type FormInitConfig, type WithWidget } from '@golemui/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormCoreComponent } from '../components/form/form.component';
import { formData, formDef, noopValidators, stubWidgetLoaders } from '../ssr.fixture';

let rejectLoad: (error: Error) => void = () => undefined;

const configWithFailingWidget = (): FormInitConfig<Type<WithWidget>> => ({
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [{ kind: 'input', type: 'failing', path: 'lastName', label: 'Last name' }],
    },
  },
  widgetLoaders: {
    ...stubWidgetLoaders,
    failing: () =>
      new Promise<Type<WithWidget>>((_resolve, reject) => {
        rejectLoad = reject;
      }),
  },
  data: formData,
});

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form
    [config]="config()"
    [validators]="validators"
    (formHealth)="receivedHealths.push($event)"
  />`,
})
class HostComponent {
  config = signal(configWithFailingWidget());
  validators = noopValidators;
  receivedHealths: FormHealth[] = [];
}

describe('a widget whose load fails', () => {
  let fixture: ComponentFixture<HostComponent>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // The errored health is logged, which is expected here.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // Lets the flex layout load, so the failing widget starts its load.
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.stub-flex')).not.toBeNull();
    });
  });

  afterEach(() => {
    fixture.destroy();
    consoleError.mockRestore();
  });

  it('marks the form as errored', async () => {
    rejectLoad(new Error('network error'));

    await vi.waitFor(() =>
      expect(fixture.componentInstance.receivedHealths.at(-1)).toMatchObject({
        status: 'errored',
        code: 30,
      }),
    );
  });

  it('does not mark the form as errored after a new config replaced the widget', async () => {
    fixture.componentInstance.config.set({
      formDef,
      widgetLoaders: stubWidgetLoaders,
      data: formData,
    });
    fixture.detectChanges();
    rejectLoad(new Error('network error'));
    // Gives the rejected load time to dispatch its error.
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
    });

    const erroredHealths = fixture.componentInstance.receivedHealths.filter(
      (health) => health.status === 'errored',
    );
    expect(erroredHealths).toEqual([]);
  });
});
