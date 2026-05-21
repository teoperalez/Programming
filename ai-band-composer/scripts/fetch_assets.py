"""Download free SoundFonts + warm model caches.

Run once after `pip install`. Pulls:
  - MuseScore General GM SF2          (~40 MB, GPL-friendly)
  - Hydrogen GMRockKit drum samples   (~30 MB)
  - Sonatina Symphonic Orchestra SF2  (~330 MB)

Also warms Whisper, Basic Pitch, Demucs caches so the first Analyze
run isn't a multi-minute model download.
"""

from __future__ import annotations


def main() -> None:
    raise NotImplementedError(
        "v0.1: urllib.request.urlretrieve for each SF2 into assets/soundfonts/, "
        "then import faster_whisper / basic_pitch / demucs to trigger their downloads."
    )


if __name__ == "__main__":
    main()
