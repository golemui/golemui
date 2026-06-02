/**
 * Demo game engine — the shared RPG shell for every {gui.} demo.
 * =============================================================
 * Private to the workspace (lives under @golemui/apps-shared, which is
 * `private` and never published; this file is .tsx so apps-shared's own
 * .ts-only build never compiles it). Both sasha-demo and rob-demo render a
 * <GameShell>, passing scene config + the stage content that differs. The
 * shell owns the state machine (scene progression, cinematics, the hand-roll
 * GAME OVER frenzy, the typewriter gate), the layout, the framework picker,
 * the quest title bar, SKIP, and the overlays. A change here hits every demo.
 */
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

/* ─── Characters (the framework "classes") ───────────────────────────── */

export type Framework = 'react' | 'angular' | 'lit' | 'vue' | 'vanilla';

export interface Character {
  id: Framework;
  name: string;
  klass: string;
  color: string;
  shadow: string;
  monogram: string;
}

export const CHARACTERS: Character[] = [
  { id: 'react',   name: 'REACT',   klass: 'HOOK CASTER',     color: '#61dafb', shadow: '#0e7a9e', monogram: 'R' },
  { id: 'angular', name: 'ANGULAR', klass: 'DI PALADIN',      color: '#dd0031', shadow: '#7a0019', monogram: 'A' },
  { id: 'lit',     name: 'LIT',     klass: 'WEB-NATIVE MAGE', color: '#324fff', shadow: '#1a2c99', monogram: 'L' },
  { id: 'vue',     name: 'VUE',     klass: 'REACTIVE RANGER', color: '#41b883', shadow: '#1f6e4d', monogram: 'V' },
  { id: 'vanilla', name: 'JS',      klass: 'VANILLA ROGUE',   color: '#f7df1e', shadow: '#8a7a00', monogram: '{}' },
];

export const FW_IDS: Framework[] = ['react', 'angular', 'lit', 'vue', 'vanilla'];

// Title-case labels + the framework logos, matching the home page's pills.
export const FW_LABEL: Record<Framework, string> = {
  react: 'React',
  angular: 'Angular',
  lit: 'Lit',
  vue: 'Vue',
  vanilla: 'JS',
};

export const FW_ICON: Record<Framework, ReactNode> = {
  react: (
    <svg viewBox="-11.5 -10.232 23 20.463" width="18" height="18" fill="none" aria-hidden="true">
      <circle r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  angular: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 0L1 4l1.7 14.5L12 24l9.3-5.5L23 4 12 0zm0 2.2L20.5 5.3 19 17.4 12 21.5 5 17.4 3.5 5.3 12 2.2zm0 2.6L7 16h2l1-2.5h4L15 16h2L12 4.8zm0 3.4L13.5 11h-3L12 7.8z" />
    </svg>
  ),
  lit: (
    <svg viewBox="0 0 768 960" width="14" height="18" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d="M192 576l96-288 432 432-144 240-192-192h-96" />
      <path d="M384 768V384l192-192v384m-480 0h96l96 192-96 192L0 768z" />
      <path d="M192 576V192L384 0v384m192 576V576l192-192v384M0 768V384l192 192" />
      <path d="M192 960V576l192 192" />
    </svg>
  ),
  vue: (
    <svg viewBox="0 0 128 128" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z" />
    </svg>
  ),
  vanilla: (
    <svg className="js-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect className="js-rect" width="24" height="24" rx="4" fill="currentColor" />
      <text
        className="js-text"
        x="12"
        y="17"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fontWeight="800"
        fill="#0f172a"
      >
        JS
      </text>
    </svg>
  ),
};

/* ─── Public types ───────────────────────────────────────────────────── */

export interface SceneDef {
  chapter: string;
  title: string;
  act?: string;
  quest?: string;
  /** Fires the boss reveal cinematic + boss styling on entry. */
  boss?: boolean;
  /** Dialog nameplate when boss (defaults to "👹 BOSS"). */
  bossTitle?: string;
  /** Fires the ITEM-GET cinematic on entry. */
  itemGet?: boolean;
}

export interface DialogOption {
  key: string;
  label: string;
  action: () => void;
}

export interface StatDef {
  label: string;
  value: number;
  frenzy?: boolean;
  /** GolemUI intent accent: info | success | warning | error | primary. */
  accent?: string;
}

export interface RevealContent {
  pretitle?: string;
  title: string;
  subtitle?: string;
  payload?: string;
  footer?: string;
}

export interface GameApi {
  scene: number;
  bare: boolean;
  framework: Framework | null;
  typingDone: boolean;
  frenzy: boolean;
  frenzyVal: number;
  setFramework: (f: Framework) => void;
  /** Start the "hand-roll it" frenzy → GAME OVER. */
  panic: () => void;
  /** Jump to the sandbox (skip / "take me to the app"). */
  goBare: () => void;
  /** Advance to the next scene (e.g. the boss "npm install" choice). */
  next: () => void;
}

export interface GameConfig {
  /** Root shell class for demo-scoped theming, e.g. 'rob-shell'. */
  shellClass: string;
  scenes: SceneDef[];
  startBare?: boolean;
  startFramework?: Framework | null;
  /** Last-scene CTA enters the sandbox instead of advancing. */
  lines: (api: GameApi) => string[];
  counter?: (api: GameApi) => string | undefined;
  cta: (api: GameApi) => string | undefined;
  options: (api: GameApi) => DialogOption[];
  engagement: (api: GameApi) => boolean;
  stats: (api: GameApi) => [StatDef, StatDef];
  reveal?: (api: GameApi) => RevealContent;
  zelda?: { name: string; spell: string };
  gameOver?: (frenzyVal: number) => { statLine: string; sub: string };
  navExtra?: (api: GameApi) => ReactNode; // extra chip in the console foot (e.g. ⚔ sword)
  renderStage: (api: GameApi) => ReactNode;
  renderBare: (api: GameApi) => ReactNode;
  /** Extra class on the stage <section> (e.g. 'is-compose' for a grid). */
  stageClass?: (api: GameApi) => string;
  onScene?: (scene: number) => void;
  /** Demo title shown on the frame title bar (walk) and the bare bar. */
  title?: string;
  bareTitle?: string;
  /** Teaser line in the "Play the quest" banner of the bare app view. */
  bareQuestTease?: string;
  bareHeaderExtra?: (api: GameApi) => ReactNode; // lang toggle, VIEW CODE…
  onEnterBare?: () => void;
  onRestart?: () => void;
}

const REVEAL_MS = 2900;
const ZELDA_MS = 3400;
const inIframe = typeof window !== 'undefined' && window.parent !== window;

/* ─── GameShell — owns the state machine + layout ────────────────────── */

export function GameShell(cfg: GameConfig) {
  const lastScene = cfg.scenes.length - 1;
  const [sceneId, setSceneId] = useState(
    cfg.startFramework && !cfg.startBare ? 1 : 0,
  );
  const [bare, setBare] = useState(!!cfg.startBare);
  const [framework, setFramework] = useState<Framework | null>(
    cfg.startBare ? cfg.startFramework ?? 'react' : cfg.startFramework ?? null,
  );
  const [typingDone, setTypingDone] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [seenReveal, setSeenReveal] = useState(false);
  const [zeldaActive, setZeldaActive] = useState(false);
  const [seenZelda, setSeenZelda] = useState(false);
  const [byHand, setByHand] = useState(false);
  const [frenzyVal, setFrenzyVal] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const scene = cfg.scenes[sceneId];
  const isBoss = !bare && !!scene?.boss;

  const onScene = cfg.onScene;
  useEffect(() => {
    onScene?.(sceneId);
  }, [sceneId, onScene]);

  useEffect(() => {
    if (bare || !scene?.boss || seenReveal) return;
    setRevealActive(true);
    const t = setTimeout(() => {
      setRevealActive(false);
      setSeenReveal(true);
    }, REVEAL_MS);
    return () => clearTimeout(t);
  }, [sceneId, bare, scene?.boss, seenReveal]);

  useEffect(() => {
    if (bare || !scene?.itemGet || seenZelda) return;
    setZeldaActive(true);
    const t = setTimeout(() => {
      setZeldaActive(false);
      setSeenZelda(true);
    }, ZELDA_MS);
    return () => clearTimeout(t);
  }, [sceneId, bare, scene?.itemGet, seenZelda]);

  useEffect(() => {
    if (!byHand) return;
    let v = frenzyVal || 40;
    const spin = setInterval(() => {
      v += 90 + (v % 9) * 30;
      setFrenzyVal(v);
    }, 45);
    const over = setTimeout(() => {
      clearInterval(spin);
      setByHand(false);
      setGameOver(true);
    }, 2300);
    return () => {
      clearInterval(spin);
      clearTimeout(over);
    };
  }, [byHand]); // eslint-disable-line react-hooks/exhaustive-deps

  function goBare() {
    setBare(true);
    setRevealActive(false);
    setZeldaActive(false);
    setSeenReveal(true);
    setSeenZelda(true);
    if (!framework) setFramework('react');
    cfg.onEnterBare?.();
    if (inIframe) window.parent.postMessage({ type: 'golemui-demo-embed' }, '*');
  }

  // The 8-bit walk lives in the quests portal. Ask the host (the /demos page,
  // which knows the portal URL + which demo this iframe is) to navigate there.
  function playQuest() {
    if (inIframe) {
      window.parent.postMessage({ type: 'golemui-play-quest' }, '*');
    } else {
      restart(); // standalone: just replay the walk in place
    }
  }

  const api: GameApi = {
    scene: sceneId,
    bare,
    framework,
    typingDone,
    frenzy: byHand || gameOver,
    frenzyVal,
    setFramework,
    panic: () => {
      if (!byHand && !gameOver) setByHand(true);
    },
    goBare,
    next: () => next(),
  };

  function next() {
    // The engagement gate is enforced at the call sites that need it — the CTA
    // button is `disabled={!engagementMet}` and the keyboard handler checks it
    // before calling next(). An explicit api.next() from an option action (e.g.
    // the boss "npm install" choice) is meant to advance unconditionally.
    if (sceneId === lastScene) {
      goBare();
      return;
    }
    setSceneId((s) => s + 1);
  }
  function prev() {
    if (sceneId > 0) setSceneId((s) => s - 1);
  }
  function restart() {
    setSceneId(0);
    setBare(false);
    setFramework(cfg.startFramework ?? null);
    setRevealActive(false);
    setSeenReveal(false);
    setZeldaActive(false);
    setSeenZelda(false);
    setByHand(false);
    setFrenzyVal(0);
    setGameOver(false);
    cfg.onRestart?.();
  }
  function tryAgain() {
    setGameOver(false);
    setByHand(false);
    setFrenzyVal(0);
    setSeenReveal(true);
    setRevealActive(false);
  }

  const showSelect = sceneId === 0 && !bare;
  const stats = cfg.stats(api);
  const character = framework ? CHARACTERS.find((c) => c.id === framework)! : null;

  return (
    <main
      className={`${cfg.shellClass} scene-${sceneId}${isBoss ? ' is-boss' : ''}${bare ? ' is-bare' : ''}`}
    >
      {bare && (
        <footer className="bare-quest-cta">
          <span className="bqc-tag">■ 8-bit quest</span>
          <span className="bqc-text">
            {cfg.bareQuestTease ?? 'Want the story behind this demo?'}
          </span>
          <button type="button" className="bqc-btn" onClick={playQuest}>
            ▶ Play the quest
          </button>
        </footer>
      )}

      {bare && (
        <header className="bare-bar">
          <div className="bare-bar-info">
            {cfg.bareTitle && <span className="bare-title">{cfg.bareTitle}</span>}
          </div>
          <div className="bare-bar-actions">
            {cfg.bareHeaderExtra?.(api)}
          </div>
        </header>
      )}

      {!bare && (
        <QuestBanner
          title={cfg.title}
          act={scene?.act || 'PROLOGUE'}
          quest={scene?.quest ?? ''}
          step={`${sceneId}/${lastScene}`}
          onSkip={goBare}
        />
      )}

      {!bare && (
        <DialogBox
          chapter={scene.chapter}
          title={isBoss ? scene.bossTitle ?? '👹 BOSS' : scene.title}
          lines={cfg.lines(api)}
          counter={cfg.counter?.(api)}
          isBoss={isBoss}
          hold={revealActive || zeldaActive}
          onTypingDone={setTypingDone}
        />
      )}

      <section
        className={`${cfg.shellClass.replace('-shell', '')}-stage demo-stage${bare ? ' is-bare' : ''}${
          cfg.stageClass ? ' ' + cfg.stageClass(api) : ''
        }`}
      >
        {showSelect ? (
          <CharacterSelect selected={framework} onSelect={setFramework} />
        ) : bare ? (
          cfg.renderBare(api)
        ) : (
          cfg.renderStage(api)
        )}
      </section>


      {!bare && (
        <BattleBar
          stats={stats}
          options={cfg.options(api)}
          typingDone={typingDone}
          cta={cfg.cta(api)}
          engagementMet={cfg.engagement(api)}
          onNext={next}
          onPrev={prev}
          canPrev={sceneId > 0}
          isBoss={isBoss}
          character={character}
          navExtra={cfg.navExtra?.(api)}
          locked={revealActive || zeldaActive || gameOver}
          onRestart={restart}
        />
      )}

      {revealActive && cfg.reveal && <RevealOverlay {...cfg.reveal(api)} />}
      {zeldaActive && cfg.zelda && <ZeldaOverlay {...cfg.zelda} />}
      {gameOver && (
        <GameOver {...(cfg.gameOver?.(frenzyVal) ?? { statLine: `${frenzyVal} LINES`, sub: '' })} onRetry={tryAgain} />
      )}
    </main>
  );
}

/* ─── Hooks ──────────────────────────────────────────────────────────── */

export function useTypewriter(text: string, cps = 38, hold = false): { shown: string; done: boolean } {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text || hold) return;
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const n = Math.floor(((ts - start) / 1000) * cps);
      if (n >= text.length) {
        setCount(text.length);
        return;
      }
      setCount(n);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, cps, hold]);
  return { shown: text.slice(0, count), done: count >= text.length };
}

export function useOverlayConfirm(action: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tag = (e.target instanceof HTMLElement ? e.target.tagName : '').toLowerCase();
      if (tag === 'button') return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [action]);
}

/* ─── QuestBanner / LangToggle ───────────────────────────────────────── */

export function QuestBanner({
  title,
  act,
  quest,
  step,
  onSkip,
}: {
  title?: string;
  act: string;
  quest: string;
  step?: string;
  onSkip?: () => void;
}) {
  return (
    <div className="quest-banner">
      {act && <span className="qb-act">{act}</span>}
      {title && <span className="qb-title">{title}</span>}
      <span className="qb-quest">⚑ {quest}</span>
      {step && <span className="qb-step">{step}</span>}
      {onSkip && (
        <button
          type="button"
          className="qb-skip"
          onClick={onSkip}
          title="Skip the walk — straight to the app"
          aria-label="Skip the walk — straight to the app"
        >
          SKIP <span className="skip-chevrons">▶▶▶</span>
        </button>
      )}
    </div>
  );
}

export function LangToggle({
  lang,
  onLang,
  langs,
}: {
  lang: string;
  onLang: (l: string) => void;
  langs: { id: string; label: string }[];
}) {
  return (
    <div className="lang-toggle" role="radiogroup" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={lang === l.id}
          className={`lang-opt ${lang === l.id ? 'is-on' : ''}`}
          onClick={() => onLang(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/* ─── CharacterSelect ─────────────────────────────────────────────────── */

export function CharacterSelect({
  selected,
  onSelect,
}: {
  selected: Framework | null;
  onSelect: (id: Framework) => void;
}) {
  return (
    <div className="char-select">
      <h2 className="char-select-title">CHOOSE YOUR FRAMEWORK</h2>
      <div className="char-grid">
        {CHARACTERS.map((c) => {
          const isSelected = c.id === selected;
          return (
            <button
              key={c.id}
              type="button"
              className={`char-tile ${isSelected ? 'is-selected' : ''}`}
              style={{ '--char-color': c.color, '--char-shadow': c.shadow } as CSSProperties}
              onClick={() => onSelect(c.id)}
            >
              <span className="char-portrait" aria-hidden="true">
                <span className="char-monogram">{c.monogram}</span>
              </span>
              <span className="char-name">{c.name}</span>
              <span className="char-klass">{c.klass}</span>
              {isSelected && <span className="char-cursor">►</span>}
            </button>
          );
        })}
      </div>
      <p className="char-hint">
        {selected ? `LOCKED IN. PRESS BEGIN TO CONTINUE. ▲` : `USE THE MOUSE. CLICK TO PICK. ▲`}
      </p>
    </div>
  );
}

/* ─── GuiArtifact (boss-centre engine) ────────────────────────────────── */

export function GuiArtifact() {
  return (
    <div className="gui-artifact" aria-hidden="true">
      <span className="ga-rays" />
      <span className="ga-sigil">{'{gui.}'}</span>
      <span className="ga-cap">THE ENGINE AWAITS</span>
    </div>
  );
}

/* ─── Overlays ───────────────────────────────────────────────────────── */

export function RevealOverlay({ pretitle, title, subtitle, payload, footer }: RevealContent) {
  return (
    <div className="reveal-overlay" aria-hidden="true">
      <div className="reveal-flash" />
      <div className="reveal-vignette" />
      <div className="reveal-stack">
        <div className="reveal-pretitle">{pretitle ?? '⚠ A WILD BOSS APPEARS ⚠'}</div>
        <h1 className="reveal-title">{title}</h1>
        {subtitle && <div className="reveal-subtitle">{subtitle}</div>}
        {payload && <pre className="reveal-payload">{payload}</pre>}
        {footer && <div className="reveal-footer">{footer}</div>}
      </div>
      <div className="reveal-bolt reveal-bolt--1" />
      <div className="reveal-bolt reveal-bolt--2" />
      <div className="reveal-bolt reveal-bolt--3" />
    </div>
  );
}

export function ZeldaOverlay({ name, spell }: { name: string; spell: string }) {
  return (
    <div className="zelda-overlay" aria-hidden="true">
      <div className="zelda-rays" />
      <div className="zelda-stack">
        <div className="zelda-pretitle">★ ITEM GET ★</div>
        <div className="zelda-artifact">
          <span className="zelda-sigil">{'{gui.}'}</span>
          <span className="zelda-glow" />
        </div>
        <div className="zelda-name">{name}</div>
        <div className="zelda-spell">{spell}</div>
      </div>
    </div>
  );
}

export function GameOver({ statLine, sub, onRetry }: { statLine: string; sub: string; onRetry: () => void }) {
  useOverlayConfirm(onRetry);
  return (
    <div className="gameover-overlay">
      <div className="go-scan" />
      <div className="go-stack">
        <div className="go-pretitle">✦ YOU CHOSE … POORLY ✦</div>
        <h1 className="go-title">GAME&nbsp;OVER</h1>
        <div className="go-stat">{statLine}</div>
        <div className="go-sub">{sub}</div>
        <button type="button" className="go-retry" onClick={onRetry}>
          ▶ TRY AGAIN
        </button>
      </div>
    </div>
  );
}

export function Victory({ onApp, children }: { onApp: () => void; children: ReactNode }) {
  useOverlayConfirm(onApp);
  return (
    <div className="victory-overlay">
      <div className="vo-rays" />
      <div className="vo-stack">
        <div className="vo-pretitle">★ QUEST COMPLETE ★</div>
        <h1 className="vo-title">CONGRATULATIONS!</h1>
        <div className="vo-sub">{children}</div>
        <button type="button" className="go-retry vo-cta" onClick={onApp}>
          ▶ TAKE ME TO THE APP
        </button>
      </div>
    </div>
  );
}

/* ─── ReturnBar (typed payload under Save) ────────────────────────────── */

export function ReturnBar({
  data,
  filledNote,
  idleNote,
}: {
  data: Record<string, unknown> | null;
  filledNote: ReactNode;
  idleNote: ReactNode;
}) {
  return (
    <div className={`return-bar${data ? ' is-filled' : ''}`}>
      {data ? (
        <>
          <span className="rb-cap">✓ YOUR BACKEND RECEIVES</span>
          <code className="rb-json">{JSON.stringify(data, null, 2)}</code>
          <span className="rb-note">{filledNote}</span>
        </>
      ) : (
        <>
          <span className="rb-cap rb-cap--idle">▶ THE RETURN TRIP</span>
          <span className="rb-note">{idleNote}</span>
        </>
      )}
    </div>
  );
}

/* ─── DialogBox ───────────────────────────────────────────────────────── */

interface DialogBoxProps {
  chapter: string;
  title: string;
  lines: string[];
  counter?: string;
  onTypingDone: (done: boolean) => void;
  isBoss: boolean;
  hold: boolean;
}

function DialogBox({ chapter, title, lines, counter, onTypingDone, isBoss, hold }: DialogBoxProps) {
  const full = lines.join('\n');
  const { shown, done } = useTypewriter(full, 38, hold);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onTypingDone(done);
  }, [done, onTypingDone]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
  }, [full]);
  useEffect(() => {
    boxRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <header className={`dialog-stage ${isBoss ? 'is-boss' : ''}`}>
      <div ref={boxRef} tabIndex={-1} className={`dialog-box ${isBoss ? 'is-boss' : ''}`}>
        <div className="dialog-nameplate">
          <span className="dialog-chapter">CH·{chapter}</span>
          <span className="dialog-title">{title}</span>
          {counter && <span className="dialog-counter">{counter}</span>}
        </div>
        <div className="dialog-body">
          <div className="dialog-type">
            {shown}
            {!done && <span className="type-caret">▋</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── BattleBar (stats + command menu) ───────────────────────────────── */

interface BattleBarProps {
  stats: [StatDef, StatDef];
  options: DialogOption[];
  typingDone: boolean;
  cta?: string;
  engagementMet: boolean;
  onNext: () => void;
  onPrev: () => void;
  canPrev: boolean;
  isBoss: boolean;
  character: Character | null;
  navExtra?: ReactNode;
  locked: boolean;
  onRestart: () => void;
}

function BattleBar({
  stats,
  options,
  typingDone,
  cta,
  engagementMet,
  onNext,
  onPrev,
  canPrev,
  isBoss,
  character,
  navExtra,
  locked,
  onRestart,
}: BattleBarProps) {
  const optionsReady = options.length > 0 && typingDone;
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);
  useEffect(() => {
    setFocus(0);
  }, [options.length]);

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target instanceof HTMLElement ? e.target.tagName : '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (optionsReady) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          setFocus((f) => Math.min(options.length - 1, f + 1));
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          setFocus((f) => Math.max(0, f - 1));
          e.preventDefault();
          return;
        }
        const idx = options.findIndex((o) => o.key === e.key);
        if (idx >= 0) {
          setFocus(idx);
          options[idx].action();
          e.preventDefault();
          return;
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (tag === 'button') return;
        if (cta && engagementMet) onNext();
        else if (optionsReady) options[focusRef.current]?.action();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, optionsReady, cta, engagementMet, locked, onNext]);

  return (
    <footer className={`battle-frame ${isBoss ? 'is-boss' : ''}`}>
      <StatBox def={stats[0]} />
      <div className="command-box">
        <div className="command-cap">
          ▸ YOUR MOVE
          {typingDone && <span className="blink cmd-blink">▌</span>}
        </div>
        <div className="command-main">
          {!typingDone ? (
            <span className="dialog-hint">…</span>
          ) : optionsReady ? (
            <ul className="dialog-options" role="menu">
              {options.map((o, i) => (
                <li key={o.key + o.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={`dialog-option ${i === focus ? 'is-focused' : ''}`}
                    onClick={o.action}
                    onMouseEnter={() => setFocus(i)}
                  >
                    <span className="opt-cursor">{i === focus ? '▶' : ''}</span>
                    <span className="opt-key">{o.key}</span>
                    <span className="opt-label">{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              className={`pixel-btn ${engagementMet ? 'is-ready' : 'is-dim'}`}
              onClick={onNext}
              disabled={!engagementMet}
            >
              {cta ?? 'NEXT'} {engagementMet && <span className="blink">▶</span>}
            </button>
          )}
        </div>
        <div className="command-foot">
          <button type="button" className="mini-btn" onClick={onPrev} disabled={!canPrev}>
            ← PREV
          </button>
          {character && (
            <span className="nav-chip" style={{ borderColor: character.color, color: character.color }}>
              <span className="nav-chip-mono">{character.monogram}</span>
              {character.name}
            </span>
          )}
          {navExtra}
          <span className="cmd-spacer" />
          <button
            type="button"
            className="mini-btn mini-btn--ghost"
            onClick={onRestart}
            title="Restart the walk"
          >
            ↻
          </button>
        </div>
      </div>
      <StatBox def={stats[1]} />
    </footer>
  );
}

function StatBox({ def }: { def: StatDef }) {
  const numRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(def.value);
  useEffect(() => {
    if (prevRef.current === def.value) return;
    prevRef.current = def.value;
    if (def.frenzy) return;
    const el = numRef.current;
    if (!el) return;
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  }, [def.value, def.frenzy]);
  return (
    <aside
      className={`stat-box stat-box--${def.label.toLowerCase()} ${def.frenzy ? 'is-frenzy' : ''}`}
      style={def.accent ? ({ '--stat-accent': def.accent } as CSSProperties) : undefined}
    >
      <div ref={numRef} className="sb-num">
        {def.value}
      </div>
      <div className="sb-label">{def.label}</div>
    </aside>
  );
}
