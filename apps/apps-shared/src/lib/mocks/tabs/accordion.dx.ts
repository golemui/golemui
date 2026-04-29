import { gui } from '@golemui/gui-shared';

export const accordionTab = gui.layouts.accordion(
  [
    {
      label: 'Personal Information',
      uid: 'section1',
      // Accordion auto-wraps section children in a flex; matches the JSON shape
      // for section1 (which is itself a flex). For sections 2 and 3 the JSON
      // uses a grid — `_guiAccordion` doesn't expose a per-section type, so we
      // accept the auto-flex and embed a grid inside (one extra layer; tracked
      // as an accordion-per-section-type gap in dx-open-items).
      children: [
        gui.inputs.textInput('shoppingCart.firstName', { validator: { required: true } }),
        gui.inputs.textInput('shoppingCart.lastName', { validator: { required: true } }),
      ],
    },
    {
      label: 'Shipping Address',
      uid: 'section2',
      children: [
        gui.layouts.grid([
          gui.inputs.textInput('shoppingCart.shippingAddress', { validator: { required: true } }),
          gui.inputs.textInput('shoppingCart.shippingState', { validator: { required: true } }),
        ]),
      ],
    },
    {
      label: 'Billing Address',
      uid: 'section3',
      children: [
        gui.layouts.grid([
          gui.inputs.textInput('shoppingCart.billingAddress', { validator: { required: true } }),
          gui.inputs.textInput('shoppingCart.billingState', { validator: { required: true } }),
        ]),
      ],
    },
  ],
  {
    singleOpen: false,
    defaultOpen: { section1: true },
    onChange: 'onAccordionEvent',
  },
);
