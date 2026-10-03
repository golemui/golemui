import { html } from 'lit';
import type { GuiMultiFileUpload } from '../../src/lib/components/multi-file-upload';
import type { FileItem, UploadService } from '../../src/lib/types';

const tag = 'gui-multi-file-upload';
const element = () => cy.get<GuiMultiFileUpload>(tag);
const fileInput = () => cy.get(`${tag} input[type=file]`);
const bar = () => cy.get(`${tag} .gui-file-upload__bar`);
const pills = () => cy.get(`${tag} .gui-pills__pill`);
const button = () => cy.get(`${tag} .gui-file-upload__button`);
const file = (fileName: string, contents = 'abc') => ({
  contents: Cypress.Buffer.from(contents),
  fileName,
});
const pick = (...fileNames: string[]) =>
  fileInput().selectFile(
    fileNames.map((name) => file(name)),
    { force: true },
  );

type Settle = { resolve: (value: unknown) => void; reject: (err: Error) => void };

/** An upload service whose uploads and removals settle when the test says so. */
const fakeService = () => {
  const uploads: Settle[] = [];
  const removals: Settle[] = [];
  const service = {
    upload: cy
      .spy(() => new Promise((resolve, reject) => uploads.push({ resolve, reject })))
      .as('upload'),
    remove: cy
      .spy(() => new Promise((resolve, reject) => removals.push({ resolve, reject })))
      .as('remove'),
  };
  return { service: service as unknown as UploadService, uploads, removals };
};

const item = (id: string, name: string): FileItem => ({
  id,
  name,
  size: 3,
  type: 'application/pdf',
  status: 'uploaded',
});
const files = [item('file-1', 'contract.pdf'), item('file-2', 'invoice.pdf')];

describe('gui-multi-file-upload', () => {
  describe('rendering', () => {
    it('renders its label, a multiple picker and its files as pills', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          button-label="Add files"
          .values=${files}
          .dependencies=${{ uploadService: service }}
        ></gui-multi-file-upload>`,
      );

      cy.get(`${tag} .gui-label`).should('contain.text', 'Attachments');
      button().should('contain.text', 'Add files');
      fileInput().should('have.attr', 'multiple');
      pills().should('have.length', 2);
      pills().first().should('contain.text', 'contract.pdf');
      pills().last().should('contain.text', 'invoice.pdf');
      bar().should('not.exist');
    });
  });

  describe('value', () => {
    it('uploads picked files one at a time and fires gui-change as each one finishes', () => {
      const { service, uploads } = fakeService();
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .dependencies=${{ uploadService: service }}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-multi-file-upload>`,
      );

      pick('a.txt', 'b.txt');

      cy.get('@change').its('firstCall.args.0.detail.value').should('have.length', 2);
      cy.get('@upload').should('have.been.calledOnce');
      cy.get('@upload').its('firstCall.args.0.name').should('equal', 'a.txt');
      bar().should('contain.text', 'a.txt').and('contain.text', '1/2');

      cy.then(() => uploads[0].resolve('a-data'));
      pills().should('have.length', 1).and('contain.text', 'a.txt');
      cy.get('@upload').should('have.been.calledTwice');
      bar().should('contain.text', 'b.txt').and('contain.text', '2/2');

      cy.then(() => uploads[1].resolve('b-data'));
      pills().should('have.length', 2);
      bar().should('not.exist');
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should((value: FileItem[]) => {
          expect(value.map(({ name, status, data }) => ({ name, status, data }))).to.deep.equal([
            { name: 'a.txt', status: 'uploaded', data: 'a-data' },
            { name: 'b.txt', status: 'uploaded', data: 'b-data' },
          ]);
        });
      cy.get('@input').should('have.callCount', 3);
      cy.get('@change').should('have.callCount', 3);
    });

    it('fires gui-input-error on a failed upload and holds the queue until the file is removed', () => {
      const { service, uploads } = fakeService();
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .dependencies=${{ uploadService: service }}
          @gui-input-error=${onError}
        ></gui-multi-file-upload>`,
      );

      pick('a.txt', 'b.txt');
      cy.get('@upload').should('have.been.calledOnce');
      cy.then(() => uploads[0].reject(new Error('Server is down')));

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Server is down' });
      bar().should('have.attr', 'data-status', 'error').and('contain.text', 'a.txt');
      cy.get('@upload').should('have.been.calledOnce');

      cy.get(`${tag} .gui-file-upload__action:not(.gui-file-upload__action--retry)`).click();

      cy.get('@upload').should('have.been.calledTwice');
      cy.get('@upload').its('secondCall.args.0.name').should('equal', 'b.txt');
    });

    it('marks a pill busy while the service removes its file, then fires gui-change without it', () => {
      const { service, removals } = fakeService();
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .values=${files}
          .dependencies=${{ uploadService: service }}
          @gui-change=${onChange}
        ></gui-multi-file-upload>`,
      );

      cy.get(`${tag} .gui-pills__pill-remove`).first().click({ force: true });

      cy.get('@remove').should('have.been.calledOnceWith', files[0]);
      pills().first().should('have.attr', 'aria-busy', 'true');
      cy.get('@change').should('not.have.been.called');

      cy.then(() => removals[0].resolve(undefined));

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: [files[1]] });
      pills().should('have.length', 1).and('contain.text', 'invoice.pdf');
    });

    it('fires gui-input-error when the service fails to remove a file', () => {
      const { service, removals } = fakeService();
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .values=${files}
          .dependencies=${{ uploadService: service }}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-multi-file-upload>`,
      );

      cy.get(`${tag} .gui-pills__pill-remove`).first().click({ force: true });
      cy.then(() => removals[0].reject(new Error('Server refused')));

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Server refused' });
      bar().should('have.attr', 'data-status', 'error').and('contain.text', 'contract.pdf');
      cy.get('@change').should('not.have.been.called');
    });

    it('refuses a file over max-size and uploads the others', () => {
      const { service, uploads } = fakeService();
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          max-size="3"
          max-size-message="Too big"
          .dependencies=${{ uploadService: service }}
          @gui-input-error=${onError}
        ></gui-multi-file-upload>`,
      );

      fileInput().selectFile([file('small.txt', 'abc'), file('big.txt', 'abcdef')], {
        force: true,
      });

      cy.get('@upload').should('have.been.calledOnce');
      cy.get('@upload').its('firstCall.args.0.name').should('equal', 'small.txt');
      element().should(([el]) =>
        expect(el.values?.map(({ name, status }) => ({ name, status }))).to.deep.equal([
          { name: 'small.txt', status: 'uploading' },
          { name: 'big.txt', status: 'error' },
        ]),
      );

      cy.then(() => uploads[0].resolve('small-data'));

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too big' });
      bar().should('have.attr', 'data-status', 'error').and('contain.text', 'big.txt');
      pills().should('have.length', 1).and('contain.text', 'small.txt');
    });

    it('fires gui-blur when focus leaves', () => {
      const { service } = fakeService();
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-multi-file-upload
            label="Attachments"
            .dependencies=${{ uploadService: service }}
            @gui-blur=${onBlur}
          ></gui-multi-file-upload>
          <button>Next</button>`,
      );

      button().focus();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows values set from outside', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .values=${files}
          .dependencies=${{ uploadService: service }}
        ></gui-multi-file-upload>`,
      );

      element().invoke('prop', 'values', [item('file-3', 'photo.png')]);

      pills().should('have.length', 1).and('contain.text', 'photo.png');
      cy.get('@upload').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('removes a pill with Delete', () => {
      const { service, removals } = fakeService();
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          .values=${files}
          .dependencies=${{ uploadService: service }}
          @gui-change=${onChange}
        ></gui-multi-file-upload>`,
      );

      pills().last().trigger('keydown', { key: 'Delete', force: true });
      cy.get('@remove').should('have.been.calledOnceWith', files[1]);
      cy.then(() => removals[0].resolve(undefined));

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: [files[0]] });
    });
  });

  describe('states', () => {
    it('shows its files without remove buttons or picker while read-only', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          readonly
          .values=${files}
          .dependencies=${{ uploadService: service }}
        ></gui-multi-file-upload>`,
      );

      pills().should('have.length', 2);
      cy.get(`${tag} .gui-pills__pill-remove`).should('not.exist');
      button().should('not.exist');
      fileInput().should('be.disabled');
    });

    it('disables its picker and pills', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-multi-file-upload
          label="Attachments"
          disabled
          .values=${files}
          .dependencies=${{ uploadService: service }}
        ></gui-multi-file-upload>`,
      );

      button().should('be.disabled');
      fileInput().should('be.disabled');
      pills().should('be.disabled');
    });
  });
});
