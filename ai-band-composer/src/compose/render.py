"""FluidSynth wrapper: MIDI → WAV.

Used by every MIDI stem (drums, bass, keys). SF2 files live under
assets/soundfonts/ — downloaded by scripts/fetch_assets.py, not
committed to the repo.
"""

from __future__ import annotations

from pathlib import Path


def midi_to_wav(midi_path: Path, sf2_path: Path, out_path: Path, sample_rate: int = 44100) -> Path:
    raise NotImplementedError("v0.1: pyfluidsynth.Synth.midi_to_audio() or fluidsynth CLI subprocess")
