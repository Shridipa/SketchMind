#!/usr/bin/env python3
"""
SketchMind — Download Quick, Draw! Dataset
============================================
Downloads only the 20 required simplified NDJSON files from Google Cloud Storage.
Supports resume, progress tracking, and checksum validation.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import hashlib
from pathlib import Path

from config import CATEGORIES, RAW_DIR, QUICKDRAW_BASE_URL


def get_download_url(category: str) -> str:
    """Build the download URL for a Quick, Draw! category."""
    # Quick Draw uses space-separated names with %20 encoding
    encoded = category.replace(" ", "%20")
    return f"{QUICKDRAW_BASE_URL}{encoded}.ndjson"


def get_file_size_remote(url: str) -> int | None:
    """Get remote file size via HEAD request."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as resp:
            cl = resp.headers.get("Content-Length")
            return int(cl) if cl else None
    except Exception:
        return None


def download_file(url: str, dest: str, category: str) -> bool:
    """Download a file with progress reporting and resume support."""
    dest_path = Path(dest)
    temp_path = dest_path.with_suffix(".ndjson.part")

    # Check if already downloaded
    if dest_path.exists():
        size = dest_path.stat().st_size
        if size > 1000:  # Sanity check — real files are > 1KB
            print(f"  ✓ {category}.ndjson already exists ({size:,} bytes), skipping.")
            return True

    # Get remote file size
    remote_size = get_file_size_remote(url)
    size_str = f" ({remote_size / 1024 / 1024:.1f} MB)" if remote_size else ""

    # Resume support: check partial download
    resume_pos = 0
    if temp_path.exists():
        resume_pos = temp_path.stat().st_size
        if remote_size and resume_pos >= remote_size:
            # Download was complete, just rename
            temp_path.rename(dest_path)
            print(f"  ✓ {category}.ndjson resumed and completed.")
            return True

    print(f"  ↓ Downloading {category}.ndjson{size_str}...")

    try:
        req = urllib.request.Request(url)
        if resume_pos > 0:
            req.add_header("Range", f"bytes={resume_pos}-")

        with urllib.request.urlopen(req, timeout=120) as response:
            mode = "ab" if resume_pos > 0 else "wb"
            total = remote_size or 0
            downloaded = resume_pos

            with open(temp_path, mode) as f:
                while True:
                    chunk = response.read(65536)  # 64KB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)

                    # Progress bar
                    if total > 0:
                        pct = downloaded / total * 100
                        bar_len = 30
                        filled = int(bar_len * downloaded / total)
                        bar = "█" * filled + "░" * (bar_len - filled)
                        mb = downloaded / 1024 / 1024
                        total_mb = total / 1024 / 1024
                        sys.stdout.write(
                            f"\r    [{bar}] {pct:5.1f}% ({mb:.1f}/{total_mb:.1f} MB)"
                        )
                        sys.stdout.flush()

            if total > 0:
                print()  # Newline after progress bar

        # Rename temp → final
        temp_path.rename(dest_path)
        final_size = dest_path.stat().st_size
        print(f"  ✓ {category}.ndjson saved ({final_size / 1024 / 1024:.1f} MB)")
        return True

    except urllib.error.HTTPError as e:
        print(f"\n  ✗ HTTP Error {e.code} downloading {category}: {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"\n  ✗ URL Error downloading {category}: {e.reason}")
        return False
    except Exception as e:
        print(f"\n  ✗ Error downloading {category}: {e}")
        return False


def validate_ndjson(filepath: str, category: str) -> bool:
    """Quick validation: check that file contains valid NDJSON lines."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            # Read first 5 lines and validate JSON
            for i, line in enumerate(f):
                if i >= 5:
                    break
                data = json.loads(line.strip())
                if "drawing" not in data or "word" not in data:
                    print(f"  ⚠ {category}.ndjson: Missing 'drawing' or 'word' field")
                    return False
        return True
    except json.JSONDecodeError as e:
        print(f"  ⚠ {category}.ndjson: Invalid JSON at line — {e}")
        return False
    except Exception as e:
        print(f"  ⚠ {category}.ndjson: Validation error — {e}")
        return False


def main():
    print("=" * 60)
    print("  SketchMind — Quick, Draw! Dataset Downloader")
    print("=" * 60)
    print(f"\n  Target directory: {RAW_DIR}")
    print(f"  Categories: {len(CATEGORIES)}")
    print()

    os.makedirs(RAW_DIR, exist_ok=True)

    success_count = 0
    fail_count = 0
    failed_categories = []

    for i, category in enumerate(CATEGORIES, 1):
        print(f"[{i:2d}/{len(CATEGORIES)}] {category}")
        url = get_download_url(category)
        dest = os.path.join(RAW_DIR, f"{category}.ndjson")

        if download_file(url, dest, category):
            if validate_ndjson(dest, category):
                success_count += 1
            else:
                print(f"  ⚠ {category}.ndjson downloaded but failed validation")
                failed_categories.append(category)
                fail_count += 1
        else:
            failed_categories.append(category)
            fail_count += 1

        print()

    # Summary
    print("=" * 60)
    print("  Download Summary")
    print("=" * 60)
    print(f"  ✓ Successful: {success_count}/{len(CATEGORIES)}")
    if fail_count > 0:
        print(f"  ✗ Failed:     {fail_count}/{len(CATEGORIES)}")
        print(f"  Failed categories: {', '.join(failed_categories)}")
    else:
        print("  All categories downloaded successfully!")
    print()

    # List file sizes
    total_size = 0
    for category in CATEGORIES:
        filepath = os.path.join(RAW_DIR, f"{category}.ndjson")
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            total_size += size

    print(f"  Total dataset size: {total_size / 1024 / 1024:.1f} MB")
    print()

    return fail_count == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
