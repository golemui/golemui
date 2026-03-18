import {
  afterNextRender,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import * as Core from '@golemui/core';
import * as Gui from '@golemui/gui-angular';

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

  private elRef = inject(ElementRef);

  hoveredHighlight = signal<ComponentHighlight | null>(null);
  selectedHighlight = signal<ComponentHighlight | null>(null);

  constructor() {
    afterNextRender(() => {
      const container = this.elRef.nativeElement.querySelector('.design-container');
      container?.addEventListener('scroll', () => this.refreshSelectedRect());
    });
  }

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
      this.selectedHighlight.set(current?.uid === hl.uid ? null : hl);
      event.stopPropagation();
    } else {
      this.selectedHighlight.set(null);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.refreshSelectedRect();
  }

  protected selectBreadcrumb(item: BreadcrumbItem, event: MouseEvent) {
    event.stopPropagation();
    const current = this.selectedHighlight();
    this.selectedHighlight.set(current?.uid === item.uid ? null : this.makeHighlight(item.el));
  }

  private refreshSelectedRect() {
    const sel = this.selectedHighlight();
    if (sel) {
      this.selectedHighlight.set({ ...sel, rect: sel.el.getBoundingClientRect() });
    }
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
      rect: el.getBoundingClientRect(),
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
