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
  RadiogroupProps,
} from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import { GuiAriaDirective } from '../../directives/aria.directive';

@Component({
  standalone: true,
  selector: 'gui-radiogroup-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent, GuiAriaDirective],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './radiogroup.component.html',
  host: {
    class: 'gui-radiogroup',
  },
})
export class RadiogroupComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<OptionValue, RadiogroupProps> = inject(
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
        } else if (isProtoOption(opts[0], this.field.props as RadiogroupProps)) {
          const optionMapper = createOptionMapper(opts[0], this.field.props as RadiogroupProps);
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
      const target = event.target as HTMLInputElement;
      this.adapter.valueChanged(
        inferOptionValue(target.value, this.adapter.templateData().options),
      );
    }
  }
}
