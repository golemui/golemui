import { Link, Route, Routes } from 'react-router';
import '../styles.scss';
import FormPage from './pages/form/form.page';
import DxFormPage from './pages/dx-form/dx-form.page';
import ModularDxPage from './pages/modular-dx/modular-dx.page';

const landingStyles = `
.kx-landing {
  --kx-bg: #f6f7fb;
  --kx-fg: #1a1f2c;
  --kx-muted: #6b7280;
  --kx-border: #e5e7eb;
  --kx-card: #ffffff;
  --kx-card-hover-border: #d6d9e0;
  --kx-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06);
  --kx-shadow-hover: 0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 36px rgba(15, 23, 42, 0.10);
  --kx-accent-json: #6366f1;
  --kx-accent-dx: #0ea5e9;
  --kx-accent-modular: #8b5cf6;
  --kx-code-bg: rgba(15, 23, 42, 0.06);
  background: var(--kx-bg);
  color: var(--kx-fg);
  min-height: 100vh;
  padding: clamp(2rem, 5vw, 4rem) 1.5rem;
}
@media (prefers-color-scheme: dark) {
  .kx-landing {
    --kx-bg: #0b0f17;
    --kx-fg: #e7eaf0;
    --kx-muted: #9aa3b2;
    --kx-border: #1f2632;
    --kx-card: #131a25;
    --kx-card-hover-border: #2a3344;
    --kx-shadow: 0 1px 2px rgba(0, 0, 0, 0.35), 0 10px 24px rgba(0, 0, 0, 0.45);
    --kx-shadow-hover: 0 1px 2px rgba(0, 0, 0, 0.4), 0 18px 40px rgba(0, 0, 0, 0.55);
    --kx-accent-json: #818cf8;
    --kx-accent-dx: #38bdf8;
    --kx-accent-modular: #a78bfa;
    --kx-code-bg: rgba(255, 255, 255, 0.08);
  }
}
.kx-landing__inner { max-width: 1080px; margin: 0 auto; }
.kx-landing__eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--kx-muted);
  margin-bottom: 0.5rem;
}
.kx-landing__title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.kx-landing__subtitle {
  font-size: 1.05rem;
  color: var(--kx-muted);
  margin: 0 0 2.5rem 0;
  max-width: 60ch;
  line-height: 1.5;
}
.kx-landing__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}
.kx-card {
  background: var(--kx-card);
  border: 1px solid var(--kx-border);
  border-radius: 14px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--kx-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;
}
.kx-card:hover { transform: translateY(-2px); box-shadow: var(--kx-shadow-hover); border-color: var(--kx-card-hover-border); }
.kx-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: var(--kx-card-accent);
}
.kx-card--json { --kx-card-accent: var(--kx-accent-json); }
.kx-card--dx { --kx-card-accent: var(--kx-accent-dx); }
.kx-card--modular { --kx-card-accent: var(--kx-accent-modular); }
.kx-card__head { display: flex; align-items: center; gap: 0.75rem; }
.kx-card__badge {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--kx-card-accent) 14%, transparent);
  color: var(--kx-card-accent);
}
.kx-card__title { font-size: 1.35rem; font-weight: 600; margin: 0; }
.kx-card__desc { color: var(--kx-muted); margin: 0; line-height: 1.55; }
.kx-card__list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
.kx-card__list li { padding-left: 1.25rem; position: relative; line-height: 1.45; font-size: 0.95rem; }
.kx-card__list li::before {
  content: '';
  position: absolute;
  left: 0; top: 0.55rem;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--kx-card-accent);
}
.kx-card__cta {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: var(--kx-card-accent);
}
.kx-card:hover .kx-card__cta__arrow { transform: translateX(3px); }
.kx-card__cta__arrow { transition: transform 0.18s ease; }
.kx-landing code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
  background: var(--kx-code-bg);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
}
`;

function LandingPage() {
  return (
    <>
      <style>{landingStyles}</style>
      <div className="kx-landing">
        <div className="kx-landing__inner">
          <span className="kx-landing__eyebrow">React Playground</span>
          <h1 className="kx-landing__title">GolemUI Kitchen Sink</h1>
          <p className="kx-landing__subtitle">
            Two ways to build the same form. Both pipelines render through the unified
            <code style={{ padding: '0 0.25rem' }}>&lt;Form&gt;</code> component and produce
            identical output — pick the path that fits how you author forms.
          </p>

          <div className="kx-landing__grid">
            <Link to="/json/kitchen-sink" className="kx-card kx-card--json">
              <div className="kx-card__head">
                <span className="kx-card__badge">JSON Path</span>
              </div>
              <h2 className="kx-card__title">Declarative form definition</h2>
              <p className="kx-card__desc">
                A plain JSON tree describing layouts, inputs, validators and event handlers.
                Ideal when the form lives in a database, is generated by an external tool, or
                needs to round-trip across services.
              </p>
              <ul className="kx-card__list">
                <li>Schema-driven UIs &amp; backend-defined forms</li>
                <li>Easy to serialize, diff and version</li>
                <li>No build-time dependency on form authors&apos; tooling</li>
              </ul>
              <span className="kx-card__cta">
                Open JSON kitchen sink
                <span className="kx-card__cta__arrow">→</span>
              </span>
            </Link>

            <Link to="/dx/kitchen-sink" className="kx-card kx-card--dx">
              <div className="kx-card__head">
                <span className="kx-card__badge">DX Path</span>
              </div>
              <h2 className="kx-card__title">Type-safe builder API</h2>
              <p className="kx-card__desc">
                Compose forms with the <code>gui.*</code> builders and GSL selectors. The unified
                <code style={{ padding: '0 0.25rem' }}>&lt;Form&gt;</code> runs
                <code style={{ padding: '0 0.25rem' }}>processDxFacade</code> internally, with
                memoization so the tree only walks once per definition.
              </p>
              <ul className="kx-card__list">
                <li>Autocomplete, refactor safety and inline docs</li>
                <li>Validators &amp; reactive states colocated with widgets</li>
                <li>Selectors apply cross-cutting concerns without prop-drilling</li>
              </ul>
              <span className="kx-card__cta">
                Open DX kitchen sink
                <span className="kx-card__cta__arrow">→</span>
              </span>
            </Link>

            <Link to="/dx/modular" className="kx-card kx-card--modular">
              <div className="kx-card__head">
                <span className="kx-card__badge">DX Modular</span>
              </div>
              <h2 className="kx-card__title">Multi-module tabbed form</h2>
              <p className="kx-card__desc">
                Combine independent <code>DxModule</code> slices into a single tabbed
                <code style={{ padding: '0 0.25rem' }}>&lt;Form&gt;</code> via{' '}
                <code>buildModularDx()</code>. Each module owns its layout, data, and reactive
                states — merged at the boundary.
              </p>
              <ul className="kx-card__list">
                <li>Compose features as self-contained modules</li>
                <li>Tabs auto-generated from module labels</li>
                <li>Data and states merged transparently at runtime</li>
              </ul>
              <span className="kx-card__cta">
                Open modular DX
                <span className="kx-card__cta__arrow">→</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
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
          <Route path="/dx/modular" element={<ModularDxPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
