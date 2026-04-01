import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import * as Core from '@golemui/core';
import * as Gui from '@golemui/gui-angular';
import {
  createDefaultWidget,
  findWidgetByUid,
  getRepeaterPrefix,
  insertWidgetAt,
  removeWidgetByUid,
  replaceWidgetByUid,
  stripVisibilityRules,
  updateWidgetFromFlatData,
} from './widget-forms';

interface BreadcrumbItem {
  uid: string;
  prettyUid: string;
  type: string;
  el: Element;
}

interface ComponentHighlight {
  uid: string;
  prettyUid: string;
  type: string;
  el: Element;
  rect: DOMRect;
  breadcrumbs: BreadcrumbItem[];
}

@Component({
  imports: [Gui.FormComponent],
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrl: './design.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DesignComponent {
  formDef = input<string>('');
  formValidateOn = input<Core.ValidateOn>('eager');
  formLocale = input<string>();
  formDefChange = output<string>();
  selectedWidgetChange = output<Record<string, unknown> | null>();

  private elRef = inject(ElementRef);

  hoveredHighlight = signal<ComponentHighlight | null>(null);
  selectedHighlight = signal<ComponentHighlight | null>(null);
  // Snapshot of the selected widget — set on selection, NOT updated when formDef changes,
  // so the properties panel stays stable while the user types.
  selectedWidget = signal<Record<string, unknown> | null>(null);
  protected formLocalization = signal(Core.identityTranslator(this.formLocale() || 'en-US'));
  protected liveFormDef = linkedSignal(() => this.formDef());
  protected designFormDef = computed(() => {
    try {
      const parsed = JSON.parse(this.liveFormDef());
      return JSON.stringify(stripVisibilityRules(parsed));
    } catch {
      return this.liveFormDef();
    }
  });
  protected formVersion = signal(0);

  constructor() {
    effect(() => {
      this.formLocalization().setLang(this.formLocale() || 'en-US');
    });
    afterNextRender(() => {
      this.layoutEl = this.elRef.nativeElement.querySelector('.design-layout');
    });
  }

  private layoutEl: HTMLElement | null = null;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if ((event.target as Element).closest('.comp-overlay')) {
      return;
    }
    const el = this.findGolemHostAtPoint(event.clientX, event.clientY);
    this.hoveredHighlight.set(el ? this.makeHighlight(el) : null);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hoveredHighlight.set(null);
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if ((event.target as Element).closest('.comp-overlay')) {
      return;
    }
    const el = this.findGolemHostAtPoint(event.clientX, event.clientY);
    if (el) {
      const hl = this.makeHighlight(el);
      const current = this.selectedHighlight();
      if (current?.uid === hl.uid) {
        this.selectedHighlight.set(null);
        this.setSelectedWidget(null);
      } else {
        this.selectedHighlight.set(hl);
        this.setSelectedWidget(this.snapshotWidget(hl.prettyUid));
      }
      event.stopPropagation();
    } else {
      this.selectedHighlight.set(null);
      this.setSelectedWidget(null);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement)?.tagName;
    const isEditable =
      tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable;
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      this.selectedHighlight() &&
      !isEditable
    ) {
      event.preventDefault();
      this.deleteSelectedWidget();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.refreshHighlights();
  }

  private refreshHighlights() {
    const hov = this.hoveredHighlight();
    if (hov) {
      this.hoveredHighlight.set({ ...hov, rect: this.getLayoutRelativeRect(hov.el) });
    }
    const sel = this.selectedHighlight();
    if (sel) {
      this.selectedHighlight.set({ ...sel, rect: this.getLayoutRelativeRect(sel.el) });
    }
  }

  protected selectBreadcrumb(item: BreadcrumbItem, event: MouseEvent) {
    event.stopPropagation();
    const current = this.selectedHighlight();
    if (current?.uid === item.uid) {
      this.selectedHighlight.set(null);
      this.setSelectedWidget(null);
    } else {
      this.selectedHighlight.set(this.makeHighlight(item.el));
      this.setSelectedWidget(this.snapshotWidget(item.prettyUid));
    }
  }

  private setSelectedWidget(widget: Record<string, unknown> | null) {
    const wasNull = this.selectedWidget() === null;
    this.selectedWidget.set(widget);
    this.selectedWidgetChange.emit(widget);
    // When the panel first appears it shifts the flex layout, making the
    // already-captured rect stale.  Refresh after the browser has laid out.
    if (widget && wasNull) {
      setTimeout(() => this.refreshHighlights(), 1);
    }
  }

  private deleteSelectedWidget() {
    const hl = this.selectedHighlight();
    if (!hl) return;
    try {
      const parsed = JSON.parse(this.liveFormDef());
      const baseUid = hl.prettyUid.replace(/\[\d+\]/g, '');
      const newFormDef = removeWidgetByUid(parsed, baseUid);
      const newFormDefStr = JSON.stringify(newFormDef, null, 2);
      this.liveFormDef.set(newFormDefStr);
      this.formVersion.update((v) => v + 1);
      this.formDefChange.emit(newFormDefStr);
      this.selectedHighlight.set(null);
      this.setSelectedWidget(null);
      this.hoveredHighlight.set(null);
    } catch (e) {
      console.error('[design] Failed to delete widget', e);
    }
  }

  onWidgetChange(flatData: Record<string, unknown>) {
    const hl = this.selectedHighlight();
    if (!hl) return;
    try {
      const parsed = JSON.parse(this.liveFormDef());
      const baseUid = hl.prettyUid.replace(/\[\d+\]/g, '');
      const original = findWidgetByUid(parsed, baseUid);
      if (!original) return;
      const updated = updateWidgetFromFlatData(original, flatData);
      const newFormDef = replaceWidgetByUid(parsed, baseUid, updated);
      const newFormDefStr = JSON.stringify(newFormDef, null, 2);
      this.liveFormDef.set(newFormDefStr);
      this.formVersion.update((v) => v + 1);
      this.formDefChange.emit(newFormDefStr);
    } catch (e) {
      console.error('[design] Failed to update widget', e);
    }
  }

  private snapshotWidget(prettyUid: string): Record<string, unknown> | null {
    try {
      // Strip repeater index brackets (e.g. "name-input[0]" → "name-input")
      const baseUid = prettyUid.replace(/\[\d+\]/g, '');
      return findWidgetByUid(JSON.parse(this.liveFormDef()), baseUid);
    } catch {
      return null;
    }
  }

  private getLayoutRelativeRect(el: Element): DOMRect {
    const elRect = el.getBoundingClientRect();
    if (!this.layoutEl) return elRect;
    const layoutRect = this.layoutEl.getBoundingClientRect();
    return new DOMRect(
      elRect.left - layoutRect.left - this.layoutEl.clientLeft + this.layoutEl.scrollLeft,
      elRect.top - layoutRect.top - this.layoutEl.clientTop + this.layoutEl.scrollTop,
      elRect.width,
      elRect.height,
    );
  }

  private findGolemHostAtPoint(x: number, y: number): Element | null {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.id?.startsWith('host-')) {
        return el;
      }
    }
    return null;
  }

  private collectBreadcrumbs(el: Element): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [];
    let current: Element | null = el.parentElement;
    while (current && current !== this.elRef.nativeElement) {
      if (current.id?.startsWith('host-')) {
        crumbs.unshift({
          uid: current.id,
          prettyUid: current.id.replace('host-', ''),
          type: current.tagName
            .toLowerCase()
            .replace(/^gui-/, '')
            .replace(/-(display|action|input|layout)$/, ''),
          el: current,
        });
      }
      current = current.parentElement;
    }
    return crumbs;
  }

  private makeHighlight(el: Element): ComponentHighlight {
    return {
      uid: el.id,
      prettyUid: el.id.replace('host-', ''),
      type: el.tagName
        .toLowerCase()
        .replace(/^gui-/, '')
        .replace(/-(display|action|input|layout)$/, ''),
      el,
      rect: this.getLayoutRelativeRect(el),
      breadcrumbs: this.collectBreadcrumbs(el),
    };
  }

  // ---- Drag & Drop ----

  dropIndicator = signal<{
    containerUid: string | null;
    index: number;
    direction: 'row' | 'column';
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);

  protected onDragOver(event: DragEvent) {
    const types = event.dataTransfer?.types;
    if (
      !types?.includes('application/golem-widget') &&
      !types?.includes('application/golem-widget-move')
    ) {
      return;
    }
    event.preventDefault();
    event.dataTransfer!.dropEffect = types.includes('application/golem-widget-move')
      ? 'move'
      : 'copy';

    const { containerEl, containerUid, direction } = this.findDropContainer(
      event.clientX,
      event.clientY,
    );
    const childRects = this.collectContainerChildRects(containerEl);
    const index = this.calcInsertionIndex(childRects, direction, event.clientX, event.clientY);
    const rect = this.calcIndicatorRect(containerEl, childRects, direction, index);

    this.dropIndicator.set({ containerUid, index, direction, rect });
  }

  protected onDragLeave(event: DragEvent) {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.elRef.nativeElement.contains(related)) {
      this.dropIndicator.set(null);
    }
  }

  protected onDrop(event: DragEvent) {
    const indicator = this.dropIndicator();
    this.dropIndicator.set(null);
    if (!indicator) return;
    event.preventDefault();

    const moveRaw = event.dataTransfer?.getData('application/golem-widget-move');
    const newRaw = event.dataTransfer?.getData('application/golem-widget');

    try {
      let parsed = JSON.parse(this.liveFormDef());

      if (moveRaw) {
        // Move existing widget
        const { uid } = JSON.parse(moveRaw);
        const baseUid = uid.replace(/\[\d+\]/g, '');
        const widget = findWidgetByUid(parsed, baseUid);
        if (!widget) return;
        const widgetCopy = JSON.parse(JSON.stringify(widget));
        parsed = removeWidgetByUid(parsed, baseUid);
        parsed = insertWidgetAt(parsed, indicator.containerUid, widgetCopy, indicator.index);
      } else if (newRaw) {
        // New widget from toolbar
        const { kind, type } = JSON.parse(newRaw);
        const widget = createDefaultWidget(kind, type);
        if (indicator.containerUid && widget['path']) {
          const prefix = getRepeaterPrefix(parsed, indicator.containerUid);
          if (prefix) {
            widget['path'] = `${prefix}.${widget['path']}`;
          }
        }
        parsed = insertWidgetAt(parsed, indicator.containerUid, widget, indicator.index);
      } else {
        return;
      }

      const newFormDefStr = JSON.stringify(parsed, null, 2);
      this.liveFormDef.set(newFormDefStr);
      this.formVersion.update((v) => v + 1);
      this.formDefChange.emit(newFormDefStr);
      this.selectedHighlight.set(null);
      this.setSelectedWidget(null);
    } catch (e) {
      console.error('[design] Failed to drop widget', e);
    }
  }

  protected onBreadcrumbDragStart(event: DragEvent, prettyUid: string) {
    event.dataTransfer?.setData(
      'application/golem-widget-move',
      JSON.stringify({ uid: prettyUid }),
    );
    event.dataTransfer!.effectAllowed = 'move';
    // Clear selection so overlay doesn't interfere with drop targets
    this.selectedHighlight.set(null);
    this.setSelectedWidget(null);
    this.hoveredHighlight.set(null);
  }

  private static readonly LAYOUT_TAGS = new Set([
    'GUI-FLEX-LAYOUT',
    'GUI-GRID-LAYOUT',
    'GUI-ACCORDION-LAYOUT',
    'GUI-TABS-LAYOUT',
  ]);

  private findDropContainer(
    x: number,
    y: number,
  ): {
    containerEl: Element;
    containerUid: string | null;
    direction: 'row' | 'column';
  } {
    const designContainer = this.elRef.nativeElement.querySelector('.design-container') as Element;
    const knownLayoutUids = this.collectKnownLayoutUids();

    // Scan ALL layout host elements in the design container and find the
    // smallest (deepest nested) one whose bounding rect contains the cursor.
    // This avoids relying on elementsFromPoint which may miss custom elements
    // that have no painted box of their own.
    const layoutSelector = Array.from(DesignComponent.LAYOUT_TAGS)
      .map((tag) => tag.toLowerCase() + '[id^="host-"]')
      .join(',');
    const allLayouts = designContainer.querySelectorAll(layoutSelector);

    let best: { el: Element; area: number } | null = null;
    for (const el of Array.from(allLayouts)) {
      const uid = el.id.replace('host-', '').replace(/\[\d+\]/g, '');
      if (!knownLayoutUids.has(uid)) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const area = rect.width * rect.height;
        if (!best || area < best.area) {
          best = { el, area };
        }
      }
    }
    if (best) {
      const uid = best.el.id.replace('host-', '').replace(/\[\d+\]/g, '');
      const direction = this.getContainerDirection(best.el);
      return { containerEl: best.el, containerUid: uid, direction };
    }

    // Fallback: root canvas
    return { containerEl: designContainer, containerUid: null, direction: 'column' };
  }

  private collectKnownLayoutUids(): Set<string> {
    const uids = new Set<string>();
    try {
      const parsed = JSON.parse(this.liveFormDef());
      this.walkForLayoutUids(parsed, uids);
    } catch {
      // ignore
    }
    return uids;
  }

  private walkForLayoutUids(node: unknown, uids: Set<string>): void {
    if (Array.isArray(node)) {
      for (const item of node) this.walkForLayoutUids(item, uids);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (obj['kind'] === 'layout' && obj['uid']) {
      uids.add(obj['uid'] as string);
    }
    if (obj['children']) this.walkForLayoutUids(obj['children'], uids);
    if (obj['form']) this.walkForLayoutUids(obj['form'], uids);
    if (obj['props'] && typeof obj['props'] === 'object') {
      const props = obj['props'] as Record<string, unknown>;
      if (props['template']) this.walkForLayoutUids(props['template'], uids);
    }
  }

  private getContainerDirection(hostEl: Element): 'row' | 'column' {
    const tag = hostEl.tagName;
    if (tag === 'GUI-ACCORDION-LAYOUT' || tag === 'GUI-TABS-LAYOUT') return 'column';

    // Flex & Grid: check inner element class
    const inner =
      hostEl.querySelector('.gui-flex__widget') || hostEl.querySelector('.gui-grid__widget');
    if (inner) {
      if (
        inner.classList.contains('gui-flex__widget--row') ||
        inner.classList.contains('gui-flex__widget--row-reverse') ||
        inner.classList.contains('gui-grid__widget--row')
      ) {
        return 'row';
      }
    }
    return 'column';
  }

  private collectContainerChildRects(containerEl: Element): DOMRect[] {
    const tag = containerEl.tagName;
    let children: Element[];

    if (tag === 'GUI-ACCORDION-LAYOUT') {
      children = Array.from(containerEl.querySelectorAll(':scope .gui-accordion__section'));
    } else if (tag === 'GUI-TABS-LAYOUT') {
      children = Array.from(containerEl.querySelectorAll(':scope section[role="tabpanel"]'));
    } else if (tag === 'GUI-GRID-LAYOUT') {
      const gridWidget = containerEl.querySelector('.gui-grid__widget');
      if (gridWidget) {
        children = Array.from(gridWidget.querySelectorAll(':scope > .gui-grid__cell'));
      } else {
        children = [];
      }
    } else if (tag === 'GUI-FLEX-LAYOUT') {
      const flexWidget = containerEl.querySelector('.gui-flex__widget');
      if (flexWidget) {
        children = Array.from(flexWidget.children).filter((c) => c.id?.startsWith('host-'));
      } else {
        children = [];
      }
    } else {
      // Root: direct host-* children inside design-container
      children = Array.from(containerEl.children).filter(
        (c) => c.id?.startsWith('host-') || c.tagName === 'GUI-FORM',
      );
      // For root, get the children of the gui-form's rendered content
      const guiForm = containerEl.querySelector('gui-form');
      if (guiForm) {
        const formFlex = guiForm.querySelector('.gui-flex__widget');
        if (formFlex) {
          children = Array.from(formFlex.children).filter((c) => c.id?.startsWith('host-'));
        }
      }
    }

    return children.map((c) => c.getBoundingClientRect());
  }

  private calcInsertionIndex(
    childRects: DOMRect[],
    direction: 'row' | 'column',
    x: number,
    y: number,
  ): number {
    let index = childRects.length;
    for (let i = 0; i < childRects.length; i++) {
      const r = childRects[i];
      const mid = direction === 'column' ? r.top + r.height / 2 : r.left + r.width / 2;
      const cursor = direction === 'column' ? y : x;
      if (cursor < mid) {
        index = i;
        break;
      }
    }
    return index;
  }

  private calcIndicatorRect(
    containerEl: Element,
    childRects: DOMRect[],
    direction: 'row' | 'column',
    index: number,
  ): { top: number; left: number; width: number; height: number } {
    const containerRect = containerEl.getBoundingClientRect();
    const layoutRect = this.layoutEl?.getBoundingClientRect() ?? containerRect;
    const scrollLeft = this.layoutEl?.scrollLeft ?? 0;
    const scrollTop = this.layoutEl?.scrollTop ?? 0;

    const toRelX = (absX: number) =>
      absX - layoutRect.left - (this.layoutEl?.clientLeft ?? 0) + scrollLeft;
    const toRelY = (absY: number) =>
      absY - layoutRect.top - (this.layoutEl?.clientTop ?? 0) + scrollTop;

    if (direction === 'column') {
      const width = containerRect.width;
      let absY: number;
      if (childRects.length === 0) {
        absY = containerRect.top + 4;
      } else if (index === 0) {
        absY = childRects[0].top - 2;
      } else if (index >= childRects.length) {
        absY = childRects[childRects.length - 1].bottom + 2;
      } else {
        absY = (childRects[index - 1].bottom + childRects[index].top) / 2;
      }
      return { top: toRelY(absY), left: toRelX(containerRect.left), width, height: 3 };
    } else {
      const height = containerRect.height;
      let absX: number;
      if (childRects.length === 0) {
        absX = containerRect.left + 4;
      } else if (index === 0) {
        absX = childRects[0].left - 2;
      } else if (index >= childRects.length) {
        absX = childRects[childRects.length - 1].right + 2;
      } else {
        absX = (childRects[index - 1].right + childRects[index].left) / 2;
      }
      return { top: toRelY(containerRect.top), left: toRelX(absX), width: 3, height };
    }
  }

  protected onFormHealth(formHealth: Core.FormHealth) {
    console.log('design formHealth', formHealth);
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.log('design formEvent', event);
  }
}
