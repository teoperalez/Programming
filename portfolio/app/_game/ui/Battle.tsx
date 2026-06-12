'use client';

import { useEffect, useMemo, useState } from 'react';
import { MONS, MOVES, calcDamage, type Mon, type Move } from '@/lib/pokemon';
import { bus } from '../engine/EventBus';

interface Props {
  projectName: string;
  onClose: () => void;
}

interface Combatant {
  mon: Mon;
  hp: number;
  status: 'ok' | 'burn';
}

const PLAYER_TEAM: Record<string, { atk: string; ally?: string }> = {
  GSCNewLayout: { atk: 'Gengar' },
  AhShuckie: { atk: 'Alakazam' },
};
const BOSS: Record<string, { def: string; nickname: string }> = {
  GSCNewLayout: { def: 'Snorlax', nickname: 'GYM LEADER · DAMAGE-CALC' },
  AhShuckie: { def: 'Machamp', nickname: 'GYM LEADER · UNLOCKED-SPEED' },
};

const PICKABLE_MOVES = ['Thunderbolt', 'Earthquake', 'Psychic', 'Body Slam', 'Surf', 'Ice Beam', 'Shadow Ball', 'Cross Chop'];

export default function Battle({ projectName, onClose }: Props) {
  const playerCfg = PLAYER_TEAM[projectName] ?? PLAYER_TEAM.GSCNewLayout;
  const bossCfg = BOSS[projectName] ?? BOSS.GSCNewLayout;
  const playerInitMon = useMemo(() => MONS.find((m) => m.name === playerCfg.atk)!, [playerCfg.atk]);
  const bossInitMon = useMemo(() => MONS.find((m) => m.name === bossCfg.def)!, [bossCfg.def]);

  const [player, setPlayer] = useState<Combatant>({ mon: playerInitMon, hp: playerInitMon.hp, status: 'ok' });
  const [boss, setBoss] = useState<Combatant>({ mon: bossInitMon, hp: bossInitMon.hp, status: 'ok' });
  const [moves] = useState<Move[]>(() => MOVES.filter((m) => PICKABLE_MOVES.includes(m.name)));
  const [log, setLog] = useState<string[]>([`A wild ${bossCfg.nickname} appeared!`]);
  const [turn, setTurn] = useState<'pick' | 'enemy' | 'done'>('pick');
  const [result, setResult] = useState<'win' | 'lose' | null>(null);

  const append = (s: string) => setLog((l) => [...l, s]);

  const playerAttack = (move: Move) => {
    if (turn !== 'pick' || result) return;
    bus.emit('audio:play', { sound: 'select' });
    const r = calcDamage(player.mon, boss.mon, move, { stab: player.mon.types.includes(move.type), crit: false, burn: player.status === 'burn', screen: false, weather: false });
    const dmg = Math.floor((r.lo + r.hi) / 2);
    const newHp = Math.max(0, boss.hp - dmg);
    append(`${player.mon.name} used ${move.name}!`);
    if (r.effect === 0) append("It had no effect…");
    else if (r.effect >= 2) append("It's super-effective!");
    else if (r.effect < 1 && r.effect > 0) append("It's not very effective…");
    append(`${boss.mon.name} took ${dmg} damage.`);
    bus.emit('audio:play', { sound: r.effect >= 2 ? 'crit' : 'hit' });
    setBoss({ ...boss, hp: newHp });
    if (newHp === 0) {
      append(`${boss.mon.name} fainted!`);
      append('You win! The gym leader nods and walks off.');
      bus.emit('audio:play', { sound: 'fanfare' });
      setResult('win');
      setTurn('done');
      return;
    }
    setTurn('enemy');
    setTimeout(() => enemyAttack(newHp), 900);
  };

  const enemyAttack = (currentBossHp: number) => {
    if (currentBossHp === 0) return;
    // boss picks a move that's at least neutral against player
    const candidates = MOVES.filter((m) => PICKABLE_MOVES.includes(m.name));
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const r = calcDamage(boss.mon, player.mon, chosen, { stab: boss.mon.types.includes(chosen.type), crit: false, burn: false, screen: false, weather: false });
    const dmg = Math.floor((r.lo + r.hi) / 2);
    const newHp = Math.max(0, player.hp - dmg);
    append(`${boss.mon.name} used ${chosen.name}!`);
    if (r.effect >= 2) append("A critical hit on you!");
    append(`${player.mon.name} took ${dmg} damage.`);
    bus.emit('audio:play', { sound: r.effect >= 2 ? 'crit' : 'hit' });
    setPlayer({ ...player, hp: newHp });
    if (newHp === 0) {
      append(`${player.mon.name} fainted! You lose.`);
      setResult('lose');
      setTurn('done');
      return;
    }
    setTurn('pick');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(7,7,11,0.92)', backdropFilter: 'blur(12px)',
      zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 760, background: '#0e0d18', border: '3px solid #f4ecdc', borderRadius: 8,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        fontFamily: 'JetBrains Mono, monospace', color: '#f4ecdc', overflow: 'hidden',
      }}>
        {/* HP bars */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2b2a36' }}>
          <HpBar name={bossCfg.nickname} mon={boss.mon} hp={boss.hp} side="enemy" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 260 }}>
          {/* battle arena (pixel art) */}
          <div style={{
            background: 'linear-gradient(180deg, #3e7e1a 0%, #6cb53a 100%)',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            imageRendering: 'pixelated',
          }}>
            <PixelMon mon={boss.mon} side="enemy" />
            <div style={{ position: 'absolute', bottom: 8, right: 8, color: 'rgba(7,7,11,0.6)', fontSize: 9, fontFamily: 'Press Start 2P, monospace' }}>VS</div>
            <PixelMon mon={player.mon} side="player" />
          </div>
          {/* log */}
          <div style={{ padding: 18, background: '#07070b', overflowY: 'auto', maxHeight: 260, display: 'flex', flexDirection: 'column-reverse' }}>
            <div>
              {log.slice(-8).map((l, i) => (
                <div key={i} style={{ fontSize: 12, lineHeight: 1.5, color: i === log.slice(-8).length - 1 ? '#f4ecdc' : '#8a8377', marginBottom: 4 }}>
                  ▸ {l}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid #2b2a36' }}>
          <HpBar name={`YOU · ${player.mon.name}`} mon={player.mon} hp={player.hp} side="player" />
        </div>
        {/* moves */}
        {turn === 'pick' && !result && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #2b2a36', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {moves.map((m) => (
              <button
                key={m.name}
                onClick={() => playerAttack(m)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  padding: '10px 14px',
                  background: '#14131b',
                  border: '1px solid rgba(244,236,220,0.2)',
                  borderRadius: 6,
                  color: '#f4ecdc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.05em',
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
        {turn === 'enemy' && (
          <div style={{ padding: 16, textAlign: 'center', color: '#8a8377', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            enemy is choosing…
          </div>
        )}
        {turn === 'done' && (
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

function HpBar({ name, mon, hp, side }: { name: string; mon: Mon; hp: number; side: 'enemy' | 'player' }) {
  const pct = (hp / mon.hp) * 100;
  const color = pct < 25 ? '#ff3c25' : pct < 50 ? '#ffb800' : '#6cf4d2';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span style={{ color: side === 'enemy' ? '#ff3c25' : '#f4ecdc' }}>{name}</span>
        <span style={{ color: '#8a8377' }}>HP {hp} / {mon.hp}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(244,236,220,0.08)', borderRadius: 4, overflow: 'hidden', border: '1px solid #2b2a36' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s, background 0.4s' }} />
      </div>
    </div>
  );
}

/** A simple pixel-mon placeholder — colored circle with monogram. */
function PixelMon({ mon, side }: { mon: Mon; side: 'enemy' | 'player' }) {
  const type = mon.types[0] ?? 'Normal';
  const colors: Record<string, string> = {
    Ghost: '#a78bff', Grass: '#6cb53a', Normal: '#efe3c2', Psychic: '#ff3c25',
    Fighting: '#c08029', Water: '#4286f0', Ice: '#6cf4d2', Fire: '#ff3c25',
    Poison: '#a78bff',
  };
  return (
    <div style={{
      position: 'absolute',
      [side === 'enemy' ? 'top' : 'bottom']: side === 'enemy' ? 20 : 16,
      [side === 'enemy' ? 'right' : 'left']: 24,
      width: 72,
      height: 72,
      background: colors[type] ?? '#efe3c2',
      borderRadius: '40% 50% 35% 50% / 35% 40% 50% 50%',
      border: '3px solid #07070b',
      boxShadow: 'inset 4px -4px 0 rgba(0,0,0,0.18), 0 8px 0 rgba(0,0,0,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Press Start 2P, monospace',
      fontSize: 14,
      color: '#07070b',
    }}>
      {mon.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
