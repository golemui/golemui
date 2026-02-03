import { NonFunctionWidget } from '../form-widget';

type Registry<ComponentType, Widget extends string = NonFunctionWidget['widget']> = Record<
  Widget,
  ComponentType
>;

export type WidgetLoaders<
  ComponentType,
  Widget extends string = NonFunctionWidget['widget'],
> = Record<Widget, () => Promise<ComponentType>>;

export class WidgetRegistry<ComponentType> {
  // TODO: this should be shared across all WidgetRegistry instances
  private registry: Registry<ComponentType> = {};
  private widgetLoaders: WidgetLoaders<ComponentType> = {};

  private _ready = false;
  /**
   * When the registry has been initialized by calling `setWidgetLoaders`
   */
  get ready() {
    return this._ready;
  }

  setWidgetLoaders(widgetLoaders: WidgetLoaders<ComponentType>) {
    this.widgetLoaders = widgetLoaders;
    this._ready = true;
  }

  async loadWidget(widget: NonFunctionWidget['widget']): Promise<ComponentType> {
    return this.registry[widget] ?? (this.registry[widget] = await this.widgetLoaders[widget]());
  }
}
