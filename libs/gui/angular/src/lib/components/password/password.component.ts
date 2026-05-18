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
import { type PasswordProps } from '@golemui/gui-shared';
import '@golemui/gui-components/password';

@Component({
  standalone: true,
  selector: 'gui-password-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './password.component.html',
  host: {
    class: 'gui-password gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PasswordComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, PasswordProps> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
