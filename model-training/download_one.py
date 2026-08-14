import os
import time
import requests

URL = "https://storage.googleapis.com/quickdraw_dataset/full/numpy_bitmap/cat.npy"
OUTPUT = "data/quickdraw/raw/cat.npy"

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

# Delete known incomplete file
if os.path.exists(OUTPUT):
    print("Removing existing file...")
    os.remove(OUTPUT)

for attempt in range(1, 6):
    try:
        print(f"\nDownload attempt {attempt}/5")

        with requests.get(
            URL,
            stream=True,
            timeout=(30, 300)
        ) as response:

            response.raise_for_status()

            total = int(response.headers.get("content-length", 0))
            downloaded = 0

            with open(OUTPUT, "wb") as f:
                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)

                        if total:
                            percent = downloaded * 100 / total
                            print(
                                f"\rDownloaded: {percent:.1f}% "
                                f"({downloaded / 1024 / 1024:.1f} MB / "
                                f"{total / 1024 / 1024:.1f} MB)",
                                end=""
                            )

        print("\nDownload finished.")

        # Validate the file
        import numpy as np

        print("Validating NumPy file...")
        data = np.load(OUTPUT, mmap_mode="r")

        print("SUCCESS!")
        print("Shape:", data.shape)
        print("Dtype:", data.dtype)

        break

    except Exception as e:
        print(f"\nDownload/validation failed: {e}")

        if os.path.exists(OUTPUT):
            os.remove(OUTPUT)

        if attempt < 5:
            print("Retrying in 5 seconds...")
            time.sleep(5)
        else:
            print("All download attempts failed.")
            raise