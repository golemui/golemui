import { type NonFunctionWidget } from '../form-widget';

/**
 * Map of widget type to a lazy component loader. This is the shape of
 * `FormInitConfig.widgetLoaders`: each entry loads the component that renders
 * that widget type, including custom widgets.
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

  // Resolved components, filled by preloadWidgets. Keyed by loader reference like sharedCache,
  // so a preload through any instance (e.g. preloadFormWidgets) makes the components available
  // to every instance configured with the same loader functions.
  private static resolvedCache = new Map<() => Promise<any>, any>();

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

  /**
   * Loads the given widget types (default: every configured type) and stores each
   * resolved component for synchronous access through `getIfLoaded`.
   * A failed loader rejects the returned promise, stores nothing, and stays retryable.
   */
  async preloadWidgets(types?: NonFunctionWidget['type'][]): Promise<void> {
    const widgetTypes = types ?? Object.keys(this.widgetLoaders);
    await Promise.all(
      widgetTypes.map(async (type) => {
        const component = await this.loadWidget(type);
        WidgetRegistry.resolvedCache.set(this.widgetLoaders[type], component);
      }),
    );
  }

  /**
   * Returns the resolved component for the given widget type, or `undefined` when it
   * was never preloaded. Never starts a load.
   */
  getIfLoaded(widget: NonFunctionWidget['type']): ComponentType | undefined {
    const loader = this.widgetLoaders[widget];
    if (!loader) {
      return undefined;
    }
    return WidgetRegistry.resolvedCache.get(loader);
  }
}

/**
 * Loads every widget component of a form config so that a later render can read
 * them synchronously. Rendering a form in an environment that cannot wait for
 * dynamic imports (a server render is one) requires this call to finish first.
 *
 * @param config - Any object that contains the `widgetLoaders` a form is
 * configured with, e.g. a `FormInitConfig`.
 * @example
 * await preloadFormWidgets(config);
 * // every widget component of `config.widgetLoaders` is now available synchronously
 */
export async function preloadFormWidgets<ComponentType>(config: {
  widgetLoaders: WidgetLoaders<ComponentType>;
}): Promise<void> {
  const registry = new WidgetRegistry<ComponentType>();
  registry.setWidgetLoaders(config.widgetLoaders);
  await registry.preloadWidgets();
}
