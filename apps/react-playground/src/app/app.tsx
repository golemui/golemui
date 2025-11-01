import clsx from 'clsx';
import { Route, Routes } from 'react-router';
import styles from './app.module.scss';
import FormPage from './pages/form/form.page';
import '../styles.scss';

function WizardPage() {
  return <h1>TODO: Wizard</h1>;
}

export function App() {
  return (
    <>
      <header className={styles.header}>
        <h1>Formforge</h1>
      </header>
      <main className={clsx(styles.main, 'container')}>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/form" element={<FormPage />} />
          <Route path="/wizard" element={<WizardPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
