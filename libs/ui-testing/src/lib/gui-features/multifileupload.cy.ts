import { defineForm, identityTranslator } from '@golemui/core';
import type { FileItem, UploadService } from '@golemui/gui-shared';
import { createMockUploadService } from '../mocks/upload-service.mock';
import { type MountComponentFn } from '../utils';

// Behavior tests for the multiFileUpload widget: the array variant of
// fileUpload. Uploads run one at a time through the same progress bar and
// every finished file becomes a pill inside the box. A failed file pauses the
// queue until it is retried or removed.
export const runMultiFileUploadComponentTests = (mountFn: MountComponentFn) => {
  describe('MultiFileUpload Component', () => {
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
      pill: 'gui-multi-file-upload gui-pills .gui-pills__pill',
      pillRemove: 'gui-multi-file-upload gui-pills .gui-pills__pill-remove',
      pillBusy: 'gui-multi-file-upload gui-pills .gui-pills__pill-busy',
      validatorError: `[data-cy="${uid}_validator-error"]`,
      submit: '[data-cy="submitBtn_button"]',
    };

    const a = { contents: Cypress.Buffer.from('aaaa'), fileName: 'a.png', mimeType: 'image/png' };
    const b = { contents: Cypress.Buffer.from('bbbb'), fileName: 'b.png', mimeType: 'image/png' };
    const c = { contents: Cypress.Buffer.from('cccc'), fileName: 'c.png', mimeType: 'image/png' };

    const preloaded: FileItem[] = [
      {
        id: 'srv-1',
        name: 'contract.pdf',
        size: 1024,
        type: 'application/pdf',
        status: 'uploaded',
        data: 'https://cdn.test/contract.pdf',
      },
      {
        id: 'srv-2',
        name: 'invoice.pdf',
        size: 2048,
        type: 'application/pdf',
        status: 'uploaded',
        data: 'https://cdn.test/invoice.pdf',
      },
    ];

    const mountMultiFileUpload = (options?: {
      data?: Record<string, unknown>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      service: UploadService;
      formSubmit?: (event: any) => void;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        dependencies: { uploadService: options?.service },
        formSubmit: options?.formSubmit,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'multiFileUpload',
              path: 'myField',
              label: 'Attachments',
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

    const pick = (files: (typeof a)[]) =>
      cy.get(sel.input).selectFile(files as any, { force: true });

    it('renders the multi button and a multiple file input', () => {
      const mock = createMockUploadService();
      mountMultiFileUpload({ service: mock.service });

      cy.get(sel.button).should('contain', 'Upload files');
      cy.get(sel.input).should('have.attr', 'multiple');
    });

    it('uploads picked files one at a time and turns each finished file into a pill', () => {
      const mock = createMockUploadService({ manual: true });
      mountMultiFileUpload({ service: mock.service });

      pick([a, b]);
      cy.get(sel.name).should('contain', 'a.png');
      cy.get(sel.pct).first().should('contain', '1/2');
      cy.get(sel.pill).should('have.length', 0);
      cy.then(() => {
        expect(mock.uploads.map((f) => f.name)).to.deep.equal(['a.png']);
      });

      cy.then(() => mock.release());
      cy.get(sel.pill).should('have.length', 1).first().should('contain', 'a.png');
      cy.get(sel.name).should('contain', 'b.png');
      cy.get(sel.pct).first().should('contain', '2/2');
      cy.then(() => {
        expect(mock.uploads.map((f) => f.name)).to.deep.equal(['a.png', 'b.png']);
      });

      cy.then(() => mock.release());
      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.bar).should('not.exist');
      cy.get(sel.button).should('be.visible');
    });

    it('pauses the queue on a failure until the file is retried or removed', () => {
      const mock = createMockUploadService({
        failFor: (file, attempt) => (file.name === 'a.png' && attempt === 1 ? 'Boom' : undefined),
      });
      mountMultiFileUpload({ service: mock.service });

      pick([a, b]);
      cy.get(sel.bar).should('have.attr', 'data-status', 'error');
      cy.get(sel.name).should('contain', 'a.png');
      cy.get(sel.error).first().should('contain', 'Boom');
      cy.then(() => {
        expect(mock.uploads.map((f) => f.name)).to.deep.equal(['a.png']);
      });

      cy.get(sel.action).click();
      cy.get(sel.pill).should('have.length', 1).first().should('contain', 'b.png');
      cy.then(() => {
        expect(mock.uploads.map((f) => f.name)).to.deep.equal(['a.png', 'b.png']);
      });
    });

    it('renders preloaded files as pills and removes one on the server before dropping it', () => {
      const mock = createMockUploadService();
      mountMultiFileUpload({ service: mock.service, data: { myField: preloaded } });

      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.pillRemove).first().click({ force: true });
      cy.get(sel.pill).should('have.length', 1).first().should('contain', 'invoice.pdf');
      cy.then(() => {
        expect(mock.removes).to.have.length(1);
        expect(mock.removes[0].id).to.equal('srv-1');
      });
    });

    it('swaps the pill × for a spinner while remove is pending and ignores repeated removes', () => {
      let resolveRemove: () => void = () => undefined;
      const mock = createMockUploadService({
        remove: () =>
          new Promise<void>((resolve) => {
            resolveRemove = resolve;
          }),
      });
      mountMultiFileUpload({ service: mock.service, data: { myField: preloaded } });

      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.pillRemove).first().click({ force: true });

      // The first pill stays, busy: spinner instead of ×, aria-busy, no remove hint.
      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.pill).first().should('have.attr', 'aria-busy', 'true');
      cy.get(sel.pill)
        .first()
        .find(sel.pillBusy.split(' ').pop() as string)
        .should('exist');
      cy.get(sel.pill).first().find('.gui-pills__pill-remove').should('not.exist');
      cy.get(sel.pill).first().should('not.have.attr', 'aria-description');
      // The other pill is untouched and still removable.
      cy.get(sel.pill).last().should('not.have.attr', 'aria-busy');
      cy.get(sel.pill).last().find('.gui-pills__pill-remove').should('exist');

      // Neither the spinner nor Delete on the busy pill call remove again.
      cy.get(sel.pillBusy).first().click({ force: true });
      cy.get(sel.pill).first().trigger('keydown', { key: 'Delete', force: true });
      cy.then(() => {
        expect(mock.removes).to.have.length(1);
        expect(mock.removes[0].id).to.equal('srv-1');
      });

      cy.then(() => resolveRemove());
      cy.get(sel.pill).should('have.length', 1).first().should('contain', 'invoice.pdf');
      cy.get(sel.pillBusy).should('not.exist');
    });

    it('submits the array of envelopes', () => {
      const mock = createMockUploadService();
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountMultiFileUpload({ service: mock.service, formSubmit: formSubmitHandler });

      pick([a, b]);
      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.submit).click();

      cy.get('@formSubmitHandler').should('have.been.calledOnce');
      cy.get('@formSubmitHandler').then((stub: any) => {
        const submitted = stub.getCall(0).args[0].data.myField;
        expect(submitted).to.have.length(2);
        expect(submitted.map((item: FileItem) => item.name)).to.deep.equal(['a.png', 'b.png']);
        expect(submitted.every((item: FileItem) => item.status === 'uploaded')).to.equal(true);
        expect(submitted[0].data).to.deep.equal({ url: 'https://cdn.test/a.png' });
      });
    });

    it('flags the extra file through the validator instead of blocking the pick', () => {
      const mock = createMockUploadService();
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountMultiFileUpload({
        service: mock.service,
        validator: { type: 'files', maxItems: 2, messages: { maxItems: 'Two files at most' } },
        formSubmit: formSubmitHandler,
      });

      pick([a, b, c]);
      cy.get(sel.pill).should('have.length', 3);
      cy.get(sel.submit).click();
      cy.get('@formSubmitHandler').should('not.have.been.called');
      cy.get(sel.validatorError).should('contain', 'Two files at most');

      cy.get(sel.pillRemove).last().click({ force: true });
      cy.get(sel.pill).should('have.length', 2);
      cy.get(sel.submit).click();
      cy.get('@formSubmitHandler').should('have.been.calledOnce');
    });
  });
};
