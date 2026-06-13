'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MONS, MOVES, calcDamage, type Mon, type Move } from '@/lib/pokemon';
import { bus } from '../engine/EventBus';

interface Props {
  projectName: string;
  onClose: () => void;
}

interface Combatant {
  mon: Mon;
  hp: number;
  /** displayed hp, animates toward real hp */
  hpVis: number;
  status: 'ok' | 'burn';
}

const PLAYER_TEAM: Record<string, { atk: string }> = {
  GSCNewLayout: { atk: 'Gengar' },
  AhShuckie: { atk: 'Alakazam' },
};
const BOSS: Record<string, { def: string; nickname: string }> = {
  GSCNewLayout: { def: 'Snorlax', nickname: 'GYM LEADER · DAMAGE-CALC' },
  AhShuckie: { def: 'Machamp', nickname: 'GYM LEADER · UNLOCKED-SPEED' },
};

const PICKABLE_MOVES = ['Thunderbolt', 'Earthquake', 'Psychic', 'Body Slam', 'Surf', 'Ice Beam', 'Shadow Ball', 'Cross Chop'];

type Phase =
  | { kind: 'pick' }
  | { kind: 'pAttack'; t: number; move: Move; dmg: number; eff: number; crit: boolean }
  | { kind: 'pHit'; t: number; dmg: number; eff: number; crit: boolean }
  | { kind: 'eAttack'; t: number; move: Move; dmg: number; eff: number }
  | { kind: 'eHit'; t: number; dmg: number; eff: number }
  | { kind: 'done' };

export default function Battle({ projectName, onClose }: Props) {
  const playerCfg = PLAYER_TEAM[projectName] ?? PLAYER_TEAM.GSCNewLayout;
  const bossCfg = BOSS[projectName] ?? BOSS.GSCNewLayout;
  const playerInitMon = useMemo(() => MONS.find((m) => m.name === playerCfg.atk)!, [playerCfg.atk]);
  const bossInitMon = useMemo(() => MONS.find((m) => m.name === bossCfg.def)!, [bossCfg.def]);

  const [player, setPlayer] = useState<Combatant>({ mon: playerInitMon, hp: playerInitMon.hp, hpVis: playerInitMon.hp, status: 'ok' });
  const [boss, setBoss] = useState<Combatant>({ mon: bossInitMon, hp: bossInitMon.hp, hpVis: bossInitMon.hp, status: 'ok' });
  const [moves] = useState<Move[]>(() => MOVES.filter((m) => PICKABLE_MOVES.includes(m.name)));
  const [log, setLog] = useState<string[]>([`A wild ${bossCfg.nickname} appeared!`]);
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [shake, setShake] = useState(0);

  const arenaRef = useRef<HTMLDivElement>(null);

  const append = (s: string) => setLog((l) => [...l.slice(-7), s]);

  // hp interpolation
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPlayer((p) => p.hpVis === p.hp ? p : { ...p, hpVis: lerp(p.hpVis, p.hp, 0.15) });
      setBoss((b) => b.hpVis === b.hp ? b : { ...b, hpVis: lerp(b.hpVis, b.hp, 0.15) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // phase advance ticker
  useEffect(() => {
    if (phase.kind === 'pick' || phase.kind === 'done') return;
    const dur = phase.kind === 'pAttack' || phase.kind === 'eAttack' ? 380 : 700;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      setPhase((p) => p.kind === 'done' || p.kind === 'pick' ? p : { ...p, t });
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // transition out
      if (phase.kind === 'pAttack') {
        const newHp = Math.max(0, boss.hp - phase.dmg);
        setBoss((b) => ({ ...b, hp: newHp }));
        append(`${player.mon.name} used ${phase.move.name}!`);
        if (phase.eff === 0) append("It had no effect…");
        else if (phase.eff >= 2) append("It's super-effective!");
        else if (phase.eff < 1 && phase.eff > 0) append("It's not very effective…");
        append(`${boss.mon.name} took ${phase.dmg} damage.`);
        bus.emit('audio:play', { sound: phase.crit || phase.eff >= 2 ? 'crit' : 'hit' });
        // damage popup over boss
        emitDamage('enemy', phase.dmg, phase.crit || phase.eff >= 2);
        // shake
        setShake(phase.crit ? 12 : phase.eff >= 2 ? 8 : 4);
        setPhase({ kind: 'pHit', t: 0, dmg: phase.dmg, eff: phase.eff, crit: phase.crit });
      } else if (phase.kind === 'pHit') {
        if (boss.hp - phase.dmg <= 0) {
          append(`${boss.mon.name} fainted!`);
          append('You win! The gym leader nods and walks off.');
          bus.emit('audio:play', { sound: 'fanfare' });
          setResult('win');
          setPhase({ kind: 'done' });
          return;
        }
        // enemy turn — pre-roll
        const chosen = moves[Math.floor(Math.random() * moves.length)];
        const r = calcDamage(boss.mon, player.mon, chosen, { stab: boss.mon.types.includes(chosen.type), crit: false, burn: false, screen: false, weather: false });
        const dmg = Math.floor((r.lo + r.hi) / 2);
        setPhase({ kind: 'eAttack', t: 0, move: chosen, dmg, eff: r.effect });
      } else if (phase.kind === 'eAttack') {
        const newHp = Math.max(0, player.hp - phase.dmg);
        setPlayer((pl) => ({ ...pl, hp: newHp }));
        append(`${boss.mon.name} used ${phase.move.name}!`);
        if (phase.eff >= 2) append('Critical hit on you!');
        append(`${player.mon.name} took ${phase.dmg} damage.`);
        bus.emit('audio:play', { sound: phase.eff >= 2 ? 'crit' : 'hit' });
        emitDamage('player', phase.dmg, phase.eff >= 2);
        setShake(phase.eff >= 2 ? 8 : 4);
        setPhase({ kind: 'eHit', t: 0, dmg: phase.dmg, eff: phase.eff });
      } else if (phase.kind === 'eHit') {
        if (player.hp - phase.dmg <= 0) {
          append(`${player.mon.name} fainted! You lose.`);
          setResult('lose');
          setPhase({ kind: 'done' });
          return;
        }
        setPhase({ kind: 'pick' });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind]);

  // shake decay
  useEffect(() => {
    if (shake === 0) return;
    const t = setTimeout(() => setShake(0), 280);
    return () => clearTimeout(t);
  }, [shake]);

  const emitDamage = (side: 'player' | 'enemy', dmg: number, crit: boolean) => {
    const el = arenaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = side === 'enemy' ? r.left + r.width * 0.75 : r.left + r.width * 0.28;
    const y = side === 'enemy' ? r.top + r.height * 0.34 : r.top + r.height * 0.66;
    bus.emit('fx:popup', { x, y, text: (crit ? '!' : '') + dmg, color: crit ? '#ffb800' : '#ff3c25' });
  };

  const playerAttack = (move: Move) => {
    if (phase.kind !== 'pick' || result) return;
    bus.emit('audio:play', { sound: 'select' });
    const crit = Math.random() < 0.0625;
    const r = calcDamage(player.mon, boss.mon, move, {
      stab: player.mon.types.includes(move.type),
      crit,
      burn: player.status === 'burn',
      screen: false, weather: false,
    });
    const dmg = Math.floor((r.lo + r.hi) / 2);
    setPhase({ kind: 'pAttack', t: 0, move, dmg, eff: r.effect, crit });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // compute lunge offsets for the rendered mons
  const lungeFor = (side: 'player' | 'enemy'): { dx: number; dy: number; flash: boolean; shake: number } => {
    const dir = side === 'player' ? 1 : -1;
    const t = phase.kind === 'pAttack' && side === 'player' ? (phase as { t: number }).t :
              phase.kind === 'eAttack' && side === 'enemy' ? (phase as { t: number }).t : -1;
    if (t < 0) {
      const isVictim = (phase.kind === 'pHit' && side === 'enemy') || (phase.kind === 'eHit' && side === 'player');
      return { dx: 0, dy: 0, flash: isVictim, shake: isVictim ? (phase as { dmg: number }).dmg : 0 };
    }
    // lunge curve: peak at t=0.5
    const lunge = 16 * Math.sin(t * Math.PI);
    return { dx: lunge * dir, dy: -lunge * 0.3, flash: false, shake: 0 };
  };

  // current battle status line for the bottom box
  const statusLine = (() => {
    if (phase.kind === 'done') {
      return result === 'win'
        ? `${bossCfg.nickname} fainted!  ▸  VICTORY`
        : `${player.mon.name} fainted!  ▸  DEFEAT`;
    }
    if (phase.kind === 'pick') return `What will ${player.mon.name.toUpperCase()} do?`;
    if (phase.kind === 'pAttack' || phase.kind === 'pHit') {
      return `${player.mon.name.toUpperCase()} used ${(phase as { move: Move }).move.name.toUpperCase()}!`;
    }
    return `Enemy ${boss.mon.name.toUpperCase()} used ${(phase as { move: Move }).move.name.toUpperCase()}!`;
  })();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        fontFamily: '"Press Start 2P", "JetBrains Mono", monospace',
        imageRendering: 'pixelated',
      }}
    >
      <div
        ref={arenaRef}
        style={{
          width: '100%', maxWidth: 800, aspectRatio: '20 / 13',
          background: '#000000', padding: 4,
          transform: shake ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : 'none',
          transition: 'transform 0.05s linear',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          background: '#ffffff', position: 'relative',
          overflow: 'hidden',
          border: '2px solid #000000',
        }}>
          {/* ===== top half: arena ===== */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: '38%',
            background: '#ffffff',
            // floor line at the bottom of the arena half
            borderBottom: '2px solid #000000',
          }}>
            {/* enemy HP box — top-left, rectangular with rounded right edge */}
            <RBYHpBox
              name={bossCfg.nickname}
              level={50}
              hp={boss.hp}
              hpVis={boss.hpVis}
              max={boss.mon.hp}
              side="enemy"
              style={{ position: 'absolute', top: 16, left: 16 }}
            />

            {/* enemy grass platform (top-right) */}
            <Platform style={{ position: 'absolute', right: 36, top: '46%' }} />
            <PixelMon mon={boss.mon} side="enemy" {...lungeFor('enemy')} />

            {/* player HP box — bottom-right with EXP bar */}
            <RBYHpBox
              name={`${player.mon.name}`}
              level={50}
              hp={player.hp}
              hpVis={player.hpVis}
              max={player.mon.hp}
              side="player"
              showExp
              style={{ position: 'absolute', bottom: 16, right: 16 }}
            />

            {/* player grass platform (bottom-left) */}
            <Platform style={{ position: 'absolute', left: 24, bottom: 14 }} />
            <PixelMon mon={player.mon} side="player" {...lungeFor('player')} />
          </div>

          {/* ===== bottom half: dialog/move panel ===== */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%',
            background: '#ffffff', display: 'flex',
            // inner padding + black border separating from arena handled above
          }}>
            {/* left status box */}
            <div style={{
              flex: 2.2,
              borderRight: phase.kind === 'pick' && !result ? '2px solid #000' : 'none',
              padding: '16px 20px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{
                fontSize: 11, color: '#000', lineHeight: 1.85, letterSpacing: '0.05em',
              }}>
                {statusLine}
              </div>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.1em', textAlign: 'right' }}>
                {phase.kind === 'done'
                  ? 'ESC > CLOSE'
                  : phase.kind === 'pick'
                  ? '▶ CHOOSE A MOVE'
                  : (phase as { dmg?: number }).dmg !== undefined ? `${(phase as { dmg: number }).dmg} DMG` : ''}
              </div>
            </div>

            {/* right panel: 2×2 move grid (only on pick), result on done */}
            {phase.kind === 'pick' && !result && (
              <div style={{
                flex: 2,
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
                gap: 0,
              }}>
                {moves.slice(0, 4).map((m, i) => (
                  <button
                    key={m.name}
                    onClick={() => playerAttack(m)}
                    style={{
                      borderRight: i % 2 === 0 ? '1px solid #000' : 'none',
                      borderBottom: i < 2 ? '1px solid #000' : 'none',
                      background: '#ffffff',
                      color: '#000',
                      fontFamily: 'inherit', fontSize: 9,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      padding: '8px',
                      textAlign: 'left',
                      lineHeight: 1.5,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f4ecdc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 4, color: '#ff3c25' }}>▶</span>
                      {m.name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 7, color: '#666', marginTop: 6, marginLeft: 12 }}>
                      {m.type.toUpperCase()} · {m.power}
                    </div>
                  </button>
                ))}
                {/* second row of attacks for 5th-8th moves */}
              </div>
            )}
            {phase.kind === 'pick' && !result && moves.length > 4 && (
              <div style={{
                position: 'absolute', right: 16, bottom: 6,
                fontSize: 7, color: '#666',
              }}>
                {moves.length} MOVES AVAILABLE
              </div>
            )}
          </div>

          {/* close button overlay when done */}
          {phase.kind === 'done' && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute', bottom: 18, right: 18,
                background: '#000000', color: '#ffffff',
                border: '2px solid #000000', padding: '8px 14px',
                fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              CLOSE [ESC]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** RBY-style HP box: name + Lv. NN on top, "HP:" + green→yellow→red bar,
 *  current/max numbers below, optional EXP bar. */
function RBYHpBox({
  name, level, hp, hpVis, max, side, showExp, style,
}: {
  name: string; level: number; hp: number; hpVis: number; max: number;
  side: 'enemy' | 'player'; showExp?: boolean;
  style?: React.CSSProperties;
}) {
  const pct = Math.max(0, Math.min(100, (hpVis / max) * 100));
  const realPct = Math.max(0, Math.min(100, (hp / max) * 100));
  const color = pct <= 20 ? '#ff3c25' : pct <= 50 ? '#ffb800' : '#3ec05c';
  return (
    <div style={{
      ...style,
      width: 200,
      background: '#000',
      padding: 3,
    }}>
      <div style={{
        background: '#ffffff',
        border: '2px solid #000',
        padding: '6px 10px 8px',
        color: '#000',
        fontFamily: '"Press Start 2P", monospace',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontSize: 9, letterSpacing: '0.05em', marginBottom: 5,
        }}>
          <span style={{
            maxWidth: 120,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name.toUpperCase()}</span>
          <span style={{ fontSize: 8 }}>:L{level}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 8, color: '#000' }}>HP:</span>
          <div style={{
            flex: 1, height: 6, background: '#dcd6c2',
            border: '1px solid #000', position: 'relative', overflow: 'hidden',
          }}>
            {/* delta sliver (just-lost portion) */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
              background: 'rgba(255,60,37,0.35)',
            }} />
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${realPct}%`,
              background: color, transition: 'background 0.3s',
            }} />
          </div>
        </div>
        {side === 'player' && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            fontSize: 8, marginTop: 5,
          }}>
            <span>{Math.round(hpVis).toString().padStart(3, ' ')}/{max}</span>
          </div>
        )}
        {showExp && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
          }}>
            <span style={{ fontSize: 7, color: '#000' }}>EXP:</span>
            <div style={{
              flex: 1, height: 3, background: '#dcd6c2',
              border: '1px solid #000', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '64%',
                background: '#3a7eb5',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Slanted "grass platform" oval that the combatants stand on. */
function Platform({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 160, height: 14,
      background: '#000',
      borderRadius: '50%',
      transform: 'skewX(-12deg)',
      position: 'relative',
      ...style,
    }}>
      <div style={{
        position: 'absolute', left: 2, top: 2, right: 2, bottom: 2,
        background: '#cda06a',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', left: 6, top: 4, right: 6, bottom: 6,
        background: '#e2bb87',
        borderRadius: '50%',
      }} />
    </div>
  );
}

function lerp(a: number, b: number, t: number): number {
  if (Math.abs(a - b) < 0.5) return b;
  return a + (b - a) * t;
}


function PixelMon({ mon, side, dx, dy, flash, shake }: {
  mon: Mon; side: 'enemy' | 'player';
  dx: number; dy: number; flash: boolean; shake: number;
}) {
  const type = mon.types[0] ?? 'Normal';
  const colors: Record<string, string> = {
    Ghost: '#a78bff', Grass: '#6cb53a', Normal: '#efe3c2', Psychic: '#ff3c25',
    Fighting: '#c08029', Water: '#4286f0', Ice: '#6cf4d2', Fire: '#ff3c25', Poison: '#a78bff',
  };
  const sx = shake > 0 ? (Math.random() - 0.5) * Math.min(8, shake / 2) : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * Math.min(8, shake / 2) : 0;
  return (
    <div style={{
      position: 'absolute',
      [side === 'enemy' ? 'top' : 'bottom']: side === 'enemy' ? 32 : 36,
      [side === 'enemy' ? 'right' : 'left']: 56,
      transform: `translate(${dx + sx}px, ${dy + sy}px)`,
      transition: 'transform 0.05s linear',
      filter: flash ? 'brightness(2.4) saturate(0.4)' : 'none',
    }}>
      {/* shadow */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -10, width: 64, height: 8,
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.35)', borderRadius: '50%', filter: 'blur(2px)',
      }}/>
      <div style={{
        width: 84, height: 84,
        background: colors[type] ?? '#efe3c2',
        borderRadius: '40% 50% 35% 50% / 35% 40% 50% 50%',
        border: '3px solid #07070b',
        boxShadow: 'inset 4px -4px 0 rgba(0,0,0,0.18), 0 8px 0 rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Press Start 2P, monospace', fontSize: 16, color: '#07070b',
        position: 'relative',
      }}>
        {/* eye highlights */}
        <div style={{ position: 'absolute', top: 22, left: 18, width: 8, height: 8, background: '#07070b', borderRadius: '50%' }}/>
        <div style={{ position: 'absolute', top: 22, right: 18, width: 8, height: 8, background: '#07070b', borderRadius: '50%' }}/>
        <div style={{ position: 'absolute', top: 23, left: 21, width: 2, height: 2, background: '#fff', borderRadius: '50%' }}/>
        <div style={{ position: 'absolute', top: 23, right: 21, width: 2, height: 2, background: '#fff', borderRadius: '50%' }}/>
        <div style={{ marginTop: 24 }}>{mon.name.slice(0, 2).toUpperCase()}</div>
      </div>
    </div>
  );
}
