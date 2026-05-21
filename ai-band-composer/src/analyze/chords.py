"""Chord progression detection.

Default: autochord (MIT, easy install). Upgrade path: Chord-CNN-LSTM
from ChordMiniApp for better accuracy on dense guitar parts.

Output is aligned to the beat grid from tempo_key.py so generators
downstream can step through chord-by-chord.
"""

from __future__ import annotations

from pathlib import Path


def detect(guitar_path: Path, beats_sec: list[float]) -> list[tuple[float, str]]:
    """Return [(beat_time_sec, chord_label), ...] one entry per beat."""
    raise NotImplementedError("v0.1+: autochord.recognize() + snap to beat grid")
