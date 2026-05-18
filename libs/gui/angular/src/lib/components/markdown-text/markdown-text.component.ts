import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type MarkdownTextProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-markdown-text-display',
  imports: [CommonModule],
  providers: [Angular.DisplayWidgetAdapter],
  templateUrl: './markdown-text.component.html',
  host: {
    class: 'gui-markdown-text gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MarkdownTextComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.DisplayWidget;

  protected adapter: Angular.DisplayWidgetAdapter<MarkdownTextProps> = inject(
    Angular.DisplayWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
