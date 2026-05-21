"""Gradio entrypoint for ai-band-composer.

Launches the three-tab UI. All heavy logic lives in src/ — this file
just wires inputs to those modules.

    python app.py                 # browser at http://localhost:7860
    python app.py --lowvram       # smaller Whisper + 3B LLM
    python app.py --share         # public Gradio share link (not recommended)
"""

from __future__ import annotations

import argparse

import gradio as gr

from src.state import new_session
from src.ui import analyze_tab, compose_tab, mix_tab


def build_app() -> gr.Blocks:
    with gr.Blocks(title="AI Band Composer") as app:
        gr.Markdown(
            "# 🎸 AI Band Composer\n"
            "Drop in a vocal + guitar recording. Pick a mood and instruments. "
            "Get a full band arrangement you can re-roll stem-by-stem."
        )
        session_state = gr.State(value=new_session())
        with gr.Tab("1. Analyze"):
            analyze_tab.build(session_state)
        with gr.Tab("2. Compose"):
            compose_tab.build(session_state)
        with gr.Tab("3. Mix"):
            mix_tab.build(session_state)
    return app


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--lowvram", action="store_true")
    p.add_argument("--share", action="store_true")
    p.add_argument("--port", type=int, default=7860)
    args = p.parse_args()

    # --lowvram is read by analyze.lyrics and compose.textures via env var.
    if args.lowvram:
        import os
        os.environ["AI_BAND_COMPOSER_LOWVRAM"] = "1"

    app = build_app()
    app.launch(
        server_port=args.port,
        share=args.share,
        inbrowser=True,
        theme=gr.themes.Soft(),
    )


if __name__ == "__main__":
    main()
