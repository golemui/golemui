import { LitElement } from 'lit';
import { html, unsafeStatic } from 'lit/static-html.js';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { consume, provide } from '@lit/context';
import {
  DisplayWidgetAdapter,
  type LitFormContext,
  displayWidgetContext,
  formContext,
} from '@golemui/lit';
import {
  typographyClasses,
  typographyTag,
  type TypographyProps,
} from '@golemui/gui-shared/internals';
import { type Subscription } from 'rxjs';

export class TypographyElement extends LitElement implements WithWidget {
  widget!: DisplayWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: displayWidgetContext })
  adapter = new DisplayWidgetAdapter<TypographyProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-typography-field', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const { text, variant } = this.adapter.templateData;
    // typographyTag returns a heading or `p` only, so the tag name is safe to render.
    const tag = unsafeStatic(typographyTag(variant));
    return html`<${tag} id=${this.adapter.domId} class=${typographyClasses(variant)}>${text}</${tag}>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-typography-display', TypographyElement);
