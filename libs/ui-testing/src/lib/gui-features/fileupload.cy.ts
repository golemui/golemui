import { defineForm, identityTranslator } from '@golemui/core';
import type { FileItem, UploadService } from '@golemui/gui-shared';
import { createMockUploadService } from '../mocks/upload-service.mock';
import { type MountComponentFn } from '../utils';

// Behavior tests for the fileUpload widget: a one-line input whose box is the
// drop target and holds the upload button; while a file uploads the box is
// the progress bar; once uploaded the name stays on the left with a remove
// button on the right. The value is a single `FileItem` envelope or null.
export const runFileUploadComponentTests = (mountFn: MountComponentFn) => {
  describe('FileUpload Component', () => {
    const uid = 'testSubject';
    const sel = {
      box: `[data-cy="${uid}_file-box"]`,
      input: `[data-cy="${uid}_file-input"]`,
      button: `[data-cy="${uid}_file-button"]`,
      bar: `[data-cy="${uid}_file-bar"]`,
      name: `[data-cy="${uid}_file-name"]`,
      pct: `[data-cy="${uid}_file-pct"]`,
      error: `[data-cy="${uid}_file-error"]`,
      retry: `[data-cy="${uid}_file-retry"]`,
      action: `[data-cy="${uid}_file-remove"]`,
      busy: `[data-cy="${uid}_file-busy"]`,
      status: `[data-cy="${uid}_file-status"]`,
      serviceError: `[data-cy="${uid}_file-service-error"]`,
      validatorError: `[data-cy="${uid}_validator-error"]`,
      submit: '[data-cy="submitBtn_button"]',
    };

    const pdf = {
      contents: Cypress.Buffer.from('%PDF-1.4 test'),
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
    };
    const png = {
      contents: Cypress.Buffer.from('png-bytes'),
      fileName: 'photo.png',
      mimeType: 'image/png',
    };

    const preloaded: FileItem = {
      id: 'srv-1',
      name: 'contract.pdf',
      size: 204800,
      type: 'application/pdf',
      status: 'uploaded',
      data: { url: 'https://cdn.test/contract.pdf' },
    };

    const mountFileUpload = (options?: {
      data?: Record<string, unknown>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      disabled?: boolean;
      readonly?: boolean;
      service?: UploadService | null;
      formSubmit?: (event: any) => void;
    }) => {
      const dependencies =
        options?.service === null ? undefined : { uploadService: options?.service };
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        dependencies,
        formSubmit: options?.formSubmit,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'fileUpload',
              path: 'myField',
              label: 'CV',
              ...(options?.disabled ? { disabled: true } : {}),
              ...(options?.readonly ? { readonly: true } : {}),
              ...(options?.validator ? { validator: options.validator as any } : {}),
              props: { ...options?.props },
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
      });
    };

    const pick = (file: typeof pdf | (typeof pdf)[]) =>
      cy.get(sel.input).selectFile(file as any, { force: true });

    describe('rendering', () => {
      it('renders the label, the in-box upload button and a hidden file input', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service });

        cy.get(`[data-cy="${uid}_label"]`).should('contain', 'CV');
        cy.get(sel.button).should('be.visible').and('contain', 'Upload file');
        cy.get(sel.input).should('exist').and('have.attr', 'type', 'file');
        cy.get(sel.input).should('not.have.attr', 'multiple');
        cy.get(sel.bar).should('not.exist');
      });

      it('uses buttonLabel and passes accept to the picker', () => {
        const mock = createMockUploadService();
        mountFileUpload({
          service: mock.service,
          props: { buttonLabel: 'Pick a CV', accept: ['application/pdf', '.docx'] },
        });

        cy.get(sel.button).should('contain', 'Pick a CV');
        cy.get(sel.input).should('have.attr', 'accept', 'application/pdf,.docx');
      });

      it('renders a preloaded value as the file name with a remove button and no retry', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service, data: { myField: preloaded } });

        cy.get(sel.name).should('contain', 'contract.pdf');
        cy.get(sel.action).should('have.attr', 'aria-label', 'Remove contract.pdf');
        cy.get(sel.retry).should('not.exist');
        cy.get(sel.button).should('not.exist');
      });
    });

    describe('upload flow', () => {
      it('turns the box into a progress bar and then shows the name with a remove button', () => {
        const mock = createMockUploadService({ manual: true });
        mountFileUpload({ service: mock.service });

        pick(pdf);
        cy.get(sel.button).should('not.exist');
        cy.get(sel.bar).should('have.attr', 'role', 'progressbar');
        cy.get(sel.name).should('contain', 'cv.pdf');
        cy.get(sel.action).should('have.attr', 'aria-label', 'Cancel cv.pdf');
        cy.then(() => {
          expect(mock.uploads).to.have.length(1);
          expect(mock.uploads[0].name).to.equal('cv.pdf');
        });

        cy.then(() => mock.progress(42));
        cy.get(sel.bar).should('have.attr', 'aria-valuenow', '42');
        cy.get(sel.bar).should('have.attr', 'aria-valuetext', 'cv.pdf, 42%');
        cy.get(sel.pct).first().should('contain', '42%');

        cy.then(() => mock.release());
        cy.get(sel.bar).should('not.have.attr', 'role');
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.get(sel.action).should('have.attr', 'aria-label', 'Remove cv.pdf');
        cy.get(sel.status).should('contain', 'cv.pdf uploaded.');
      });

      it('submits the envelope with the server response in data', () => {
        const mock = createMockUploadService();
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountFileUpload({ service: mock.service, formSubmit: formSubmitHandler });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.get(sel.submit).click();

        cy.get('@formSubmitHandler').should('have.been.calledOnce');
        cy.get('@formSubmitHandler').then((stub: any) => {
          const submitted = stub.getCall(0).args[0].data.myField;
          expect(submitted.id).to.be.a('string');
          expect(submitted).to.include({
            name: 'cv.pdf',
            size: pdf.contents.length,
            type: 'application/pdf',
            status: 'uploaded',
          });
          expect(submitted.data).to.deep.equal({ url: 'https://cdn.test/cv.pdf' });
        });
      });

      it('uploads a file dropped onto the box', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service });

        cy.get(sel.box).selectFile(png, { action: 'drag-drop' });
        cy.get(sel.name).should('contain', 'photo.png');
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
      });

      it('replaces the current file and removes the previous one on the server', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.get(sel.box).selectFile(png, { action: 'drag-drop' });

        cy.get(sel.name).should('contain', 'photo.png');
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.then(() => {
          expect(mock.uploads.map((f) => f.name)).to.deep.equal(['cv.pdf', 'photo.png']);
          expect(mock.removes).to.have.length(1);
          expect(mock.removes[0].name).to.equal('cv.pdf');
        });
      });

      it('cancels an in-progress upload and brings the button back', () => {
        const mock = createMockUploadService({ manual: true });
        mountFileUpload({ service: mock.service });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'role', 'progressbar');
        cy.get(sel.action).click();

        cy.get(sel.bar).should('not.exist');
        cy.get(sel.button).should('be.visible');
        cy.then(() => {
          expect(mock.aborted).to.have.length(1);
        });
      });
    });

    describe('pre-upload gates', () => {
      it('keeps a file that does not match accept in the bar with the reason and never uploads it', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service, props: { accept: ['image/*'] } });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'data-status', 'error');
        cy.get(sel.name).should('contain', 'cv.pdf');
        cy.get(sel.error).first().should('contain', 'File type not accepted');
        cy.get(sel.retry).should('not.exist');
        cy.then(() => {
          expect(mock.uploads).to.have.length(0);
        });

        cy.get(sel.action).click();
        cy.get(sel.button).should('be.visible');
      });

      it('refuses files above maxSize with the custom message', () => {
        const mock = createMockUploadService();
        mountFileUpload({
          service: mock.service,
          props: { maxSize: 4, maxSizeMessage: 'Max 4 bytes' },
        });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'data-status', 'error');
        cy.get(sel.error).first().should('contain', 'Max 4 bytes');
        cy.then(() => {
          expect(mock.uploads).to.have.length(0);
        });
      });
    });

    describe('failures', () => {
      it('shows the failure in the bar and retries with the same file', () => {
        const mock = createMockUploadService({
          failFor: (_file, attempt) => (attempt === 1 ? 'Network down' : undefined),
        });
        mountFileUpload({ service: mock.service });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'data-status', 'error');
        cy.get(sel.error).first().should('contain', 'Network down');
        cy.get(sel.status).should('contain', 'cv.pdf failed to upload.');

        cy.get(sel.retry).click();
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.then(() => {
          expect(mock.uploads).to.have.length(2);
        });
      });
    });

    describe('removal', () => {
      it('awaits uploadService.remove behind a spinner before clearing and moves focus to the button', () => {
        let resolveRemove: () => void = () => undefined;
        const mock = createMockUploadService({
          remove: () =>
            new Promise<void>((resolve) => {
              resolveRemove = resolve;
            }),
        });
        mountFileUpload({ service: mock.service, data: { myField: preloaded } });

        cy.get(sel.busy).should('not.exist');
        cy.get(sel.action).click();
        cy.get(sel.bar).should('have.attr', 'aria-busy', 'true');
        // The spinner takes the icon's place inside the (now disabled) button.
        cy.get(sel.action).should('be.disabled').find(sel.busy).should('exist');
        cy.get(sel.action).find('svg').should('have.length', 1);
        cy.then(() => {
          expect(mock.removes).to.have.length(1);
          expect(mock.removes[0].id).to.equal('srv-1');
        });

        cy.then(() => resolveRemove());
        cy.get(sel.bar).should('not.exist');
        cy.get(sel.busy).should('not.exist');
        cy.get(sel.button).should('be.visible').and('have.focus');
        cy.get(sel.status).should('contain', 'contract.pdf removed.');
      });

      it('keeps the file with the error when remove rejects, and retries the removal', () => {
        let calls = 0;
        const mock = createMockUploadService({
          remove: () => {
            calls += 1;
            return calls === 1 ? Promise.reject(new Error('Server refused')) : Promise.resolve();
          },
        });
        mountFileUpload({ service: mock.service, data: { myField: preloaded } });

        cy.get(sel.action).click();
        cy.get(sel.bar).should('have.attr', 'data-status', 'error');
        cy.get(sel.error).first().should('contain', 'Server refused');
        // The spinner is gone and the remove button is usable again.
        cy.get(sel.busy).should('not.exist');
        cy.get(sel.action).should('not.be.disabled');

        cy.get(sel.retry).click();
        cy.get(sel.bar).should('not.exist');
        cy.get(sel.button).should('be.visible');
      });

      it('clears immediately when the service has no remove', () => {
        const mock = createMockUploadService({ remove: false });
        mountFileUpload({ service: mock.service, data: { myField: preloaded } });

        cy.get(sel.action).click();
        cy.get(sel.bar).should('not.exist');
        cy.get(sel.button).should('be.visible');
      });
    });

    describe('validation', () => {
      it('shows the required error after blur and marks the box invalid', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service, validator: { type: 'file', required: true } });

        cy.get(sel.button).focus();
        cy.get(sel.button).blur();
        cy.get(sel.validatorError).should('be.visible').and('contain', 'This field is required');
        cy.get(sel.box).should('have.attr', 'aria-invalid', 'true');
      });

      it('blocks submission while the upload is pending and allows it once uploaded', () => {
        const mock = createMockUploadService({ manual: true });
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountFileUpload({
          service: mock.service,
          validator: { type: 'file' },
          formSubmit: formSubmitHandler,
        });

        pick(pdf);
        cy.get(sel.bar).should('have.attr', 'role', 'progressbar');
        cy.get(sel.submit).click();
        cy.get('@formSubmitHandler').should('not.have.been.called');
        cy.get(sel.validatorError).should('contain', 'Wait for the upload to finish');

        cy.then(() => mock.release());
        cy.get(sel.bar).should('have.attr', 'data-status', 'uploaded');
        cy.get(sel.submit).click();
        cy.get('@formSubmitHandler').should('have.been.calledOnce');
      });
    });

    describe('states', () => {
      it('shows an inline error and disables the input when no uploadService is provided', () => {
        mountFileUpload({ service: null });

        cy.get(sel.serviceError).should('be.visible').and('contain', 'not configured');
        cy.get(sel.input).should('be.disabled');
        cy.get(sel.button).should('not.exist');
      });

      it('disables the button when the widget is disabled', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service, disabled: true });
        cy.get(sel.button).should('be.disabled');
      });

      it('hides the upload button and the actions when readonly', () => {
        const mock = createMockUploadService();
        mountFileUpload({ service: mock.service, readonly: true, data: { myField: preloaded } });
        cy.get(sel.name).should('contain', 'contract.pdf');
        cy.get(sel.action).should('not.exist');
        cy.get(sel.button).should('not.exist');
      });
    });
  });
};
