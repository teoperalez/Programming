"""Session state, shared across Gradio tabs.

Single source of truth for what the UI shows. Tabs read/write through
helpers here rather than passing dicts around.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

Instrument = Literal[
    "drums", "bass", "keys", "strings", "pads", "lead", "brass", "perc"
]


class AnalysisResult(BaseModel):
    """Output of the Analyze stage. Pure data — no model handles."""

    vocal_path: Path
    guitar_path: Path
    tempo_bpm: float
    beats_sec: list[float]
    downbeats_sec: list[float]
    key: str                              # e.g. "C major", "F# minor"
    chord_grid: list[tuple[float, str]]   # [(beat_time_sec, chord_label)]
    vocal_midi_path: Path | None = None
    sections: list[tuple[float, str]] = Field(default_factory=list)  # [(start_sec, label)]


class LyricAnalysis(BaseModel):
    """Output of the lyric analysis stage (Whisper + LLM)."""

    transcript: str
    words: list[dict] = Field(default_factory=list)   # [{word, start, end}]
    sentiment: str                                    # e.g. "melancholic"
    themes: list[str]
    mood_tags: list[str]                              # used to seed Compose mood prompt
    suggested_instruments: list[Instrument]
    energy_curve: list[float] = Field(default_factory=list)  # per-section 0..1
    style: str                                        # one-line style description


class ComposeSettings(BaseModel):
    """User's choices in the Compose tab. Drives every generator."""

    mood_prompt: str
    instruments: set[Instrument]
    intensity: float = 0.5            # 0..1
    live_feel: float = 0.2            # 0..1, drives humanize.py
    seed: int = 1337
    # Per-section overrides; key = section label from AnalysisResult.sections
    section_overrides: dict[str, "ComposeSettings"] = Field(default_factory=dict)


@dataclass
class StemArtifact:
    """Generator output. Stable shape across every src/compose/* module."""

    instrument: Instrument
    wav_path: Path
    midi_path: Path | None = None
    meta: dict = field(default_factory=dict)   # generator params, for re-roll


@dataclass
class Session:
    """Top-level session state. One instance per Gradio app run."""

    analysis: AnalysisResult | None = None
    lyrics: LyricAnalysis | None = None
    compose: ComposeSettings | None = None
    stems: dict[Instrument, StemArtifact] = field(default_factory=dict)
    workdir: Path = field(default_factory=lambda: Path("sessions") / "current")


def new_session(workdir: Path | None = None) -> Session:
    s = Session()
    if workdir is not None:
        s.workdir = workdir
    s.workdir.mkdir(parents=True, exist_ok=True)
    return s
