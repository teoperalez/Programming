"""Onset-grid alignment via pyrubberband.

Only used on textural audio-model stems (ACE-Step) that may have
drifted off the input beat grid. Skipped for humanized MIDI stems
where drift is the intended feature.
"""

from __future__ import annotations

from pathlib import Path


def snap_to_grid(stem_wav: Path, beats_sec: list[float], tolerance_ms: float = 5.0) -> Path:
    raise NotImplementedError("v0.4: cross-correlate stem onsets vs beats, pyrubberband.time_stretch")
