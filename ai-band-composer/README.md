# ai-band-composer

Local desktop tool that takes a recorded **vocal + guitar** track and
generates a full band arrangement around it — drums, bass, keys, strings,
pads, lead — with rich customization (mood, instrumentation, per-section
overrides, per-stem re-roll), a **Live Feel** slider that humanizes
timing to mimic a real band, and a **Whisper + LLM** lyrical analysis
pass that pre-fills smart defaults before the UI loads.

100% open-source models, runs locally on your GPU, no paid APIs.

## Status

**Scaffold (v0.0)** — directory layout, pyproject, Gradio shell wired
up, `humanize.py` implemented. Pipeline modules are stubs with
`NotImplementedError`.

Roadmap (mirrors the design plan):

1. **v0.1** — ingest → analyze (tempo/key) → drums-only via GrooVAE with
   Live Feel slider → mix with input → export.
2. **v0.2** — full rhythm section (add bass + keys). Per-stem re-roll.
3. **v0.3** — lyric-aware defaults (faster-whisper + Ollama).
4. **v0.4** — textural stems via ACE-Step.
5. **v0.5** — section-aware composition (MSAF).
6. **v0.6** — polish: presets, project save/load, native window via `pywebview`.

## Requirements

- Python 3.11
- NVIDIA GPU with ~12GB VRAM (recommended) — required for ACE-Step in v0.4+
- FluidSynth installed at the system level (`choco install fluidsynth` on Windows)
- Ollama running locally (`ollama serve` + `ollama pull llama3.1:8b-instruct-q4_K_M`) for v0.3+
- ~5GB of SoundFonts (downloaded by `python scripts/fetch_assets.py`)

## Quick start

```powershell
# 1. Create env
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1

# 2. Install
pip install -e .[dev]

# 3. Run the UI shell (works without any model assets — tabs render, but
#    Generate buttons raise NotImplementedError until v0.1 lands)
python app.py
# → open http://localhost:7860
```

## Architecture (one-screen overview)

```
audio in ─► [analyze]  tempo, key, chords, melody MIDI, sections
            [lyrics]   Whisper transcript → Ollama mood/theme JSON
                       └─► smart defaults pre-fill the Compose tab
                ▼
        [compose] user picks mood, instruments, Live Feel slider
                ▼
   ┌────────────┴───────────────────┐
   │                                │
[MIDI path]                  [audio-model path]
DrumsRNN/GrooVAE             ACE-Step 1.5
+ bass walker                (strings, pads, lead, brass)
+ MusicVAE keys              prompted per instrument
   │                                │
   ▼                                │
[humanize]  timing & velocity       │
jitter scaled by Live Feel          │
   │                                │
   ▼                                │
[FluidSynth + SF2] → WAV ◄──────────┘
                ▼
       [align] pyrubberband micro-stretch to input beat grid
       [mix]   pyloudnorm per stem → mix bus → master + per-stem ZIP
                ▼
              audio out
```

## Project layout

```
ai-band-composer/
├── app.py                       # Gradio entrypoint
├── pyproject.toml
├── src/
│   ├── state.py                 # session state & per-stem cache
│   ├── analyze/
│   │   ├── separation.py        # Demucs (single-file input → stems)
│   │   ├── tempo_key.py         # madmom beats + librosa key
│   │   ├── chords.py            # autochord / Chord-CNN-LSTM
│   │   ├── melody.py            # Basic Pitch → vocal MIDI
│   │   ├── sections.py          # MSAF verse/chorus boundaries
│   │   └── lyrics.py            # faster-whisper + Ollama LLM
│   ├── compose/
│   │   ├── drums.py             # GrooVAE / DrumsRNN
│   │   ├── bass.py              # chord-walker + GrooVAE
│   │   ├── keys.py              # MusicVAE chord-conditioned
│   │   ├── textures.py          # ACE-Step prompts per instrument
│   │   ├── humanize.py          # Live Feel humanization (implemented)
│   │   └── render.py            # FluidSynth MIDI→WAV
│   ├── mix/
│   │   ├── align.py             # pyrubberband alignment
│   │   └── bus.py               # mix + LUFS norm + stem export
│   └── ui/
│       ├── analyze_tab.py
│       ├── compose_tab.py
│       └── mix_tab.py
├── scripts/fetch_assets.py      # downloads SF2s + warms model caches
└── tests/                       # pytest fixtures (click track, known clips)
```

## License & model notes

- All project code: MIT.
- ACE-Step 1.5, Magenta, Demucs, librosa, madmom, Basic Pitch,
  faster-whisper: permissive (MIT / Apache / BSD).
- Ollama models: each carries its own license — Llama 3.1 is "free for
  research and most commercial use" under Meta's community license.
- **MusicGen weights are CC-BY-NC** — present as an opt-in fallback only.
  Disabled by default; do not ship MusicGen output commercially.

## Note on this scaffold

This scaffold currently lives inside the `Programming` meta-repo under
`ai-band-composer/` because the remote-execution environment used to
seed it can only push to that repo. Per the workspace convention
(`F:\Programming\AGENTS.md`), it should be extracted into its own
private repo at `github.com/teoperalez/ai-band-composer` once you pull
it onto your Windows machine. Suggested steps:

```powershell
# from F:\Programming\
gh repo create teoperalez/ai-band-composer --private --source=ai-band-composer --remote=origin --push
# then add the entry to repos.json and remove the whitelist from this meta-repo's .gitignore
```
