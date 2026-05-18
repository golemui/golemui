import { type NonFunctionWidget } from '../form-widget';

/**
 * @internal Framework adapter contract — not part of the end-user public API.
 */
export type WidgetLoaders<
  ComponentType,
  Widget extends string = NonFunctionWidget['type'],
> = Record<Widget, () => Promise<ComponentType>>;

export class WidgetRegistry<ComponentType> {
  /**
   * Shared across all instances, keyed by loader function reference.
   * Loader functions must be stable references (module-scope constants).
   * Failed requests are automatically cleared so you can retry them later.
   */
  private static sharedCache = new Map<() => Promise<any>, Promise<any>>();

  private widgetLoaders: WidgetLoaders<ComponentType> = {} as WidgetLoaders<ComponentType>;
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

  async loadWidget(widget: NonFunctionWidget['type']): Promise<ComponentType> {
    const loader = this.widgetLoaders[widget];
    if (!WidgetRegistry.sharedCache.has(loader)) {
      const promise = loader().catch((err) => {
        WidgetRegistry.sharedCache.delete(loader);
        return Promise.reject(err);
      });
      WidgetRegistry.sharedCache.set(loader, promise);
    }
    return WidgetRegistry.sharedCache.get(loader);
  }
}
