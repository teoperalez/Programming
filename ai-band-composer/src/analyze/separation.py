"""Stem separation via Demucs v4 htdemucs.

Only invoked when the user uploads a single mixed track instead of
pre-split vocal + guitar. Output isolated vocals + an 'other' stem
treated as the guitar reference.
"""

from __future__ import annotations

from pathlib import Path


def split(mixed_audio: Path, out_dir: Path) -> tuple[Path, Path]:
    """Return (vocal_wav, guitar_wav)."""
    raise NotImplementedError("v0.1+: shell out to `demucs -n htdemucs ...`")
