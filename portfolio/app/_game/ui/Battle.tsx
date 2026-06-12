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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(7,7,11,0.92)', backdropFilter: 'blur(12px)',
      zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 780, background: '#0e0d18', border: '3px solid #f4ecdc', borderRadius: 8,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        fontFamily: 'JetBrains Mono, monospace', color: '#f4ecdc', overflow: 'hidden',
        transform: shake ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : 'none',
        transition: 'transform 0.05s linear',
      }}>
        {/* boss bar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2b2a36' }}>
          <HpBar name={bossCfg.nickname} mon={boss.mon} hp={boss.hp} hpVis={boss.hpVis} side="enemy" />
        </div>

        {/* arena */}
        <div ref={arenaRef} style={{
          position: 'relative', minHeight: 280,
          background: 'linear-gradient(180deg, #3a7eb5 0%, #6cb53a 35%, #4a8a26 100%)',
          imageRendering: 'pixelated',
          overflow: 'hidden',
        }}>
          {/* sky horizon clouds */}
          <div style={{ position: 'absolute', left: 16, top: 12, width: 28, height: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}/>
          <div style={{ position: 'absolute', right: 24, top: 28, width: 36, height: 5, background: 'rgba(255,255,255,0.35)', borderRadius: 4 }}/>
          {/* grass platforms */}
          <div style={{ position: 'absolute', right: 32, top: 84, width: 120, height: 18, background: 'rgba(0,0,0,0.25)', borderRadius: '50%', filter: 'blur(3px)' }}/>
          <div style={{ position: 'absolute', left: 32, bottom: 32, width: 140, height: 22, background: 'rgba(0,0,0,0.25)', borderRadius: '50%', filter: 'blur(3px)' }}/>

          <PixelMon mon={boss.mon} side="enemy" {...lungeFor('enemy')} />
          <PixelMon mon={player.mon} side="player" {...lungeFor('player')} />

          {/* log overlay */}
          <div style={{
            position: 'absolute', right: 12, bottom: 8, maxWidth: '52%',
            padding: '8px 12px', background: 'rgba(7,7,11,0.65)', borderRadius: 6,
            border: '1px solid rgba(244,236,220,0.18)',
          }}>
            {log.slice(-3).map((l, i, arr) => (
              <div key={i} style={{ fontSize: 11, lineHeight: 1.5, color: i === arr.length - 1 ? '#f4ecdc' : '#8a8377' }}>
                ▸ {l}
              </div>
            ))}
          </div>
        </div>

        {/* player bar */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #2b2a36' }}>
          <HpBar name={`YOU · ${player.mon.name}`} mon={player.mon} hp={player.hp} hpVis={player.hpVis} side="player" />
        </div>

        {/* moves */}
        {phase.kind === 'pick' && !result && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #2b2a36', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {moves.map((m) => (
              <button
                key={m.name}
                onClick={() => playerAttack(m)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                  padding: '10px 14px',
                  background: '#14131b',
                  border: '1px solid rgba(244,236,220,0.2)',
                  borderRadius: 6,
                  color: '#f4ecdc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.05em',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff3c25'; e.currentTarget.style.background = '#1a1620'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(244,236,220,0.2)'; e.currentTarget.style.background = '#14131b'; }}
              >
                <span style={{ color: '#ff3c25', marginRight: 8 }}>▶</span>
                {m.name} · <span style={{ color: '#8a8377', fontSize: 10 }}>{m.power} bp · {m.type}</span>
              </button>
            ))}
          </div>
        )}
        {(phase.kind === 'pAttack' || phase.kind === 'pHit' || phase.kind === 'eAttack' || phase.kind === 'eHit') && (
          <div style={{ padding: 16, textAlign: 'center', color: '#8a8377', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {phase.kind === 'pAttack' && 'attacking…'}
            {phase.kind === 'pHit' && 'impact!'}
            {phase.kind === 'eAttack' && 'enemy is attacking…'}
            {phase.kind === 'eHit' && 'taking damage…'}
          </div>
        )}
        {phase.kind === 'done' && (
          <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 14, color: result === 'win' ? '#6cf4d2' : '#ff3c25' }}>
              {result === 'win' ? '★ VICTORY · You read the type chart right.' : '× DEFEAT · Try a different matchup.'}
            </span>
            <button onClick={onClose} style={{
              padding: '8px 16px', background: '#ff3c25', color: '#07070b', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              close [esc]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function lerp(a: number, b: number, t: number): number {
  if (Math.abs(a - b) < 0.5) return b;
  return a + (b - a) * t;
}

function HpBar({ name, mon, hp, hpVis, side }: { name: string; mon: Mon; hp: number; hpVis: number; side: 'enemy' | 'player' }) {
  const pct = (hpVis / mon.hp) * 100;
  const realPct = (hp / mon.hp) * 100;
  const color = pct < 25 ? '#ff3c25' : pct < 50 ? '#ffb800' : '#6cf4d2';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span style={{ color: side === 'enemy' ? '#ff3c25' : '#f4ecdc' }}>{name}</span>
        <span style={{ color: '#8a8377' }}>HP {Math.round(hpVis)} / {mon.hp}</span>
      </div>
      <div style={{
        height: 10, background: 'rgba(244,236,220,0.06)', borderRadius: 4, overflow: 'hidden',
        border: '1px solid #2b2a36', position: 'relative',
      }}>
        {/* delta sliver */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(255,60,37,0.35)' }}/>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${realPct}%`, background: color, transition: 'width 0.05s linear' }}/>
      </div>
    </div>
  );
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
