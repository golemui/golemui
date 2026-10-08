import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { fires } from '../utils/events';
import type { GuiTab } from './tab';
import type { GuiTabList } from './tab-list';
import type { GuiTabPanel } from './tab-panel';
import './tab';
import './tab-list';
import './tab-panel';

/** The detail of `gui-tab-change`: the `panel` of the tab the user selected. */
export type GuiTabChangeEventDetail = { value: string };

let nextId = 0;

/** Gives an element an id, unless it has one. */
function ensureId(element: Element, part: string): string {
  if (!element.id) element.id = `gui-${part}-${++nextId}`;
  return element.id;
}

/** Sets an attribute, or removes it for `null`, leaving it alone when it already matches. */
function syncAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/**
 * Tabs, composed from parts the app renders: a `gui-tab-list` of `gui-tab`s, and a `gui-tab-panel`
 * for each tab. `gui-tabs` adds the behavior: it links each tab to its panel with ids and ARIA,
 * selects tabs on click and with the arrow keys, Home and End, hides the inactive panels and
 * shows a shadow at a side of the tab strip with tabs scrolled out of view.
 *
 * ```html
 * <gui-tabs active="address">
 *   <gui-tab-list aria-label="Profile">
 *     <gui-tab panel="personal">Personal</gui-tab>
 *     <gui-tab panel="address">Address</gui-tab>
 *   </gui-tab-list>
 *   <gui-tab-panel name="personal">…</gui-tab-panel>
 *   <gui-tab-panel name="address">…</gui-tab-panel>
 * </gui-tabs>
 * ```
 *
 * @fires gui-tab-change - The user selected a tab. `detail.value` is its `panel`. Cancel it to
 *   keep the current tab.
 */
export class GuiTabs extends ReactiveElement {
  /** The `panel` of the selected tab. Defaults to the first tab. */
  @property({ type: String }) active: string | undefined = undefined;

  private mutations?: MutationObserver;
  private resizes?: ResizeObserver;
  private observedList: Element | undefined;
  private revealed = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    // Scroll events do not bubble: a capturing listener sees the tab strip's.
    this.addEventListener('scroll', this.onScroll, true);
    this.mutations = new MutationObserver((records) => {
      if (records.some((record) => this.affectsParts(record))) this.sync();
    });
    this.mutations.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['panel', 'name'],
    });
    this.resizes = new ResizeObserver(() => this.updateShadows());
    this.sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('scroll', this.onScroll, true);
    this.mutations?.disconnect();
    this.resizes?.disconnect();
    this.observedList = undefined;
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('active')) this.sync();
  }

  /** The parts of this tab set, leaving out those of tabs nested in its panels. */
  private parts<T extends Element>(tag: string): T[] {
    return Array.from(this.querySelectorAll<T>(tag)).filter(
      (part) => part.closest('gui-tabs') === this,
    );
  }

  private get tabs(): GuiTab[] {
    return this.parts<GuiTab>('gui-tab');
  }

  private get list(): GuiTabList | undefined {
    return this.parts<GuiTabList>('gui-tab-list')[0];
  }

  /** The selected tab's `panel`: `active` when a tab has it, otherwise the first tab's. */
  private get current(): string | undefined {
    const panels = this.tabs.map(panelOf);
    return this.active !== undefined && panels.includes(this.active) ? this.active : panels[0];
  }

  private affectsParts(record: MutationRecord): boolean {
    const target = record.target as Element;
    return (
      record.type === 'attributes' ||
      target === this ||
      target.localName === 'gui-tab-list' ||
      Array.from(record.addedNodes).some(isPart) ||
      Array.from(record.removedNodes).some(isPart)
    );
  }

  /** Brings the parts in line with the selected tab. */
  private sync() {
    const tabs = this.tabs;
    const panels = this.parts<GuiTabPanel>('gui-tab-panel');
    const current = this.current;

    for (const panel of panels) ensureId(panel, 'tab-panel');
    for (const tab of tabs) {
      const panel = panels.find((candidate) => nameOf(candidate) === panelOf(tab));
      const selected = panelOf(tab) === current;
      ensureId(tab, 'tab');
      syncAttribute(tab, 'aria-selected', String(selected));
      syncAttribute(tab, 'aria-controls', panel?.id ?? null);
      syncAttribute(tab, 'tabindex', selected ? '0' : '-1');
    }
    for (const panel of panels) {
      const tab = tabs.find((candidate) => panelOf(candidate) === nameOf(panel));
      syncAttribute(panel, 'aria-labelledby', tab?.id ?? null);
      panel.hidden = nameOf(panel) !== current;
    }

    const list = this.list;
    if (list !== this.observedList) {
      if (this.observedList) this.resizes?.unobserve(this.observedList);
      if (list) this.resizes?.observe(list);
      this.observedList = list;
    }
    this.revealSelectedTab();
    this.updateShadows();
  }

  /** Scrolls the strip, only, to the selected tab once it first renders. */
  private revealSelectedTab() {
    const list = this.list;
    const tab = this.tabs.find((candidate) => panelOf(candidate) === this.current);
    if (this.revealed || !list || !tab) return;
    this.revealed = true;

    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    if (tabBox.left < listBox.left) list.scrollLeft -= listBox.left - tabBox.left;
    else if (tabBox.right > listBox.right) list.scrollLeft += tabBox.right - listBox.right;
  }

  /** Marks the sides of the strip with tabs out of view, for their shadows. */
  private updateShadows() {
    const list = this.list;
    const hidden = list ? list.scrollWidth - list.clientWidth : 0;
    // scrollLeft runs negative in a right-to-left strip.
    const scrolled = list ? Math.abs(list.scrollLeft) : 0;
    this.toggleAttribute('overflow-start', hidden > 1 && scrolled > 1);
    this.toggleAttribute('overflow-end', hidden > 1 && scrolled < hidden - 1);
  }

  private ownTab(event: Event): GuiTab | undefined {
    const tab = (event.target as Element).closest?.<GuiTab>('gui-tab');
    return tab && tab.closest('gui-tabs') === this ? tab : undefined;
  }

  private select(tab: GuiTab) {
    const value = panelOf(tab);
    if (value === undefined || value === this.current) return;

    const event = new CustomEvent<GuiTabChangeEventDetail>('gui-tab-change', {
      detail: { value },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    if (this.dispatchEvent(event)) this.active = value;
  }

  private onClick = (event: Event) => {
    const tab = this.ownTab(event);
    if (tab) this.select(tab);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const tab = this.ownTab(event);
    if (!tab) return;

    const tabs = this.tabs;
    const index = tabs.indexOf(tab);
    const forward = getComputedStyle(this).direction === 'rtl' ? -1 : 1;
    const next = {
      ArrowLeft: tabs[index - forward],
      ArrowRight: tabs[index + forward],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[event.key];
    if (!next) return;

    event.preventDefault();
    next.focus();
    this.select(next);
  };

  private onScroll = (event: Event) => {
    if (event.target === this.list) this.updateShadows();
  };
}

const PART_TAGS = new Set(['gui-tab', 'gui-tab-list', 'gui-tab-panel']);

function isPart(node: Node): boolean {
  return node instanceof Element && PART_TAGS.has(node.localName);
}

function panelOf(tab: Element): string | undefined {
  return (tab as GuiTab).panel ?? tab.getAttribute('panel') ?? undefined;
}

function nameOf(panel: Element): string | undefined {
  return (panel as GuiTabPanel).name ?? panel.getAttribute('name') ?? undefined;
}

/** The events `gui-tabs` fires, with their types. */
export const GuiTabsEvents = {
  'gui-tab-change': fires<CustomEvent<GuiTabChangeEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-tabs': GuiTabs;
  }
}

safeDefine('gui-tabs', GuiTabs);
