import { Route, Routes } from 'react-router';
import '../styles.scss';
import FormPage from './pages/form/form.page';

export function App() {
  return (
    <>
      <main className="container">
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/form" element={<FormPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
