import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

const departments = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Sales', value: 'sales' },
  { label: 'HR', value: 'hr' },
];

const teamsByDepartment: Record<string, { label: string; value: string }[]> = {
  engineering: [
    { label: 'Frontend', value: 'frontend' },
    { label: 'Backend', value: 'backend' },
    { label: 'Infrastructure', value: 'infra' },
    { label: 'QA', value: 'qa' },
  ],
  design: [
    { label: 'Product Design', value: 'product' },
    { label: 'Brand', value: 'brand' },
    { label: 'UX Research', value: 'ux-research' },
  ],
  marketing: [
    { label: 'Content', value: 'content' },
    { label: 'Growth', value: 'growth' },
    { label: 'Events', value: 'events' },
  ],
  sales: [
    { label: 'Enterprise', value: 'enterprise' },
    { label: 'SMB', value: 'smb' },
    { label: 'Partnerships', value: 'partnerships' },
  ],
  hr: [
    { label: 'Recruiting', value: 'recruiting' },
    { label: 'People Ops', value: 'people-ops' },
    { label: 'L&D', value: 'learning' },
  ],
};

const offices = [
  { label: 'San Francisco', value: 'sf' },
  { label: 'New York', value: 'nyc' },
  { label: 'London', value: 'london' },
  { label: 'Berlin', value: 'berlin' },
  { label: 'Remote', value: 'remote' },
];

const dietaryOptions = [
  { label: 'No restrictions', value: 'none' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-free', value: 'gluten-free' },
  { label: 'Halal', value: 'halal' },
  { label: 'Kosher', value: 'kosher' },
];

export const employeeOnboardingDemo: FormDemoDefinition = {
  title: '40. Employee Onboarding',
  category: 'Ch9: Real World',
  description:
    'HR sends this to new hires on day one. Two tabs organise personal and ' +
    'employment details. Selecting a department cascades to populate the team ' +
    'dropdown. An accordion at the bottom holds a repeater for prior employment ' +
    'history. Required fields are marked via tags.',
  formDef: () => [
    gui.layouts.tabs([
      {
        label: 'Personal Details',
        children: [
          gui.inputs.textInput('firstName', {}, ['required']),
          gui.inputs.textInput('lastName', {}, ['required']),
          gui.inputs.textInput('email', {}, ['required']),
          gui.inputs.textInput('phone'),
          gui.inputs.datePicker('dateOfBirth', { label: 'Date of birth' }),
          gui.layouts.horizontalFlex([
            gui.inputs.textInput('emergencyContactName', { label: 'Emergency contact' }, [
              'required',
            ]),
            gui.inputs.textInput('emergencyContactPhone', { label: 'Contact phone' }, ['required']),
          ]),
        ],
      },
      {
        label: 'Employment',
        children: [
          gui.inputs.select('department', {
            options: departments,
            label: 'Department',
            onChange: (event) => {
              const selected = event.data?.department;
              const teams = teamsByDepartment[selected] ?? [];
              event.update({ path: 'team', options: teams });
            },
          }),
          gui.inputs.select('team', {
            options: [],
            label: 'Team',
          }),
          gui.inputs.datePicker('startDate', { label: 'Start date' }),
          gui.inputs.select('office', {
            options: offices,
            label: 'Office location',
          }),
          gui.inputs.select('dietaryPreference', {
            options: dietaryOptions,
            label: 'Dietary preference (welcome lunch)',
          }),
        ],
      },
    ]),
    gui.layouts.accordion([
      {
        label: 'Prior Employment',
        children: [
          gui.inputs.repeater('employmentHistory', {
            addLabel: 'Add position',
            removeLabel: 'Remove',
            template: [
              gui.layouts.horizontalFlex([
                gui.inputs.textInput('company'),
                gui.inputs.textInput('role'),
              ]),
              gui.layouts.horizontalFlex([
                gui.inputs.datePicker('from', { label: 'From' }),
                gui.inputs.datePicker('to', { label: 'To' }),
              ]),
            ],
          }),
        ],
      },
    ]),
  ],
  formSelectors: () => [
    gui.selectors.tag('required').inputs({
      override: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Onboarding submitted:', data),
  }),
};
