import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { LayoutWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { LayoutWidget, WithWidget } from '@golemui/core';

type OwnWidgetProps = {
  title?: string;
};

/** A custom layout widget that shows its `title` prop and renders its children. */
@Component({
  standalone: true,
  selector: 'gui-custom-layout',
  imports: [WidgetDirective],
  providers: [LayoutWidgetAdapter],
  template: `<section [id]="widget.uid" data-cy="custom-layout">
    <h4 data-cy="custom-layout-title">{{ adapter.templateData().title }}</h4>
    @for (child of adapter.templateData().children; track child.uid) {
      <ng-container guiWidget [widget]="child" />
    }
  </section>`,
})
export class CustomLayoutComponent implements OnInit, OnDestroy, WithWidget {
  widget!: LayoutWidget;

  protected adapter: LayoutWidgetAdapter<OwnWidgetProps> = inject(LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
