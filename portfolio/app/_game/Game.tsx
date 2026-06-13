'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { boot as bootAssets, TILE_SIZE, PAL } from './engine/Assets';
import { Tilemap } from './engine/Tilemap';
import { Camera } from './engine/Camera';
import { Input } from './engine/Input';
import { Audio } from './engine/Audio';
import { Player } from './engine/Player';
import { Building, NPC, TreeEntity, FountainEntity, BeaconEntity, Prop } from './engine/Entities';
import { Particles } from './engine/Particles';
import { bus } from './engine/EventBus';
import {
  BUILDINGS, NPCS, SPAWN, TILEMAP, WORLD_W, WORLD_H,
  TREES, FOUNTAIN, PROPS, GAMEHOOK_ANTENNA, HOUSE_CHIMNEY,
} from './data/world';
import { DIALOGS, HOUSE_INTRO, ARCHIVE_INTRO, CONTACT_INTRO } from './data/dialogs';
import type { GameMetrics, WorldRenderable } from './engine/types';

import TitleScreen from './ui/TitleScreen';
import Hud from './ui/Hud';
import DialogBox from './ui/DialogBox';
import Panel from './ui/Panel';
import PauseMenu from './ui/PauseMenu';
import DevConsole from './ui/DevConsole';
import ReadMode from './ui/ReadMode';
import MobileControls from './ui/MobileControls';
import FloatingPopups from './ui/FloatingPopups';
import { loadSave, writeSave } from './state/saves';

type Mode = 'title' | 'play' | 'read';
type Overlay = null
  | { kind: 'dialog'; lines: string[]; speaker?: string }
  | { kind: 'panel'; id: string }
  | { kind: 'menu' };

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('title');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [metrics, setMetrics] = useState<GameMetrics>({ fps: 0, frameMs: 0, drawMs: 0, entities: 0, visibleTiles: 0 });
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const engineRef = useRef<{
    tilemap: Tilemap;
    camera: Camera;
    input: Input;
    audio: Audio;
    player: Player;
    buildings: Building[];
    npcs: NPC[];
    trees: TreeEntity[];
    props: Prop[];
    fountain: FountainEntity;
    beacon: BeaconEntity;
    particles: Particles;
    /** active screen shake state */
    shakeT: number;
    shakeMag: number;
    /** chimney smoke emit cooldown */
    smokeCool: number;
    time: number;
  } | null>(null);

  /* ============================================================ */
  /* boot engine                                                  */
  /* ============================================================ */

  useEffect(() => {
    bootAssets();

    const save = loadSave();
    const spawnX = save?.x ?? SPAWN.tx * TILE_SIZE;
    const spawnY = save?.y ?? SPAWN.ty * TILE_SIZE;
    if (save?.flags) setFlags(new Set(save.flags));
    if (save?.visited) setVisited(new Set(save.visited));

    const tilemap = new Tilemap(TILEMAP);
    const camera = new Camera();
    camera.setWorld(WORLD_W, WORLD_H);
    camera.scale = 3;
    const input = new Input();
    input.attach();
    const audio = new Audio();
    audio.attach();
    const particles = new Particles();
    particles.attach();
    const player = new Player(spawnX, spawnY);
    if (save?.dir) player.dir = save.dir;

    const buildings = BUILDINGS.map((def) => {
      const b = new Building({
        id: def.id, sprite: def.sprite, tx: def.tx, ty: def.ty,
        label: def.label, sublabel: def.sublabel,
        onEnter: () => openBuilding(def.projectId),
      });
      b.stamp(tilemap);
      return b;
    });

    const npcs = NPCS.map((def) => new NPC(def));
    const trees = TREES.map((t) => {
      const spr = t.kind === 'pine' ? 'tree-pine' : t.kind === 'squat' ? 'tree-squat' : 'tree-round';
      const e = new TreeEntity(t.tx, t.ty, spr);
      // mark trunk as solid
      const i = tilemap.idx(t.tx, t.ty);
      if (i >= 0) tilemap.solid[i] = true;
      return e;
    });

    const props = PROPS.map((p) => {
      const footY = p.sprite === 'flowerbed' ? 14 : undefined;
      const e = new Prop(p.sprite, p.tx, p.ty, { glow: p.glow, footYPx: footY });
      if (p.solid) {
        const i = tilemap.idx(p.tx, p.ty);
        if (i >= 0) tilemap.solid[i] = true;
      }
      return e;
    });

    const fountain = new FountainEntity(FOUNTAIN.tx, FOUNTAIN.ty);
    // mark fountain footprint solid (32x32 = 2x2 tiles)
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const i = tilemap.idx(FOUNTAIN.tx + dx, FOUNTAIN.ty + dy);
        if (i >= 0) tilemap.solid[i] = true;
      }
    }

    const beacon = new BeaconEntity(GAMEHOOK_ANTENNA.wx, GAMEHOOK_ANTENNA.wy);

    engineRef.current = {
      tilemap, camera, input, audio, player,
      buildings, npcs, trees, props, fountain, beacon, particles,
      shakeT: 0, shakeMag: 0, smokeCool: 0, time: 0,
    };

    // shake handler
    const offShake = bus.on('fx:shake', ({ intensity, duration }) => {
      const e = engineRef.current;
      if (!e) return;
      e.shakeMag = Math.max(e.shakeMag, intensity);
      e.shakeT = Math.max(e.shakeT, duration);
    });

    return () => {
      input.detach();
      audio.detach();
      particles.detach();
      offShake();
      bus.clear();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================ */
  /* game loop                                                    */
  /* ============================================================ */

  useEffect(() => {
    if (mode !== 'play') return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const eng = engineRef.current;
    if (!canvas || !wrap || !eng) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      eng.camera.setViewport(w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    eng.camera.centerOn(eng.player.x + 8, eng.player.y + 12, true);

    const STEP = 1 / 120;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let frames = 0;
    let fpsTick = last;
    let drawMs = 0;
    let metricsTick = last;

    const update = (dt: number) => {
      eng.time += dt;

      if (eng.input.pressed('console')) setShowConsole((v) => !v);
      if (eng.input.pressed('mode')) {
        setMode('read');
        return;
      }

      if (overlay) {
        if (overlay.kind === 'dialog') {
          if (eng.input.pressed('confirm') || eng.input.pressed('cancel')) {
            bus.emit('dialog:advance', undefined);
          }
        } else if (overlay.kind === 'panel') {
          if (eng.input.pressed('cancel') || eng.input.pressed('confirm')) {
            setOverlay(null);
            bus.emit('audio:play', { sound: 'close' });
          }
        } else if (overlay.kind === 'menu') {
          if (eng.input.pressed('cancel') || eng.input.pressed('menu')) {
            setOverlay(null);
            bus.emit('audio:play', { sound: 'close' });
          }
        }
        for (const n of eng.npcs) n.update(dt, eng.tilemap);
        eng.camera.update(dt);
        eng.input.flip();
        return;
      }

      if (eng.input.pressed('menu')) {
        setOverlay({ kind: 'menu' });
        bus.emit('audio:play', { sound: 'open' });
        eng.input.flip();
        return;
      }

      if (eng.input.pressed('confirm')) {
        const probe = eng.player.facingProbe();
        for (const b of eng.buildings) {
          if (aabb(probe, b.interactBounds())) {
            b.interact();
            eng.input.flip();
            return;
          }
        }
        for (const n of eng.npcs) {
          if (aabb(probe, n.interactBounds())) {
            n.interact();
            eng.input.flip();
            return;
          }
        }
      }

      eng.player.update(dt, eng.input, eng.tilemap);
      for (const n of eng.npcs) n.update(dt, eng.tilemap);
      eng.particles.update(dt);

      // chimney smoke emitter
      eng.smokeCool -= dt;
      if (eng.smokeCool <= 0) {
        bus.emit('fx:smoke', { x: HOUSE_CHIMNEY.wx, y: HOUSE_CHIMNEY.wy });
        eng.smokeCool = 0.55 + Math.random() * 0.4;
      }

      // screen shake decay
      if (eng.shakeT > 0) {
        eng.shakeT -= dt;
        if (eng.shakeT <= 0) eng.shakeMag = 0;
      }

      eng.camera.centerOn(eng.player.x + 8, eng.player.y + 12, false);
      eng.camera.update(dt);
      eng.input.flip();
    };

    const render = () => {
      const e = eng;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t0 = performance.now();

      // shake offset (sub-pixel via integer at draw time)
      const sx = e.shakeMag > 0 ? Math.round((Math.random() - 0.5) * e.shakeMag * 2) : 0;
      const sy = e.shakeMag > 0 ? Math.round((Math.random() - 0.5) * e.shakeMag * 2) : 0;

      ctx.save();
      ctx.translate(sx, sy);

      // sky
      ctx.fillStyle = '#1d2030';
      ctx.fillRect(-sx, -sy, w, h);

      // tiles
      const visible = e.tilemap.draw(ctx, e.camera, e.time);

      // y-sorted entities
      const r: WorldRenderable[] = [];
      for (const b of e.buildings) r.push(b);
      for (const tr of e.trees) r.push(tr);
      for (const pr of e.props) r.push(pr);
      r.push(e.fountain);
      for (const n of e.npcs) r.push(n);
      r.push(e.player);
      r.sort((a, b) => a.sortY - b.sortY);
      for (const ent of r) ent.draw(ctx, e.camera, e.time);

      // particles (above world)
      e.particles.draw(ctx, e.camera);

      // beacon (always-on-top because it's a light source)
      e.beacon.draw(ctx, e.camera, e.time);

      // cloud shadow drifts across the world — subtle large soft circle
      const cloudX = (e.time * 28) % (w + 600) - 300;
      const cg = ctx.createRadialGradient(cloudX, 80, 0, cloudX, 80, 240);
      cg.addColorStop(0, 'rgba(0,0,0,0.08)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);

      // vignette
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = g;
      ctx.fillRect(-sx, -sy, w, h);

      ctx.restore();

      drawMs = performance.now() - t0;

      const now = performance.now();
      if (now - metricsTick > 250) {
        metricsTick = now;
        setMetrics({
          fps: Math.round(frames / Math.max(0.001, (now - fpsTick) / 1000)),
          frameMs: 0,
          drawMs,
          entities: r.length + e.particles.count(),
          visibleTiles: visible,
        });
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
      render();
      frames++;
      if (now - fpsTick > 1000) {
        frames = 0;
        fpsTick = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, overlay]);

  /* ============================================================ */
  /* event-bus → React state                                      */
  /* ============================================================ */

  useEffect(() => {
    const offDialog = bus.on('dialog:open', (p) => {
      setOverlay({ kind: 'dialog', lines: p.lines, speaker: p.speaker });
    });
    const offPanel = bus.on('panel:open', (p) => {
      setOverlay({ kind: 'panel', id: p.id });
      setVisited((v) => new Set(v).add(p.id));
    });
    const offClosed = bus.on('panel:closed', () => setOverlay(null));
    const offFlag = bus.on('quest:flag', ({ flag }) => {
      setFlags((s) => new Set(s).add(flag));
    });
    return () => { offDialog(); offPanel(); offClosed(); offFlag(); };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    const t = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      writeSave({
        x: e.player.x, y: e.player.y, dir: e.player.dir,
        flags: Array.from(flags), visited: Array.from(visited), ts: Date.now(),
      });
    }, 4000);
    return () => clearInterval(t);
  }, [flags, visited]);

  /* ============================================================ */
  /* building entries                                             */
  /* ============================================================ */

  const openBuilding = useCallback((projectId: string) => {
    if (projectId === 'house') {
      bus.emit('dialog:open', { lines: HOUSE_INTRO, speaker: "TEO'S HOUSE" });
      return;
    }
    if (projectId === 'archive') {
      bus.emit('dialog:open', { lines: ARCHIVE_INTRO, speaker: 'THE ARCHIVE' });
      setTimeout(() => bus.emit('panel:open', { id: 'archive' }), 0);
      return;
    }
    if (projectId === 'contact') {
      bus.emit('dialog:open', { lines: CONTACT_INTRO, speaker: 'CONTACT TOWER' });
      setTimeout(() => bus.emit('panel:open', { id: 'contact' }), 0);
      return;
    }
    if (DIALOGS[projectId]) {
      bus.emit('panel:open', { id: projectId });
    }
  }, []);

  /* ============================================================ */
  /* render                                                       */
  /* ============================================================ */

  if (mode === 'title') {
    return (
      <TitleScreen
        hasSave={!!loadSave()}
        onStart={(fromSave) => {
          if (!fromSave) {
            // wipe save
            const e = engineRef.current;
            if (e) {
              e.player.x = SPAWN.tx * TILE_SIZE;
              e.player.y = SPAWN.ty * TILE_SIZE;
              e.player.dir = 'down';
            }
            setFlags(new Set());
            setVisited(new Set());
          }
          setMode('play');
        }}
        onRead={() => setMode('read')}
      />
    );
  }

  if (mode === 'read') {
    return <ReadMode onClose={() => setMode('play')} />;
  }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'fixed', inset: 0, background: PAL.ink, overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />

      <Hud
        flags={flags}
        visited={visited}
        onMenuOpen={() => setOverlay({ kind: 'menu' })}
      />

      <FloatingPopups />

      {overlay?.kind === 'dialog' && (
        <DialogBox lines={overlay.lines} speaker={overlay.speaker} onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'panel' && (
        <Panel id={overlay.id} onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'menu' && (
        <PauseMenu
          visited={visited}
          onClose={() => setOverlay(null)}
          onJump={(projectId) => { setOverlay(null); openBuilding(projectId); }}
          onReset={() => {
            const e = engineRef.current;
            if (!e) return;
            e.player.x = SPAWN.tx * TILE_SIZE;
            e.player.y = SPAWN.ty * TILE_SIZE;
            setOverlay(null);
          }}
          onReadMode={() => { setOverlay(null); setMode('read'); }}
          onTitle={() => { setOverlay(null); setMode('title'); }}
        />
      )}

      {showConsole && <DevConsole metrics={metrics} onClose={() => setShowConsole(false)} />}

      <MobileControls
        onDir={(k, down) => {
          const e = engineRef.current;
          if (!e) return;
          if (down) e.input.virtualPress(k);
          else e.input.virtualRelease(k);
        }}
        onConfirm={() => {
          const e = engineRef.current;
          if (!e) return;
          e.input.virtualPress('confirm');
          setTimeout(() => e.input.virtualRelease('confirm'), 60);
        }}
        onMenu={() => setOverlay({ kind: 'menu' })}
      />
    </div>
  );
}

function aabb(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
