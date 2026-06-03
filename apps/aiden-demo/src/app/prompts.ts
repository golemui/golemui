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
    id: 'event-signup',
    label: 'Event signup',
    prompt:
      'A signup form for a developer meetup. Collect the attendee’s full name, ' +
      'email, the size of their team, which track they’ll attend (Frontend, ' +
      'Backend, or AI), and whether they want a vegetarian meal.',
    formDefinition: {
      $schema: 'https://golemui.com/schemas/form.schema.json',
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'fullName',
          label: 'Full name',
          validator: { type: 'string', required: true },
        },
        {
          kind: 'input',
          type: 'textinput',
          path: 'email',
          label: 'Email',
          validator: { type: 'string', required: true, format: 'email' },
        },
        {
          kind: 'input',
          type: 'number',
          path: 'teamSize',
          label: 'Team size',
          validator: { type: 'integer', minimum: 1, maximum: 500 },
        },
        {
          kind: 'input',
          type: 'select',
          path: 'track',
          label: 'Track',
          props: {
            options: [
              { label: 'Frontend', value: 'frontend' },
              { label: 'Backend', value: 'backend' },
              { label: 'AI', value: 'ai' },
            ],
          },
        },
        {
          kind: 'input',
          type: 'checkbox',
          path: 'vegetarian',
          label: 'Vegetarian meal',
        },
        {
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          label: 'Register',
          props: { variant: 'filled' },
        },
      ],
    },
  },
  {
    id: 'support-ticket',
    label: 'Support ticket',
    prompt:
      'A support ticket form. Ask for a subject line, a priority (Low, Normal, ' +
      'High, Urgent), a longer description of the problem, and let them opt in to ' +
      'email updates.',
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
    prompt:
      'A job application form. Collect the candidate’s name, email, the role ' +
      'they’re applying for, years of experience, an available start date, and a ' +
      'short cover note.',
    formDefinition: {
      $schema: 'https://golemui.com/schemas/form.schema.json',
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'name',
          label: 'Name',
          validator: { type: 'string', required: true },
        },
        {
          kind: 'input',
          type: 'textinput',
          path: 'email',
          label: 'Email',
          validator: { type: 'string', required: true, format: 'email' },
        },
        {
          kind: 'input',
          type: 'select',
          path: 'role',
          label: 'Role',
          props: {
            options: [
              { label: 'Frontend Engineer', value: 'frontend' },
              { label: 'Backend Engineer', value: 'backend' },
              { label: 'Designer', value: 'designer' },
            ],
          },
        },
        {
          kind: 'input',
          type: 'number',
          path: 'experience',
          label: 'Years of experience',
          validator: { type: 'integer', minimum: 0, maximum: 50 },
        },
        {
          kind: 'input',
          type: 'datePicker',
          path: 'startDate',
          label: 'Available from',
        },
        {
          kind: 'input',
          type: 'textarea',
          path: 'coverNote',
          label: 'Cover note',
          props: { hint: 'A couple of sentences on why you’re a fit.' },
        },
        {
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          label: 'Apply',
          props: { variant: 'filled' },
        },
      ],
    },
  },
];
