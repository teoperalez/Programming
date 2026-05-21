"""Tempo, beat grid, and key detection.

v0.1 critical path. Foundation everything else uses — drum/bass/keys
generators all need the beat grid, ACE-Step prompts need the key.

Implementation plan:
  - tempo + beats:  madmom RNNBeatProcessor + BeatTrackingProcessor
  - downbeats:      madmom RNNDownBeatProcessor + DBNDownBeatTrackingProcessor
  - key:            librosa Krumhansl-Schmuckler key profile over CQT chroma
"""

from __future__ import annotations

from pathlib import Path

from ..state import AnalysisResult


def analyze(vocal_path: Path, guitar_path: Path) -> AnalysisResult:
    """Run tempo + key + beat-grid analysis on the guitar track.

    Vocal track is used only by lyrics.py and melody.py.
    """
    raise NotImplementedError("v0.1: wire up madmom + librosa here")
