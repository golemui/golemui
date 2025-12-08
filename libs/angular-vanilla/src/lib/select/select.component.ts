import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import {
  createOptionMapper,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  OptionValue,
  SelectProps,
} from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-select',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './select.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'gui-select',
  },
})
export class SelectComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, SelectProps> = inject(
    Angular.ControlFieldAdapter,
  );
  protected optionsLoading = false;
  protected hasMatchingValue = false;

  constructor() {
    effect(() => {
      const opts = this.adapter.templateData().options;
      if (Array.isArray(opts) && opts.length > 0) {
        if (isOption(opts[0])) {
          // nothing to do
        } else if (isOptionValue(opts[0])) {
          this.adapter.templateData.update((current) => ({
            ...current,
            options: (current.options as unknown as OptionValue[]).map((opt) => ({
              label: opt.toString(),
              value: opt,
            })),
          }));
        } else if (isProtoOption(opts[0], this.field.props as SelectProps)) {
          const optionMapper = createOptionMapper(opts[0], this.field.props as SelectProps);
          this.adapter.templateData.update((current) => ({
            ...current,
            options: current.options.map(optionMapper),
          }));
        } else {
          throw new Error('Invalid option shape');
        }
        const selection = this.adapter.templateData().value;
        this.hasMatchingValue =
          this.adapter.templateData().options.find(({ value }) => value === selection) !==
          undefined;
      }
    });
  }

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    if (this.adapter.templateData().readonly) {
      event.preventDefault();
    } else {
      const target = event.target as HTMLSelectElement;
      this.adapter.valueChanged(
        inferOptionValue(target.value, this.adapter.templateData().options),
      );
    }
  }
}
