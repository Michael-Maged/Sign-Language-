"""
MS-ASL Video Downloader

Downloads and clips training video segments from MS-ASL using yt-dlp.
Each entry in MSASL_train.json becomes one clipped .mp4 file.

Prerequisites:
    pip install yt-dlp

Run from backend/:
    python scripts/download_msasl_videos.py
"""

import json
import os
import time
import subprocess

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

JSON_PATH  = os.path.join(BACKEND_DIR, "data", "words", "msasl", "MSASL_train.json")
VIDEO_DIR  = os.path.join(BACKEND_DIR, "data", "words", "msasl", "videos")

SLEEP_SEC   = 1.5  # pause between downloads — increase to 3+ if you hit 429 errors
TOP_N_WORDS = 200  # download clips for the N most common words; increase each session (200→400→600…)


def download():
    os.makedirs(VIDEO_DIR, exist_ok=True)

    with open(JSON_PATH) as f:
        entries = json.load(f)

    # Build stable index from the full list BEFORE filtering.
    # This keeps filenames consistent across sessions as TOP_N_WORDS grows.
    indexed = list(enumerate(entries))  # [(original_index, entry), ...]

    if TOP_N_WORDS > 0:
        from collections import Counter
        counts = Counter(e["clean_text"] for e in entries)
        top_words = set(w for w, _ in counts.most_common(TOP_N_WORDS))
        indexed = [(i, e) for i, e in indexed if e["clean_text"] in top_words]
        print(f"Filtered to top {TOP_N_WORDS} words: {len(indexed)} clips")

    total = len(indexed)
    print(f"Target: {total} clips  |  Output: {VIDEO_DIR}")
    print("(Already-downloaded files are skipped automatically)\n")

    ok, skipped, failed = 0, 0, 0

    for pos, (i, entry) in enumerate(indexed):
        out_path = os.path.join(VIDEO_DIR, f"{i:05d}.mp4")

        if os.path.exists(out_path) and os.path.getsize(out_path) > 1024:
            skipped += 1
            continue

        url        = entry["url"]

        start_time = max(0.0, entry.get("start_time", 0.0) - 0.1)
        end_time   = entry.get("end_time", start_time + 5.0) + 0.1
        label      = entry.get("clean_text", "?")

        cmd = [
            "yt-dlp",
            "--quiet",
            "--no-warnings",
            "--download-sections", f"*{start_time:.2f}-{end_time:.2f}",
            "--force-keyframes-at-cuts",
            "-f", "mp4/bestvideo[height<=360]+bestaudio/best[height<=360]",
            "--merge-output-format", "mp4",
            "-o", out_path,
            url,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
            if result.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1024:
                ok += 1
            else:
                failed += 1
        except subprocess.TimeoutExpired:
            failed += 1
        except Exception:
            failed += 1

        if (pos + 1) % 100 == 0 or pos == total - 1:
            print(f"  [{pos+1:>5}/{total}]  ok={ok}  skipped={skipped}  failed={failed}")

        time.sleep(SLEEP_SEC)

    print(f"\nFinished: {ok} downloaded, {skipped} skipped, {failed} failed/unavailable")
    print(f"Run scripts/extract_wlasl_landmarks.py next.")


if __name__ == "__main__":
    download()
