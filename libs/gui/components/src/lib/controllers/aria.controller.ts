import { type ControlTemplateData, filterTap } from '@golemui/core';
import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export class GUIAriaController<T, ExtraProps extends { hint?: string }>
  implements ReactiveController
{
  private getTargets: () => NodeListOf<Element> | HTMLElement[] | HTMLElement | null;
  private getState: () => {
    uid: string;
    templateData: ControlTemplateData<T> & ExtraProps;
  };

  constructor(
    host: ReactiveControllerHost,
    options: {
      getTargets: () => NodeListOf<Element> | HTMLElement[] | HTMLElement | null;
      getState: () => {
        uid: string;
        templateData: ControlTemplateData<T> & ExtraProps;
      };
    },
  ) {
    host.addController(this);
    this.getTargets = options.getTargets;
    this.getState = options.getState;
  }

  hostConnected() {
    // Do nothing
  }

  hostUpdated() {
    const rawTargets = this.getTargets();
    if (!rawTargets) return;

    let elements: Element[] = [];

    if (rawTargets instanceof NodeList) {
      elements = Array.from(rawTargets);
    } else if (Array.isArray(rawTargets)) {
      elements = rawTargets as Element[];
    } else {
      elements = [rawTargets as Element];
    }

    const { uid, templateData } = this.getState();
    const { touched, errors, readonly, disabled, hint } = templateData;
    const showErrors = touched && errors && errors.length > 0;

    filterTap(
      elements,
      (e) => !!e,
      (element) => {
        const toggleAttr = (attr: string, value: string | null) => {
          if (value) {
            element.setAttribute(attr, value);
          } else {
            element.removeAttribute(attr);
          }
        };

        toggleAttr('aria-describedby', hint ? `${uid}_hint` : null);
        toggleAttr('aria-invalid', showErrors ? 'true' : null);
        toggleAttr('aria-errormessage', showErrors ? `${uid}_errors` : null);
        toggleAttr('aria-readonly', disabled || readonly ? 'true' : null);
      },
    );
  }
}
