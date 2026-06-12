'use client';

import { useEffect, useRef } from 'react';

/**
 * A pure-WebGL2 particle field with no three.js dependency for the hero
 * background. ~12k instanced points laid out on a grid, animated by a
 * custom GLSL fragment shader that combines:
 *   - a slow polar warp keyed to mouse position (echoes "live polling")
 *   - per-cell "memory value" lookups from a simplex-ish noise
 *   - red/gold/plasma palette tied to cell value, with a soft glow
 *
 * The visual metaphor is the RBY-GameHook memory grid: 0x0000 – 0x017F
 * lit up at 600 Hz. It's beautiful AND on-brand.
 */
export default function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ---------- shaders ---------- */
    const vert = `#version 300 es
      precision highp float;
      in vec2 a_pos;
      out vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const frag = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 outColor;

      uniform float u_t;
      uniform vec2 u_mouse;
      uniform vec2 u_res;

      // hash + value noise
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // aspect-corrected uv centered at 0
        vec2 uv = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);

        // grid lattice — memory cells. 56 columns reads as "0x00 .. 0x37".
        float gridN = 56.0;
        vec2 grid = uv * gridN;
        vec2 cell = floor(grid);
        vec2 local = fract(grid) - 0.5;

        // mouse pull
        vec2 m = (u_mouse / u_res - 0.5) * vec2(u_res.x / u_res.y, 1.0);
        float dm = distance(uv, m);

        // per-cell "memory value" — animated noise that drifts
        float v = fbm(cell * 0.13 + u_t * 0.08);
        // poll wave — radial ring expanding from mouse, fades out
        float ring = exp(-pow((dm - mod(u_t * 0.25, 1.2)) * 6.0, 2.0));
        v += ring * 0.6;

        // dot per cell with soft falloff
        float r = length(local);
        float dot = smoothstep(0.34, 0.0, r);

        // mask: only "lit" cells (v > threshold) show their dot
        float lit = smoothstep(0.42, 0.7, v);
        float intensity = dot * lit;

        // a faint background fill so the dark cells feel like a substrate
        float bg = 0.02 + 0.04 * fbm(uv * 4.0 + u_t * 0.04);

        // palette: ink → fire → gold → plasma highlight on hottest cells
        vec3 ink     = vec3(0.027, 0.027, 0.043);
        vec3 fire    = vec3(1.0, 0.235, 0.145);
        vec3 gold    = vec3(1.0, 0.72, 0.0);
        vec3 plasma  = vec3(0.423, 0.957, 0.823);

        vec3 col = ink + bg * vec3(0.6, 0.45, 0.35);
        col = mix(col, fire * 0.85, intensity * 0.85);
        col = mix(col, gold, smoothstep(0.7, 0.95, v) * intensity);
        col = mix(col, plasma, smoothstep(0.93, 1.05, v) * intensity * 0.6);

        // subtle vignette
        float vg = smoothstep(1.1, 0.4, length(uv));
        col *= mix(0.4, 1.0, vg);

        outColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.warn('shader error', gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // fullscreen quad
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const locPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    const locT = gl.getUniformLocation(prog, 'u_t');
    const locM = gl.getUniformLocation(prog, 'u_mouse');
    const locR = gl.getUniformLocation(prog, 'u_res');

    /* ---------- pointer ---------- */
    const m = { x: 0, y: 0, tx: 0, ty: 0 };
    const setMouse = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      m.tx = (cx - r.left) * dpr;
      m.ty = (r.height - (cy - r.top)) * dpr; // gl y-up
    };
    setMouse(window.innerWidth / 2, window.innerHeight / 2);
    m.x = m.tx;
    m.y = m.ty;

    const onMove = (e: PointerEvent) => setMouse(e.clientX, e.clientY);
    window.addEventListener('pointermove', onMove, { passive: true });

    /* ---------- loop ---------- */
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      m.x += (m.tx - m.x) * 0.08;
      m.y += (m.ty - m.y) * 0.08;
      gl.uniform1f(locT, t);
      gl.uniform2f(locM, m.x, m.y);
      gl.uniform2f(locR, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
