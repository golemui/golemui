import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import {
  typographyClasses,
  typographyTag,
  type TypographyProps,
} from '@golemui/gui-shared/internals';

@Component({
  standalone: true,
  selector: 'gui-typography-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './typography.component.html',
  host: {
    class: 'gui-typography-field gui-field',
  },
})
export class TypographyComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<TypographyProps> = inject(DisplayWidgetAdapter);
  protected readonly typographyTag = typographyTag;
  protected readonly typographyClasses = typographyClasses;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
