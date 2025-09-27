import { FormField } from '../Field';
import { Constructor } from '../shared';
import { WithField } from './with-field.type';

type Registry = Record<FormField['widget'], Constructor<WithField>>;
export type FieldLoaders = Record<
  FormField['widget'],
  () => Promise<Constructor<WithField>>
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

  async loadField(
    widget: FormField['widget'],
  ): Promise<Constructor<WithField>> {
    return (
      this.registry[widget] ??
      (this.registry[widget] = await this.fieldLoaders[widget]())
    );
  }
}
