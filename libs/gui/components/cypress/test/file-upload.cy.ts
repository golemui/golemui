import { html } from 'lit';
import type { GuiFileUpload } from '../../src/lib/components/file-upload';
import type { FileItem, UploadService } from '../../src/lib/types';

const element = () => cy.get<GuiFileUpload>('gui-file-upload');
const fileInput = () => cy.get('gui-file-upload input[type=file]');
const bar = () => cy.get('gui-file-upload .gui-file-upload__bar');
const action = () =>
  cy.get('gui-file-upload .gui-file-upload__action:not(.gui-file-upload__action--retry)');
const pick = (fileName = 'notes.txt', contents = 'abc') =>
  fileInput().selectFile({ contents: Cypress.Buffer.from(contents), fileName }, { force: true });

/** An upload service whose uploads settle when the test says so. */
const fakeService = () => {
  const pending: {
    resolve: (data: unknown) => void;
    reject: (err: Error) => void;
    ctx: Parameters<UploadService['upload']>[1];
  }[] = [];
  const service = {
    upload: cy
      .spy(
        (_file: File, ctx: Parameters<UploadService['upload']>[1]) =>
          new Promise((resolve, reject) => pending.push({ resolve, reject, ctx })),
      )
      .as('upload'),
    remove: cy.spy(() => Promise.resolve()).as('remove'),
  };
  return { service: service as UploadService, pending };
};

const uploaded: FileItem = {
  id: 'file-1',
  name: 'report.pdf',
  size: 3,
  type: 'application/pdf',
  status: 'uploaded',
  data: { url: '/files/1' },
};

describe('gui-file-upload', () => {
  describe('rendering', () => {
    it('renders its label, its upload button and the accepted types', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          button-label="Pick a report"
          accept='[".pdf","image/*"]'
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      cy.get('gui-file-upload .gui-label').should('contain.text', 'Report');
      cy.get('gui-file-upload .gui-file-upload__button').should('contain.text', 'Pick a report');
      fileInput().should('have.attr', 'accept', '.pdf,image/*').and('not.have.attr', 'multiple');
      bar().should('not.exist');
    });

    it('reads its accepted types from the native comma list', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          accept=".pdf, image/*"
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      element().should('have.prop', 'accept').and('deep.equal', ['.pdf', 'image/*']);
      fileInput().should('have.attr', 'accept', '.pdf,image/*');
    });

    it('explains a missing upload service and turns the picker off', () => {
      cy.mount(
        html`<gui-file-upload
          label="Report"
          missing-service-message="Uploads are off"
        ></gui-file-upload>`,
      );

      cy.get('gui-file-upload [role="alert"]').should('contain.text', 'Uploads are off');
      fileInput().should('be.disabled');
      cy.get('gui-file-upload .gui-file-upload__button').should('not.exist');
    });
  });

  describe('value', () => {
    it('fires gui-change as a picked file starts uploading and again once it is uploaded', () => {
      const { service, pending } = fakeService();
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-file-upload
          label="Report"
          path="docs.report"
          .dependencies=${{ uploadService: service }}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-file-upload>`,
      );

      pick();

      cy.get('@upload').should('have.been.calledOnce');
      cy.get('@upload').its('firstCall.args.0.name').should('equal', 'notes.txt');
      cy.get('@upload').its('firstCall.args.1.path').should('equal', 'docs.report');
      cy.get('@change')
        .its('firstCall.args.0.detail.value')
        .should('include', { name: 'notes.txt', size: 3, status: 'uploading' });
      cy.then(() => pending[0].ctx.onProgress?.(40));
      bar().should('have.attr', 'role', 'progressbar').and('have.attr', 'aria-valuenow', '40');

      cy.then(() => pending[0].resolve({ url: '/files/9' }));

      cy.get('@change').should('have.been.calledTwice');
      cy.get('@input').should('have.been.calledTwice');
      cy.get('@change')
        .its('secondCall.args.0.detail.value')
        .should('deep.include', {
          name: 'notes.txt',
          status: 'uploaded',
          data: { url: '/files/9' },
        });
      element().should(([el]) => expect(el.value?.status).to.equal('uploaded'));
      bar().should('contain.text', 'notes.txt').and('not.have.attr', 'role');
    });

    it('fires gui-input-error when an upload fails, and an empty one as the retry clears it', () => {
      const { service, pending } = fakeService();
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-file-upload
          label="Report"
          retry-aria-label="Try {name} again"
          .dependencies=${{ uploadService: service }}
          @gui-input-error=${onError}
        ></gui-file-upload>`,
      );

      pick();
      cy.get('@upload').should('have.been.calledOnce');
      cy.then(() => pending[0].reject(new Error('Server is down')));

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Server is down' });
      bar().should('have.attr', 'data-status', 'error');

      cy.get('gui-file-upload [aria-label="Try notes.txt again"]').click();

      cy.get('@upload').should('have.been.calledTwice');
      bar().should('have.attr', 'data-status', 'uploading');
      cy.get('@error').should('have.been.calledTwice');
      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: '' });
    });

    it('refuses a file of a type not accepted or over max-size without uploading it', () => {
      const { service } = fakeService();
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-file-upload
          label="Report"
          accept='[".pdf"]'
          accept-message="PDF only"
          max-size="2"
          max-size-message="Too big"
          .dependencies=${{ uploadService: service }}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-file-upload>`,
      );

      pick('notes.txt');
      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'PDF only' });

      pick('report.pdf');
      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too big' });
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('include', { name: 'report.pdf', status: 'error', error: 'Too big' });
      cy.get('@upload').should('not.have.been.called');
    });

    it('removes an uploaded file through the service and fires gui-change with null', () => {
      const { service } = fakeService();
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-file-upload
          label="Report"
          remove-aria-label="Delete {name}"
          .value=${uploaded}
          .dependencies=${{ uploadService: service }}
          @gui-change=${onChange}
        ></gui-file-upload>`,
      );

      bar().should('contain.text', 'report.pdf');
      action().should('have.attr', 'aria-label', 'Delete report.pdf').click();

      cy.get('@remove').should('have.been.calledOnceWith', uploaded);
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('gui-file-upload .gui-file-upload__button').should('exist');
    });

    it('cancels an upload in progress', () => {
      const { service, pending } = fakeService();
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-file-upload
          label="Report"
          cancel-aria-label="Stop {name}"
          .dependencies=${{ uploadService: service }}
          @gui-change=${onChange}
        ></gui-file-upload>`,
      );

      pick();
      action().should('have.attr', 'aria-label', 'Stop notes.txt').click();

      cy.then(() => expect(pending[0].ctx.signal.aborted).to.equal(true));
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@remove').should('not.have.been.called');
    });

    it('fires gui-blur to an ancestor listener when focus leaves', () => {
      const { service } = fakeService();
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<div @gui-blur=${onBlur}>
            <gui-file-upload
              label="Report"
              .dependencies=${{ uploadService: service }}
            ></gui-file-upload>
          </div>
          <button>Next</button>`,
      );

      cy.get('gui-file-upload .gui-file-upload__button').focus();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a value set from outside, and an interrupted upload as failed', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          interrupted-message="{name} never finished"
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      element().invoke('prop', 'value', uploaded);
      bar().should('contain.text', 'report.pdf').and('have.attr', 'data-status', 'uploaded');

      element().invoke('prop', 'value', { ...uploaded, status: 'uploading' });
      bar().should('have.attr', 'data-status', 'error');
      cy.get('@upload').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('moves focus to the upload button once the file is removed', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          .value=${uploaded}
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      action().focus().type('{enter}');

      cy.focused().should('have.class', 'gui-file-upload__button');
    });
  });

  describe('states', () => {
    it('shows the file without actions while read-only', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          readonly
          .value=${uploaded}
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      bar().should('contain.text', 'report.pdf');
      cy.get('gui-file-upload .gui-file-upload__action').should('not.exist');
      fileInput().should('be.disabled');
    });

    it('disables its upload button and picker', () => {
      const { service } = fakeService();
      cy.mount(
        html`<gui-file-upload
          label="Report"
          disabled
          .dependencies=${{ uploadService: service }}
        ></gui-file-upload>`,
      );

      cy.get('gui-file-upload .gui-file-upload__button').should('be.disabled');
      fileInput().should('be.disabled');
    });
  });
});
