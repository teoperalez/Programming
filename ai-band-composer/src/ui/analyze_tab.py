"""Analyze tab — upload, run analysis + lyric analysis, show results."""

from __future__ import annotations

import gradio as gr


def build(session_state: gr.State) -> None:
    gr.Markdown(
        "### 1. Upload your recording\n"
        "Drop in a vocal-only track and a guitar-only track, "
        "or a single mixed track (Demucs will split it)."
    )
    with gr.Row():
        vocal_in = gr.Audio(label="Vocal track", type="filepath")
        guitar_in = gr.Audio(label="Guitar track", type="filepath")
    mixed_in = gr.Audio(label="…or a single mixed track", type="filepath")

    analyze_btn = gr.Button("Analyze", variant="primary")

    with gr.Row():
        tempo_out = gr.Textbox(label="Tempo (BPM)", interactive=False)
        key_out = gr.Textbox(label="Key", interactive=False)
    chord_grid = gr.Dataframe(
        headers=["beat", "chord"],
        label="Detected chord progression (editable — fix before composing)",
        interactive=True,
    )

    gr.Markdown("### Lyric analysis (Whisper + LLM)")
    transcript_out = gr.Textbox(label="Transcript", lines=4, interactive=True)
    analysis_out = gr.JSON(label="LLM analysis (editable JSON pre-fills the Compose tab)")

    def _on_analyze(vocal, guitar, mixed, sess):
        raise NotImplementedError("v0.1: wire analyze.tempo_key + analyze.lyrics")

    analyze_btn.click(
        _on_analyze,
        inputs=[vocal_in, guitar_in, mixed_in, session_state],
        outputs=[tempo_out, key_out, chord_grid, transcript_out, analysis_out],
    )
