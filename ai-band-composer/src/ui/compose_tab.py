"""Compose tab — mood, instruments, Live Feel slider, Generate button.

Defaults are pre-filled from the LyricAnalysis on the session state
once the Analyze tab has run. Every field stays editable.
"""

from __future__ import annotations

import gradio as gr

INSTRUMENTS = ["drums", "bass", "keys", "strings", "pads", "lead", "brass", "perc"]


def build(session_state: gr.State) -> None:
    gr.Markdown("### 2. Compose")
    mood = gr.Textbox(
        label="Mood prompt",
        placeholder="e.g. warm indie folk, melancholic, late-evening",
        info="Pre-filled from lyrical analysis once you've run Analyze.",
    )
    with gr.Row():
        instruments = gr.CheckboxGroup(
            INSTRUMENTS, label="Instruments to add", value=["drums", "bass"],
        )
    with gr.Row():
        intensity = gr.Slider(0.0, 1.0, value=0.5, label="Intensity")
        live_feel = gr.Slider(
            0.0, 1.0, value=0.2,
            label="Live Feel (0 = tight studio click, 1 = drunk-bar-band loose)",
        )
    seed = gr.Number(value=1337, label="Seed", precision=0)

    generate_btn = gr.Button("Generate band", variant="primary")
    status = gr.Markdown()

    def _on_generate(mood_text, insts, inten, feel, seed_val, sess):
        raise NotImplementedError(
            "v0.1: build ComposeSettings, dispatch to compose.drums.generate "
            "(then bass/keys/textures in later phases), store StemArtifacts on session."
        )

    generate_btn.click(
        _on_generate,
        inputs=[mood, instruments, intensity, live_feel, seed, session_state],
        outputs=[status],
    )
