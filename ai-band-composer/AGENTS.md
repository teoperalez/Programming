# AGENTS.md — ai-band-composer

Per-project conventions for AI coding agents. Read the root
`F:\Programming\AGENTS.md` first for workspace-wide rules.

## Project shape

- Python 3.11, single `pyproject.toml`, installed as editable (`pip install -e .[dev]`).
- UI: Gradio Blocks, launched by `app.py`. Three tabs: Analyze, Compose, Mix.
- All heavy logic lives under `src/`, organized by pipeline stage
  (`analyze/`, `compose/`, `mix/`). The UI layer (`src/ui/`) only wires
  inputs to those modules — no business logic in the tab files.
- Session state lives in `src/state.py` and is the single source of
  truth for what the UI shows. Tabs read/write through it.

## Pipeline contract (DO NOT break)

Every stem-generating function under `src/compose/` MUST accept and
return the same shape so re-roll works:

```python
def generate(
    analysis: AnalysisResult,
    settings: ComposeSettings,
    seed: int,
) -> StemArtifact:
    """Returns a StemArtifact with .wav_path, .midi_path (if MIDI),
       and .meta (dict of generator params for re-roll)."""
```

Same seed + same inputs + same settings = byte-identical output.
This is what makes "tweak gain without re-generating" work.

## Live Feel humanization

`src/compose/humanize.py::humanize(midi, live_feel)` is the ONLY place
that adds timing/velocity jitter to MIDI. Don't sprinkle randomness
elsewhere — keep humanization pluggable and disable-able for tests.

## GPU memory management

Pipeline is serial. Load each model on first use, unload before the
next stage. Pattern:

```python
@contextmanager
def loaded(model_factory):
    model = model_factory()
    try:
        yield model
    finally:
        del model
        torch.cuda.empty_cache()
```

Whisper + Ollama (Analyze phase) MUST be fully unloaded before
ACE-Step (Generate phase) loads. The `--lowvram` flag in `app.py`
swaps to whisper-small + a 3B LLM.

## LLM output handling

The Ollama lyric-analysis step uses `format=json` AND Pydantic
validation. If the LLM hallucinates, surface the raw transcript +
analysis JSON in the Analyze tab so the user can edit before
Compose runs. Never let LLM output flow directly into generation
without a UI checkpoint.

## Testing

- `pytest tests/` runs the deterministic test suite (no GPU required —
  uses fixtures with mocked model outputs for the heavy steps).
- `pytest -m gpu` runs the end-to-end smoke tests that load real models.
- Add a fixture under `tests/fixtures/` for every new audio analysis
  branch (different tempos, keys, time signatures).

## Don't

- Don't add commercial APIs (Suno, Udio, OpenAI Whisper API). Local only.
- Don't enable MusicGen by default — license is CC-BY-NC.
- Don't commit SF2 files, model weights, or generated audio. The
  project `.gitignore` already excludes `assets/`, `models/`, `*.wav`,
  `*.mid` outside `tests/fixtures/`.
- Don't put business logic in `src/ui/` tab files.
