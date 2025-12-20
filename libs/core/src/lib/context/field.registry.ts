import { FormField } from '../form-field';

type Registry<ComponentType, Widget extends string = FormField['widget']> = Record<
  Widget,
  ComponentType
>;

export type FieldLoaders<ComponentType, Widget extends string = FormField['widget']> = Record<
  Widget,
  () => Promise<ComponentType>
>;

export class FieldRegistry<ComponentType> {
  private registry: Registry<ComponentType> = {};
  private fieldLoaders: FieldLoaders<ComponentType> = {};

  private _ready = false;
  /**
   * When the registry has been initialized by calling `setFieldLoaders`
   */
  get ready() {
    return this._ready;
  }

  setFieldLoaders(fieldLoaders: FieldLoaders<ComponentType>) {
    this.fieldLoaders = fieldLoaders;
    this._ready = true;
  }

  async loadField(widget: FormField['widget']): Promise<ComponentType> {
    return this.registry[widget] ?? (this.registry[widget] = await this.fieldLoaders[widget]());
  }
}
