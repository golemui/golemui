import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import * as GuiValidators from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components';
import type { ChecklistItem, CodeModalMode } from '../../components';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { FORM_SOURCE } from './form-source';
import './form.element.scss';

const mock = AppsShared.appetizer;

const CHECKLIST_TITLE = 'Take GolemUI for a spin';
const CHECKLIST_SUBTITLE = 'Try each step in the form on the right — checkmarks turn green as you go.';

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'change-country',
    label: 'Change the departure country',
    description:
      'Pick a different country and watch the Travel Budget currency adapt instantly — reactive props with zero glue code.',
  },
  {
    id: 'date-validation',
    label: 'Trigger a date validation',
    description:
      'Try selecting more than three dates. Validation rules are declarative and fully customizable from the schema.',
  },
  {
    id: 'conditional-fields',
    label: 'Reveal a conditional field',
    description:
      'Toggle "Include Pets" to make a new field appear. Conditional logic lives right in the form definition.',
  },
  {
    id: 'i18n',
    label: 'Experience real i18n',
    description:
      'Type a budget, then change the language. Labels, date formats, weekday order, currency formatting and even text direction (RTL) update automatically — no extra code.',
  },
  {
    id: 'keyboard-nav',
    label: 'Navigate with the keyboard',
    description:
      'Press Tab to move through the form. GolemUI ships WCAG 2.1 AA accessibility for free, so every visitor gets a great experience.',
  },
  {
    id: 'submit-data',
    label: 'Submit and inspect the data',
    description:
      'Complete every field and submit. We will pop open the resulting JSON payload so you can see exactly what your app receives.',
  },
  {
    id: 'check-code',
    label: 'Peek at the source',
    description:
      'See the entire declarative definition behind this demo — validations, logic, i18n, ARIA and more.',
    linkText: 'open the source',
  },
];

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = mock.form;
  formData = mock.data;
  localization = AppsShared.initializeI18n(mock.resources);
  languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));
  itemRenderers = {
    countryItemRenderer: countryItemRenderer,
  };
  middlewares = [AppsShared.loggerMiddleware];
  customValidators: GuiValidators.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  validateOn: Core.ValidateOn = 'eager';
  checklistItems = CHECKLIST_ITEMS;
  formSource = FORM_SOURCE;

  @state() declare error: string;
  @state() declare completed: Record<string, boolean>;
  @state() declare modalOpen: boolean;
  @state() declare modalMode: CodeModalMode;
  @state() declare modalData: unknown;

  private previousData: Record<string, any> = {};
  private lastHealth: Core.FormHealth | null = null;
  private budgetTouched = false;
  private languageChangedOnce = false;
  private tabKeysPressed = 0;
  private focusedFields = new Set<Element>();

  private onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Tab') {
      this.tabKeysPressed += 1;
      this.recomputeKeyboardNav();
    }
  };

  constructor() {
    super();
    this.error = '';
    this.completed = {};
    this.modalOpen = false;
    this.modalMode = 'submit';
    this.modalData = null;
  }

  private onFocusIn = (ev: FocusEvent) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const focusable = (target as HTMLElement).closest(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      this.focusedFields.add(focusable);
      this.recomputeKeyboardNav();
    }
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('focusin', this.onFocusIn);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('focusin', this.onFocusIn);
  }

  protected onFormHealth(event: CustomEvent<Core.FormHealth>) {
    const health = event.detail;
    this.lastHealth = health;
    this.error = health.status === 'errored' ? (health.message ?? '') : '';
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected async onFormEvent(event: CustomEvent<Core.FormEvent>) {
    const { name, data } = event.detail;
    if (name === 'fieldChange') {
      this.handleFieldChange(data);
    } else if (name === 'onSelectLanguage') {
      this.languageChangedOnce = true;
      this.recomputeI18n();
      this.onLanguageChanged(event);
    } else if (name === 'handleSubmit') {
      this.handleSubmit(event.detail);
    } else {
      await AppsShared.onFormEvent(event.detail);
    }
    this.previousData = structuredClone(data ?? {});
    Promise.resolve().then(() => this.requestUpdate());
  }

  private handleFieldChange(data: Record<string, any>) {
    const prev = this.previousData;
    if (data.departureCountry && data.departureCountry !== prev.departureCountry) {
      this.markComplete('change-country');
    }
    if (data.includePets === true && prev.includePets !== true) {
      this.markComplete('conditional-fields');
    }
    if (data.budget && Number(data.budget) > 0) {
      if (!this.budgetTouched) {
        this.budgetTouched = true;
        this.recomputeI18n();
      }
    }
    const dates = Array.isArray(data.preferredDates) ? data.preferredDates : [];
    if (dates.length > 3) {
      this.markComplete('date-validation');
    }
  }

  private handleSubmit(detail: Core.FormEvent) {
    if (this.lastHealth?.status === 'ok') {
      this.markComplete('submit-data');
    }
    this.modalMode = 'submit';
    this.modalData = detail.data;
    this.modalOpen = true;
  }

  private recomputeI18n() {
    if (this.budgetTouched && this.languageChangedOnce) {
      this.markComplete('i18n');
    }
  }

  private recomputeKeyboardNav() {
    if (this.tabKeysPressed >= 1 && this.focusedFields.size >= 2) {
      this.markComplete('keyboard-nav');
    }
  }

  private markComplete(id: string) {
    if (this.completed[id]) return;
    this.completed = { ...this.completed, [id]: true };
  }

  protected onLanguageChanged(event: CustomEvent<{ data: any }>) {
    const code = event.detail.data.language;
    i18next.changeLanguage(code);
  }

  protected setLanguage(code: string) {
    i18next.changeLanguage(code);
  }

  private onCheckCodeClick() {
    this.markComplete('check-code');
    this.modalMode = 'source';
    this.modalData = null;
    this.modalOpen = true;
  }

  private onModalClose() {
    this.modalOpen = false;
  }

  override render() {
    return html`
      <div class="demo-layout">
        <gui-checklist
          .items=${this.checklistItems}
          .completed=${this.completed}
          .title=${CHECKLIST_TITLE}
          .subtitle=${CHECKLIST_SUBTITLE}
          @checkCodeClick=${this.onCheckCodeClick}
        ></gui-checklist>
        <div class="demo-form">
          ${this.error ? html`<p class="error">${this.error}</p>` : null}
          <gui-form
            .formDef=${this.formDef}
            .data=${this.formData}
            .itemRenderers=${this.itemRenderers}
            .localization=${this.localization}
            .middlewares=${this.middlewares}
            .customValidators=${this.customValidators}
            .validateOn=${this.validateOn}
            @formHealth=${this.onFormHealth}
            @formEvent=${this.onFormEvent}
          ></gui-form>
        </div>
      </div>
      <gui-code-modal
        .open=${this.modalOpen}
        .mode=${this.modalMode}
        .data=${this.modalData}
        .source=${this.formSource}
        @close=${this.onModalClose}
      ></gui-code-modal>
    `;
  }
}
