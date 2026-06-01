import { DxFormPage } from './dx-form.page';

export function App() {
  return (
    <main className="rob-shell">
      <header className="rob-strip">
        <h1>
          A real form. <span className="accent">All the goodies turned on.</span>
        </h1>
        <p className="sub">
          Custom widgets, item renderers, validators, runtime methods, i18n — with TypeScript carrying you through.
        </p>
      </header>

      <section className="rob-form-host">
        <DxFormPage />
      </section>
    </main>
  );
}
