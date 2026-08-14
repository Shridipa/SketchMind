import numpy as np
import matplotlib.pyplot as plt

category = "cat"

path = f"data/quickdraw/raw/{category}.npy"

data = np.load(path)

images = data.reshape(-1, 28, 28)

plt.figure(figsize=(10, 10))

for i in range(25):
    plt.subplot(5, 5, i + 1)
    plt.imshow(images[i], cmap="gray")
    plt.axis("off")

plt.suptitle(category)

plt.tight_layout()
plt.show()