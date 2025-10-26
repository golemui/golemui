import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type Option = {
  label: string;
  value: unknown;
};

type SelectProps = {
  options: Option[];
  labelField?: string;
  valueField?: string;
};

const isOption = (opt: unknown): opt is Option =>
  opt !== null &&
  typeof opt === 'object' &&
  Object.hasOwn(opt, 'label') &&
  Object.hasOwn(opt, 'value');

/** Checks if an object can be converted into an actual Option */
const isProtoOption = (
  opt: unknown,
  { labelField, valueField }: { labelField?: string; valueField?: string },
): opt is Record<string, unknown> => {
  if (opt === null || typeof opt !== 'object') {
    return false;
  }
  const obj = opt as Record<string, unknown>;

  const hasLabel = labelField ? Object.hasOwn(obj, labelField) : false;
  const hasValue = valueField ? Object.hasOwn(obj, valueField) : false;

  if (labelField && !hasLabel) {
    // labelField is provided but hasLabel is false → invalid
    return false;
  } else if (valueField && !hasValue) {
    // valueField is provided but hasValue is false → invalid
    return false;
  }
  return true;
};

/** Returns a mapper function that converts objects into { label, value } */
function createOptionMapper(
  opt: unknown,
  { labelField, valueField }: { labelField?: string; valueField?: string },
) {
  if (opt === null || typeof opt !== 'object') {
    throw new Error('Provided value is not an object');
  }

  const obj = opt as Record<string, unknown>;

  // Resolve fields: only keep those that exist on the object
  const resolvedLabelField = labelField && Object.hasOwn(obj, labelField) ? labelField : undefined;
  const resolvedValueField = valueField && Object.hasOwn(obj, valueField) ? valueField : undefined;

  if (!resolvedLabelField && !resolvedValueField) {
    throw new Error('Neither labelField nor valueField exists on the object');
  }

  // Return the mapping function
  return (item: unknown): Option => {
    if (item === null || typeof item !== 'object') {
      throw new Error('Item is not an object');
    }
    const o = item as Record<string, unknown>;
    return {
      label: resolvedLabelField ? String(o[resolvedLabelField]) : '',
      value: resolvedValueField ? String(o[resolvedValueField]) : '',
    };
  };
}

@Component({
  standalone: true,
  selector: 'ff-select',
  imports: [CommonModule],
  providers: [Angular.ControlAdapter],
  templateUrl: './select.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'ff-select',
  },
})
export class SelectComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlAdapter<string, SelectProps> = inject(Angular.ControlAdapter);
  protected optionsLoading = false;
  protected hasMatchingValue = false;

  constructor() {
    effect(() => {
      const opts = this.adapter.templateData().options;
      if (Array.isArray(opts) && opts.length > 0) {
        if (isOption(opts[0])) {
          // nothing to do
        } else if (Core.isLiteral(opts[0])) {
          this.adapter.templateData.update((current) => ({
            ...current,
            options: (current.options as unknown as Core.LiteralValue[]).map((opt) => ({
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
    const target = event.target as HTMLSelectElement;
    this.adapter.valueChanged(target.value);
  }
}
