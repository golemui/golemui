import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui, DxRuntimeParams } from '@golemui/gui-shared';

const products = [
  { label: 'Cloud Platform', value: 'cloud' },
  { label: 'Desktop App', value: 'desktop' },
  { label: 'Mobile App', value: 'mobile' },
  { label: 'API / SDK', value: 'api' },
];

const categoriesByProduct: Record<string, { label: string; value: string }[]> = {
  cloud: [
    { label: 'Billing', value: 'billing' },
    { label: 'Permissions', value: 'permissions' },
    { label: 'Outage', value: 'outage' },
  ],
  desktop: [
    { label: 'Installation', value: 'install' },
    { label: 'Crash', value: 'crash' },
    { label: 'Performance', value: 'performance' },
  ],
  mobile: [
    { label: 'Login', value: 'login' },
    { label: 'Push Notifications', value: 'push' },
    { label: 'Sync', value: 'sync' },
  ],
  api: [
    { label: 'Authentication', value: 'auth' },
    { label: 'Rate Limits', value: 'rate-limits' },
    { label: 'Documentation', value: 'docs' },
  ],
};

const priorities = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export const supportTicketDemo: FormDemoDefinition = {
  title: '41. Support Ticket',
  category: 'Ch9: Real World',
  description:
    'A customer-facing support request. Selecting a product cascades to load ' +
    'category options. Priority drives conditional fields and dynamic button ' +
    'labels. A live summary at the bottom reads form state reactively.',
  formDef: () => [
    gui.inputs.select('product', {
      options: products,
      label: 'Product',
      onChange: (event) => {
        const selected = event.data?.product;
        const cats = categoriesByProduct[selected] ?? [];
        event.update({ path: 'category', options: cats });
      },
    }),
    gui.inputs.select('category', {
      options: [],
      label: 'Category',
    }),
    gui.inputs.radiogroup('priority', {
      options: priorities,
      label: 'Priority',
    }),
    gui.inputs.textInput('escalationContact', {
      label: 'Escalation contact',
      include: { when: '$form.priority === "critical"' },
    }),
    gui.inputs.textInput('subject', { label: 'Subject', uid: 'subject' }),
    gui.inputs.textarea('description', { label: 'Description', uid: 'description' }),
    gui.inputs.repeater('attachments', {
      addLabel: 'Add attachment',
      removeLabel: 'Remove',
      template: [gui.inputs.textInput('filename'), gui.inputs.textInput('notes')],
    }),
    gui.displays.display((params: DxRuntimeParams) => {
      const form = params?.$form;
      if (!form?.product || !form?.priority) return null;
      const category = form.category ? ` > ${form.category}` : '';
      return (
        <p style={{ padding: '0.75rem', background: 'f0f4f8', borderRadius: '4px' }}>
          You're submitting a <strong>{form.priority}</strong> ticket for{' '}
          <strong>
            {form.product}
            {category}
          </strong>
          .
        </p>
      );
    }),
    gui.actions.button({
      label: 'Submit Ticket',
      states: { urgent: { label: 'Submit Urgent Ticket' } },
    }),
  ],
  formSelectors: () => [
    gui.selectors.inputByUid('description', {
      override: { placeholder: 'Describe the issue in detail…' },
    }),
  ],
  formConfig: () => ({
    states: {
      urgent: '$form.priority === "critical"',
    },
    onSubmit: (data: any) => console.log('Ticket submitted:', data),
  }),
};
