import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { AlertProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/alert';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-alert-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './alert.component.html',
  host: {
    class: 'gui-alert gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AlertComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<AlertProps> = inject(DisplayWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
