"""Mix tab — per-stem gain/pan/mute, per-stem re-roll, export."""

from __future__ import annotations

import gradio as gr

INSTRUMENTS = ["drums", "bass", "keys", "strings", "pads", "lead", "brass", "perc"]


def build(session_state: gr.State) -> None:
    gr.Markdown("### 3. Mix & export")

    for inst in INSTRUMENTS:
        with gr.Row():
            gr.Audio(label=f"{inst}", interactive=False)
            gr.Slider(-24, 12, value=0, label=f"{inst} gain (dB)")
            gr.Slider(-1, 1, value=0, label=f"{inst} pan")
            gr.Checkbox(label="Mute")
            gr.Button(f"🎲 Re-roll {inst}")

    master_audio = gr.Audio(label="Master mix", interactive=False)
    with gr.Row():
        export_btn = gr.Button("Export stems + master (ZIP)", variant="primary")
        export_out = gr.File(label="Download")

    def _on_export(sess):
        raise NotImplementedError("v0.1: mix.bus.mix() then mix.bus.export_zip()")

    export_btn.click(_on_export, inputs=[session_state], outputs=[export_out])
    _ = master_audio  # silence unused warning in scaffold
