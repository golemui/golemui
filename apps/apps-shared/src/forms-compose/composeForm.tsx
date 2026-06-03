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
  { id: 'address', label: 'Address block', hint: 'One block, reused in shipping + billing', power: 'REUSE' },
  { id: 'reactive', label: 'City reacts to country', hint: 'One field drives another, live', power: 'REACTIVITY' },
  { id: 'conditional', label: 'Conditional billing', hint: 'A section that appears on demand', power: 'CONDITIONAL' },
  { id: 'currency', label: 'Currency picker', hint: 'A custom-rendered dropdown', power: 'CUSTOM WIDGET' },
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
  | 'name' | 'email' | 'country' | 'city' | 'currency'
  | 'shipping' | 'billing' | 'street' | 'postcode'
  | 'billingDiffers' | 'save'
  | 'secContact' | 'secRegion' | 'secBilling' | 'secCurrency';

const LABELS: Record<Lang, Record<LabelKey, string>> = {
  en: {
    name: 'Full name', email: 'Email', country: 'Country', city: 'City',
    currency: 'Currency', shipping: 'Shipping address', billing: 'Billing address',
    street: 'Street', postcode: 'Postcode',
    billingDiffers: 'Bill-to differs from ship-to', save: 'Save',
    secContact: 'Contact', secRegion: 'Region', secBilling: 'Billing', secCurrency: 'Payment',
  },
  ja: {
    name: '氏名', email: 'メール', country: '国', city: '市',
    currency: '通貨', shipping: '配送先住所', billing: '請求先住所',
    street: '番地', postcode: '郵便番号',
    billingDiffers: '請求先は配送先と異なる', save: '保存',
    secContact: '連絡先', secRegion: '地域', secBilling: '請求', secCurrency: '支払い',
  },
  // Arabic — a right-to-left script. GolemUI reads the active language from the
  // translator and sets dir="rtl" on the <form> automatically, so the whole
  // composed UI mirrors with zero layout code.
  ar: {
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', country: 'الدولة', city: 'المدينة',
    currency: 'العملة', shipping: 'عنوان الشحن', billing: 'عنوان الفوترة',
    street: 'الشارع', postcode: 'الرمز البريدي',
    billingDiffers: 'عنوان الفوترة مختلف عن الشحن', save: 'حفظ',
    secContact: 'جهة الاتصال', secRegion: 'المنطقة', secBilling: 'الفوترة', secCurrency: 'الدفع',
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

export function composeForm(active: Set<BlockId>) {
  // Each block is its own labelled SECTION (a verticalFlex with a header), in the
  // same order as the COMPOSE checklist — so a block ↔ a section is obvious, and
  // hovering a block can light its whole section.
  const def: any[] = [
    gui.layouts.verticalFlex([
      header('secContact'),
      gui.inputs.textInput('name', { label: L('name') }),
      gui.inputs.textInput('email', { label: L('email'), validator: { format: 'email' } }),
    ] as any),
  ];

  // 1 · Address block (reused shipping address).
  if (active.has('address')) {
    def.push(
      gui.layouts.verticalFlex([header('shipping'), ...addressFields('ship')] as any),
    );
  }

  // 2 · Reactive — country drives city.
  def.push(
    gui.layouts.verticalFlex([
      header('secRegion'),
      gui.inputs.dropdown('country', {
        label: L('country'),
        items: COUNTRIES,
        ...(active.has('reactive')
          ? {
              onChange: ({ data, update }: any) => {
                const c = (data as FormShape).country ?? '';
                update({ path: 'city', options: CITIES[c] ?? [] });
              },
            }
          : {}),
      }),
      ...(active.has('reactive')
        ? [
            gui.inputs.radiogroup('city', {
              label: L('city'),
              options: [],
              include: { when: '!!$form.country' },
              onLoad: ({ data, update }: any) => {
                const c = (data as FormShape).country ?? '';
                if (c) update({ path: 'city', options: CITIES[c] ?? [] });
              },
            }),
          ]
        : []),
    ] as any),
  );

  // 3 · Conditional billing — the SAME address block, reused + gated.
  if (active.has('conditional')) {
    def.push(
      gui.layouts.verticalFlex([
        header('secBilling'),
        gui.inputs.checkbox('billingDiffers', { label: L('billingDiffers') }),
        gui.layouts.verticalFlex(addressFields('bill') as any, {
          include: { when: '$form.billingDiffers == true' },
        } as any),
      ] as any),
    );
  }

  // 4 · Currency — a custom-rendered dropdown.
  if (active.has('currency')) {
    def.push(
      gui.layouts.verticalFlex([
        header('secCurrency'),
        gui.inputs.dropdown('currency', {
          label: L('currency'),
          // Object items paired with labelField/valueField + a custom renderer;
          // the factory's items type doesn't model that combo, so widen it.
          items: CURRENCIES as unknown as Record<string, unknown>[],
          labelField: 'code',
          valueField: 'code',
          itemRenderer: 'currency',
        }),
      ] as any),
    );
  }

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
    gui.layouts.verticalFlex([
      header('secContact'),
      gui.inputs.textInput('name', { label: L('name') }),
      gui.inputs.textInput('email', { label: L('email'), validator: { format: 'email' } }),
    ] as any),

    // Shipping address — the reused block, shown when its flag is on.
    gui.layouts.verticalFlex([header('shipping'), ...addressFields('ship')] as any, {
      include: { when: '$meta._block_address == true' },
    } as any),

    // Region — country is always shown (and always reactive: updating a hidden
    // city's options is harmless). City appears once the reactive flag is on AND
    // a country is chosen.
    gui.layouts.verticalFlex([
      header('secRegion'),
      gui.inputs.dropdown('country', {
        label: L('country'),
        items: COUNTRIES,
        onChange: ({ data, update }: any) => {
          const c = (data as FormShape).country ?? '';
          update({ path: 'city', options: CITIES[c] ?? [] });
        },
      }),
      gui.inputs.radiogroup('city', {
        label: L('city'),
        options: [],
        include: { when: '$meta._block_reactive == true && !!$form.country' },
        onLoad: ({ data, update }: any) => {
          const c = (data as FormShape).country ?? '';
          if (c) update({ path: 'city', options: CITIES[c] ?? [] });
        },
      }),
    ] as any),

    // Conditional billing — the SAME address block, reused + gated by its flag,
    // its inner address further gated by the billingDiffers checkbox.
    gui.layouts.verticalFlex(
      [
        header('secBilling'),
        gui.inputs.checkbox('billingDiffers', { label: L('billingDiffers') }),
        gui.layouts.verticalFlex(addressFields('bill') as any, {
          include: { when: '$form.billingDiffers == true' },
        } as any),
      ] as any,
      { include: { when: '$meta._block_conditional == true' } } as any,
    ),

    // Payment — a custom-rendered currency dropdown, shown when its flag is on.
    gui.layouts.verticalFlex(
      [
        header('secCurrency'),
        gui.inputs.dropdown('currency', {
          label: L('currency'),
          items: CURRENCIES as unknown as Record<string, unknown>[],
          labelField: 'code',
          valueField: 'code',
          itemRenderer: 'currency',
        }),
      ] as any,
      { include: { when: '$meta._block_currency == true' } } as any,
    ),

    gui.actions.button({ label: L('save'), actionType: 'submit' }),
  ];
}

/* ─── The composition, as display lines (the on-screen hero) ──────────── */

export interface TreeLine {
  owner: BlockId | 'base';
  depth: number;
  text: string;
}

export function composeTree(active: Set<BlockId>): TreeLine[] {
  const lines: TreeLine[] = [];
  const push = (owner: TreeLine['owner'], depth: number, text: string) =>
    lines.push({ owner, depth, text });

  // The reusable block, defined once.
  if (active.has('address') || active.has('conditional')) {
    push('address', 0, 'const address = (p) => [');
    push('address', 1, "gui.inputs.textInput(p+'Street'),");
    push('address', 1, "gui.inputs.textInput(p+'Postcode'),");
    push('address', 0, '];');
    push('base', 0, '');
  }

  push('base', 0, 'gui.layouts.column([');
  push('base', 1, "gui.inputs.textInput('name'),");
  push('base', 1, "gui.inputs.textInput('email', { validator }),");

  if (active.has('reactive')) {
    push('reactive', 1, "gui.inputs.dropdown('country', {");
    push('reactive', 2, 'onChange: ({ update }) => update({ path: city }),');
    push('reactive', 1, '}),');
    push('reactive', 1, "gui.inputs.radiogroup('city', {");
    push('reactive', 2, "include: { when: '$form.country' },");
    push('reactive', 1, '}),');
  } else {
    push('base', 1, "gui.inputs.dropdown('country'),");
  }

  if (active.has('address')) {
    push('address', 1, "...address('ship'),   // reused");
  }
  if (active.has('currency')) {
    push('currency', 1, "gui.inputs.dropdown('currency', {");
    push('currency', 2, "itemRenderer: 'currency',");
    push('currency', 1, '}),');
  }
  if (active.has('conditional')) {
    push('conditional', 1, "gui.inputs.checkbox('billingDiffers'),");
    push('conditional', 1, "...address('bill'),   // same block, again");
    push('conditional', 1, "// ^ include: { when: billingDiffers }");
  }

  push('base', 1, "gui.actions.button({ actionType: 'submit' }),");
  push('base', 0, '])');
  return lines;
}
