"""Live Feel humanization for MIDI stems.

Single entry point: humanize(midi, live_feel) -> midi. Applied to every
MIDI stem after generation, before FluidSynth rendering. Pure-Python,
no model dependencies, deterministic given a seed.

Live Feel slider mapping (0.0 = tight/quantized, 1.0 = drunk-bar-band):

  - Gaussian onset jitter, σ scales 0 → 25 ms
  - Velocity jitter,        σ scales 0 → 15
  - Swing ratio on eighths, 50 → 58 (drums only)
  - Per-bar micro-tempo drift, ±0 → ±0.5 BPM, smoothed by a low-pass
    over bars so the band "breathes" against the click instead of
    randomly stumbling

Empirical caps live here; do not raise them without listening tests
against reference recordings (see tests/test_humanize.py).
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass

import pretty_midi


MAX_ONSET_JITTER_SEC = 0.025
MAX_VELOCITY_JITTER = 15
MAX_SWING_RATIO = 0.58       # 50% = straight 8ths, 58% ≈ jazzy shuffle
MAX_TEMPO_DRIFT_BPM = 0.5


@dataclass
class HumanizeParams:
    """Resolved per-stem humanization parameters.

    Exposed so callers can override individual axes (e.g. dial back
    swing on bass while keeping drum swing high).
    """

    onset_sigma_sec: float
    velocity_sigma: float
    swing_ratio: float
    tempo_drift_bpm: float
    seed: int

    @classmethod
    def from_live_feel(
        cls,
        live_feel: float,
        *,
        seed: int = 0,
        is_drums: bool = False,
    ) -> "HumanizeParams":
        f = max(0.0, min(1.0, live_feel))
        return cls(
            onset_sigma_sec=MAX_ONSET_JITTER_SEC * f,
            velocity_sigma=MAX_VELOCITY_JITTER * f,
            swing_ratio=0.5 + (MAX_SWING_RATIO - 0.5) * f if is_drums else 0.5,
            tempo_drift_bpm=MAX_TEMPO_DRIFT_BPM * f,
            seed=seed,
        )


def humanize(
    midi: pretty_midi.PrettyMIDI,
    live_feel: float,
    *,
    seed: int = 0,
    is_drums: bool = False,
    beat_grid_sec: list[float] | None = None,
) -> pretty_midi.PrettyMIDI:
    """Return a new PrettyMIDI with timing/velocity humanization applied.

    Original `midi` is not mutated.

    Args:
        midi: input MIDI from a Magenta generator (quantized to grid).
        live_feel: 0.0..1.0 slider value.
        seed: RNG seed; same seed + same input ⇒ byte-identical output.
        is_drums: enables swing.
        beat_grid_sec: optional beat times from AnalysisResult.beats_sec;
            used for swing and tempo-drift bar boundaries. If None,
            swing/drift are skipped (timing+velocity jitter still apply).
    """
    params = HumanizeParams.from_live_feel(live_feel, seed=seed, is_drums=is_drums)
    return _apply(midi, params, beat_grid_sec)


def _apply(
    midi: pretty_midi.PrettyMIDI,
    p: HumanizeParams,
    beats: list[float] | None,
) -> pretty_midi.PrettyMIDI:
    rng = random.Random(p.seed)
    out = pretty_midi.PrettyMIDI(initial_tempo=_initial_tempo(midi))

    drift_fn = _tempo_drift_fn(beats, p.tempo_drift_bpm, rng) if beats else (lambda t: t)
    swing_fn = _swing_fn(beats, p.swing_ratio) if beats and p.swing_ratio > 0.5 else (lambda t: t)

    for inst in midi.instruments:
        new_inst = pretty_midi.Instrument(
            program=inst.program, is_drum=inst.is_drum, name=inst.name,
        )
        for note in inst.notes:
            start = swing_fn(note.start)
            end = swing_fn(note.end)
            start = drift_fn(start)
            end = drift_fn(end)
            if p.onset_sigma_sec > 0:
                jitter = rng.gauss(0.0, p.onset_sigma_sec)
                start += jitter
                end += jitter
            start = max(0.0, start)
            end = max(start + 0.01, end)

            velocity = note.velocity
            if p.velocity_sigma > 0:
                velocity = int(round(velocity + rng.gauss(0.0, p.velocity_sigma)))
                velocity = max(1, min(127, velocity))

            new_inst.notes.append(pretty_midi.Note(
                velocity=velocity, pitch=note.pitch, start=start, end=end,
            ))
        out.instruments.append(new_inst)
    return out


def _initial_tempo(midi: pretty_midi.PrettyMIDI) -> float:
    times, tempi = midi.get_tempo_changes()
    return float(tempi[0]) if len(tempi) else 120.0


def _swing_fn(beats: list[float], ratio: float):
    """Push off-beat eighths later by (ratio - 0.5) of the beat interval."""
    if len(beats) < 2:
        return lambda t: t
    shift = ratio - 0.5
    eighths: list[tuple[float, float]] = []
    for b0, b1 in zip(beats, beats[1:]):
        mid = (b0 + b1) / 2
        eighths.append((mid, (b1 - b0) * shift))

    def fn(t: float) -> float:
        # Find nearest off-beat eighth and shift if t is close enough.
        for mid, delta in eighths:
            if abs(t - mid) < 0.02:
                return t + delta
        return t

    return fn


def _tempo_drift_fn(beats: list[float], drift_bpm: float, rng: random.Random):
    """Smooth ±drift_bpm wobble across bars (one wobble per ~4 beats).

    Implemented as a piecewise-linear time warp anchored at beats.
    """
    if drift_bpm <= 0 or len(beats) < 5:
        return lambda t: t

    # One control point every 4 beats.
    anchors = beats[::4]
    if anchors[-1] != beats[-1]:
        anchors = anchors + [beats[-1]]

    # Random ±drift_bpm fraction per anchor, low-passed.
    raw = [rng.gauss(0.0, drift_bpm / 2.0) for _ in anchors]
    smooth = _low_pass(raw, alpha=0.4)
    # Convert BPM offset to fractional time scale (slower BPM → stretch).
    avg_bpm = 60.0 / ((beats[-1] - beats[0]) / max(1, len(beats) - 1))
    scales = [1.0 + (offset / avg_bpm) for offset in smooth]

    def fn(t: float) -> float:
        if t <= anchors[0]:
            return t * scales[0]
        if t >= anchors[-1]:
            return t * scales[-1]
        for i in range(len(anchors) - 1):
            if anchors[i] <= t < anchors[i + 1]:
                frac = (t - anchors[i]) / (anchors[i + 1] - anchors[i])
                s = scales[i] + frac * (scales[i + 1] - scales[i])
                return t * s
        return t

    return fn


def _low_pass(xs: list[float], alpha: float) -> list[float]:
    out: list[float] = []
    prev = 0.0
    for x in xs:
        prev = alpha * x + (1 - alpha) * prev
        out.append(prev)
    return out
