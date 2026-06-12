/**
 * Procedural audio: chiptune-style synth. No sample loading — all sounds
 * are synthesised from primitive oscillators in Web Audio. Lazily
 * initialised on first user gesture so autoplay policies are happy.
 */

import { bus } from './EventBus';

type Sound = 'step' | 'select' | 'open' | 'close' | 'hit' | 'crit' | 'fanfare';

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private unsubs: Array<() => void> = [];

  attach(): void {
    const unsub = bus.on('audio:play', ({ sound }) => this.play(sound));
    this.unsubs.push(unsub);
    // gestureless contexts get rejected; lazily create on first interaction
    const wake = () => {
      this.ensure();
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
    window.addEventListener('pointerdown', wake, { once: true });
    window.addEventListener('keydown', wake, { once: true });
  }

  detach(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.22;
  }

  private ensure(): void {
    if (this.ctx) return;
    const Ctx = (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.22;
    this.master.connect(this.ctx.destination);
  }

  private play(sound: Sound): void {
    this.ensure();
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const blip = (freq: number, dur: number, type: OscillatorType = 'square', vol = 1) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g).connect(this.master!);
      o.start(now);
      o.stop(now + dur + 0.02);
    };

    switch (sound) {
      case 'step':
        blip(110 + Math.random() * 30, 0.04, 'triangle', 0.4);
        break;
      case 'select':
        blip(880, 0.06, 'square', 0.6);
        break;
      case 'open':
        blip(523, 0.08, 'square');
        setTimeout(() => blip(784, 0.1, 'square'), 70);
        break;
      case 'close':
        blip(523, 0.06, 'square');
        setTimeout(() => blip(330, 0.08, 'square'), 50);
        break;
      case 'hit':
        blip(220, 0.1, 'sawtooth', 0.7);
        break;
      case 'crit':
        blip(110, 0.16, 'sawtooth', 0.9);
        setTimeout(() => blip(220, 0.12, 'sawtooth', 0.8), 60);
        break;
      case 'fanfare':
        [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.16, 'square', 0.7), i * 90));
        break;
    }
  }
}
