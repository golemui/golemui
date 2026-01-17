import { cn } from '@golemui/react';
import { Route, Routes } from 'react-router';
import '../styles.scss';
import styles from './app.module.scss';
import FormPage from './pages/form/form.page';

export function App() {
  return (
    <>
      <header className={styles.header}>
        <h1>GolemUI React</h1>
      </header>
      <main className={cn(styles.main, 'container')}>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/form" element={<FormPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
