"""Drum generation via Magenta GrooVAE / DrumsRNN.

First generator to land (v0.1). Conditions on the beat grid from
tempo_key.py and a style prompt from the user. GrooVAE's groove
embedding is dialed up with the Live Feel slider so high-feel drums
get both Magenta-native microtiming AND the additive jitter from
humanize.py.
"""

from __future__ import annotations

from ..state import AnalysisResult, ComposeSettings, StemArtifact


def generate(analysis: AnalysisResult, settings: ComposeSettings) -> StemArtifact:
    raise NotImplementedError(
        "v0.1: load GrooVAE checkpoint, seed with beats_sec, run sampler, "
        "pass through humanize(midi, settings.live_feel, is_drums=True), "
        "render via compose.render.midi_to_wav with a drum kit SF2."
    )
