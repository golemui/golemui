import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import './checklist.element.scss';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  linkText?: string;
}

@customElement('gui-checklist')
export class ChecklistElement extends LitElement {
  @property({ attribute: false }) declare items: ChecklistItem[];
  @property({ attribute: false }) declare completed: Record<string, boolean>;
  @property() declare title: string;
  @property() declare subtitle: string;

  constructor() {
    super();
    this.items = [];
    this.completed = {};
    this.title = '';
    this.subtitle = '';
  }

  override createRenderRoot() {
    return this;
  }

  private onLinkClick(itemId: string, ev: Event) {
    ev.preventDefault();
    this.dispatchEvent(
      new CustomEvent('checkCodeClick', { detail: { id: itemId }, bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`
      <aside class="checklist" aria-label=${this.title}>
        ${this.title ? html`<h2 class="checklist-title">${this.title}</h2>` : null}
        ${this.subtitle ? html`<p class="checklist-subtitle">${this.subtitle}</p>` : null}
        <ol class="checklist-items">
          ${this.items.map((item, idx) => this.renderItem(item, idx))}
        </ol>
      </aside>
    `;
  }

  private renderItem(item: ChecklistItem, idx: number) {
    const done = !!this.completed[item.id];
    const classes = { 'checklist-item': true, done };
    return html`
      <li class=${classMap(classes)} aria-checked=${done ? 'true' : 'false'} role="checkbox">
        <span class="checklist-icon material-icons" aria-hidden="true">
          ${done ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <div class="checklist-content">
          <p class="checklist-label">
            <span class="checklist-index">${idx + 1}.</span>
            ${item.label}
          </p>
          <p class="checklist-description">
            ${item.description}
            ${item.linkText
              ? html` <a
                  class="checklist-link"
                  href="#"
                  @click=${(ev: Event) => this.onLinkClick(item.id, ev)}
                  >${item.linkText}</a
                >`
              : null}
          </p>
        </div>
      </li>
    `;
  }
}
