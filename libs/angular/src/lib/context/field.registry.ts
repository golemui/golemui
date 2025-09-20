import { Type } from '@angular/core';
import { FormField } from '@formforge/core';
import { WithField } from '../directives/with-field.type';

type Registry = Record<FormField['widget'], Type<WithField>>;
export type FieldLoaders = Record<
  FormField['widget'],
  () => Promise<Type<WithField>>
>;

export class FieldRegistry {
  private registry: Registry = {};
  private fieldLoaders: FieldLoaders = {};

  private _ready = false;
  /**
   * When the registry has been initialized by calling `setFieldLoaders`
   */
  get ready() {
    return this._ready;
  }

  setFieldLoaders(fieldLoaders: FieldLoaders) {
    this.fieldLoaders = fieldLoaders;
    this._ready = true;
  }

  async loadField(widget: FormField['widget']): Promise<Type<WithField>> {
    return (
      this.registry[widget] ??
      (this.registry[widget] = await this.fieldLoaders[widget]())
    );
  }
}
