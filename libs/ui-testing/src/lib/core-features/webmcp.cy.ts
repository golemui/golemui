import { defineForm } from '@golemui/core';
import {
  type ModelContextLike,
  type ModelContextRegisterOptions,
  type ModelContextTool,
  webmcp,
  type WebmcpResult,
} from '@golemui/webmcp';
import { type FormHandle, type MountComponentFn } from '../utils';

/**
 * WebMCP conformance: the `@golemui/webmcp` plugin, attached through the real form component,
 * must describe the gui widgets, and its tools must drive the real widgets and the real submit.
 *
 * The browsers CI runs have no WebMCP, so the model context is a fake built inside the spec
 * (component tests share the page with the form) and injected through the plugin option.
 */

type FakeModelContext = ModelContextLike & {
  tools: Map<string, ModelContextTool>;
  registrations: number;
  execute(name: string, input?: unknown): Promise<WebmcpResult>;
};

const createFakeModelContext = (): FakeModelContext => {
  const tools = new Map<string, ModelContextTool>();
  const fake: FakeModelContext = {
    tools,
    registrations: 0,
    async registerTool(tool: ModelContextTool, options?: ModelContextRegisterOptions) {
      tools.set(tool.name, tool);
      fake.registrations += 1;
      options?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) {
          tools.delete(tool.name);
        }
      });
    },
    async execute(name, input = {}) {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`No tool "${name}"`);
      }
      const result = await tool.execute(JSON.parse(JSON.stringify(input)), {
        signal: new AbortController().signal,
      });
      return JSON.parse(JSON.stringify(result)) as WebmcpResult;
    },
  };
  return fake;
};

const properties = (tool: ModelContextTool | undefined) =>
  (tool?.inputSchema['properties'] ?? {}) as Record<string, Record<string, unknown>>;

export const runWebmcpComponentTests = (mountFn: MountComponentFn) => {
  describe('WebMCP plugin', () => {
    const demoForm = () =>
      defineForm({
        form: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'name',
            label: 'Full name',
            props: { hint: 'As printed on the passport' },
            validator: { type: 'string', required: true },
          },
          { uid: 'age', kind: 'input', type: 'number', path: 'age', label: 'Age' },
          {
            uid: 'newsletter',
            kind: 'input',
            type: 'checkbox',
            path: 'newsletter',
            label: 'Newsletter',
          },
          {
            uid: 'plan',
            kind: 'input',
            type: 'select',
            path: 'plan',
            label: 'Plan',
            props: {
              options: [
                { label: 'Free', value: 'free' },
                { label: 'Team plan', value: 'team' },
              ],
            },
          },
          {
            uid: 'country',
            kind: 'input',
            type: 'dropdown',
            path: 'country',
            label: 'Country',
            props: {
              items: [
                { id: 'es', name: 'Spain' },
                { id: 'fr', name: 'France' },
              ],
              labelField: 'name',
              valueField: 'id',
            },
          },
          { uid: 'interests', kind: 'input', type: 'tags', path: 'interests', label: 'Interests' },
          { uid: 'secret', kind: 'input', type: 'password', path: 'secret', label: 'Secret' },
          { uid: 'submitBtn', kind: 'action', type: 'button', label: 'Send', actionType: 'submit' },
        ],
      });

    // Submits are collected through an explicit handler: some mount adapters create the
    // `@formSubmit` spy lazily, so "never called" cannot be asserted through the alias.
    const mountDemo = (fake: FakeModelContext, onFormReady?: (handle: FormHandle) => void) => {
      const submits: Record<string, unknown>[] = [];
      mountFn({
        formDef: demoForm(),
        plugins: [webmcp({ name: 'demo', description: 'A demo form', modelContext: fake })],
        // The submit payload carries the `undefined` placeholders the form writes for every
        // input path; a JSON round trip drops them so the assertions compare what a host sends.
        formSubmit: (event) => submits.push(JSON.parse(JSON.stringify(event.data))),
        onFormReady,
      });
      return submits;
    };

    const registered = (fake: FakeModelContext, count: number) =>
      cy.wrap(null, { log: false }).should(() => {
        expect(fake.tools.size).to.equal(count);
      });

    it('registers fill and submit tools that describe the gui widgets', () => {
      const fake = createFakeModelContext();
      mountDemo(fake);

      registered(fake, 2);
      cy.then(() => {
        expect([...fake.tools.keys()].sort()).to.deep.equal(['demo-fill', 'demo-submit']);
        const props = properties(fake.tools.get('demo-fill'));

        expect(props['name']).to.deep.include({
          type: 'string',
          description: 'Full name. As printed on the passport',
        });
        expect(props['age']).to.deep.include({ type: 'number' });
        expect(props['newsletter']).to.deep.include({ type: 'boolean' });
        expect(props['plan']['oneOf']).to.deep.equal([
          { const: 'free', title: 'Free' },
          { const: 'team', title: 'Team plan' },
        ]);
        expect(props['country']['oneOf']).to.deep.equal([
          { const: 'es', title: 'Spain' },
          { const: 'fr', title: 'France' },
        ]);
        expect(props['interests']).to.deep.include({ type: 'array', items: { type: 'string' } });
        expect(props['secret'], 'passwords are not exposed').to.be.undefined;
        expect(fake.tools.get('demo-fill')!.inputSchema['required']).to.deep.equal(['name']);
        expect(fake.tools.get('demo-submit')!.annotations?.consequentialHint).to.equal(true);
      });
    });

    it('fills the real widgets through the fill tool', () => {
      const fake = createFakeModelContext();
      const submits = mountDemo(fake);
      registered(fake, 2);

      cy.then(() =>
        fake.execute('demo-fill', {
          name: 'Ada Lovelace',
          age: '36',
          newsletter: 'yes',
          plan: 'Team plan',
          country: 'France',
          interests: ['maths', 'engines'],
        }),
      ).then((result) => {
        expect(result.status).to.equal('filled');
        expect(result.isValid).to.equal(true);
        expect(result.values).to.deep.equal({
          name: 'Ada Lovelace',
          age: 36,
          newsletter: true,
          plan: 'team',
          country: 'fr',
          interests: ['maths', 'engines'],
        });
      });

      cy.get('[data-cy="name_textinput"]').should('have.value', 'Ada Lovelace');
      cy.get('[data-cy="age_number"]').should('have.value', '36');
      cy.get('[data-cy="newsletter_checkbox"]').should('be.checked');
      cy.get('[data-cy="plan_select"]').should('have.value', 'team');
      cy.get('[data-cy="country_textinput"]').should('have.value', 'France');
      cy.then(() => expect(submits).to.have.length(0));
    });

    it('updates the dropdown label when the agent changes a value the user already picked', () => {
      const fake = createFakeModelContext();
      mountDemo(fake);
      registered(fake, 2);

      cy.then(() => fake.execute('demo-fill', { country: 'es' }));
      cy.get('[data-cy="country_textinput"]').should('have.value', 'Spain');

      cy.then(() => fake.execute('demo-fill', { country: 'fr' }));
      cy.get('[data-cy="country_textinput"]').should('have.value', 'France');
    });

    it('submits through the submit tool and reaches the host submit handler', () => {
      const fake = createFakeModelContext();
      const submits = mountDemo(fake);
      registered(fake, 2);

      cy.then(() => fake.execute('demo-submit', { name: 'Grace Hopper', plan: 'free' })).then(
        (result) => {
          expect(result.status).to.equal('submitted');
          expect(submits).to.deep.equal([{ name: 'Grace Hopper', plan: 'free' }]);
        },
      );
    });

    it('refuses to submit an invalid form and shows the errors to the user', () => {
      const fake = createFakeModelContext();
      const submits = mountDemo(fake);
      registered(fake, 2);

      cy.then(() => fake.execute('demo-submit', { age: 5 })).then((result) => {
        expect(result.status).to.equal('invalid');
        expect(result.errors).to.have.property('name');
        expect(submits).to.have.length(0);
      });
      cy.get('[data-cy="name_validator-errors"]').should('exist');
    });

    it('rejects an unknown choice with the accepted labels instead of writing it', () => {
      const fake = createFakeModelContext();
      mountDemo(fake);
      registered(fake, 2);

      cy.then(() => fake.execute('demo-fill', { plan: 'gold' })).then((result) => {
        expect(result.errors?.['plan']?.[0]).to.contain('Accepted: Free, Team plan');
      });
      cy.get('[data-cy="plan_select"]').should('not.have.value', 'gold');
    });

    it('re-registers the tools for the new form when the config is replaced', () => {
      const fake = createFakeModelContext();
      let handle: FormHandle;
      mountDemo(fake, (h) => {
        handle = h;
      });
      registered(fake, 2);

      cy.then(() => {
        handle.setConfig({
          formDef: defineForm({
            form: [{ uid: 'only', kind: 'input', type: 'textinput', path: 'only', label: 'Only' }],
          }),
        });
      });

      cy.wrap(null, { log: false }).should(() => {
        expect(fake.registrations).to.equal(4);
        expect(fake.tools.size).to.equal(2);
        expect(Object.keys(properties(fake.tools.get('demo-fill')))).to.deep.equal(['only']);
      });
    });
  });
};
