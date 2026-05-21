"""Whisper transcription + Ollama LLM lyrical analysis.

Runs in the Analyze phase BEFORE the Compose tab paints, so the Compose
tab can pre-fill mood + instrument defaults from sentiment/themes.

Pipeline:
  1. faster-whisper transcribes the vocal stem with word-level timestamps.
  2. Words are bucketed into song sections from sections.py (if available).
  3. Local Ollama LLM (default llama3.1:8b-instruct-q4_K_M) is prompted
     for a strict-JSON LyricAnalysis. Output is Pydantic-validated.
  4. User can edit transcript + analysis in the Analyze tab before the
     pre-filled values flow into Compose.
"""

from __future__ import annotations

from pathlib import Path

from ..state import LyricAnalysis


LLM_SYSTEM_PROMPT = """\
You are a music producer analyzing song lyrics. Return STRICT JSON
matching this schema:
{
  "sentiment": "<one of: joyful, hopeful, melancholic, angry, romantic, introspective, dark, playful>",
  "themes": ["<short noun phrase>", ...],
  "mood_tags": ["<adjective>", ...],
  "suggested_instruments": ["drums"|"bass"|"keys"|"strings"|"pads"|"lead"|"brass"|"perc", ...],
  "energy_curve": [<float 0..1 per song section>],
  "style": "<one sentence describing musical style>"
}
Be specific. Choose instruments that complement the lyrical mood,
NOT a generic kitchen-sink list. If unsure, suggest fewer instruments.
"""


def transcribe_and_analyze(
    vocal_path: Path,
    sections: list[tuple[float, str]] | None = None,
    *,
    whisper_model: str = "large-v3",
    llm_model: str = "llama3.1:8b-instruct-q4_K_M",
) -> LyricAnalysis:
    """Return LyricAnalysis. Caches Whisper transcript next to vocal_path."""
    raise NotImplementedError(
        "v0.3: faster_whisper.WhisperModel(...).transcribe(vocal_path); "
        "ollama.chat(model=llm_model, format='json', messages=[...]); "
        "LyricAnalysis.model_validate_json(response)"
    )
