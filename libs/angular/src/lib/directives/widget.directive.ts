import { isPlatformServer } from '@angular/common';
import {
  type ComponentRef,
  Directive,
  inject,
  input,
  type OnDestroy,
  type OnInit,
  PLATFORM_ID,
  type Type,
  ViewContainerRef,
} from '@angular/core';
import { type NonFunctionWidget, type WithWidget, errorCodes } from '@golemui/core';
import { AngularFormContext } from '../context/form.context';

/**
 * Loads the component registered for the widget's type and creates it with the widget config.
 * Widgets inside a repeater row arrive with the row indexes already applied to `uid` and `path`
 * (the store expands repeater rows from the data), so no index handling happens here.
 */
@Directive({
  selector: '[guiWidget]',
  standalone: true,
})
export class WidgetDirective implements OnInit, OnDestroy {
  widget = input.required<NonFunctionWidget<string>>();

  private formContext: AngularFormContext<Type<WithWidget>> = inject(AngularFormContext);
  private platformId = inject(PLATFORM_ID);
  private viewContainerRef = inject(ViewContainerRef);
  private componentRef!: ComponentRef<WithWidget>;
  private destroyed = false;

  async ngOnInit() {
    // Read the input once so a bad binding fails inside the try, not again in the catch.
    const widget = this.widget();
    // When the component is already preloaded, create it synchronously so it renders in
    // the same change detection pass. Server renders and hydration both depend on this.
    const preloaded = this.formContext.widgetRegistry.getIfLoaded(widget.type);
    if (preloaded) {
      this.createComponent(preloaded);
      return;
    }
    if (isPlatformServer(this.platformId)) {
      console.warn(
        `[GolemUI] Widget "${widget.type}" was not preloaded; its server markup will be empty. ` +
          'Call preloadFormWidgets() before rendering.',
      );
    }
    try {
      const component = await this.formContext.widgetRegistry.loadWidget(widget.type);
      // The directive can be destroyed while the loader is still running.
      if (this.destroyed) {
        return;
      }
      this.createComponent(component);
    } catch {
      const code = errorCodes.widgetCouldNotBeLoaded;
      this.formContext.store.dispatch({
        type: 'SET_FORM_HEALTH',
        payload: {
          formHealth: {
            status: 'errored',
            message: `[${code}] Widget "${widget?.type}" could not be loaded`,
            code,
          },
        },
      });
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  private createComponent(component: Type<WithWidget>) {
    this.componentRef = this.viewContainerRef.createComponent(component);
    this.componentRef.instance.widget = this.widget();
    (this.componentRef.location.nativeElement as HTMLElement).id =
      `host-${this.componentRef.instance.widget.uid}`;
  }
}
