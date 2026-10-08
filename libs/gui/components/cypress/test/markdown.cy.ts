import { html } from 'lit';
import type { GuiMarkdown } from '../../src/lib/components/markdown';

const textarea = () => cy.get('gui-markdown textarea');
const element = () => cy.get<GuiMarkdown>('gui-markdown');
const button = (name: string) => cy.get(`gui-markdown button[aria-label="${name}"]`);
const preview = () => cy.get('gui-markdown .gui-markdown__preview');

const markdown = { parse: (md: string) => `<p class="parsed">${md}</p>` };

describe('gui-markdown', () => {
  describe('rendering', () => {
    it('renders its attributes on the native textarea', () => {
      cy.mount(
        html`<gui-markdown
          label="Bio"
          value="# Hi"
          placeholder="Write something"
          required
        ></gui-markdown>`,
      );

      textarea().should('have.value', '# Hi').and('have.attr', 'placeholder', 'Write something');
      // The element validates itself: only the ARIA state is on the native control.
      textarea().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      cy.get('gui-markdown label').should('contain.text', 'Bio');
    });

    it('describes the textarea with its hint and points it at its errors', () => {
      cy.mount(
        html`<gui-markdown
          label="Bio"
          hint="Markdown works"
          .errors=${['Too short']}
        ></gui-markdown>`,
      );

      textarea()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Markdown works'));
      textarea().should('have.attr', 'aria-invalid', 'true');
      textarea()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too short'));
    });

    it('renders only the tools it is given, with their titles', () => {
      cy.mount(
        html`<gui-markdown
          label="Bio"
          tools='["B", "I"]'
          bold-title="Negrita"
          toolbar-aria-label="Formato"
        ></gui-markdown>`,
      );

      cy.get('gui-markdown [role="toolbar"]').should('have.attr', 'aria-label', 'Formato');
      cy.get('gui-markdown .gui-markdown__toolbar-button').should('have.length', 3);
      button('Negrita').should('have.attr', 'title', 'Negrita');
      button('Italic').should('exist');
      button('Split View').should('exist');
      button('Heading').should('not.exist');
    });

    it('counts the characters used with maxlength and counter-mode="current"', () => {
      cy.mount(
        html`<gui-markdown label="Bio" maxlength="5" counter-mode="current"></gui-markdown>`,
      );

      textarea().type('Hello!');

      cy.get('gui-markdown .gui-markdown--counter')
        .should('have.class', 'gui-markdown--counter__error')
        .children()
        .first()
        .should('have.text', '6');
    });
  });

  describe('value', () => {
    it('fires gui-input on every keystroke', () => {
      const onInput = cy.spy().as('input');
      cy.mount(html`<gui-markdown label="Bio" @gui-input=${onInput}></gui-markdown>`);

      textarea().type('Hi');

      cy.get('@input').should('have.callCount', 2);
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'Hi' });
      element().should('have.prop', 'value', 'Hi');
    });

    it('fires gui-change and gui-blur when focus leaves', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-markdown label="Bio" @gui-change=${onChange} @gui-blur=${onBlur}></gui-markdown>`,
      );

      textarea().type('Hi{enter}there').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'Hi\nthere' });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('wraps the selection with a toolbar command and commits it', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-markdown
          label="Bio"
          value="hello world"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-markdown>`,
      );

      textarea().then(([el]) => (el as HTMLTextAreaElement).setSelectionRange(0, 5));
      button('Bold').click();

      textarea().should('have.value', '**hello** world');
      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '**hello** world' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '**hello** world' });
      button('Bold').should('have.attr', 'aria-pressed', 'true');
    });

    it('adds a heading at the start of the line and removes it again', () => {
      cy.mount(html`<gui-markdown label="Bio" value="Title"></gui-markdown>`);

      textarea().then(([el]) => (el as HTMLTextAreaElement).setSelectionRange(0, 0));
      button('Heading').click();
      textarea().should('have.value', '# Title');
      button('Heading').should('have.attr', 'aria-pressed', 'true').click();
      textarea().should('have.value', 'Title');
    });

    it('adds a line format at the start of the line from a caret inside it', () => {
      cy.mount(
        html`<gui-markdown
          label="Bio"
          value="Intro
Say hi"
        ></gui-markdown>`,
      );

      // The caret after "Say".
      textarea().then(([el]) => (el as HTMLTextAreaElement).setSelectionRange(9, 9));
      button('Quote').click();

      textarea().should('have.value', 'Intro\n> Say hi');
      button('Quote').should('have.attr', 'aria-pressed', 'true');
      textarea().should(([el]) => expect((el as HTMLTextAreaElement).selectionStart).to.equal(11));

      button('Quote').click();
      textarea().should('have.value', 'Intro\nSay hi');
      button('Quote').should('have.attr', 'aria-pressed', 'false');
    });

    it('adds a list format to every selected line', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-markdown
          label="Bio"
          value="Intro
One
Two"
          @gui-change=${onChange}
        ></gui-markdown>`,
      );

      // From inside "One" to inside "Two".
      textarea().then(([el]) => (el as HTMLTextAreaElement).setSelectionRange(7, 12));
      button('Ordered List').click();

      textarea().should('have.value', 'Intro\n1. One\n2. Two');
      button('Ordered List').should('have.attr', 'aria-pressed', 'true');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: 'Intro\n1. One\n2. Two' });

      button('Ordered List').click();
      textarea().should('have.value', 'Intro\nOne\nTwo');

      textarea().then(([el]) => (el as HTMLTextAreaElement).setSelectionRange(6, 13));
      button('Unordered List').click();
      textarea().should('have.value', 'Intro\n- One\n- Two');
    });

    it('lets the text go over maxlength, which only drives the counter', () => {
      cy.mount(html`<gui-markdown label="Bio" maxlength="3"></gui-markdown>`);

      textarea().type('Hello').should('have.value', 'Hello');
      textarea().should('not.have.attr', 'maxlength');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-markdown label="Bio" value="Hello"></gui-markdown>`);

      element().invoke('prop', 'value', 'Bye');

      textarea().should('have.value', 'Bye');
    });
  });

  describe('keyboard', () => {
    it('marks the format under the caret as pressed', () => {
      cy.mount(html`<gui-markdown label="Bio" value="**bold** plain"></gui-markdown>`);

      textarea().type('{moveToStart}{rightArrow}{rightArrow}{rightArrow}');
      button('Bold').should('have.attr', 'aria-pressed', 'true');

      textarea().type('{end}');
      button('Bold').should('have.attr', 'aria-pressed', 'false');
    });
  });

  describe('preview', () => {
    it('opens with the parsed preview with default-open-preview', () => {
      cy.mount(
        html`<gui-markdown
          label="Bio"
          value="Hello"
          default-open-preview
          .dependencies=${{ markdown }}
        ></gui-markdown>`,
      );

      button('Split View').should('have.attr', 'aria-pressed', 'true');
      preview().find('p.parsed').should('have.text', 'Hello');
      element().invoke('prop', 'value', 'Bye');
      preview().find('p.parsed').should('have.text', 'Bye');
    });

    it('toggles the preview with the split view button', () => {
      cy.mount(
        html`<gui-markdown label="Bio" value="Hi" .dependencies=${{ markdown }}></gui-markdown>`,
      );

      preview().should('not.exist');
      button('Split View').should('have.attr', 'aria-pressed', 'false').click();
      preview().find('p.parsed').should('have.text', 'Hi');
      button('Split View').should('have.attr', 'aria-pressed', 'true').click();
      preview().should('not.exist');
    });
  });

  describe('states', () => {
    it('makes the textarea read-only and disables formatting but not the preview', () => {
      cy.mount(html`<gui-markdown label="Bio" value="Hello" readonly></gui-markdown>`);

      textarea().should('have.attr', 'readonly');
      textarea().should('have.attr', 'aria-readonly', 'true');
      textarea().focus().should('be.focused').and('have.value', 'Hello');
      button('Bold').should('be.disabled');
      button('Split View').should('not.be.disabled');
    });

    it('disables the textarea and the whole toolbar', () => {
      cy.mount(html`<gui-markdown label="Bio" disabled></gui-markdown>`);

      textarea().should('be.disabled');
      cy.get('gui-markdown .gui-markdown__toolbar-button').should('be.disabled');
    });
  });
});
