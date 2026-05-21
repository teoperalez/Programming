"""Vocal melody → MIDI via Spotify Basic Pitch."""

from __future__ import annotations

from pathlib import Path


def transcribe(vocal_path: Path, out_dir: Path) -> Path:
    """Return path to the generated MIDI file."""
    raise NotImplementedError("v0.2+: basic_pitch.inference.predict_and_save")
