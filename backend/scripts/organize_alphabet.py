"""
Picks one representative image per letter from the ASL Alphabet dataset
and copies it to backend/data/signs/ as a.jpg, b.jpg, ... z.jpg

Run from backend/ directory:
    python scripts/organize_alphabet.py
"""

import os
import shutil

DATASET_DIR = os.path.join("data", "asl_alphabet_train", "asl_alphabet_train")
OUTPUT_DIR  = os.path.join("data", "signs")

def main():
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset not found at: {DATASET_DIR}")
        print("Expected structure: data/asl_alphabet_train/asl_alphabet_train/A/, B/, ...")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    letters = [chr(c) for c in range(ord("A"), ord("Z") + 1)]
    copied, skipped = 0, 0

    for letter in letters:
        folder = os.path.join(DATASET_DIR, letter)
        if not os.path.isdir(folder):
            print(f"  SKIP  {letter} — folder not found")
            skipped += 1
            continue

        images = sorted([
            f for f in os.listdir(folder)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ])

        if not images:
            print(f"  SKIP  {letter} — no images in folder")
            skipped += 1
            continue

        src  = os.path.join(folder, images[0])
        ext  = os.path.splitext(images[0])[1].lower()
        dest = os.path.join(OUTPUT_DIR, f"{letter.lower()}{ext}")

        shutil.copy2(src, dest)
        print(f"  OK    {letter} -> signs/{letter.lower()}{ext}")
        copied += 1

    print(f"\nDone — {copied} letters copied, {skipped} skipped.")
    print(f"Output: {os.path.abspath(OUTPUT_DIR)}")

if __name__ == "__main__":
    main()
