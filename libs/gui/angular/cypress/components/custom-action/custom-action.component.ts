import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';

/** A custom action widget: a native button that sends the click of the widget. */
@Component({
  standalone: true,
  selector: 'gui-custom-action',
  providers: [ActionWidgetAdapter],
  template: `<button [id]="widget.uid" type="button" data-cy="custom-action" (click)="onClick()">
    {{ adapter.templateData().label }}
  </button>`,
})
export class CustomActionComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;

  protected adapter: ActionWidgetAdapter<{ label?: string }> = inject(ActionWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onClick() {
    this.adapter.click();
  }
}
