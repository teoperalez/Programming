'use client';

/**
 * Top-level game runtime. Owns the canvas, the game loop, the scene system,
 * and the entity registry. Renders the canvas + a React UI overlay layer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { boot as bootAssets, TILE_SIZE, PAL } from './engine/Assets';
import { Tilemap } from './engine/Tilemap';
import { Camera } from './engine/Camera';
import { Input } from './engine/Input';
import { Audio } from './engine/Audio';
import { Player } from './engine/Player';
import { Building, NPC } from './engine/Entities';
import { bus } from './engine/EventBus';
import { BUILDINGS, NPCS, SPAWN, TILEMAP, WORLD_W, WORLD_H } from './data/world';
import { DIALOGS, HOUSE_INTRO, ARCHIVE_INTRO, CONTACT_INTRO } from './data/dialogs';
import type { GameMetrics } from './engine/types';

import BootScreen from './ui/BootScreen';
import Hud from './ui/Hud';
import DialogBox from './ui/DialogBox';
import Panel from './ui/Panel';
import PauseMenu from './ui/PauseMenu';
import DevConsole from './ui/DevConsole';
import ReadMode from './ui/ReadMode';
import MobileControls from './ui/MobileControls';
import { loadSave, writeSave } from './state/saves';

/* ============================================================ */
/* Game state — single React state machine for UI overlays.     */
/* ============================================================ */

type Mode = 'boot' | 'play' | 'read';
type Overlay = null | { kind: 'dialog'; lines: string[]; speaker?: string }
             | { kind: 'panel'; id: string }
             | { kind: 'menu' };

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('boot');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [metrics, setMetrics] = useState<GameMetrics>({ fps: 0, frameMs: 0, drawMs: 0, entities: 0, visibleTiles: 0 });
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  /* ---- engine refs (mutable but not part of React state) ---- */
  const engineRef = useRef<{
    tilemap: Tilemap;
    camera: Camera;
    input: Input;
    audio: Audio;
    player: Player;
    buildings: Building[];
    npcs: NPC[];
    paused: boolean;
    blockMovement: boolean;
  } | null>(null);

  /* ============================================================ */
  /* mount / unmount lifecycle                                    */
  /* ============================================================ */

  useEffect(() => {
    bootAssets();

    // restore save
    const save = loadSave();
    const spawnX = save?.x ?? SPAWN.tx * TILE_SIZE;
    const spawnY = save?.y ?? SPAWN.ty * TILE_SIZE;
    if (save?.flags) setFlags(new Set(save.flags));
    if (save?.visited) setVisited(new Set(save.visited));

    const tilemap = new Tilemap(TILEMAP);
    const camera = new Camera();
    camera.setWorld(WORLD_W, WORLD_H);
    const input = new Input();
    input.attach();
    const audio = new Audio();
    audio.attach();
    const player = new Player(spawnX, spawnY);
    if (save?.dir) player.dir = save.dir;

    const buildings = BUILDINGS.map((def) => {
      const b = new Building({
        id: def.id,
        sprite: def.sprite,
        tx: def.tx,
        ty: def.ty,
        label: def.label,
        sublabel: def.sublabel,
        onEnter: () => openBuilding(def.projectId),
      });
      b.stamp(tilemap);
      return b;
    });

    const npcs = NPCS.map((def) => new NPC(def));
    // stamp NPC positions as solid for the moment they spawn
    for (const n of npcs) {
      const tx = Math.floor(n.x / TILE_SIZE);
      const ty = Math.floor(n.y / TILE_SIZE);
      // we don't actually mark NPCs as permanently solid because they move,
      // but we do prevent the player from overlapping via the AABB check below.
      void tx; void ty;
    }

    engineRef.current = {
      tilemap, camera, input, audio, player,
      buildings, npcs,
      paused: false,
      blockMovement: false,
    };

    // Boot screen handles itself with a 1.4s timer, then sets mode='play'.

    return () => {
      input.detach();
      audio.detach();
      bus.clear();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================ */
  /* canvas size + game loop                                      */
  /* ============================================================ */

  useEffect(() => {
    if (mode === 'boot' || mode === 'read') return;
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
      // pixel-perfect rendering
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    eng.camera.centerOn(eng.player.x + 8, eng.player.y + 12, true);

    /* fixed-timestep update + variable render */
    const STEP = 1 / 120;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let frames = 0;
    let fpsTick = last;
    let drawMs = 0;

    const update = (dt: number) => {
      const { input, player, tilemap, npcs, camera, audio } = eng;

      if (input.pressed('console')) {
        setShowConsole((v) => !v);
      }
      if (input.pressed('mode')) {
        setMode('read');
        return;
      }

      // overlay handling: dialog/panel/menu intercepts movement
      if (overlay) {
        if (overlay.kind === 'dialog') {
          if (input.pressed('confirm') || input.pressed('cancel')) {
            bus.emit('dialog:advance', undefined);
          }
        } else if (overlay.kind === 'panel') {
          if (input.pressed('cancel') || input.pressed('confirm')) {
            audio.setMuted(false);
            setOverlay(null);
            bus.emit('audio:play', { sound: 'close' });
          }
        } else if (overlay.kind === 'menu') {
          if (input.pressed('cancel') || input.pressed('menu')) {
            setOverlay(null);
            bus.emit('audio:play', { sound: 'close' });
          }
        }
        // NPCs still patrol while paused, but player stays still
        for (const n of npcs) n.update(dt, tilemap);
        camera.update(dt);
        input.flip();
        return;
      }

      if (input.pressed('menu')) {
        setOverlay({ kind: 'menu' });
        bus.emit('audio:play', { sound: 'open' });
        input.flip();
        return;
      }

      // interaction probe (player presses Space facing something)
      if (input.pressed('confirm')) {
        const probe = player.facingProbe();
        // buildings
        for (const b of eng.buildings) {
          const ib = b.interactBounds();
          if (aabb(probe, ib)) {
            b.interact();
            input.flip();
            return;
          }
        }
        // npcs
        for (const n of eng.npcs) {
          const ib = n.interactBounds();
          if (aabb(probe, ib)) {
            n.interact();
            input.flip();
            return;
          }
        }
      }

      // player + npc movement
      player.update(dt, input, tilemap);
      for (const n of npcs) n.update(dt, tilemap);
      camera.centerOn(player.x + 8, player.y + 12, false);
      camera.update(dt);
      input.flip();
    };

    const render = () => {
      const { tilemap, camera, player, buildings, npcs } = eng;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const t0 = performance.now();
      // sky
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(0, 0, w, h);

      // tiles
      const visible = tilemap.draw(ctx, camera);

      // collect renderables sorted by sortY
      type R = { sortY: number; draw: (ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }) => void };
      const renderables: R[] = [];
      for (const b of buildings) renderables.push(b);
      for (const n of npcs) renderables.push(n);
      renderables.push(player);
      renderables.sort((a, b) => a.sortY - b.sortY);
      for (const r of renderables) r.draw(ctx, camera);

      // night/day overlay — very subtle vignette
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      drawMs = performance.now() - t0;
      setMetricsInternal(camera, visible, renderables.length);
    };

    let metricsTick = last;
    const setMetricsInternal = (_cam: Camera, visTiles: number, ents: number) => {
      // throttle UI updates to 4 Hz
      const now = performance.now();
      if (now - metricsTick < 250) return;
      metricsTick = now;
      setMetrics({
        fps: Math.round(frames / ((now - fpsTick) / 1000)),
        frameMs: 0, // set in loop below
        drawMs,
        entities: ents,
        visibleTiles: visTiles,
      });
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
    return () => {
      offDialog(); offPanel(); offClosed(); offFlag();
    };
  }, []);

  /* save on player motion (debounced) */
  useEffect(() => {
    if (!engineRef.current) return;
    const t = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      writeSave({
        x: e.player.x,
        y: e.player.y,
        dir: e.player.dir,
        flags: Array.from(flags),
        visited: Array.from(visited),
        ts: Date.now(),
      });
    }, 4000);
    return () => clearInterval(t);
  }, [flags, visited]);

  /* ============================================================ */
  /* building entries — dispatch correct overlay                  */
  /* ============================================================ */

  const openBuilding = useCallback((projectId: string) => {
    if (projectId === 'house') {
      bus.emit('dialog:open', { lines: HOUSE_INTRO, speaker: "TEO'S HOUSE" });
      return;
    }
    if (projectId === 'archive') {
      bus.emit('dialog:open', {
        lines: ARCHIVE_INTRO,
        speaker: 'THE ARCHIVE',
        onClose: () => bus.emit('panel:open', { id: 'archive' }),
      });
      // open the archive panel immediately (no "open" follow-up since intro is short)
      setTimeout(() => bus.emit('panel:open', { id: 'archive' }), 0);
      return;
    }
    if (projectId === 'contact') {
      bus.emit('dialog:open', { lines: CONTACT_INTRO, speaker: 'CONTACT TOWER' });
      setTimeout(() => bus.emit('panel:open', { id: 'contact' }), 0);
      return;
    }
    const dlg = DIALOGS[projectId];
    if (dlg) {
      bus.emit('panel:open', { id: projectId });
    }
  }, []);

  /* ============================================================ */
  /* render                                                       */
  /* ============================================================ */

  if (mode === 'boot') {
    return <BootScreen onDone={() => setMode('play')} />;
  }

  if (mode === 'read') {
    return <ReadMode onClose={() => setMode('play')} />;
  }

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: PAL.ink,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />

      <Hud
        flags={flags}
        visited={visited}
        onMenuOpen={() => setOverlay({ kind: 'menu' })}
      />

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
          onJump={(projectId) => {
            setOverlay(null);
            openBuilding(projectId);
          }}
          onReset={() => {
            // teleport to spawn
            const e = engineRef.current;
            if (!e) return;
            e.player.x = SPAWN.tx * TILE_SIZE;
            e.player.y = SPAWN.ty * TILE_SIZE;
            setOverlay(null);
          }}
          onReadMode={() => {
            setOverlay(null);
            setMode('read');
          }}
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
