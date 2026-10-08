import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { showsErrors, type ControlTemplateData } from '../utils/templates';
import { warnIfUnlabelled } from '../utils/dev';

export class GUIAriaController<T, ExtraProps extends { hint?: string; required?: boolean }>
  implements ReactiveController
{
  private getTargets: () => NodeListOf<Element> | HTMLElement[] | HTMLElement | null;
  private getState: () => {
    uid: string;
    templateData: ControlTemplateData<T> & ExtraProps;
  };
  private host: ReactiveControllerHost;
  private requiresLabel: boolean;

  constructor(
    host: ReactiveControllerHost,
    options: {
      /**
       * The field takes its accessible name from the `${uid}_label` element, its own label or its
       * host picker's, and warns in development when there is none.
       */
      requiresLabel?: boolean;
      getTargets: () => NodeListOf<Element> | HTMLElement[] | HTMLElement | null;
      getState: () => {
        uid: string;
        templateData: ControlTemplateData<T> & ExtraProps;
      };
    },
  ) {
    host.addController(this);
    this.host = host;
    this.getTargets = options.getTargets;
    this.getState = options.getState;
    this.requiresLabel = options.requiresLabel ?? false;
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
    if (this.requiresLabel && this.host instanceof HTMLElement) {
      warnIfUnlabelled(this.host, `${uid}_label`);
    }
    const { touched, errors, readonly, disabled, hint, required } = templateData;
    const showErrors = showsErrors(touched, errors);

    const toggleAttr = (element: Element, attr: string, value: string | null) => {
      if (value) {
        element.setAttribute(attr, value);
      } else {
        element.removeAttribute(attr);
      }
    };

    for (const element of elements) {
      if (!element) continue;

      toggleAttr(element, 'aria-describedby', hint ? `${uid}_hint` : null);
      toggleAttr(element, 'aria-invalid', showErrors ? 'true' : null);
      toggleAttr(element, 'aria-errormessage', showErrors ? `${uid}_errors` : null);
      toggleAttr(element, 'aria-disabled', disabled ? 'true' : null);

      // A group (the parts of a date or time field, the input of a tags field) supports neither
      // aria-readonly nor aria-required: the controls inside it carry them.
      const isGroup = element.getAttribute('role') === 'group';
      const stateTargets = isGroup
        ? Array.from(element.querySelectorAll('[role="spinbutton"], input[type="text"]'))
        : [element];
      if (isGroup) {
        toggleAttr(element, 'aria-readonly', null);
        toggleAttr(element, 'aria-required', null);
      }
      for (const target of stateTargets) {
        toggleAttr(target, 'aria-readonly', readonly ? 'true' : null);
        toggleAttr(target, 'aria-required', required ? 'true' : null);
      }
    }
  }
}
