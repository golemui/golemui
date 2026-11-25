import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { SpinnerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/spinner';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-spinner-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './spinner.component.html',
  host: {
    class: 'gui-spinner gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SpinnerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<SpinnerProps> = inject(DisplayWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
