import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { MarkdownTextProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/markdown-text';

@Component({
  standalone: true,
  selector: 'gui-markdown-text-display',
  imports: [CommonModule],
  providers: [DisplayWidgetAdapter],
  templateUrl: './markdown-text.component.html',
  host: {
    class: 'gui-markdown-text gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MarkdownTextComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<MarkdownTextProps> = inject(DisplayWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
