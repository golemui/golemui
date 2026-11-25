import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { ProgressProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/progress';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-progress-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './progress.component.html',
  host: {
    class: 'gui-progress gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProgressComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<ProgressProps> = inject(DisplayWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
