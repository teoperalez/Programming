"""Mix bus: per-stem LUFS normalization → gain/pan → sum → master WAV.

Called by every re-roll, so it must be cheap and stateless.
"""

from __future__ import annotations

from pathlib import Path

from ..state import Instrument, StemArtifact


def mix(
    input_audio: Path,
    stems: dict[Instrument, StemArtifact],
    gains_db: dict[Instrument, float],
    pans: dict[Instrument, float],
    out_path: Path,
    target_lufs: float = -14.0,
) -> Path:
    """Return path to the mixed master WAV. Inputs are not modified."""
    raise NotImplementedError(
        "v0.1: load each stem with soundfile, pyloudnorm.normalize.loudness, "
        "apply gains_db + constant-power pan, sum with original input, write WAV."
    )


def export_zip(stems: dict[Instrument, StemArtifact], master: Path, out_zip: Path) -> Path:
    raise NotImplementedError("v0.1: zipfile.ZipFile with all stems + master")
