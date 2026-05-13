import { iframeResizer, iframeThemeSync } from '@golemui/apps-shared';
import type { ItemRenderContext } from '@golemui/core';
import { gui } from '@golemui/gui-shared';
import '@golemui/gui-lit';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import './app.element.scss';

type Origin = 'golem' | 'material' | 'shoelace' | 'yours';

type FieldKey = 'country' | 'birthday' | 'satisfaction' | 'newsletter' | 'submit';

type FieldType = 'dropdown' | 'datepicker' | 'slider' | 'checkbox' | 'submit';

const FIELD_TYPE: Record<FieldKey, FieldType> = {
  country: 'dropdown',
  birthday: 'datepicker',
  satisfaction: 'slider',
  newsletter: 'checkbox',
  submit: 'submit',
};

const FIELD_LABEL: Record<FieldKey, string> = {
  country: 'Country',
  birthday: 'Birthday',
  satisfaction: 'Satisfaction (0–10)',
  newsletter: 'Email me when there are updates',
  submit: 'Sign up',
};

const FIELDS: FieldKey[] = ['country', 'birthday', 'satisfaction', 'newsletter', 'submit'];

type CountryItem = { value: string; label: string; flag: string };

const COUNTRIES: CountryItem[] = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵' },
  { value: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
];

type FormShape = {
  country?: string;
  birthday?: string;
  satisfaction?: number;
  newsletter?: boolean;
};

const DEFAULT_DATA: FormShape = {
  country: 'JP',
  birthday: '1990-04-12',
  satisfaction: 8,
  newsletter: true,
};

const ORIGIN_LABEL: Record<Origin, string> = {
  golem: 'GolemUI',
  material: 'Material',
  shoelace: 'Shoelace',
  yours: 'Custom',
};

const ORIGIN_ICON: Record<Origin, TemplateResult> = {
  // Official locked GolemUI mark — see docs/public/assets/gui-braces.svg.
  // Inlined so the iframe doesn't depend on a cross-origin asset.
  golem: html`<svg
    class="fd-origin-icon"
    viewBox="0 0 200 200"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fd-golem-brand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
    </defs>
    <text
      x="100"
      y="100"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="Inter, system-ui, -apple-system, sans-serif"
      font-weight="600"
      font-size="160"
      letter-spacing="6"
      fill="url(#fd-golem-brand)"
    >
      {}
    </text>
  </svg>`,
  material: html`<svg
    class="fd-origin-icon"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <path
      d="M12 2 L2 19.7778 h20 L12 2 Z m0 3.8856 L18.8089 17.5 H5.1911 L12 5.8856 Z"
      fill="currentColor"
    />
  </svg>`,
  shoelace: html`<svg
    class="fd-origin-icon"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <path
      d="M12 2 L22 12 L12 22 L2 12 Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
  </svg>`,
  yours: html`<svg
    class="fd-origin-icon"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <path
      d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z"
      fill="currentColor"
    />
  </svg>`,
};

const DEFAULT_MIX: Record<FieldKey, Origin> = {
  country: 'shoelace',
  birthday: 'material',
  satisfaction: 'yours',
  newsletter: 'golem',
  submit: 'shoelace',
};

const ORIGINS: Origin[] = ['golem', 'material', 'shoelace', 'yours'];

const flagItemRenderer = (ctx: ItemRenderContext<CountryItem>): TemplateResult => html`
  <div class="fd-flag-item ${ctx.selected ? 'is-selected' : ''} ${ctx.focused ? 'is-focused' : ''}">
    <span class="fd-flag-item__flag">${ctx.template.flag}</span>
    <span class="fd-flag-item__label">${ctx.template.label}</span>
  </div>
`;

function buildField(field: FieldKey, origin: Origin, onChangeCb: (value: unknown) => void) {
  const type = FIELD_TYPE[field];
  const label = FIELD_LABEL[field];

  if (type === 'submit') {
    if (origin === 'golem') return gui.actions.button({ label, uid: field });
    if (origin === 'material') return gui.actions.custom('matButton', { label, uid: field });
    if (origin === 'shoelace') return gui.actions.custom('shoelaceButton', { label, uid: field });
    return gui.actions.custom('freedomButton', { label, uid: field });
  }

  const onChange = ({ data }: { data: unknown }) =>
    onChangeCb((data as Record<string, unknown>)[field]);

  if (type === 'dropdown') {
    if (origin === 'golem')
      return gui.inputs.dropdown(field, {
        uid: field,
        label,
        items: COUNTRIES,
        labelField: 'label',
        valueField: 'value',
        itemRenderer: 'flagItem',
        onChange,
      });
    if (origin === 'material')
      return gui.inputs.custom('matDropdown', field, {
        uid: field,
        label,
        props: { items: COUNTRIES },
        onChange,
      });
    if (origin === 'shoelace')
      return gui.inputs.custom('shoelaceDropdown', field, {
        uid: field,
        label,
        props: { items: COUNTRIES },
        onChange,
      });
    return gui.inputs.custom('freedomDropdown', field, {
      uid: field,
      label,
      props: { items: COUNTRIES },
      onChange,
    });
  }

  if (type === 'datepicker') {
    if (origin === 'golem')
      return gui.inputs.datePicker(field, {
        uid: field,
        label,
        icon: 'calendar_month',
        onChange,
      });
    if (origin === 'material')
      return gui.inputs.custom('matDatePicker', field, { uid: field, label, onChange });
    if (origin === 'shoelace')
      return gui.inputs.custom('shoelaceDatePicker', field, { uid: field, label, onChange });
    return gui.inputs.custom('freedomDatePicker', field, { uid: field, label, onChange });
  }

  if (type === 'slider') {
    const sliderProps = { min: 0, max: 10, step: 1 };
    if (origin === 'golem')
      // GolemUI ships numberInput, not a slider — the demo uses what each
      // library actually has, so the GolemUI slot renders a number field
      // bound to the same data. Same shape, different interaction.
      return gui.inputs.numberInput(field, { uid: field, label, onChange });
    if (origin === 'material')
      return gui.inputs.custom('matSlider', field, {
        uid: field,
        label,
        props: sliderProps,
        onChange,
      });
    if (origin === 'shoelace')
      return gui.inputs.custom('shoelaceSlider', field, {
        uid: field,
        label,
        props: sliderProps,
        onChange,
      });
    return gui.inputs.custom('freedomSlider', field, {
      uid: field,
      label,
      props: sliderProps,
      onChange,
    });
  }

  // checkbox
  if (origin === 'golem') return gui.inputs.checkbox(field, { uid: field, label, onChange });
  if (origin === 'material')
    return gui.inputs.custom('matCheckbox', field, { uid: field, label, onChange });
  if (origin === 'shoelace')
    return gui.inputs.custom('shoelaceCheckbox', field, { uid: field, label, onChange });
  return gui.inputs.custom('freedomCheckbox', field, { uid: field, label, onChange });
}

function fieldLineJson(field: FieldKey, origin: Origin): unknown {
  const type = FIELD_TYPE[field];
  const label = FIELD_LABEL[field];

  if (type === 'submit') {
    if (origin === 'golem') return { type: 'button', uid: field, label };
    return {
      type: 'custom',
      widget:
        origin === 'material'
          ? 'matButton'
          : origin === 'shoelace'
            ? 'shoelaceButton'
            : 'freedomButton',
      uid: field,
      label,
    };
  }

  if (type === 'dropdown') {
    if (origin === 'golem')
      return {
        type: 'dropdown',
        path: field,
        label,
        items: 'COUNTRIES',
        itemRenderer: 'flagItem',
      };
    return {
      type: 'custom',
      widget:
        origin === 'material'
          ? 'matDropdown'
          : origin === 'shoelace'
            ? 'shoelaceDropdown'
            : 'freedomDropdown',
      path: field,
      label,
      props: { items: 'COUNTRIES' },
    };
  }

  if (type === 'datepicker') {
    if (origin === 'golem')
      return { type: 'datePicker', path: field, label, icon: 'calendar_month' };
    return {
      type: 'custom',
      widget:
        origin === 'material'
          ? 'matDatePicker'
          : origin === 'shoelace'
            ? 'shoelaceDatePicker'
            : 'freedomDatePicker',
      path: field,
      label,
    };
  }

  if (type === 'slider') {
    if (origin === 'golem') return { type: 'numberInput', path: field, label };
    return {
      type: 'custom',
      widget:
        origin === 'material'
          ? 'matSlider'
          : origin === 'shoelace'
            ? 'shoelaceSlider'
            : 'freedomSlider',
      path: field,
      label,
      props: { min: 0, max: 10 },
    };
  }

  // checkbox
  if (origin === 'golem') return { type: 'checkbox', path: field, label };
  return {
    type: 'custom',
    widget:
      origin === 'material'
        ? 'matCheckbox'
        : origin === 'shoelace'
          ? 'shoelaceCheckbox'
          : 'freedomCheckbox',
    path: field,
    label,
  };
}

function fieldLineSource(field: FieldKey, origin: Origin): string {
  const type = FIELD_TYPE[field];
  if (type === 'submit') {
    if (origin === 'golem') return `gui.actions.button({ label: 'Sign up' }),`;
    if (origin === 'material') return `gui.actions.custom('matButton', { label: 'Sign up' }),`;
    if (origin === 'shoelace') return `gui.actions.custom('shoelaceButton', { label: 'Sign up' }),`;
    return `gui.actions.custom('freedomButton', { label: 'Sign up' }),`;
  }

  if (type === 'dropdown') {
    if (origin === 'golem')
      return `gui.inputs.dropdown('${field}', { items: COUNTRIES, itemRenderer: 'flagItem' }),`;
    if (origin === 'material')
      return `gui.inputs.custom('matDropdown', '${field}', { props: { items: COUNTRIES } }),`;
    if (origin === 'shoelace')
      return `gui.inputs.custom('shoelaceDropdown', '${field}', { props: { items: COUNTRIES } }),`;
    return `gui.inputs.custom('freedomDropdown', '${field}', { props: { items: COUNTRIES } }),`;
  }

  if (type === 'datepicker') {
    if (origin === 'golem')
      return `gui.inputs.datePicker('${field}', { label: 'Birthday', icon: 'calendar_month' }),`;
    if (origin === 'material')
      return `gui.inputs.custom('matDatePicker', '${field}', { label: 'Birthday' }),`;
    if (origin === 'shoelace')
      return `gui.inputs.custom('shoelaceDatePicker', '${field}', { label: 'Birthday' }),`;
    return `gui.inputs.custom('freedomDatePicker', '${field}', { label: 'Birthday' }),`;
  }

  if (type === 'slider') {
    if (origin === 'golem')
      return `gui.inputs.numberInput('${field}', { label: 'Satisfaction (0–10)' }),`;
    if (origin === 'material')
      return `gui.inputs.custom('matSlider', '${field}', { props: { min: 0, max: 10 } }),`;
    if (origin === 'shoelace')
      return `gui.inputs.custom('shoelaceSlider', '${field}', { props: { min: 0, max: 10 } }),`;
    return `gui.inputs.custom('freedomSlider', '${field}', { props: { min: 0, max: 10 } }),`;
  }

  // checkbox
  if (origin === 'golem')
    return `gui.inputs.checkbox('${field}', { label: 'Email me when there are updates' }),`;
  if (origin === 'material')
    return `gui.inputs.custom('matCheckbox', '${field}', { label: 'Email me when there are updates' }),`;
  if (origin === 'shoelace')
    return `gui.inputs.custom('shoelaceCheckbox', '${field}', { label: 'Email me when there are updates' }),`;
  return `gui.inputs.custom('freedomCheckbox', '${field}', { label: 'Email me when there are updates' }),`;
}

type Tab = 'dsl' | 'json';

@customElement('gui-freedom')
export class FreedomElement extends LitElement {
  @state() declare private mix: Record<FieldKey, Origin>;
  @state() declare private formData: FormShape;
  @state() declare private formKey: number;
  @state() declare private openPicker: FieldKey | null;
  @state() declare private flashedCodeField: FieldKey | null;
  @state() declare private flashedDataField: FieldKey | null;
  @state() declare private activeTab: Tab;

  private codeFlashTimer: ReturnType<typeof setTimeout> | null = null;
  private dataFlashTimer: ReturnType<typeof setTimeout> | null = null;

  private formConfig = {
    suppressAutomaticSubmit: true,
    itemRenderers: {
      flagItem: flagItemRenderer,
    },
    widgetLoaders: {
      // Material
      matDropdown: async () =>
        (await import('./components/mat-dropdown')).FreedomMatDropdownElement,
      matCheckbox: async () =>
        (await import('./components/mat-checkbox')).FreedomMatCheckboxElement,
      matDatePicker: async () =>
        (await import('./components/mat-date-picker')).FreedomMatDatePickerElement,
      matSlider: async () => (await import('./components/mat-slider')).FreedomMatSliderElement,
      matButton: async () => (await import('./components/mat-button')).FreedomMatButtonElement,
      // Shoelace
      shoelaceDropdown: async () =>
        (await import('./components/shoelace-dropdown')).FreedomShoelaceDropdownElement,
      shoelaceCheckbox: async () =>
        (await import('./components/shoelace-checkbox')).FreedomShoelaceCheckboxElement,
      shoelaceDatePicker: async () =>
        (await import('./components/shoelace-date-picker')).FreedomShoelaceDatePickerElement,
      shoelaceSlider: async () =>
        (await import('./components/shoelace-slider')).FreedomShoelaceSliderElement,
      shoelaceButton: async () =>
        (await import('./components/shoelace-button')).FreedomShoelaceButtonElement,
      // Custom (Yours)
      freedomDropdown: async () =>
        (await import('./components/freedom-dropdown')).FreedomDropdownElement,
      freedomCheckbox: async () =>
        (await import('./components/freedom-checkbox')).FreedomCheckboxElement,
      freedomDatePicker: async () =>
        (await import('./components/freedom-date-picker')).FreedomDatePickerElement,
      freedomSlider: async () => (await import('./components/freedom-slider')).FreedomSliderElement,
      freedomButton: async () => (await import('./components/freedom-button')).FreedomButtonElement,
    },
  };

  private shoelaceThemeObserver: MutationObserver | null = null;

  constructor() {
    super();
    this.mix = { ...DEFAULT_MIX };
    this.formData = { ...DEFAULT_DATA };
    this.formKey = 0;
    this.openPicker = null;
    this.flashedCodeField = null;
    this.flashedDataField = null;
    this.activeTab = 'dsl';
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    iframeThemeSync();
    // Mirror the docs site's dark/light onto Shoelace's .sl-theme-dark class.
    // iframeThemeSync owns html.dark/.light; we just track and forward.
    const root = document.documentElement;
    const syncShoelace = () =>
      root.classList.toggle('sl-theme-dark', root.classList.contains('dark'));
    syncShoelace();
    this.shoelaceThemeObserver = new MutationObserver(syncShoelace);
    this.shoelaceThemeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });
    document.addEventListener('click', this.handleDocClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocClick);
    this.shoelaceThemeObserver?.disconnect();
    this.shoelaceThemeObserver = null;
    if (this.codeFlashTimer) clearTimeout(this.codeFlashTimer);
    if (this.dataFlashTimer) clearTimeout(this.dataFlashTimer);
  }

  private flashCode(field: FieldKey) {
    this.flashedCodeField = field;
    if (this.codeFlashTimer) clearTimeout(this.codeFlashTimer);
    this.codeFlashTimer = setTimeout(() => {
      this.flashedCodeField = null;
      this.codeFlashTimer = null;
    }, 1400);
  }

  private flashData(field: FieldKey) {
    this.flashedDataField = field;
    if (this.dataFlashTimer) clearTimeout(this.dataFlashTimer);
    this.dataFlashTimer = setTimeout(() => {
      this.flashedDataField = null;
      this.dataFlashTimer = null;
    }, 1400);
  }

  private handleDocClick = (e: MouseEvent) => {
    if (this.openPicker === null) return;
    const target = e.target as HTMLElement;
    if (target.closest('.fd-picker') || target.closest('.fd-picker-menu')) return;
    this.openPicker = null;
  };

  private togglePicker(field: FieldKey) {
    this.openPicker = this.openPicker === field ? null : field;
  }

  private setOrigin(field: FieldKey, origin: Origin) {
    this.openPicker = null;
    if (this.mix[field] === origin) return;
    this.mix = { ...this.mix, [field]: origin };
    this.formKey += 1;
    this.flashCode(field);
  }

  private setFieldValue(field: FieldKey, value: unknown) {
    if (this.formData[field as keyof FormShape] === value) return;
    this.formData = { ...this.formData, [field]: value };
    this.flashData(field);
  }

  private renderRow(field: FieldKey) {
    const origin = this.mix[field];
    const isSubmit = FIELD_TYPE[field] === 'submit';
    const dataForRow = isSubmit
      ? {}
      : ({ [field]: this.formData[field as keyof FormShape] } as Record<string, unknown>);

    const isOpen = this.openPicker === field;

    return html`<div class="fd-row">
      <div class="fd-picker-wrap">
        <button
          type="button"
          class="fd-picker fd-picker--${origin} ${isOpen ? 'is-open' : ''}"
          aria-haspopup="listbox"
          aria-expanded=${isOpen}
          aria-label=${`Implementation for ${FIELD_LABEL[field]}`}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.togglePicker(field);
          }}
        >
          ${ORIGIN_ICON[origin]}
          <span class="fd-picker__label">${ORIGIN_LABEL[origin]}</span>
          <span class="fd-picker__chev" aria-hidden="true">▾</span>
        </button>
        ${isOpen
          ? html`<ul class="fd-picker-menu" role="listbox">
              ${ORIGINS.map(
                (o) =>
                  html`<li>
                    <button
                      type="button"
                      role="option"
                      class="fd-picker-menu__item fd-picker-menu__item--${o} ${o === origin
                        ? 'is-current'
                        : ''}"
                      aria-selected=${o === origin}
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this.setOrigin(field, o);
                      }}
                    >
                      ${ORIGIN_ICON[o]}
                      <span class="fd-picker-menu__label">${ORIGIN_LABEL[o]}</span>
                      ${o === origin
                        ? html`<span class="fd-picker-menu__check" aria-hidden="true">✓</span>`
                        : null}
                    </button>
                  </li>`,
              )}
            </ul>`
          : null}
      </div>
      <div class="fd-row__field" data-origin=${origin}>
        ${keyed(
          `${field}-${origin}-${this.formKey}`,
          html`<gui-form
            .formDef=${[buildField(field, origin, (v) => this.setFieldValue(field, v))]}
            .data=${dataForRow}
            .formConfig=${this.formConfig}
          ></gui-form>`,
        )}
      </div>
    </div>`;
  }

  private renderDsl(): TemplateResult {
    return html`<pre class="ds-code"><code>const formDef = [
${FIELDS.map(
      (f) =>
        html`<span
          class="fd-code-line ${this.flashedCodeField === f ? 'is-flashing' : ''}"
          data-field=${f}
        >
          ${fieldLineSource(f, this.mix[f])}</span
        > `,
    )}];</code></pre>`;
  }

  private renderJson(): TemplateResult {
    const merged = FIELDS.map((f) => fieldLineJson(f, this.mix[f]));
    return html`<pre class="ds-code"><code>${JSON.stringify(merged, null, 2)}</code></pre>`;
  }

  private renderTabs(): TemplateResult {
    return html`<nav class="ds-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected=${this.activeTab === 'dsl'}
        class="ds-tab ${this.activeTab === 'dsl' ? 'is-active' : ''}"
        @click=${() => (this.activeTab = 'dsl')}
      >
        gui.*
      </button>
      <button
        type="button"
        role="tab"
        aria-selected=${this.activeTab === 'json'}
        class="ds-tab ${this.activeTab === 'json' ? 'is-active' : ''}"
        @click=${() => (this.activeTab = 'json')}
      >
        {} JSON
      </button>
    </nav>`;
  }

  private renderLiveData(): string {
    const visible: Record<string, unknown> = {};
    (['country', 'birthday', 'satisfaction', 'newsletter'] as const).forEach((f) => {
      const v = this.formData[f];
      if (v !== undefined) visible[f] = v;
    });
    return Object.keys(visible).length === 0
      ? '// type into the form — data appears here'
      : JSON.stringify(visible, null, 2);
  }

  override render() {
    return html`
      <div class="ds-shell">
        <div class="ds-grid">
          <section class="ds-left">
            <div class="ds-canvas">
              <div class="fd-fields">${FIELDS.map((f) => this.renderRow(f))}</div>
            </div>
          </section>
          <section class="ds-right">
            <div class="ds-pane ds-pane--top">
              <header class="ds-pane__header">
                ${this.renderTabs()}
                <span class="ds-pane__caption">Schema</span>
              </header>
              ${keyed(
                `${this.formKey}-${this.activeTab}`,
                this.activeTab === 'dsl' ? this.renderDsl() : this.renderJson(),
              )}
            </div>
            <div class="ds-pane ds-pane--bottom">
              <header class="ds-pane__header">
                <span class="ds-pane__title">Form data (live)</span>
                <span class="ds-pane__caption">Stays the same on swap ↑</span>
              </header>
              <pre class="ds-code ds-code--data"><code>${this.renderLiveData()}</code></pre>
            </div>
          </section>
        </div>
      </div>
    `;
  }
}
