"""Keys / piano generation via MusicVAE chord-conditioned model."""

from __future__ import annotations

from ..state import AnalysisResult, ComposeSettings, StemArtifact


def generate(analysis: AnalysisResult, settings: ComposeSettings) -> StemArtifact:
    raise NotImplementedError("v0.2")
