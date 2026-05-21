"""Textural stems (strings, pads, lead, brass) via ACE-Step 1.5.

Audio-model output — no MIDI, no humanize pass. Prompt template:

    "{instrument} only, {mood}, {key} {scale}, {tempo} BPM, {style}"

Plus chord-progression-aware chroma conditioning so harmony tracks
the guitar reference.

After generation, mix.align.snap_to_grid() does a small pyrubberband
stretch if the model drifted off the input's beat grid.
"""

from __future__ import annotations

from ..state import AnalysisResult, ComposeSettings, Instrument, StemArtifact


def generate(
    instrument: Instrument,
    analysis: AnalysisResult,
    settings: ComposeSettings,
) -> StemArtifact:
    raise NotImplementedError(
        "v0.4: ace_step.pipeline.generate(prompt=..., melody_audio=guitar, ...)"
    )
