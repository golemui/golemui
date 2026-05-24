import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import { type TagsProps } from '@golemui/gui-shared';
import '@golemui/gui-components/tags';

@Component({
  standalone: true,
  selector: 'gui-tags-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './tags.component.html',
  host: {
    class: 'gui-tags gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TagsComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string[]>;
  protected adapter: InputWidgetAdapter<string[], TagsProps> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value as string[];
    this.adapter.valueChanged(value);
  }
}
