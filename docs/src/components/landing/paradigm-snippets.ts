export type Snippet = {
  id: string;
  /** Pill label — framework name only. */
  label: string;
  /** Full header label inside the column — framework + library. */
  headerLabel: string;
  pillIcon: 'react' | 'angular' | 'lit' | 'js';
  lang: string;
  code: string;
  /** Lines of code in the form definition. */
  lines: number;
  /** Count of `if` / `when` / conditional renders the developer wrote by hand. */
  branches: number;
  /** Input tokens in the form definition, measured with `tiktoken` `cl100k_base`. */
  tokens: number;
  /** Named APIs / hooks / decorators the developer must know to write this. */
  concepts: string[];
  /** Brand color for tinting the left box (hex + rgb-triplet). */
  color: string;
  colorRgb: string;
};

export const reactRhf: Snippet = {
  id: 'react-rhf',
  label: 'React',
  headerLabel: 'React + React Hook Form',
  pillIcon: 'react',
  lang: 'tsx',
  lines: 76,
  branches: 8,
  tokens: 622,
  concepts: ['useForm', 'register', 'useWatch', 'handleSubmit', 'formState'],
  color: '#61dafb',
  colorRgb: '97, 218, 251',
  code: `import { useForm, useWatch } from 'react-hook-form';

type FormData = {
  email: string;
  password: string;
  accountType: 'Free' | 'Pro' | 'Enterprise';
  companyName?: string;
  seats?: number;
  subscribe: boolean;
  frequency?: string;
  terms: boolean;
};

export function SignupForm() {
  const { register, control, handleSubmit, formState: { errors } } =
    useForm<FormData>({
      defaultValues: { accountType: 'Free', subscribe: false, terms: false },
    });
  const accountType = useWatch({ control, name: 'accountType' });
  const subscribe = useWatch({ control, name: 'subscribe' });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <label>Email
        <input type="email" {...register('email', {
          required: true,
          pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
        })} />
        {errors.email && <span>Valid email required</span>}
      </label>

      <label>Password
        <input type="password" {...register('password', {
          required: true,
          minLength: 8,
        })} />
        {errors.password && <span>Min 8 characters</span>}
      </label>

      <label>Account type
        <select {...register('accountType', { required: true })}>
          <option>Free</option>
          <option>Pro</option>
          <option>Enterprise</option>
        </select>
      </label>

      {accountType !== 'Free' && (
        <label>Company name
          <input {...register('companyName', { required: true })} />
          {errors.companyName && <span>Required</span>}
        </label>
      )}

      {accountType === 'Enterprise' && (
        <label>Seats
          <input type="number" {...register('seats', {
            required: true, min: 5, max: 1000, valueAsNumber: true,
          })} />
          {errors.seats && <span>Between 5 and 1000</span>}
        </label>
      )}

      <label>
        <input type="checkbox" {...register('subscribe')} />
        Subscribe to product updates
      </label>

      {subscribe && (
        <label>Frequency
          <select {...register('frequency', { required: true })}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </label>
      )}

      <label>
        <input type="checkbox" {...register('terms', {
          validate: (v) => v === true || 'Required',
        })} />
        I accept the terms of service
      </label>

      <button type="submit">Sign up</button>
    </form>
  );
}`,
};

export const angularReactive: Snippet = {
  id: 'angular',
  label: 'Angular',
  headerLabel: 'Angular Signal Forms',
  pillIcon: 'angular',
  lang: 'ts',
  lines: 80,
  branches: 6,
  tokens: 707,
  concepts: ['form()', 'schema()', 'signal()', 'Control', '@Component'],
  color: '#dd0031',
  colorRgb: '221, 0, 49',
  code: `import { Component, signal } from '@angular/core';
import {
  form, Control, schema, required, email, minLength, validate,
} from '@angular/forms/signals';

interface Signup {
  email: string;
  password: string;
  accountType: 'Free' | 'Pro' | 'Enterprise';
  companyName: string;
  seats: number | null;
  subscribe: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  terms: boolean;
}

const signupSchema = schema<Signup>((data) => {
  required(data.email); email(data.email);
  required(data.password); minLength(data.password, 8);

  validate(data.companyName, ({ value, valueOf }) =>
    valueOf(data.accountType) !== 'Free' && !value()
      ? { kind: 'required' } : null);

  validate(data.seats, ({ value, valueOf }) => {
    if (valueOf(data.accountType) !== 'Enterprise') return null;
    const v = value();
    return v != null && v >= 5 && v <= 1000 ? null : { kind: 'seats' };
  });

  validate(data.terms, ({ value }) =>
    value() ? null : { kind: 'mustAccept' });
});

@Component({
  selector: 'app-signup',
  imports: [Control],
  template: \`
    <form (submit)="onSubmit($event)">
      <label>Email
        <input [control]="f.email" type="email" />
      </label>

      <label>Password
        <input [control]="f.password" type="password" />
      </label>

      <label>Account type
        <select [control]="f.accountType">
          <option>Free</option>
          <option>Pro</option>
          <option>Enterprise</option>
        </select>
      </label>

      @if (data().accountType !== 'Free') {
        <label>Company name
          <input [control]="f.companyName" />
        </label>
      }

      @if (data().accountType === 'Enterprise') {
        <label>Seats
          <input [control]="f.seats" type="number" min="5" max="1000" />
        </label>
      }

      <label>
        <input [control]="f.subscribe" type="checkbox" />
        Subscribe to product updates
      </label>

      @if (data().subscribe) {
        <label>Frequency
          <select [control]="f.frequency">
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </label>
      }

      <label>
        <input [control]="f.terms" type="checkbox" />
        I accept the terms of service
      </label>

      <button type="submit" [disabled]="!f().valid()">Sign up</button>
    </form>
  \`,
})
export class SignupForm {
  data = signal<Signup>({
    email: '', password: '', accountType: 'Free',
    companyName: '', seats: null,
    subscribe: false, frequency: 'Daily', terms: false,
  });
  f = form(this.data, signupSchema);

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.f().valid()) console.log(this.data());
  }
}`,
};

export const litElement: Snippet = {
  id: 'lit',
  label: 'Lit',
  headerLabel: 'Lit + Reactive Properties',
  pillIcon: 'lit',
  lang: 'ts',
  lines: 93,
  branches: 8,
  tokens: 829,
  concepts: ['LitElement', '@customElement', '@state', 'html'],
  color: '#324fff',
  colorRgb: '50, 79, 255',
  code: `import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type Account = 'Free' | 'Pro' | 'Enterprise';

@customElement('signup-form')
export class SignupForm extends LitElement {
  @state() email = '';
  @state() password = '';
  @state() accountType: Account = 'Free';
  @state() companyName = '';
  @state() seats: number | null = null;
  @state() subscribe = false;
  @state() frequency = 'Daily';
  @state() terms = false;
  @state() errors: Record<string, string> = {};

  private bind = (key: keyof this) => (e: Event) => {
    const t = e.target as HTMLInputElement;
    (this as any)[key] = t.type === 'checkbox' ? t.checked : t.value;
  };

  private validate() {
    const e: Record<string, string> = {};
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.email)) e.email = 'Valid email';
    if (this.password.length < 8) e.password = 'Min 8 characters';
    if (this.accountType !== 'Free' && !this.companyName) e.companyName = 'Required';
    if (this.accountType === 'Enterprise') {
      const s = this.seats;
      if (s == null || s < 5 || s > 1000) e.seats = 'Between 5 and 1000';
    }
    if (this.subscribe && !this.frequency) e.frequency = 'Required';
    if (!this.terms) e.terms = 'Required';
    return e;
  }

  private onSubmit(ev: Event) {
    ev.preventDefault();
    this.errors = this.validate();
    if (!Object.keys(this.errors).length) console.log(this);
  }

  render() {
    return html\`
      <form @submit=\${this.onSubmit}>
        <label>Email
          <input type="email" .value=\${this.email} @input=\${this.bind('email')} />
          \${this.errors.email ? html\`<span>\${this.errors.email}</span>\` : null}
        </label>

        <label>Password
          <input type="password" .value=\${this.password} @input=\${this.bind('password')} />
          \${this.errors.password ? html\`<span>\${this.errors.password}</span>\` : null}
        </label>

        <label>Account type
          <select .value=\${this.accountType} @change=\${this.bind('accountType')}>
            <option>Free</option><option>Pro</option><option>Enterprise</option>
          </select>
        </label>

        \${this.accountType !== 'Free' ? html\`
          <label>Company name
            <input .value=\${this.companyName} @input=\${this.bind('companyName')} />
          </label>\` : null}

        \${this.accountType === 'Enterprise' ? html\`
          <label>Seats
            <input type="number" .value=\${this.seats ?? ''} @input=\${this.bind('seats')} />
          </label>\` : null}

        <label>
          <input type="checkbox" .checked=\${this.subscribe} @change=\${this.bind('subscribe')} />
          Subscribe to product updates
        </label>

        \${this.subscribe ? html\`
          <label>Frequency
            <select .value=\${this.frequency} @change=\${this.bind('frequency')}>
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </label>\` : null}

        <label>
          <input type="checkbox" .checked=\${this.terms} @change=\${this.bind('terms')} />
          I accept the terms of service
        </label>

        <button type="submit">Sign up</button>
      </form>
    \`;
  }
}`,
};

export const vanilla: Snippet = {
  id: 'vanilla',
  label: 'Vanilla',
  headerLabel: 'Vanilla JS',
  pillIcon: 'js',
  lang: 'html',
  lines: 86,
  branches: 9,
  tokens: 489,
  concepts: ['FormData', 'setCustomValidity', 'checkValidity', 'DOM events'],
  color: '#f7df1e',
  colorRgb: '247, 223, 30',
  code: `<form id="signup">
  <label>Email
    <input name="email" type="email" required />
  </label>

  <label>Password
    <input name="password" type="password" required minlength="8" />
  </label>

  <label>Account type
    <select name="accountType" required>
      <option>Free</option><option>Pro</option><option>Enterprise</option>
    </select>
  </label>

  <label data-show="companyName" hidden>Company name
    <input name="companyName" />
  </label>

  <label data-show="seats" hidden>Seats
    <input name="seats" type="number" min="5" max="1000" />
  </label>

  <label>
    <input name="subscribe" type="checkbox" />
    Subscribe to product updates
  </label>

  <label data-show="frequency" hidden>Frequency
    <select name="frequency">
      <option>Daily</option><option>Weekly</option><option>Monthly</option>
    </select>
  </label>

  <label>
    <input name="terms" type="checkbox" />
    I accept the terms of service
  </label>

  <button type="submit">Sign up</button>
</form>

<script>
  const f = document.querySelector('#signup');
  const show = (key, on, req) => {
    const el = f.querySelector(\`[data-show="\${key}"]\`);
    el.hidden = !on;
    f.elements[key].required = on && req;
  };

  function sync() {
    const t = f.accountType.value;
    show('companyName', t !== 'Free', true);
    show('seats', t === 'Enterprise', true);
    show('frequency', f.subscribe.checked, true);
  }
  f.accountType.addEventListener('change', sync);
  f.subscribe.addEventListener('change', sync);
  sync();

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!f.terms.checked) {
      f.terms.setCustomValidity('Required');
    } else {
      f.terms.setCustomValidity('');
    }
    if (!f.checkValidity()) return f.reportValidity();
    console.log(Object.fromEntries(new FormData(f)));
  });
</script>`,
};

export const golemui: Snippet = {
  id: 'golemui',
  label: 'GolemUI',
  headerLabel: 'GolemUI',
  pillIcon: 'js',
  lang: 'ts',
  lines: 35,
  branches: 0,
  tokens: 366,
  concepts: ['gui'],
  color: '#a855f7',
  colorRgb: '168, 85, 247',
  code: `import { gui } from '@golemui/gui-shared';

export const signupForm = [
  gui.inputs.textInput('email', {
    label: 'Email',
    validator: { type: 'string', required: true, format: 'email' },
  }),
  gui.inputs.password('password', {
    label: 'Password',
    validator: { type: 'string', required: true, minLength: 8 },
  }),
  gui.inputs.dropdown('accountType', {
    label: 'Account type',
    items: ['Free', 'Pro', 'Enterprise'],
    defaultValue: 'Free',
    validator: { type: 'string', required: true },
  }),
  gui.inputs.textInput('companyName', {
    label: 'Company name',
    validator: { type: 'string', required: true },
    include: { when: '$form.accountType !== "Free"' },
  }),
  gui.inputs.numberInput('seats', {
    label: 'Seats',
    validator: { type: 'number', required: true, minimum: 5, maximum: 1000 },
    include: { when: '$form.accountType === "Enterprise"' },
  }),
  gui.inputs.checkbox('subscribe', {
    label: 'Subscribe to product updates',
  }),
  gui.inputs.dropdown('frequency', {
    label: 'Frequency',
    items: ['Daily', 'Weekly', 'Monthly'],
    validator: { type: 'string', required: true },
    include: { when: '$form.subscribe === true' },
  }),
  gui.inputs.checkbox('terms', {
    label: 'I accept the terms of service',
    validator: { type: 'boolean', const: true },
  }),
  gui.actions.button({ label: 'Sign up', onClick: 'submit' }),
];`,
};

export const stackTabs: Snippet[] = [
  reactRhf,
  angularReactive,
  litElement,
  vanilla,
];
