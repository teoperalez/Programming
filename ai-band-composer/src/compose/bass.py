"""Bass generation: chord-root walker + GrooVAE for groove pattern."""

from __future__ import annotations

from ..state import AnalysisResult, ComposeSettings, StemArtifact


def generate(analysis: AnalysisResult, settings: ComposeSettings) -> StemArtifact:
    raise NotImplementedError("v0.2")
