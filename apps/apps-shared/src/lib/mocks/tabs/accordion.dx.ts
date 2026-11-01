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
        gui.inputs.textInput('shoppingCart.firstName', {
          label: 'First name',
          validator: { required: true },
        }),
        gui.inputs.textInput('shoppingCart.lastName', {
          label: 'Last name',
          validator: { required: true },
        }),
      ],
    },
    {
      label: 'Shipping Address',
      uid: 'section2',
      children: [
        gui.layouts.horizontalGrid([
          gui.inputs.textInput('shoppingCart.shippingAddress', {
            label: 'Shipping address',
            validator: { required: true },
          }),
          gui.inputs.textInput('shoppingCart.shippingState', {
            label: 'Shipping state',
            validator: { required: true },
          }),
        ]),
      ],
    },
    {
      label: 'Billing Address',
      uid: 'section3',
      children: [
        gui.layouts.horizontalGrid([
          gui.inputs.textInput('shoppingCart.billingAddress', {
            label: 'Billing address',
            validator: { required: true },
          }),
          gui.inputs.textInput('shoppingCart.billingState', {
            label: 'Billing state',
            validator: { required: true },
          }),
        ]),
      ],
    },
  ],
  {
    singleOpen: false,
    defaultOpen: { section1: true },
    onChange: () => 'onAccordionEvent',
  },
);
