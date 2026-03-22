import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
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
  findWidgetByUid,
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
  formDefChange = output<string>();
  selectedWidgetChange = output<Record<string, unknown> | null>();

  private elRef = inject(ElementRef);

  hoveredHighlight = signal<ComponentHighlight | null>(null);
  selectedHighlight = signal<ComponentHighlight | null>(null);
  // Snapshot of the selected widget — set on selection, NOT updated when formDef changes,
  // so the properties panel stays stable while the user types.
  selectedWidget = signal<Record<string, unknown> | null>(null);
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

  protected onFormHealth(formHealth: Core.FormHealth) {
    console.log('design formHealth', formHealth);
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.log('design formEvent', event);
  }
}
