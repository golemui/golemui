import type { Localizable, MutableI18nTranslator } from '@golemui/core';
import { gui } from '@golemui/gui-shared';
import { createElement } from 'react';

/**
 * Forms compose
 * =============
 * Rob's pillar. You don't hand-roll a form — you COMPOSE it from primitives:
 * layouts, inputs, actions. A composed block is just a value, so you reuse it.
 * Reactivity, conditional sections and custom widgets aren't escape hatches —
 * they're more options on the same primitives. And every label is data, so the
 * whole thing localises by swapping the strings.
 */

export type BlockId = 'address' | 'reactive' | 'conditional' | 'currency';

export type Lang = 'en' | 'ja' | 'ar';

export interface Block {
  id: BlockId;
  label: string;
  hint: string;
  power: string;
}

// The composable blocks — one per superpower the walk teaches.
export const BLOCKS: Block[] = [
  {
    id: 'address',
    label: 'Address block',
    hint: 'One block, reused in shipping + billing',
    power: 'REUSE',
  },
  {
    id: 'reactive',
    label: 'City reacts to country',
    hint: 'One field drives another, live',
    power: 'REACTIVITY',
  },
  {
    id: 'conditional',
    label: 'Conditional billing',
    hint: 'A section that appears on demand',
    power: 'CONDITIONAL',
  },
  {
    id: 'currency',
    label: 'Currency picker',
    hint: 'A custom-rendered dropdown',
    power: 'CUSTOM WIDGET',
  },
];

const COUNTRIES = ['United States', 'Japan', 'Brazil', 'France'];

export const CITIES: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Los Angeles'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto'],
  Brazil: ['São Paulo', 'Rio de Janeiro'],
  France: ['Paris', 'Marseille'],
};

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyItem[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// Labels are data — so localising the form is just swapping this map. The
// CH.09 finale flips `lang` and the whole form re-renders in Japanese.
type LabelKey =
  | 'name'
  | 'email'
  | 'country'
  | 'city'
  | 'currency'
  | 'shipping'
  | 'billing'
  | 'street'
  | 'postcode'
  | 'billingDiffers'
  | 'save'
  | 'secContact'
  | 'secRegion'
  | 'secBilling'
  | 'secCurrency';

const LABELS: Record<Lang, Record<LabelKey, string>> = {
  en: {
    name: 'Full name',
    email: 'Email',
    country: 'Country',
    city: 'City',
    currency: 'Currency',
    shipping: 'Shipping address',
    billing: 'Billing address',
    street: 'Street',
    postcode: 'Postcode',
    billingDiffers: 'Bill-to differs from ship-to',
    save: 'Save',
    secContact: 'Contact',
    secRegion: 'Region',
    secBilling: 'Billing',
    secCurrency: 'Payment',
  },
  ja: {
    name: '氏名',
    email: 'メール',
    country: '国',
    city: '市',
    currency: '通貨',
    shipping: '配送先住所',
    billing: '請求先住所',
    street: '番地',
    postcode: '郵便番号',
    billingDiffers: '請求先は配送先と異なる',
    save: '保存',
    secContact: '連絡先',
    secRegion: '地域',
    secBilling: '請求',
    secCurrency: '支払い',
  },
  // Arabic — a right-to-left script. GolemUI reads the active language from the
  // translator and sets dir="rtl" on the <form> automatically, so the whole
  // composed UI mirrors with zero layout code.
  ar: {
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    country: 'الدولة',
    city: 'المدينة',
    currency: 'العملة',
    shipping: 'عنوان الشحن',
    billing: 'عنوان الفوترة',
    street: 'الشارع',
    postcode: 'الرمز البريدي',
    billingDiffers: 'عنوان الفوترة مختلف عن الشحن',
    save: 'حفظ',
    secContact: 'جهة الاتصال',
    secRegion: 'المنطقة',
    secBilling: 'الفوترة',
    secCurrency: 'الدفع',
  },
};

// A localizable label: a translation key + its English fallback. The form's
// `localization` translator resolves the key to the active language at render
// time — so labels are *data*, not baked-in strings.
const L = (key: LabelKey): Localizable => ({ key, default: LABELS.en[key] });

/**
 * A {gui.} i18n translator backed by the LABELS dictionary. Hand this to the
 * form as `localization`; calling `setLang` re-labels every field live AND, for
 * RTL scripts like Arabic, makes GolemUI set dir="rtl" on the <form> itself —
 * no manual direction handling. This is the honest way to localise a {gui.}
 * form: the labels travel as keys, the translator owns the strings + language.
 */
export function createLocalization(initial: Lang = 'en'): MutableI18nTranslator {
  let lang: Lang = initial;
  const listeners = new Set<(l: string) => void>();
  return {
    get lang() {
      return lang;
    },
    translate(key, _params, def) {
      return LABELS[lang][key as LabelKey] ?? def ?? key;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setLang(next) {
      lang = next as Lang;
      listeners.forEach((l) => l(lang));
    },
  };
}

export const SEED_DATA: Record<string, unknown> = {
  name: 'Rob Mensah',
  email: 'rob@example.com',
  country: 'Japan',
  city: 'Osaka',
  currency: 'JPY',
  shipStreet: '1-2-3 Umeda',
  shipPostcode: '530-0001',
  billingDiffers: false,
  billStreet: '',
  billPostcode: '',
};

type FormShape = { country?: string };

// The reused block — one definition, dropped into shipping AND billing. THIS
// is the reuse story: a composed block is a value you pass around. Labels are
// translation keys, so the same block localises wherever it lands.
function addressFields(prefix: 'ship' | 'bill') {
  return [
    gui.inputs.textInput(`${prefix}Street`, { label: L('street') }),
    gui.inputs.textInput(`${prefix}Postcode`, { label: L('postcode') }),
  ];
}

// A localised section header — plain framework content via gui.displays.display()
// (a React <p> — no GolemUI widget); it re-labels by reading `translate` from the
// runtime params at render time. Shared by both form builders.
const header = (key: LabelKey) =>
  gui.displays.display(({ translate }) =>
    createElement('p', { className: 'sec-head' }, translate ? translate(key) : LABELS.en[key]),
  );

// A "card" — one section as its own flex layout: the header display widget plus
// its fields. Every card is a verticalFlex, so a block ↔ a card ↔ its code is
// obvious. `opts` carries an include condition when the card is conditional.
const card = (key: LabelKey, children: any[], opts?: any) =>
  gui.layouts.verticalFlex([header(key), ...children] as any, opts);

// The Region card's fields — country (optionally reactive) + the city radiogroup.
// `cityWhen` gates the city: the quest shows it once a country is picked; the
// bare screen also requires its block flag.
function regionFields(reactive: boolean, cityWhen = '!!$form.country') {
  return [
    gui.inputs.dropdown('country', {
      label: L('country'),
      items: COUNTRIES,
      ...(reactive
        ? {
            onChange: ({ data, update }: any) => {
              const c = (data as FormShape).country ?? '';
              update({ path: 'city', options: CITIES[c] ?? [] });
            },
          }
        : {}),
    }),
    ...(reactive
      ? [
          gui.inputs.radiogroup('city', {
            label: L('city'),
            options: [],
            include: { when: cityWhen },
            onLoad: ({ data, update }: any) => {
              const c = (data as FormShape).country ?? '';
              if (c) update({ path: 'city', options: CITIES[c] ?? [] });
            },
          }),
        ]
      : []),
  ];
}

// The Billing card's fields — the SAME address block, reused + gated by the
// billingDiffers checkbox.
const billingFields = () => [
  gui.inputs.checkbox('billingDiffers', { label: L('billingDiffers') }),
  gui.layouts.verticalFlex(
    addressFields('bill') as any,
    {
      include: { when: '$form.billingDiffers == true' },
    } as any,
  ),
];

// The Payment card's field — a custom-rendered currency dropdown.
const currencyFields = () => [
  gui.inputs.dropdown('currency', {
    label: L('currency'),
    // Object items paired with labelField/valueField + a custom renderer; the
    // factory's items type doesn't model that combo, so widen it.
    items: CURRENCIES as unknown as Record<string, unknown>[],
    labelField: 'code',
    valueField: 'code',
    itemRenderer: 'currency',
  }),
];

const contactFields = () => [
  gui.inputs.textInput('name', { label: L('name') }),
  gui.inputs.textInput('email', { label: L('email'), validator: { format: 'email' } }),
];

export function composeForm(active: Set<BlockId>) {
  // One card per block, pushed by membership — the same order as the checklist.
  const def: any[] = [card('secContact', contactFields())];
  if (active.has('address')) def.push(card('shipping', addressFields('ship')));
  def.push(card('secRegion', regionFields(active.has('reactive'))));
  if (active.has('conditional')) def.push(card('secBilling', billingFields()));
  if (active.has('currency')) def.push(card('secCurrency', currencyFields()));
  def.push(gui.actions.button({ label: L('save'), actionType: 'submit' }));
  return def;
}

/* ─── Declarative single definition (the bare app "actually uses GolemUI") ──
   ONE stable {gui.} definition: every section is present, and GolemUI's own
   include:{when} reactivity shows/hides it based on block flags kept in form
   META (not data, so the typed payload never carries them). The outside React
   toggles flip those flags via the form's setMeta handle — no rebuild, no
   remount. `composeForm(active)` above stays for the quest's scripted rebuild. */

// Block → meta flag key. Flags live in meta so they never pollute the payload.
export const BLOCK_META: Record<BlockId, string> = {
  address: '_block_address',
  reactive: '_block_reactive',
  conditional: '_block_conditional',
  currency: '_block_currency',
};

// The form's meta object for a given active-block set (all-true seeds the app
// fully composed). Hand this to <GuiForm meta={…}> and to ref.setMeta(…).
export function metaFromActive(active: Set<BlockId>): Record<string, boolean> {
  return Object.fromEntries(
    (Object.keys(BLOCK_META) as BlockId[]).map((b) => [BLOCK_META[b], active.has(b)]),
  );
}

export function composeFormMeta() {
  return [
    // Contact — always present, the base of every form.
    card('secContact', contactFields()),

    // Shipping address — the reused block, shown when its flag is on.
    card('shipping', addressFields('ship'), { include: { when: '$meta._block_address == true' } }),

    // Region — country is always shown (and always reactive: updating a hidden
    // city's options is harmless). City appears once the reactive flag is on AND
    // a country is chosen.
    card('secRegion', regionFields(true, '$meta._block_reactive == true && !!$form.country')),

    // Conditional billing — the SAME address block, reused + gated by its flag
    // (its inner address further gated by the billingDiffers checkbox).
    card('secBilling', billingFields(), { include: { when: '$meta._block_conditional == true' } }),

    // Payment — a custom-rendered currency dropdown, shown when its flag is on.
    card('secCurrency', currencyFields(), { include: { when: '$meta._block_currency == true' } }),

    gui.actions.button({ label: L('save'), actionType: 'submit' }),
  ];
}

/* ─── The composition, as display lines (the on-screen hero) ──────────── */

export interface TreeLine {
  owner: BlockId | 'base';
  depth: number;
  text: string;
}

export function composeTree(active: Set<BlockId>, framework = 'react'): TreeLine[] {
  const lines: TreeLine[] = [];
  const push = (owner: TreeLine['owner'], depth: number, text: string) =>
    lines.push({ owner, depth, text });

  // Each card is its OWN flex layout — a header (a display widget) + its fields.
  push('base', 0, 'const card = (title, fields) => gui.layouts.verticalFlex([');
  push('base', 1, 'gui.displays.display(() => title),   // the card title widget');
  push('base', 1, '...fields,');
  push('base', 0, ']);');
  push('base', 0, '');

  // The reusable address block, defined once (shipping + billing).
  if (active.has('address') || active.has('conditional')) {
    push('address', 0, 'const address = (type) => [');
    push('address', 1, "gui.inputs.textInput(type+'Street'),");
    push('address', 1, "gui.inputs.textInput(type+'Postcode'),");
    push('address', 0, '];');
    push('base', 0, '');
  }

  // The {gui.} form config — a column of cards, handed to <GuiForm config={config}>.
  push('base', 0, 'const config = {');
  push('base', 1, 'formDef: gui.layouts.column([');

  push('base', 2, "card('Contact', [");
  push('base', 3, "gui.inputs.textInput('name'),");
  push('base', 3, "gui.inputs.textInput('email', { validator }),");
  push('base', 2, ']),');

  if (active.has('address')) {
    push('address', 2, "card('Shipping', address('ship')),   // reused block");
  }

  push('base', 2, "card('Region', [");
  if (active.has('reactive')) {
    push('reactive', 3, "gui.inputs.dropdown('country', { onChange: setCity }),");
    push('reactive', 3, "gui.inputs.radiogroup('city', { when: '$form.country' !== undefined }),");
  } else {
    push('base', 3, "gui.inputs.dropdown('country'),");
  }
  push('base', 2, ']),');

  if (active.has('conditional')) {
    push('conditional', 2, "card('Billing', [");
    push('conditional', 3, "gui.inputs.checkbox('billingDiffers'),");
    push('conditional', 3, "gui.layouts.verticalFlex(address('bill'), {");
    push('conditional', 4, "include: { when: '$form.billingDiffers' },");
    push('conditional', 3, '}),   // same block, again');
    push('conditional', 2, ']),');
  }

  if (active.has('currency')) {
    push('currency', 2, "card('Payment', [");
    push('currency', 3, "gui.inputs.dropdown('currency', { itemRenderer }),");
    push('currency', 2, ']),');
  }

  push('base', 2, "gui.actions.button({ actionType: 'submit' }),");
  push('base', 1, ']),');

  // The custom currency renderer — registered per framework. Angular renderers
  // are classes (need the cast); React / Lit / Vue / Vanilla are functions.
  if (active.has('currency')) {
    if (framework === 'angular') {
      push('currency', 1, 'itemRenderers: {');
      push('currency', 2, 'currency: CurrencyChip,');
      push('currency', 1, '} as Record<string, AngularItemRenderer<any>>,');
    } else {
      push('currency', 1, 'itemRenderers: { currency: CurrencyChip },');
    }
  }

  push('base', 0, '};');
  return lines;
}
