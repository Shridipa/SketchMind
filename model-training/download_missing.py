import os
import time
import requests
import numpy as np

# ============================================================
# CONFIGURATION
# ============================================================

CATEGORIES = [
    "airplane",
    "apple",
    "bicycle",
    "book",
    "car",
    "cat",
    "circle",
    "clock",
    "cloud",
    "cup",
    "fish",
    "flower",
    "house",
    "moon",
    "cactus",
    "square",
    "star",
    "sun",
    "tree",
    "triangle",
]

BASE_URL = (
    "https://storage.googleapis.com/"
    "quickdraw_dataset/full/numpy_bitmap/"
)

OUTPUT_DIR = os.path.join(
    "data",
    "quickdraw",
    "raw"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# DOWNLOAD FUNCTION
# ============================================================

def download_category(category):

    filename = f"{category}.npy"
    output_path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    url = BASE_URL + filename

    # --------------------------------------------------------
    # If file already exists, validate it
    # --------------------------------------------------------

    if os.path.exists(output_path):

        print(f"\n[CHECK] {filename}")

        try:
            data = np.load(
                output_path,
                mmap_mode="r"
            )

            if (
                data.ndim == 2
                and data.shape[1] == 784
            ):
                print(
                    f"[VALID] {filename} "
                    f"{data.shape}"
                )
                return

            print(
                f"[INVALID] Wrong shape: "
                f"{data.shape}"
            )

        except Exception as e:

            print(
                f"[INVALID] {filename}: {e}"
            )

        print("Deleting corrupted file...")
        os.remove(output_path)

    # --------------------------------------------------------
    # Download with retries
    # --------------------------------------------------------

    for attempt in range(1, 6):

        try:

            print(
                f"\n[DOWNLOAD] {category} "
                f"(attempt {attempt}/5)"
            )

            with requests.get(
                url,
                stream=True,
                timeout=(30, 300)
            ) as response:

                response.raise_for_status()

                total = int(
                    response.headers.get(
                        "content-length",
                        0
                    )
                )

                downloaded = 0

                with open(
                    output_path,
                    "wb"
                ) as f:

                    for chunk in response.iter_content(
                        chunk_size=1024 * 1024
                    ):

                        if not chunk:
                            continue

                        f.write(chunk)

                        downloaded += len(chunk)

                        if total:

                            percentage = (
                                downloaded
                                * 100
                                / total
                            )

                            print(
                                f"\r"
                                f"{percentage:6.2f}% "
                                f"("
                                f"{downloaded / 1024 / 1024:.1f} MB / "
                                f"{total / 1024 / 1024:.1f} MB"
                                f")",
                                end=""
                            )

            print("\nDownload finished.")

            # ------------------------------------------------
            # Validate
            # ------------------------------------------------

            print("Validating...")

            data = np.load(
                output_path,
                mmap_mode="r"
            )

            if (
                data.ndim != 2
                or data.shape[1] != 784
            ):
                raise ValueError(
                    f"Invalid shape: {data.shape}"
                )

            print(
                f"[SUCCESS] {category}: "
                f"{data.shape}"
            )

            return

        except Exception as e:

            print(
                f"\n[ERROR] {category}: {e}"
            )

            if os.path.exists(output_path):
                os.remove(output_path)

            if attempt < 5:

                print(
                    "Retrying in 5 seconds..."
                )

                time.sleep(5)

            else:

                print(
                    f"\nFAILED: {category}"
                )

                raise


# ============================================================
# MAIN
# ============================================================

print("=" * 60)
print("QUICK DRAW DATASET DOWNLOADER")
print("=" * 60)

for category in CATEGORIES:
    download_category(category)


# ============================================================
# FINAL VERIFICATION
# ============================================================

print("\n" + "=" * 60)
print("FINAL DATASET VERIFICATION")
print("=" * 60)

all_valid = True

for category in CATEGORIES:

    filename = f"{category}.npy"

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    try:

        data = np.load(
            path,
            mmap_mode="r"
        )

        print(
            f"[OK] {filename:<25} "
            f"{data.shape}"
        )

    except Exception as e:

        print(
            f"[FAILED] {filename}: {e}"
        )

        all_valid = False


print("\n" + "=" * 60)

if all_valid:
    print("ALL 20 QUICK DRAW FILES ARE VALID!")
else:
    print("SOME FILES FAILED VALIDATION.")

print("=" * 60)
