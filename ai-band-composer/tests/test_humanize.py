"""Tests for src/compose/humanize.py.

These run on CPU with no GPU / model deps — they're the only tests
guaranteed to pass in the scaffold state.
"""

from __future__ import annotations

import pretty_midi
import pytest

from src.compose.humanize import (
    MAX_ONSET_JITTER_SEC,
    MAX_VELOCITY_JITTER,
    HumanizeParams,
    humanize,
)


def _click_midi(n_notes: int = 16, bpm: int = 120) -> pretty_midi.PrettyMIDI:
    """Build a perfectly quantized 16th-note MIDI for testing."""
    midi = pretty_midi.PrettyMIDI(initial_tempo=bpm)
    inst = pretty_midi.Instrument(program=0, is_drum=True)
    step = 60.0 / bpm / 4
    for i in range(n_notes):
        t = i * step
        inst.notes.append(pretty_midi.Note(velocity=100, pitch=36, start=t, end=t + step))
    midi.instruments.append(inst)
    return midi


def test_live_feel_zero_is_identity():
    """With Live Feel = 0, output timing/velocity must match input exactly."""
    midi = _click_midi()
    out = humanize(midi, live_feel=0.0, seed=42)
    src = midi.instruments[0].notes
    dst = out.instruments[0].notes
    assert len(src) == len(dst)
    for a, b in zip(src, dst):
        assert a.start == pytest.approx(b.start, abs=1e-9)
        assert a.velocity == b.velocity


def test_live_feel_nonzero_introduces_jitter():
    midi = _click_midi()
    out = humanize(midi, live_feel=0.8, seed=42)
    diffs = [
        out.instruments[0].notes[i].start - midi.instruments[0].notes[i].start
        for i in range(len(midi.instruments[0].notes))
    ]
    # At least some onsets should have moved.
    assert any(abs(d) > 0.001 for d in diffs)


def test_humanize_is_deterministic():
    """Same seed + same input ⇒ byte-identical output. Required for re-roll caching."""
    midi = _click_midi()
    a = humanize(midi, live_feel=0.5, seed=123)
    b = humanize(midi, live_feel=0.5, seed=123)
    notes_a = [(n.start, n.end, n.pitch, n.velocity) for n in a.instruments[0].notes]
    notes_b = [(n.start, n.end, n.pitch, n.velocity) for n in b.instruments[0].notes]
    assert notes_a == notes_b


def test_caps_are_respected():
    p = HumanizeParams.from_live_feel(1.0, is_drums=True)
    assert p.onset_sigma_sec == MAX_ONSET_JITTER_SEC
    assert p.velocity_sigma == MAX_VELOCITY_JITTER
    assert 0.5 < p.swing_ratio <= 0.58


def test_no_negative_start_times():
    midi = _click_midi(n_notes=4, bpm=240)  # first note at t=0
    out = humanize(midi, live_feel=1.0, seed=7)
    for note in out.instruments[0].notes:
        assert note.start >= 0.0
        assert note.end > note.start
