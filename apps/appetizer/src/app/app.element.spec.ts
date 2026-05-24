import { AppElement } from './app.element';

describe('AppElement', () => {
  let app: AppElement;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        addListener: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        removeListener: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        addEventListener: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  beforeEach(() => {
    app = new AppElement();
  });

  it('should create successfully', () => {
    expect(app).toBeTruthy();
  });

  it('should have a greeting', () => {
    app.connectedCallback();

    expect(app.innerHTML).toContain('<lit-form>');
  });
});
