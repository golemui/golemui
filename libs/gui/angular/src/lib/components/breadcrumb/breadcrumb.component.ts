import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  breadcrumbLabel,
  breadcrumbTrail,
  type BreadcrumbProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/breadcrumb';
import { deferHydrationAttr } from '../../utils/defer-hydration';

/**
 * The breadcrumb action widget: a trail to the current page, with `gui-breadcrumb`. Picking a
 * step emits the widget's `click` event with `{ value }` as its detail.
 */
@Component({
  standalone: true,
  selector: 'gui-breadcrumb-interactive',
  providers: [ActionWidgetAdapter],
  templateUrl: './breadcrumb.component.html',
  host: {
    class: 'gui-breadcrumb gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BreadcrumbComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<BreadcrumbProps> = inject(ActionWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly breadcrumbLabel = breadcrumbLabel;
  protected readonly breadcrumbTrail = breadcrumbTrail;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onAction(event: Event) {
    const { detail } = event as CustomEvent<GuiActionEventDetail>;
    this.adapter.click({ value: detail.value });
  }
}
