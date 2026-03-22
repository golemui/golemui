import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiTabs,
  _guiAccordion,
  _guiRepeater,
  _guiInputs,
  _guiTextInput,
  _guiSelect,
  _guiDatePicker,
  _guiHorizontalStack,
  _gslTag,
  _gslInputs,
} from '@golemui/gui-shared';

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
    'HR sends this to new hires on day one. Two tabs organise personal and '
    + 'employment details. Selecting a department cascades to populate the team '
    + 'dropdown. An accordion at the bottom holds a repeater for prior employment '
    + 'history. Required fields are marked via tags.',
  formDef: () => [
    _guiTabs({
      'Personal Details': [
        _guiInputs({
          firstName: ['string', 'required'],
          lastName: ['string', 'required'],
          email: ['string', 'required'],
          phone: 'string',
        }),
        _guiDatePicker('dateOfBirth', { label: 'Date of birth' }),
        _guiHorizontalStack([
          _guiTextInput('emergencyContactName', { label: 'Emergency contact' }, ['required']),
          _guiTextInput('emergencyContactPhone', { label: 'Contact phone' }, ['required']),
        ]),
      ],
      'Employment': [
        _guiSelect('department', {
          options: departments,
          label: 'Department',
          onChange: (event) => {
            const selected = event.data?.department;
            const teams = teamsByDepartment[selected] ?? [];
            event.update({ path: 'team', options: teams });
          },
        }),
        _guiSelect('team', {
          options: [],
          label: 'Team',
        }),
        _guiDatePicker('startDate', { label: 'Start date' }),
        _guiSelect('office', {
          options: offices,
          label: 'Office location',
        }),
        _guiSelect('dietaryPreference', {
          options: dietaryOptions,
          label: 'Dietary preference (welcome lunch)',
        }),
      ],
    }),
    _guiAccordion(
      {
        'Prior Employment': [
          _guiRepeater(
            'employmentHistory',
            { addLabel: 'Add position', removeLabel: 'Remove' },
            [
              _guiHorizontalStack([
                _guiInputs({ company: 'string', role: 'string' }),
              ]),
              _guiHorizontalStack([
                _guiDatePicker('from', { label: 'From' }),
                _guiDatePicker('to', { label: 'To' }),
              ]),
            ],
          ),
        ],
      },
    ),
  ],
  formSelectors: () => [
    _gslTag('required', _gslInputs({
      decorator: (cur) => ({
        placeholder: `${('placeholder' in cur ? cur.placeholder : undefined) ?? cur.path} *`,
      }),
    })),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Onboarding submitted:', data),
  }),
};
