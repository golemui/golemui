import { iframeResizer, iframeThemeSync } from '@golemui/apps-shared';
import '@golemui/gui-lit';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import './app.element.scss';

type FragmentKey = 'profile' | 'address' | 'preferences' | 'payment';
type Tab = 'json' | 'dsl';

const STORAGE_KEY = 'gui-serializable-poc-v1';

type FragmentChangeHandler = (e: { data: unknown }) => void;
type Fragment = {
  key: FragmentKey;
  label: string;

  build: (onChange: FragmentChangeHandler) => any[]; // formDef builder
  json: unknown[]; // display-friendly JSON snapshot
  dsl: string; // DSL source string
};

const FRAGMENTS: Record<FragmentKey, Fragment> = {
  profile: {
    key: 'profile',
    label: 'Profile',
    build: (onChange) => [
      gui.inputs.textInput('fullName', {
        uid: 'profile.fullName',
        label: 'Full name',
        onChange,
      }),
      gui.inputs.textInput('email', {
        uid: 'profile.email',
        label: 'Email',
        validator: { required: true, format: 'email' },
        onChange,
      }),
    ],
    json: [
      { type: 'textInput', path: 'fullName', label: 'Full name' },
      {
        type: 'textInput',
        path: 'email',
        label: 'Email',
        validator: { format: 'email' },
      },
    ],
    dsl: `gui.inputs.textInput('fullName', { label: 'Full name' }),
gui.inputs.textInput('email',    { label: 'Email', validator: { format: 'email' } }),`,
  },
  address: {
    key: 'address',
    label: 'Address',
    build: (onChange) => [
      gui.inputs.textInput('city', { uid: 'address.city', label: 'City', onChange }),
      gui.inputs.dropdown('country', {
        uid: 'address.country',
        label: 'Country',
        items: ['United States', 'Japan', 'Brazil', 'France'],
        onChange,
      }),
    ],
    json: [
      { type: 'textInput', path: 'city', label: 'City' },
      {
        type: 'dropdown',
        path: 'country',
        label: 'Country',
        items: ['United States', 'Japan', 'Brazil', 'France'],
      },
    ],
    dsl: `gui.inputs.textInput('city',  { label: 'City' }),
gui.inputs.dropdown('country', { label: 'Country', items: COUNTRIES }),`,
  },
  preferences: {
    key: 'preferences',
    label: 'Preferences',
    build: (onChange) => [
      gui.inputs.checkbox('newsletter', {
        uid: 'preferences.newsletter',
        label: 'Subscribe to newsletter',
        onChange,
      }),
      gui.inputs.dropdown('theme', {
        uid: 'preferences.theme',
        label: 'Preferred theme',
        items: ['Light', 'Dark', 'System'],
        onChange,
      }),
    ],
    json: [
      { type: 'checkbox', path: 'newsletter', label: 'Subscribe to newsletter' },
      {
        type: 'dropdown',
        path: 'theme',
        label: 'Preferred theme',
        items: ['Light', 'Dark', 'System'],
      },
    ],
    dsl: `gui.inputs.checkbox('newsletter', { label: 'Subscribe to newsletter' }),
gui.inputs.dropdown('theme',     { label: 'Preferred theme', items: ['Light', 'Dark', 'System'] }),`,
  },
  payment: {
    key: 'payment',
    label: 'Payment',
    build: (onChange) => [
      gui.inputs.textInput('cardNumber', {
        uid: 'payment.cardNumber',
        label: 'Card number',
        onChange,
      }),
      gui.inputs.password('cvv', { uid: 'payment.cvv', label: 'CVV', onChange }),
    ],
    json: [
      { type: 'textInput', path: 'cardNumber', label: 'Card number' },
      { type: 'password', path: 'cvv', label: 'CVV' },
    ],
    dsl: `gui.inputs.textInput('cardNumber', { label: 'Card number' }),
gui.inputs.password('cvv',        { label: 'CVV' }),`,
  },
};

const FRAGMENT_KEYS: FragmentKey[] = ['profile', 'address', 'preferences', 'payment'];

@customElement('gui-serializable')
export class SerializableElement extends LitElement {
  @state() declare private added: FragmentKey[];
  @state() declare private activeTab: Tab;
  @state() declare private savedAt: number | null;
  @state() declare private loadedAt: number | null;
  @state() declare private draggingKey: FragmentKey | null;
  @state() declare private dragOverIdx: number | null;
  @state() declare private codeSeq: number;
  @state() declare private formData: Partial<Record<FragmentKey, Record<string, unknown>>>;
  @state() declare private progress: {
    changed: boolean;
    saved: boolean;
    changedAfter: boolean;
    restored: boolean;
  };

  // Per-fragment gui-form config cache. Keyed by `${index}-${loadedAt ?? 0}` so
  // the cached reference is reused across parent re-renders (e.g. when
  // `formData` updates on user input) and rebuilt only when the row remounts
  // via keyed(...) — i.e. when reordered or restored from storage.
  private fragmentConfigCache: Partial<
    Record<FragmentKey, { cacheKey: string; config: GuiFormInitConfig }>
  > = {};

  private getFragmentConfig(key: FragmentKey, i: number): GuiFormInitConfig {
    const cacheKey = `${i}-${this.loadedAt ?? 0}`;
    const cached = this.fragmentConfigCache[key];
    if (cached?.cacheKey === cacheKey) return cached.config;
    const config: GuiFormInitConfig = {
      formDef: FRAGMENTS[key].build(({ data }) => this.handleFragmentChange(key, data)),
      data: this.formData[key] ?? {},
    };
    this.fragmentConfigCache[key] = { cacheKey, config };
    return config;
  }

  constructor() {
    super();
    this.added = [];
    this.activeTab = 'dsl';
    this.savedAt = null;
    this.loadedAt = null;
    this.draggingKey = null;
    this.dragOverIdx = null;
    this.codeSeq = 0;
    this.formData = {};
    this.progress = {
      changed: false,
      saved: false,
      changedAfter: false,
      restored: false,
    };
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    iframeThemeSync();
  }

  private bumpCode() {
    this.codeSeq += 1;
  }

  private markChanged() {
    const next = { ...this.progress };
    if (!next.changed) next.changed = true;
    if (next.saved && !next.changedAfter) next.changedAfter = true;
    if (next !== this.progress) this.progress = next;
  }

  private handleFragmentChange(key: FragmentKey, data: unknown) {
    this.formData = {
      ...this.formData,
      [key]: { ...(data as Record<string, unknown>) },
    };
    this.markChanged();
  }

  private addFragment(key: FragmentKey) {
    if (this.added.includes(key)) return;
    this.added = [...this.added, key];
    this.savedAt = null;
    this.loadedAt = null;
    this.markChanged();
    this.bumpCode();
  }

  private removeFragment(key: FragmentKey) {
    if (!this.added.includes(key)) return;
    this.added = this.added.filter((k) => k !== key);
    this.savedAt = null;
    this.loadedAt = null;
    this.markChanged();
    this.bumpCode();
  }

  private moveFragment(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    if (fromIdx >= this.added.length || toIdx >= this.added.length) return;
    const next = [...this.added];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    this.added = next;
    this.savedAt = null;
    this.loadedAt = null;
    this.markChanged();
    this.bumpCode();
  }

  private onDragStart(e: DragEvent, key: FragmentKey) {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
    }
    this.draggingKey = key;
  }

  private onDragOver(e: DragEvent, idx: number) {
    if (this.draggingKey === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (this.dragOverIdx !== idx) this.dragOverIdx = idx;
  }

  private onDrop(e: DragEvent, toIdx: number) {
    e.preventDefault();
    if (this.draggingKey === null) return;
    const fromIdx = this.added.indexOf(this.draggingKey);
    this.moveFragment(fromIdx, toIdx);
    this.draggingKey = null;
    this.dragOverIdx = null;
  }

  private onDragEnd() {
    this.draggingKey = null;
    this.dragOverIdx = null;
  }

  private reset() {
    if (this.added.length === 0) return;
    this.added = [];
    this.formData = {};
    this.savedAt = null;
    this.loadedAt = null;
    this.markChanged();
    this.bumpCode();
  }

  private save() {
    if (this.added.length === 0) return;
    try {
      const payload = { added: this.added, formData: this.formData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      this.savedAt = Date.now();
      this.loadedAt = null;
      if (this.progress.changed && !this.progress.saved) {
        this.progress = { ...this.progress, saved: true };
      }
    } catch {
      /* localStorage unavailable — POC swallows */
    }
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as
        | FragmentKey[]
        | { added: FragmentKey[]; formData: Partial<Record<FragmentKey, Record<string, unknown>>> };
      // backwards-compat: older saves were just an array of fragment keys
      if (Array.isArray(parsed)) {
        this.added = parsed.filter((k): k is FragmentKey => FRAGMENT_KEYS.includes(k));
        this.formData = {};
      } else {
        this.added = parsed.added.filter((k): k is FragmentKey => FRAGMENT_KEYS.includes(k));
        this.formData = parsed.formData ?? {};
      }
      this.loadedAt = Date.now();
      this.savedAt = null;
      if (this.progress.changedAfter && !this.progress.restored) {
        this.progress = { ...this.progress, restored: true };
      }
      this.bumpCode();
    } catch {
      /* ignore */
    }
  }

  private renderForm(): TemplateResult {
    if (this.added.length === 0) {
      return html`<div class="ds-empty">
        <p class="ds-empty__title">Your form is empty.</p>
        <p class="ds-empty__hint">Click a fragment below to start composing.</p>
      </div>`;
    }
    return html`<div class="srz-sections">
      ${this.added.map(
        (key, i) =>
          html`<section
            class="srz-section ${this.draggingKey === key ? 'is-dragging' : ''} ${this
              .dragOverIdx === i &&
            this.draggingKey !== null &&
            this.draggingKey !== key
              ? 'is-drop-target'
              : ''}"
            data-fragment=${key}
            @dragover=${(e: DragEvent) => this.onDragOver(e, i)}
            @drop=${(e: DragEvent) => this.onDrop(e, i)}
            @dragleave=${() => {
              if (this.dragOverIdx === i) this.dragOverIdx = null;
            }}
          >
            <header
              class="srz-section__header"
              draggable="true"
              @dragstart=${(e: DragEvent) => this.onDragStart(e, key)}
              @dragend=${() => this.onDragEnd()}
            >
              <span class="srz-section__handle" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
              <span class="srz-section__index">${i + 1}</span>
              <span class="srz-section__title">${FRAGMENTS[key].label}</span>
              <button
                type="button"
                class="srz-section__remove"
                aria-label=${`Remove ${FRAGMENTS[key].label} section`}
                title="Remove section"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.removeFragment(key);
                }}
                @mousedown=${(e: Event) => e.stopPropagation()}
              >
                ×
              </button>
            </header>
            ${keyed(
              `${key}-${i}-${this.loadedAt ?? 0}`,
              html`<gui-form .config=${this.getFragmentConfig(key, i)}></gui-form>`,
            )}
          </section>`,
      )}
    </div>`;
  }

  private renderTray(): TemplateResult {
    return html`<section class="srz-tray">
      <header class="srz-tray__header">
        <span class="srz-tray__title">Add a section</span>
        <span class="srz-tray__hint">Each pill appends a form fragment.</span>
      </header>
      <div class="srz-tray__pills">
        ${FRAGMENT_KEYS.map((key) => {
          const isAdded = this.added.includes(key);
          return html`<button
            type="button"
            class="srz-pill ${isAdded ? 'is-added' : ''}"
            ?disabled=${isAdded}
            @click=${() => this.addFragment(key)}
          >
            <span class="srz-pill__plus" aria-hidden="true">${isAdded ? '✓' : '+'}</span>
            <span class="srz-pill__label">${FRAGMENTS[key].label}</span>
          </button>`;
        })}
      </div>
    </section>`;
  }

  private renderStepper(): TemplateResult {
    const p = this.progress;
    const hasContent = this.added.length > 0;

    // The "active" step is the first non-done one
    const stepStatus = (i: 1 | 2 | 3 | 4): 'done' | 'active' | 'pending' => {
      const done = [p.changed, p.saved, p.changedAfter, p.restored];
      if (done[i - 1]) return 'done';
      const firstActive = done.findIndex((d) => !d) + 1;
      return firstActive === i ? 'active' : 'pending';
    };

    const renderCheck = (status: 'done' | 'active' | 'pending') =>
      status === 'done'
        ? html`<span class="ds-step__check is-done" aria-hidden="true">✓</span>`
        : html`<span
            class="ds-step__check ${status === 'active' ? 'is-active' : ''}"
            aria-hidden="true"
          ></span>`;

    return html`<nav class="ds-stepper" aria-label="Demo flow">
      <ol class="ds-stepper__list">
        <li class="ds-step ds-step--${stepStatus(1)}">
          ${renderCheck(stepStatus(1))}
          <div class="ds-step__body">
            <span class="ds-step__label"><span class="ds-step__num">1</span> Change the form</span>
            <span class="ds-step__hint">Click a fragment below ↓</span>
          </div>
        </li>

        <li class="ds-step ds-step--${stepStatus(2)}">
          ${renderCheck(stepStatus(2))}
          <div class="ds-step__body">
            <span class="ds-step__label"><span class="ds-step__num">2</span> Save the form</span>
            <button
              type="button"
              class="ds-step__action ds-step__action--accent"
              ?disabled=${!hasContent}
              @click=${() => this.save()}
            >
              Save to local history
            </button>
          </div>
        </li>

        <li class="ds-step ds-step--${stepStatus(3)}">
          ${renderCheck(stepStatus(3))}
          <div class="ds-step__body">
            <span class="ds-step__label"
              ><span class="ds-step__num">3</span> Reset or change further</span
            >
            <button
              type="button"
              class="ds-step__action ds-step__action--ghost"
              ?disabled=${!hasContent}
              @click=${() => this.reset()}
            >
              Reset the form
            </button>
          </div>
        </li>

        <li class="ds-step ds-step--${stepStatus(4)}">
          ${renderCheck(stepStatus(4))}
          <div class="ds-step__body">
            <span class="ds-step__label"><span class="ds-step__num">4</span> Restore</span>
            <button
              type="button"
              class="ds-step__action ds-step__action--primary"
              @click=${() => this.load()}
            >
              Load latest save
            </button>
          </div>
        </li>
      </ol>
    </nav>`;
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
    if (this.added.length === 0) {
      return '// add a section and start typing — the data appears here';
    }
    const visible: Record<string, unknown> = {};
    this.added.forEach((key) => {
      const d = this.formData[key];
      if (d && Object.keys(d).length > 0) visible[key] = d;
    });
    if (Object.keys(visible).length === 0) {
      return '// type into the form — data appears here as you go';
    }
    return JSON.stringify(visible, null, 2);
  }

  private renderJson(): string {
    const merged = this.added.flatMap((k) => FRAGMENTS[k].json);
    return JSON.stringify(merged, null, 2);
  }

  private renderDsl(): string {
    if (this.added.length === 0) return '// pick a fragment to start';
    const body = this.added
      .map((k) => `  // ${FRAGMENTS[k].label}\n  ${FRAGMENTS[k].dsl.split('\n').join('\n  ')}`)
      .join('\n\n');
    return `const formDef = [\n${body}\n];`;
  }

  override render() {
    return html`<div class="ds-shell">
      ${this.renderStepper()}
      <div class="ds-grid">
        <section class="ds-left">
          <div class="ds-canvas">${this.renderForm()} ${this.renderTray()}</div>
        </section>
        <section class="ds-right">
          <div class="ds-pane ds-pane--top">
            <header class="ds-pane__header">
              ${this.renderTabs()}
              <span class="ds-pane__caption">Schema</span>
            </header>
            ${keyed(
              this.codeSeq,
              html`<pre class="ds-code"><code>${this.activeTab === 'dsl'
                ? this.renderDsl()
                : this.renderJson()}</code></pre>`,
            )}
          </div>
          <div class="ds-pane ds-pane--bottom">
            <header class="ds-pane__header">
              <span class="ds-pane__title">Form data (live)</span>
              <span class="ds-pane__caption">Type into the form ↑</span>
            </header>
            <pre class="ds-code ds-code--data"><code>${this.renderLiveData()}</code></pre>
          </div>
        </section>
      </div>
    </div>`;
  }
}
