import { Route, Routes } from 'react-router';
import styles from './app.module.scss';
import FormPage from './pages/form/form.page';

function WizardPage() {
  return <h1>TODO: Wizard</h1>;
}

export function App() {
  return (
    <>
      <header className={styles.header}>
        <h1>Formforge</h1>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/form" element={<FormPage />} />
          <Route path="/wizard" element={<WizardPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
