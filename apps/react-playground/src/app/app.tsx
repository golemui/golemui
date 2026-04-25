import { Link, Route, Routes } from 'react-router';
import '../styles.scss';
import FormPage from './pages/form/form.page';
import DxFormPage from './pages/dx-form/dx-form.page';

function LandingPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Kitchen Sink</h1>
      <p>Pick a path:</p>
      <ul>
        <li><Link to="/json/kitchen-sink">JSON path</Link></li>
        <li><Link to="/dx/kitchen-sink">DX path</Link></li>
      </ul>
    </div>
  );
}

export function App() {
  return (
    <>
      <main className="container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/json/kitchen-sink" element={<FormPage />} />
          <Route path="/dx/kitchen-sink" element={<DxFormPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
