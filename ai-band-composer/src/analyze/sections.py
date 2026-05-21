"""Section boundary detection via MSAF (Music Structure Analysis Framework)."""

from __future__ import annotations

from pathlib import Path


def detect(audio_path: Path) -> list[tuple[float, str]]:
    """Return [(start_sec, label), ...] e.g. ('0.0','intro'), ('8.2','verse')."""
    raise NotImplementedError("v0.5: msaf.process(audio_path, boundaries_id='sf', labels_id='fmc2d')")
