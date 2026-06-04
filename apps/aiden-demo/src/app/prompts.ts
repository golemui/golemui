/**
 * The canned prompt → {gui.} pairs that drive the demo.
 *
 * The story: you describe a form to an LLM in plain language; the model emits a
 * GolemUI form-definition JSON; our MCP validates that JSON against the bundled
 * {gui.} schemas; GolemUI renders it. This file is the deterministic, offline
 * stand-in for that loop — each entry pairs the natural-language `prompt` with
 * the validated `formDefinition` the loop produced.
 *
 * TODO: replace these three placeholder pairs with the real prompt/output pairs
 * from the user. The `formDefinition` of each must be valid {gui.} JSON
 * (`{ form: [ { kind, type, path, label, validator? }, … ] }`) — the same shape
 * the MCP's `validate_form_definition` accepts and `GuiForm` renders directly.
 */
export interface PromptExample {
  /** Stable key — drives left-column selection and the GuiForm remount. */
  id: string;
  /** Short left-column title. */
  label: string;
  /** The natural-language ask handed to the LLM. */
  prompt: string;
  /** The {gui.} form definition the LLM emitted and the MCP validated. */
  formDefinition: Record<string, unknown>;
}

export const PROMPTS: PromptExample[] = [
  {
    id: 'support-ticket',
    label: 'Support ticket',
    prompt: `A support ticket form.

Ask for:
- Subject line (required, up to 120 characters)
- Priority (dropdown): Low, Normal, High, Urgent
- A longer description of the problem (multi-line, required)
- An opt-in checkbox for email updates

End with an Open ticket submit button.`,
    formDefinition: {
      $schema: 'https://golemui.com/schemas/form.schema.json',
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'subject',
          label: 'Subject',
          validator: { type: 'string', required: true, maxLength: 120 },
        },
        {
          kind: 'input',
          type: 'select',
          path: 'priority',
          label: 'Priority',
          props: {
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Normal', value: 'normal' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ],
          },
        },
        {
          kind: 'input',
          type: 'textarea',
          path: 'description',
          label: 'Description',
          validator: { type: 'string', required: true, minLength: 20 },
          props: { hint: 'Tell us what happened and what you expected.' },
        },
        {
          kind: 'input',
          type: 'checkbox',
          path: 'emailUpdates',
          label: 'Email me updates',
        },
        {
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          label: 'Open ticket',
          props: { variant: 'filled' },
        },
      ],
    },
  },
  {
    id: 'job-application',
    label: 'Job application',
    prompt: `Build a Job Application form.

Applicant details:
- Full name (text, required)
- Email (text, required, email format)
- Phone (text, required)
- Portfolio / LinkedIn URL (text, optional)
- Short bio (markdown editor)

Work experience — a repeatable list ("Add experience" / "Remove experience"). Each entry has:
- Company (text, required)
- Position (text, required)
- Start date (date, required)
- Currently working here (yes/no toggle, default no)
- End date (date) — hide this field when "Currently working here" is yes
- What you did (multi-line text, short)

End with a Submit application button.`,
    formDefinition: {
      $schema: 'https://golemui.com/schemas/form.schema.json',
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'fullName',
          label: 'Full name',
          validator: { type: 'string', required: true, minLength: 1 },
          props: { placeholder: 'Jane Doe', autocomplete: 'name' },
        },
        {
          kind: 'input',
          type: 'textinput',
          path: 'email',
          label: 'Email',
          validator: { type: 'string', required: true, format: 'email' },
          props: { placeholder: 'jane@example.com', autocomplete: 'email' },
        },
        {
          kind: 'input',
          type: 'textinput',
          path: 'phone',
          label: 'Phone',
          validator: { type: 'string', required: true, minLength: 1 },
          props: { placeholder: '+1 555 123 4567', autocomplete: 'tel' },
        },
        {
          kind: 'input',
          type: 'textinput',
          path: 'portfolioUrl',
          label: 'Portfolio / LinkedIn URL',
          validator: { type: 'string', required: false, format: 'url' },
          props: { placeholder: 'https://linkedin.com/in/jane' },
        },
        {
          kind: 'input',
          type: 'markdown',
          path: 'bio',
          label: 'Short bio',
          props: {
            placeholder: 'Tell us a bit about yourself…',
            minimumHeight: 120,
            autoGrow: true,
          },
        },
        {
          kind: 'input',
          type: 'repeater',
          path: 'experience',
          label: 'Work experience',
          props: {
            addLabel: 'Add experience',
            removeLabel: 'Remove experience',
            title: 'Experience',
            template: {
              kind: 'layout',
              type: 'flex',
              props: { direction: 'column' },
              children: [
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'experience.items.company',
                  label: 'Company',
                  validator: { type: 'string', required: true, minLength: 1 },
                },
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'experience.items.position',
                  label: 'Position',
                  validator: { type: 'string', required: true, minLength: 1 },
                },
                {
                  kind: 'input',
                  type: 'dateInput',
                  path: 'experience.items.startDate',
                  label: 'Start date',
                  validator: { type: 'string', required: true },
                },
                {
                  kind: 'input',
                  type: 'toggle',
                  path: 'experience.items.currentlyWorking',
                  label: 'Currently working here',
                  defaultValue: false,
                },
                {
                  kind: 'input',
                  type: 'dateInput',
                  path: 'experience.items.endDate',
                  label: 'End date',
                  exclude: { when: '$form.experience?.items?.currentlyWorking === true' },
                },
                {
                  kind: 'input',
                  type: 'textarea',
                  path: 'experience.items.whatYouDid',
                  label: 'What you did',
                  props: {
                    minimumHeight: 80,
                    autoGrow: true,
                    placeholder: 'Briefly describe your responsibilities and impact.',
                  },
                },
              ],
            },
          },
        },
        {
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          label: 'Submit application',
          props: { variant: 'filled' },
        },
      ],
    },
  },
  {
    id: 'create-teams',
    label: 'Create teams',
    prompt: `Build a "Create Teams" form for onboarding an org's teams and their people.

At the top level, let the user add one or more teams (a repeatable list — "Add team" / "Remove team"). Each team has:
- Team name (text, required)
- Department (dropdown, required): Engineering, Sales, Marketing, Support, Operations
- Cost center (text, optional)

Inside each team, let the user add one or more team members (a nested repeatable list — "Add member" / "Remove member"). Each member has:
- Full name (text, required)
- Work email (text, required, email format)
- Member type (dropdown, required): Employee, Contractor, External
- Access level (dropdown, required): Standard, Admin
- Needs hardware? (yes/no toggle, default no)

Apply these show/hide rules within each member, based on that member's own selections:
- When Member type is "Contractor", also show Contract end date (date, required) and Hourly rate (USD) (number, minimum 0).
- When Member type is "External", also show Company / agency name (text, required) and NDA signed? (checkbox).
- When Access level is "Admin", also show Reason for admin access (multi-line text, required).
- When Needs hardware? is yes, also show Device type (dropdown: Laptop, Desktop, Phone) and Shipping address (multi-line text, required).

Hide each conditional field entirely when its condition isn't met.

End the form with a Create teams submit button.`,
    formDefinition: {
      $schema: 'https://golemui.com/schemas/form.schema.json',
      form: [
        {
          kind: 'input',
          type: 'repeater',
          path: 'teams',
          label: 'Teams',
          props: {
            addLabel: 'Add team',
            removeLabel: 'Remove team',
            title: 'Team',
            template: {
              kind: 'layout',
              type: 'flex',
              props: { direction: 'column', gap: 16 },
              children: [
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'teams.items.teamName',
                  label: 'Team name',
                  validator: { type: 'string', required: true },
                },
                {
                  kind: 'input',
                  type: 'dropdown',
                  path: 'teams.items.department',
                  label: 'Department',
                  validator: { type: 'string', required: true },
                  props: {
                    placeholder: 'Select a department',
                    items: ['Engineering', 'Sales', 'Marketing', 'Support', 'Operations'],
                  },
                },
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'teams.items.costCenter',
                  label: 'Cost center',
                  props: { hint: 'Optional' },
                },
                {
                  kind: 'input',
                  type: 'repeater',
                  path: 'teams.items.members',
                  label: 'Team members',
                  props: {
                    addLabel: 'Add member',
                    removeLabel: 'Remove member',
                    title: 'Member',
                    template: {
                      kind: 'layout',
                      type: 'flex',
                      props: { direction: 'column', gap: 16 },
                      children: [
                        {
                          kind: 'input',
                          type: 'textinput',
                          path: 'teams.items.members.items.fullName',
                          label: 'Full name',
                          validator: { type: 'string', required: true },
                        },
                        {
                          kind: 'input',
                          type: 'textinput',
                          path: 'teams.items.members.items.workEmail',
                          label: 'Work email',
                          validator: { type: 'string', required: true, format: 'email' },
                        },
                        {
                          kind: 'input',
                          type: 'dropdown',
                          path: 'teams.items.members.items.memberType',
                          label: 'Member type',
                          validator: { type: 'string', required: true },
                          props: {
                            placeholder: 'Select a member type',
                            items: ['Employee', 'Contractor', 'External'],
                          },
                        },
                        {
                          kind: 'input',
                          type: 'dropdown',
                          path: 'teams.items.members.items.accessLevel',
                          label: 'Access level',
                          validator: { type: 'string', required: true },
                          props: {
                            placeholder: 'Select an access level',
                            items: ['Standard', 'Admin'],
                          },
                        },
                        {
                          kind: 'input',
                          type: 'toggle',
                          path: 'teams.items.members.items.needsHardware',
                          label: 'Needs hardware?',
                          defaultValue: false,
                        },
                        {
                          kind: 'input',
                          type: 'dateInput',
                          path: 'teams.items.members.items.contractEndDate',
                          label: 'Contract end date',
                          validator: { type: 'string', required: true },
                          include: {
                            when: "$form.teams?.items?.members?.items?.memberType === 'Contractor'",
                          },
                        },
                        {
                          kind: 'input',
                          type: 'number',
                          path: 'teams.items.members.items.hourlyRate',
                          label: 'Hourly rate (USD)',
                          props: { minimum: 0 },
                          validator: { type: 'number', minimum: 0 },
                          include: {
                            when: "$form.teams?.items?.members?.items?.memberType === 'Contractor'",
                          },
                        },
                        {
                          kind: 'input',
                          type: 'textinput',
                          path: 'teams.items.members.items.companyName',
                          label: 'Company / agency name',
                          validator: { type: 'string', required: true },
                          include: {
                            when: "$form.teams?.items?.members?.items?.memberType === 'External'",
                          },
                        },
                        {
                          kind: 'input',
                          type: 'checkbox',
                          path: 'teams.items.members.items.ndaSigned',
                          label: 'NDA signed?',
                          include: {
                            when: "$form.teams?.items?.members?.items?.memberType === 'External'",
                          },
                        },
                        {
                          kind: 'input',
                          type: 'textarea',
                          path: 'teams.items.members.items.adminReason',
                          label: 'Reason for admin access',
                          validator: { type: 'string', required: true },
                          props: { minimumHeight: 100, autoGrow: true },
                          include: {
                            when: "$form.teams?.items?.members?.items?.accessLevel === 'Admin'",
                          },
                        },
                        {
                          kind: 'input',
                          type: 'dropdown',
                          path: 'teams.items.members.items.deviceType',
                          label: 'Device type',
                          props: {
                            placeholder: 'Select a device type',
                            items: ['Laptop', 'Desktop', 'Phone'],
                          },
                          include: {
                            when: '$form.teams?.items?.members?.items?.needsHardware === true',
                          },
                        },
                        {
                          kind: 'input',
                          type: 'textarea',
                          path: 'teams.items.members.items.shippingAddress',
                          label: 'Shipping address',
                          validator: { type: 'string', required: true },
                          props: { minimumHeight: 100, autoGrow: true },
                          include: {
                            when: '$form.teams?.items?.members?.items?.needsHardware === true',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          kind: 'action',
          type: 'button',
          label: 'Create teams',
          actionType: 'submit',
        },
      ],
    },
  },
];
