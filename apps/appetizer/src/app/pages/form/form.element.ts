import type { ItemRenderContext } from '@golemui/core';
import type { ValidateOn } from '@golemui/core';
import '@golemui/gui-lit';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import './form.element.scss';

const COUNTRIES = ['United States', 'Japan', 'Brazil', 'France'];

const CITIES: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Los Angeles'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto'],
  Brazil: ['São Paulo', 'Rio de Janeiro'],
  France: ['Paris', 'Marseille'],
};

type CurrencyItem = { code: string; symbol: string; name: string };

const CURRENCIES: CurrencyItem[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const currencyItemRenderer = (ctx: ItemRenderContext<CurrencyItem>): TemplateResult => html`
  <div
    class="poc-currency-item ${ctx.selected ? 'is-selected' : ''} ${ctx.focused
      ? 'is-focused'
      : ''}"
  >
    <span class="poc-currency-item__symbol">${ctx.template.symbol}</span>
    <span class="poc-currency-item__code">${ctx.template.code}</span>
    <span class="poc-currency-item__name">${ctx.template.name}</span>
  </div>
`;

type FormShape = {
  country?: string;
  city?: string;
  currency?: string;
  pets?: boolean;
  startDate?: string;
};

type Stage =
  | 'start'
  | 'countryPicked'
  | 'cityPicked'
  | 'currencyPicked'
  | 'petsToggled'
  | 'dateEntered'
  | 'submitted';

const STEP_LABELS = ['Country', 'City', 'Currency', 'Pets', 'Date', 'Submit'] as const;

const STAGE_TO_STEP_INDEX: Record<Stage, number> = {
  start: 0,
  countryPicked: 1,
  cityPicked: 2,
  currencyPicked: 3,
  petsToggled: 4,
  dateEntered: 5,
  submitted: 6,
};

type Token =
  | 'componentDropdown'
  | 'componentRadiogroup'
  | 'componentCheckbox'
  | 'componentDatePicker'
  | 'update'
  | 'include'
  | 'itemRenderer'
  | 'submit';

const STAGE_HEADLINE_TOKEN: Record<Stage, Token> = {
  start: 'componentDropdown',
  countryPicked: 'componentRadiogroup',
  cityPicked: 'itemRenderer',
  currencyPicked: 'componentCheckbox',
  petsToggled: 'componentDatePicker',
  dateEntered: 'submit',
  submitted: 'submit',
};

const STAGE_PROMPT_FORM: Record<Stage, string> = {
  start: 'Pick a country to show its relevant cities. See the code below for how this is wired.',
  countryPicked: 'Pick a city — note how the radio group only appeared once a country was set.',
  cityPicked: 'Pick a currency. The dropdown uses a custom item renderer for symbol + code + name.',
  currencyPicked:
    'Toggle whether you are travelling with pets. A simple boolean flips the next step in.',
  petsToggled: 'Pick a start date. The calendar pops over the input — ISO date in, ISO date out.',
  dateEntered: 'Submit when you are ready. The form will flip to a summary of what just happened.',
  submitted: 'Submitted. Click "Start again" on the back face to come back here.',
};

const STAGE_PROMPT_CODE: Record<Stage, string> = {
  start:
    'Code for a dropdown in GolemUI. Notice the update instruction that hydrates cities based on the chosen country.',
  countryPicked:
    'Code for the city radio group. The include rule is what kept it hidden until a country was picked.',
  cityPicked:
    'Code for the currency dropdown. itemRenderer is plugged in by name — the row layout becomes custom.',
  currencyPicked:
    'Code for the pets toggle. A plain boolean field, conditionally included once currency is set.',
  petsToggled: 'Code for the date picker. ISO dates, with optional min/max and disabled ranges.',
  dateEntered:
    'And the submit handler. onSubmit gets the form data — do whatever you want with it.',
  submitted: 'That was the whole form.',
};

type TokenInfo = {
  title: string;
  base: () => unknown;
  context?: Partial<Record<Stage, () => unknown>>;
  docs: string;
};

const TOKEN_INFO: Record<Token, TokenInfo> = {
  componentDropdown: {
    title: 'Dropdown',
    base: () =>
      html`A list-based input. Static items, reactive items, custom rendering, item filtering — all
      declarative.`,
    context: {
      start: () =>
        html`Here it's a static list of four countries, and <code>onChange</code> wires up the next
          field.`,
      cityPicked: () =>
        html`Here it backs the currency picker, with a custom renderer for each row.`,
    },
    docs: '/dx/widgets-reference/input-fields/dropdown/',
  },
  componentRadiogroup: {
    title: 'Radio group',
    base: () =>
      html`Mutually-exclusive options laid out inline. Same shape as the dropdown — pick whichever
      fits the UX.`,
    context: {
      countryPicked: () => html`Here it lists the cities of the chosen country.`,
    },
    docs: '/dx/widgets-reference/input-fields/radiogroup/',
  },
  componentCheckbox: {
    title: 'Checkbox',
    base: () =>
      html`A boolean input. Render as checkbox, switch, or any custom toggle — the data model is one
      bool.`,
    context: {
      currencyPicked: () =>
        html`Here it captures whether the user is travelling with pets. Toggling it unlocks the date
        field.`,
    },
    docs: '/dx/widgets-reference/input-fields/checkbox/',
  },
  componentDatePicker: {
    title: 'Date picker',
    base: () =>
      html`An input with a calendar pop-over. ISO date in/out, with optional min/max and disabled
      ranges.`,
    context: {
      petsToggled: () =>
        html`Here it captures the trip start date — the format is plain ISO so it round-trips
        cleanly.`,
    },
    docs: '/dx/widgets-reference/input-fields/date-picker/',
  },
  update: {
    title: 'update()',
    base: () =>
      html`Mutate any widget from anywhere — set its value, swap its options, change visibility.
      Inline, no host code needed.`,
    context: {
      start: () => html`Here it sets the city's options to the cities of the chosen country.`,
    },
    docs: '/dx/features/events/',
  },
  include: {
    title: 'Conditional rendering',
    base: () =>
      html`The field appears or disappears as form state changes. Declared inline; no show/hide
      handlers.`,
    context: {
      countryPicked: () => html`The city is hidden until <code>$form.country</code> is set.`,
      cityPicked: () => html`The currency is hidden until <code>$form.city</code> is set.`,
      currencyPicked: () => html`The pets toggle appears once <code>$form.currency</code> is set.`,
      petsToggled: () => html`The date is hidden until the pets toggle has been touched.`,
    },
    docs: '/dx/features/states/',
  },
  submit: {
    title: 'onSubmit',
    base: () =>
      html`The form's submit handler. Receives the current form data — do whatever you need: fetch,
      log, navigate.`,
    context: {
      dateEntered: () =>
        html`In this case it just calls <code>process(data)</code> — your handler. The flip is
          incidental.`,
    },
    docs: '/dx/features/events/',
  },
  itemRenderer: {
    title: 'Item renderers',
    base: () =>
      html`Replace the default option markup with your own — icons, badges, multi-line layouts. Plug
      it in by name.`,
    context: {
      cityPicked: () =>
        html`The currency dropdown registers <code>currencyItemRenderer</code> for a 3-column layout
          (symbol, code, name).`,
    },
    docs: '/dx/features/item-renderers/',
  },
};

const CONFETTI_COLORS = ['#60a5fa', '#a855f7', '#f472b6', '#34d399', '#fbbf24'];
type ConfettiPiece = { x: number; y: number; color: string; delay: number; rot: number };

function makeConfetti(count = 28): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 130;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 120,
      rot: 360 + Math.random() * 360,
    };
  });
}

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef: ReturnType<FormElement['buildFormDef']>;
  formData: Record<string, unknown> = {};
  formConfig = {
    validateOn: 'submit' as ValidateOn,
    suppressAutomaticSubmit: true,
    itemRenderers: {
      currencyItemRenderer,
    },
  };
  config: GuiFormInitConfig;

  @state() declare stage: Stage;
  @state() declare furthestStage: Stage;
  @state() declare confetti: ConfettiPiece[] | null;
  @state() declare activeToken: Token;
  @state() declare activeFieldRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
  @state() declare connectorPath: string | null;
  @state() declare connectorBounds: { width: number; height: number } | null;
  @state() declare confettiOrigin: { left: number; top: number } | null;
  @state() declare resetCounter: number;
  @state() declare isFlipped: boolean;

  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private confettiTimer: ReturnType<typeof setTimeout> | null = null;
  private celebrateTimer: ReturnType<typeof setTimeout> | null = null;
  private petsTouched = false;
  private latestFormData: FormShape = {};

  constructor() {
    super();
    this.stage = 'start';
    this.furthestStage = 'start';
    this.confetti = null;
    this.activeToken = 'componentDropdown';
    this.activeFieldRect = null;
    this.connectorPath = null;
    this.connectorBounds = null;
    this.confettiOrigin = null;
    this.resetCounter = 0;
    this.isFlipped = false;
    this.formDef = this.buildFormDef();
    this.config = { formDef: this.formDef, data: this.formData, formConfig: this.formConfig };
  }

  private buildFormDef() {
    const onProgress = (data: FormShape) => this.handleProgress(data);
    return [
      gui.inputs.dropdown('country', {
        uid: 'country',
        items: COUNTRIES,
        onChange: ({ data, update }) => {
          const d = data as FormShape;
          // Updates city options on subsequent changes (city already registered)
          update({ path: 'city', options: CITIES[d.country ?? ''] ?? [] });
          onProgress(d);
        },
      }),
      gui.inputs.radiogroup('city', {
        uid: 'city',
        options: [],
        include: { when: '!!$form.country' },
        // Initial population — fires once when city is first included
        onLoad: ({ data, update }) => {
          const country = (data as FormShape).country;
          if (country) update({ path: 'city', options: CITIES[country] ?? [] });
        },
        onChange: ({ data }) => onProgress(data as FormShape),
      }),
      gui.inputs.dropdown('currency', {
        uid: 'currency',
        items: CURRENCIES,
        labelField: 'code',
        valueField: 'code',
        itemRenderer: 'currencyItemRenderer',
        include: { when: '!!$form.city' },
        onChange: ({ data, update }) => {
          const d = data as FormShape;
          // Re-apply city options — overrides are wiped on subsequent dispatches
          if (d.country) update({ path: 'city', options: CITIES[d.country] ?? [] });
          onProgress(d);
        },
      }),
      gui.inputs.checkbox('pets', {
        uid: 'pets',
        label: 'Travelling with pets?',
        include: { when: '!!$form.currency' },
        onChange: ({ data, update }) => {
          const d = data as FormShape;
          this.petsTouched = true;
          if (d.country) update({ path: 'city', options: CITIES[d.country] ?? [] });
          onProgress(d);
        },
      }),
      gui.inputs.datePicker('startDate', {
        uid: 'startDate',
        icon: 'calendar_month',
        prevMonthIcon: 'chevron_left',
        nextMonthIcon: 'chevron_right',
        prevMonthAriaLabel: 'Previous month',
        nextMonthAriaLabel: 'Next month',
        include: { when: '$form.pets != null' },
        onChange: ({ data, update }) => {
          const d = data as FormShape;
          if (d.country) update({ path: 'city', options: CITIES[d.country] ?? [] });
          onProgress(d);
          if (d.startDate) {
            requestAnimationFrame(() => {
              const picker = this.querySelector('gui-date-picker') as
                | (HTMLElement & { closeCalendar?: () => void })
                | null;
              picker?.closeCalendar?.();
            });
          }
        },
      }),
    ];
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.scheduleFieldRectCompute());
    this.resizeObserver.observe(this);

    this.mutationObserver = new MutationObserver(() => this.scheduleFieldRectCompute());
    this.mutationObserver.observe(this, { childList: true, subtree: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }

  override updated() {
    this.scheduleFieldRectCompute();
    this.querySelectorAll('input, select').forEach((el) => el.setAttribute('autocomplete', 'off'));
  }

  private scheduleFieldRectCompute() {
    requestAnimationFrame(() => {
      this.computeActiveFieldRect();
      this.computeConnectorPath();
    });
    setTimeout(() => {
      this.computeActiveFieldRect();
      this.computeConnectorPath();
    }, 120);
  }

  private computeConnectorPath() {
    const layoutEl = this.querySelector('.poc-stage__content') as HTMLElement | null;
    const tokenEl = this.querySelector('.poc-token.is-active') as HTMLElement | null;
    const detailEl = this.querySelector('.poc-stage__detail-box') as HTMLElement | null;
    if (!layoutEl || !tokenEl || !detailEl) {
      if (this.connectorPath !== null) {
        this.connectorPath = null;
        this.connectorBounds = null;
      }
      return;
    }
    const cRect = layoutEl.getBoundingClientRect();
    const tRect = tokenEl.getBoundingClientRect();
    const dRect = detailEl.getBoundingClientRect();
    const startX = tRect.left - cRect.left;
    const startY = tRect.top + tRect.height / 2 - cRect.top;
    const endX = dRect.left - cRect.left;
    const endY = dRect.top + dRect.height / 2 - cRect.top;
    const railX = 6;
    const r = 8;
    const path =
      `M ${startX} ${startY} ` +
      `L ${railX + r} ${startY} ` +
      `Q ${railX} ${startY} ${railX} ${startY + r} ` +
      `L ${railX} ${endY - r} ` +
      `Q ${railX} ${endY} ${railX + r} ${endY} ` +
      `L ${endX} ${endY}`;
    const bounds = { width: cRect.width, height: cRect.height };
    const sameBounds =
      this.connectorBounds &&
      this.connectorBounds.width === bounds.width &&
      this.connectorBounds.height === bounds.height;
    if (this.connectorPath !== path) this.connectorPath = path;
    if (!sameBounds) this.connectorBounds = bounds;
  }

  private findActiveFieldElement(): HTMLElement | null {
    const stagePath: Record<Stage, string | null> = {
      start: 'host-country',
      countryPicked: 'host-city',
      cityPicked: 'host-currency',
      currencyPicked: 'host-pets',
      petsToggled: 'host-startDate',
      dateEntered: null,
      submitted: null,
    };
    const id = stagePath[this.stage];
    if (id === null) return null;
    const el = this.querySelector(`#${id}`) as HTMLElement | null;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return rect.height > 10 ? el : null;
  }

  private computeActiveFieldRect() {
    const target = this.findActiveFieldElement();
    const wrapper = this.querySelector('.poc-stage__form') as HTMLElement | null;
    if (!target || !wrapper) {
      if (this.activeFieldRect !== null) this.activeFieldRect = null;
      return;
    }
    const tRect = target.getBoundingClientRect();
    const wRect = wrapper.getBoundingClientRect();
    const pad = 8;
    const rect = {
      top: tRect.top - wRect.top - pad,
      left: tRect.left - wRect.left - pad,
      width: tRect.width + pad * 2,
      height: tRect.height + pad * 2,
    };
    const same =
      this.activeFieldRect &&
      this.activeFieldRect.top === rect.top &&
      this.activeFieldRect.left === rect.left &&
      this.activeFieldRect.width === rect.width &&
      this.activeFieldRect.height === rect.height;
    if (!same) this.activeFieldRect = rect;
  }

  private handleProgress($form: FormShape) {
    this.latestFormData = { ...$form };
    if (this.stage === 'submitted') return;
    let target: Stage = 'start';
    if ($form.startDate && this.petsTouched) target = 'dateEntered';
    else if (this.petsTouched) target = 'petsToggled';
    else if ($form.currency) target = 'currencyPicked';
    else if ($form.city) target = 'cityPicked';
    else if ($form.country) target = 'countryPicked';

    const targetIdx = STAGE_TO_STEP_INDEX[target];
    const furthestIdx = STAGE_TO_STEP_INDEX[this.furthestStage];
    if (targetIdx > furthestIdx) this.furthestStage = target;

    const wasAtFurthest = STAGE_TO_STEP_INDEX[this.stage] === furthestIdx;
    if (wasAtFurthest && target !== this.stage) {
      this.stage = target;
      this.scheduleCelebration();
      this.activeToken = STAGE_HEADLINE_TOKEN[this.stage];
      this.scheduleFieldRectCompute();
    }
  }

  private scheduleCelebration(count = 28) {
    if (this.celebrateTimer) clearTimeout(this.celebrateTimer);
    this.celebrateTimer = setTimeout(() => {
      this.celebrateTimer = null;
      this.celebrate(count);
    }, 450);
  }

  private async celebrate(count = 28) {
    if (this.confettiTimer) clearTimeout(this.confettiTimer);
    await this.updateComplete;
    const tokenEl = this.querySelector('.poc-token.is-active') as HTMLElement | null;
    const codeEl = this.querySelector('.poc-stage__code') as HTMLElement | null;
    if (tokenEl && codeEl) {
      const tRect = tokenEl.getBoundingClientRect();
      const cRect = codeEl.getBoundingClientRect();
      this.confettiOrigin = {
        left: tRect.left + tRect.width / 2 - cRect.left,
        top: tRect.top + tRect.height / 2 - cRect.top,
      };
    } else {
      this.confettiOrigin = null;
    }
    this.confetti = makeConfetti(count);
    this.confettiTimer = setTimeout(() => {
      this.confetti = null;
      this.confettiOrigin = null;
      this.confettiTimer = null;
    }, 1700);
  }

  private handleSubmit() {
    if (this.stage !== 'dateEntered') return;
    this.stage = 'submitted';
    this.furthestStage = 'submitted';
    this.activeToken = STAGE_HEADLINE_TOKEN['submitted'];
    this.celebrate(160);
    setTimeout(() => {
      this.isFlipped = true;
    }, 80);
  }

  private startAgain() {
    this.resetDemo();
    this.isFlipped = false;
  }

  private resetDemo() {
    if (this.confettiTimer) {
      clearTimeout(this.confettiTimer);
      this.confettiTimer = null;
    }
    if (this.celebrateTimer) {
      clearTimeout(this.celebrateTimer);
      this.celebrateTimer = null;
    }
    this.stage = 'start';
    this.furthestStage = 'start';
    this.activeToken = STAGE_HEADLINE_TOKEN['start'];
    this.petsTouched = false;
    this.latestFormData = {};
    this.formData = {};
    this.formDef = this.buildFormDef();
    this.config = { formDef: this.formDef, data: this.formData, formConfig: this.formConfig };
    this.activeFieldRect = null;
    this.confetti = null;
    this.confettiOrigin = null;
    this.connectorPath = null;
    this.connectorBounds = null;
    this.resetCounter += 1;
  }

  private jumpToStep(stepIdx: number) {
    const currentIdx = STAGE_TO_STEP_INDEX[this.stage];
    const furthestIdx = STAGE_TO_STEP_INDEX[this.furthestStage];
    if (stepIdx === currentIdx || stepIdx > furthestIdx) return;
    const stages: Stage[] = [
      'start',
      'countryPicked',
      'cityPicked',
      'currencyPicked',
      'petsToggled',
      'dateEntered',
    ];
    this.stage = stages[stepIdx];
    this.activeToken = STAGE_HEADLINE_TOKEN[this.stage];
  }

  private onTokenClick(token: Token) {
    this.activeToken = token;
  }

  private renderToken(token: Token, label: string) {
    const isActive = this.activeToken === token;
    return html`<span
      class="poc-token ${isActive ? 'is-active' : ''}"
      role="button"
      tabindex="0"
      @click=${() => this.onTokenClick(token)}
      @keydown=${(e: KeyboardEvent) =>
        (e.key === 'Enter' || e.key === ' ') && this.onTokenClick(token)}
      >${label}</span
    >`;
  }

  private renderCountryCode() {
    return html`${this.renderToken('componentDropdown', 'gui.inputs.dropdown')}('country', { items:
    ['United States', 'Japan', 'Brazil', 'France'], onChange: ({ data, update }) =>
    ${this.renderToken('update', "update({ path: 'city', options: CITIES[data.country] })")}, }),`;
  }

  private renderCityCode() {
    return html`${this.renderToken('componentRadiogroup', 'gui.inputs.radiogroup')}('city', {
    ${this.renderToken('include', "include: { when: '!!$form.country' }")}, }),`;
  }

  private renderCurrencyCode() {
    return html`${this.renderToken('componentDropdown', 'gui.inputs.dropdown')}('currency', { items:
    CURRENCIES, ${this.renderToken('itemRenderer', "itemRenderer: 'currencyItemRenderer'")},
    ${this.renderToken('include', "include: { when: '!!$form.city' }")}, }),`;
  }

  private renderPetsCode() {
    return html`${this.renderToken('componentCheckbox', 'gui.inputs.checkbox')}('pets', { label:
    'Travelling with pets?',
    ${this.renderToken('include', "include: { when: '!!$form.currency' }")}, }),`;
  }

  private renderDateCode() {
    return html`${this.renderToken('componentDatePicker', 'gui.inputs.datePicker')}('startDate', {
    icon: 'calendar_month',
    ${this.renderToken('include', "include: { when: '$form.pets != null' }")}, }),`;
  }

  private renderSubmitCode() {
    return html`formConfig: { ${this.renderToken('submit', 'onSubmit: (data) => process(data)')}, }`;
  }

  private renderCurrentCode() {
    switch (this.stage) {
      case 'start':
        return this.renderCountryCode();
      case 'countryPicked':
        return this.renderCityCode();
      case 'cityPicked':
        return this.renderCurrencyCode();
      case 'currencyPicked':
        return this.renderPetsCode();
      case 'petsToggled':
        return this.renderDateCode();
      case 'dateEntered':
      case 'submitted':
        return this.renderSubmitCode();
    }
  }

  override render() {
    const showHint = this.activeFieldRect != null;
    const tokenInfo = TOKEN_INFO[this.activeToken];
    const currentStep = STAGE_TO_STEP_INDEX[this.stage];
    const furthestStep = STAGE_TO_STEP_INDEX[this.furthestStage];
    const formPromptCopy = STAGE_PROMPT_FORM[this.stage];
    const codePromptCopy = STAGE_PROMPT_CODE[this.stage];
    const contextDesc = tokenInfo.context?.[this.stage];
    const renderPrompt = (key: string, text: string) => html`
      <aside class="poc-stage__prompt">
        ${keyed(key, html`<p class="poc-stage__prompt-copy">${text}</p>`)}
      </aside>
    `;
    const renderStep = (label: string, i: number) => {
      const isActive = i === currentStep;
      const isVisited = i <= furthestStep;
      const status = isActive ? 'is-active' : isVisited ? 'is-done' : 'is-pending';
      const clickable = !isActive && isVisited;
      return html`
        <button
          type="button"
          class="poc-stage__step ${status}"
          ?disabled=${!clickable}
          @click=${() => clickable && this.jumpToStep(i)}
        >
          <span class="poc-stage__step-marker">
            ${isActive ? i + 1 : isVisited ? '✓' : i + 1}
          </span>
          <span class="poc-stage__step-label">${label}</span>
        </button>
        ${i < STEP_LABELS.length - 1
          ? html`<span class="poc-stage__step-sep" aria-hidden="true"></span>`
          : null}
      `;
    };
    return html`
      <div class="poc-stage__flipper ${this.isFlipped ? 'is-flipped' : ''}">
        <section class="poc-stage poc-stage__face poc-stage__face--front" data-stage=${this.stage}>
          <div class="poc-stage__layout">
            <aside class="poc-stage__rail" aria-label="Demo progress">
              <button
                type="button"
                class="poc-stage__rail-reset"
                ?disabled=${this.stage === 'start'}
                @click=${() => this.resetDemo()}
                aria-label="Start over"
                title="Start over"
              >
                <span class="poc-stage__rail-reset-icon" aria-hidden="true">↻</span>
                <span class="poc-stage__rail-reset-label">Start over</span>
              </button>
              ${STEP_LABELS.map((label, i) => renderStep(label, i))}
            </aside>

            <div class="poc-stage__content">
              ${this.connectorPath && this.connectorBounds
                ? html`
                    <svg
                      class="poc-stage__connectors"
                      viewBox="0 0 ${this.connectorBounds.width} ${this.connectorBounds.height}"
                      width=${this.connectorBounds.width}
                      height=${this.connectorBounds.height}
                      aria-hidden="true"
                    >
                      <path d=${this.connectorPath} />
                    </svg>
                  `
                : null}
              <div class="poc-stage__row">
                <div class="poc-stage__form">
                  ${keyed(this.resetCounter, html`<gui-form .config=${this.config}></gui-form>`)}
                  ${this.stage === 'dateEntered'
                    ? html`<button
                        type="button"
                        class="poc-stage__submit"
                        @click=${() => this.handleSubmit()}
                      >
                        Submit →
                      </button>`
                    : null}
                  ${showHint && this.activeFieldRect
                    ? html`
                        <div
                          class="poc-stage__field-glow"
                          style="top: ${this.activeFieldRect.top}px; left: ${this.activeFieldRect
                            .left}px; width: ${this.activeFieldRect.width}px; height: ${this
                            .activeFieldRect.height}px"
                        ></div>
                      `
                    : null}
                </div>
                ${renderPrompt(`form-${this.stage}`, formPromptCopy)}
              </div>

              <div class="poc-stage__row">
                <div class="poc-stage__code">
                  ${keyed(
                    this.stage,
                    html`<pre
                      class="poc-stage__code-reveal is-active-step"
                    ><code>${this.renderCurrentCode()}</code></pre>`,
                  )}
                  ${this.confetti
                    ? html`
                        <div
                          class="poc-confetti"
                          aria-hidden="true"
                          style=${this.confettiOrigin
                            ? `--origin-x: ${this.confettiOrigin.left}px; --origin-y: ${this.confettiOrigin.top}px;`
                            : ''}
                        >
                          ${this.confetti.map(
                            (p) => html`
                              <span
                                class="poc-confetti__piece"
                                style="--x: ${p.x}px; --y: ${p.y}px; --color: ${p.color}; --delay: ${p.delay}ms; --rot: ${p.rot}deg"
                              ></span>
                            `,
                          )}
                        </div>
                      `
                    : null}
                </div>
                ${renderPrompt(`code-${this.stage}`, codePromptCopy)}
              </div>

              <div class="poc-stage__row poc-stage__row--solo">
                <div class="poc-stage__detail-box">
                  <h4 class="poc-stage__detail-title">${tokenInfo.title}</h4>
                  <p class="poc-stage__detail-body">
                    ${tokenInfo.base()}${contextDesc ? html` — ${contextDesc()}` : null}
                  </p>
                  <a
                    class="poc-stage__detail-link"
                    href=${tokenInfo.docs}
                    target="_top"
                    rel="noopener"
                    >Read the docs →</a
                  >
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          class="poc-stage poc-stage__face poc-stage__face--back"
          aria-hidden=${!this.isFlipped}
        >
          <div class="poc-stage__back">
            <h3 class="poc-stage__back-headline">That's GolemUI in five fields.</h3>
            <div class="poc-stage__back-grid">
              <div class="poc-stage__back-col">
                <h4>Data</h4>
                <pre class="poc-stage__back-code"><code>${JSON.stringify(
                  this.latestFormData,
                  null,
                  2,
                )}</code></pre>
              </div>
              <div class="poc-stage__back-col">
                <h4>Code</h4>
                <pre class="poc-stage__back-code"><code>const formDef = [
  gui.inputs.dropdown('country', {
    items: ['United States', 'Japan', 'Brazil', 'France'],
    onChange: ({ data, update }) =>
      update({ path: 'city', options: CITIES[data.country] }),
  }),
  gui.inputs.radiogroup('city', {
    include: { when: '!!$form.country' },
  }),
  gui.inputs.dropdown('currency', {
    items: CURRENCIES,
    itemRenderer: 'currencyItemRenderer',
    include: { when: '!!$form.city' },
  }),
  gui.inputs.checkbox('pets', {
    label: 'Travelling with pets?',
    include: { when: '!!$form.currency' },
  }),
  gui.inputs.datePicker('startDate', {
    include: { when: '$form.pets != null' },
  }),
];

const formConfig = { onSubmit: (data) => process(data) };</code></pre>
              </div>
            </div>
            <div class="poc-stage__back-footer">
              <button
                type="button"
                class="poc-stage__back-restart"
                @click=${() => this.startAgain()}
              >
                ↻ Start again
              </button>
              <button
                type="button"
                class="poc-stage__back-codesandbox"
                @click=${() => alert('Coming soon')}
              >
                Open in Codesandbox →
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
