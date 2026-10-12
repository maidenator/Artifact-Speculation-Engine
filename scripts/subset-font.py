#!/usr/bin/env python3
"""
Subset font script for artifact-speculation-engine.

Subsets the Genshin font to Latin, punctuation, math, box-drawing, and UI symbols,
and outputs a WOFF2 file at src/assets/fonts/genshin-latin.woff2 (~19.5 kB).

Requirements:
    pip install fonttools brotli

Usage:
    python scripts/subset-font.py [path_to_source_ttf]
"""

import sys
import subprocess
from pathlib import Path

# Target Unicode ranges covering Latin, punctuation, math, arrows, and UI symbols:
UNICODE_RANGES = ",".join([
    "U+0020-007E",  # Basic Latin
    "U+00A0-00FF",  # Latin-1 Supplement (×, degree, etc.)
    "U+2010-2027",  # General Punctuation (–, —, •, etc.)
    "U+2190-21FF",  # Arrows (→, etc.)
    "U+2200-22FF",  # Mathematical Operators (−, ≈, etc.)
    "U+2500-257F",  # Box Drawing (─, ═, etc.)
    "U+25A0-25FF",  # Geometric Shapes (▼, etc.)
    "U+2600-26FF",  # Miscellaneous Symbols (★, etc.)
    "U+2B00-2BFF",  # Miscellaneous Symbols and Arrows (⬡, etc.)
])

def main():
    repo_root = Path(__file__).resolve().parent.parent
    default_input = repo_root / "src" / "assets" / "fonts" / "zh-cn.ttf"
    output_woff2 = repo_root / "src" / "assets" / "fonts" / "genshin-latin.woff2"

    input_font = Path(sys.argv[1]) if len(sys.argv) > 1 else default_input

    if not input_font.exists():
        print(f"Error: Source font not found at {input_font}")
        print("Provide the path to the font: python scripts/subset-font.py <path-to-font.ttf>")
        sys.exit(1)

    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(input_font),
        f"--unicodes={UNICODE_RANGES}",
        "--flavor=woff2",
        f"--output-file={output_woff2}",
    ]

    print(f"Subsetting {input_font} -> {output_woff2}...")
    subprocess.check_call(cmd)
    size_kb = output_woff2.stat().st_size / 1024
    print(f"Success! Output size: {size_kb:.2f} kB")

if __name__ == "__main__":
    main()
