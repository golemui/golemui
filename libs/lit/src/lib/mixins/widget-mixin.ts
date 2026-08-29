import { type FormHealth, type FormWidget, errorCodes, formEventNames } from '@golemui/core';
import { consume } from '@lit/context';
import { type LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { formContext, type LitFormContext } from '../context/form.context';
import { tagNameOf } from '../utils/define';

// Static template identity is derived from the strings, so one value per tag is enough.
const staticTagCache = new Map<string, ReturnType<typeof unsafeStatic>>();

const staticTagFor = (tag: string) => {
  let staticTag = staticTagCache.get(tag);
  if (!staticTag) {
    staticTag = unsafeStatic(tag);
    staticTagCache.set(tag, staticTag);
  }
  return staticTag;
};

export const WidgetMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class WidgetElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) widget!: FormWidget<string> | undefined;

    override createRenderRoot() {
      return this;
    }

    override connectedCallback() {
      super.connectedCallback?.();
      if (this.resolvePreloadedTag()) {
        // On the preloaded path this element stays in the DOM as the widget's parent,
        // so it must not become a flex or grid item of the surrounding layout.
        this.setAttribute('style', 'display:contents');
      } else {
        this.loadWidgetComponent();
      }
    }

    /**
     * Returns the tag of the widget's component when it was preloaded, undefined
     * otherwise (no widget, no form context, or the component was never preloaded).
     */
    private resolvePreloadedTag(): string | undefined {
      const type = this.widget?.type;
      if (!type) {
        return undefined;
      }
      const component = this.formContext?.widgetRegistry.getIfLoaded(type);
      if (!component) {
        return undefined;
      }
      const ctor = component as unknown as CustomElementConstructor;
      const registry = customElements as CustomElementRegistry & {
        getName?(ctor: CustomElementConstructor): string | null;
      };
      return tagNameOf(ctor) ?? registry.getName?.(ctor) ?? undefined;
    }

    private async loadWidgetComponent() {
      if (!this.widget) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.widget.type!);
        const element = new component();

        element.widget = this.widget;
        element.id = `host-${this.widget.uid}`;

        this.replaceWith(element);
      } catch (err) {
        console.error(`Widget "${this.widget.type}" could not be loaded`, err);

        const code = errorCodes.widgetCouldNotBeLoaded;
        this.dispatchEvent(
          new CustomEvent<FormHealth>(formEventNames.health, {
            detail: {
              status: 'errored',
              message: `[${code}] Widget "${this.widget.type}" could not be loaded`,
              code,
            },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    override render() {
      const tag = this.resolvePreloadedTag();
      if (!tag || !this.widget) {
        return null;
      }
      const staticTag = staticTagFor(tag);
      return staticHtml`<${staticTag} id=${`host-${this.widget.uid}`} .widget=${this.widget}></${staticTag}>`;
    }
  }

  return WidgetElement as unknown as T & (new (...args: any[]) => LitElement);
};
