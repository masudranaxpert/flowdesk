## কেন Save/Load দরকার?

কাজ শেষে array গুলো disk এ save করে রাখা লাগে — পরে আবার load করে কাজ চালানো যায়। ML model এর weights, preprocessed dataset, intermediate result — সব save করে রাখা যায়। NumPy তে এর জন্য `.npy` আর `.npz` format আছে।

## np.save — Single Array

একটা array কে `.npy` file এ save করো:

```python
import numpy as np

weights = np.array([[0.1, 0.2, 0.3],
                     [0.4, 0.5, 0.6]])

# save
np.save("weights.npy", weights)

# load
loaded = np.load("weights.npy")
print(np.array_equal(weights, loaded))   # True — হুবহু এক!
```

> [!note]
> `.npy` binary format — text না। তাই খুব fast read/write হয় আর precision নষ্ট হয় না। dtype, shape সব automatically preserve হয়। `.txt` file এ integer বদলে লিখলে precision হারায়, কিন্তু `.npy` তে এমন সমস্যা নেই।

## np.savez — Multiple Arrays

একাধিক array কে একসাথে একটা `.npz` file এ save করো:

```python
W1 = np.random.randn(3, 4)
b1 = np.random.randn(3)
W2 = np.random.randn(1, 3)
b2 = np.random.randn(1)

# keyword argument দিয়ে name দাও
np.savez("model.npz", W1=W1, b1=b1, W2=W2, b2=b2)

# load — dict এর মতো access
data = np.load("model.npz")
print(data["W1"].shape)   # (3, 4)
print(data["b2"].shape)   # (1,)

data.close()  # file handle close করা ভালো
```

### Compressed save

ডেটা বড় হলে compressed format ব্যবহার করো:

```python
# compressed — file size অনেক ছোট
np.savez_compressed("model_compressed.npz", W1=W1, b1=b1, W2=W2, b2=b2)

# size তুলনা
import os
print(os.path.getsize("model.npz"))                    # ~800 bytes
print(os.path.getsize("model_compressed.npz"))         # ~500 bytes
```

> [!tip]
> Compressed format file size ছোট করে কিন্তু read/write একটু ধীর। Disk space টানাপড়ে থাকলে `savez_compressed`, speed দরকার হলে `savez` ব্যবহার করো। Sparse data (অনেক zero) তে compression অনেক বেশি কাজে দেয়।

## Text File Load

```python
# সাধারণ text file
np.savetxt("data.csv", arr, delimiter=",")
loaded = np.loadtxt("data.csv", delimiter=",")

# missing value থাকলে genfromtxt
loaded = np.genfromtxt("data.csv", delimiter=",", filling_values=0)
```

> [!warn]
> CSV এর জন্য `np.loadtxt` বা `np.genfromtxt` এর চেয়ে **Pandas** ব্যবহার করা অনেক ভালো। Pandas faster, column name handle করতে পারে, missing value ভালোভাবে manage করে। NumPy এর text loader শুধু সাধারণ numeric data এর জন্য।

```python
# ✅ CSV এর জন্য Pandas ব্যবহার করো
import pandas as pd
df = pd.read_csv("data.csv")  # column name, missing value, date — সব handle
```

## np.memmap — বিশাল File যেগুলো RAM এ ফিট হয় না

যখন file এত বড় যে RAM এ আসে না — তখন `np.memmap` দিয়ে file কে memory এ mapped করো। পুরো file load না করে শুধু দরকারি অংশ read হয়:

```python
# বিশাল file তৈরি (demo)
big_data = np.arange(100_000_000, dtype=np.float64)  # ~800 MB
np.save("big.npy", big_data)

# memmap দিয়ে open — RAM এ সব load হবে না!
mmap = np.load("big.npy", mmap_mode="r")

# শুধু দরকারি অংশ read করো
print(mmap[0:5])         # [0. 1. 2. 3. 4.]
print(mmap[-5:])         # [99999995. ... 99999999.]
```

> [!example]
> Satellite imagery, genomics data, বিশাল ML dataset — এসব 50GB+ হতে পারে। `memmap` দিয়ে পুরোটা RAM এ না এনে chunk করে process করা যায়। Operating system automatically cache manage করে।

### memmap Mode গুলো

| Mode | কী করে |
|------|--------|
| `'r'` | Read only |
| `'r+'` | Read + write (file পরিবর্তন হয়) |
| `'c'` | Copy-on-write (file পরিবর্তন হয় না, memory তে change) |

## কোন Format কখন ব্যবহার করবে?

| Format | কখন ব্যবহার করবে | সুবিধা |
|--------|------------------|--------|
| `.npy` | single array | সবচেয়ে সহজ, fast |
| `.npz` | multiple array | এক file এ সব |
| `.npz` (compressed) | বড় array, disk বাঁচাতে | ছোট file size |
| `.csv` / `.txt` | human readable দরকার | portable কিন্তু slow |
| `memmap` | RAM এ fit না হওয়া বিশাল file | partial loading |
| `.parquet` | tabular production data | columnar, fast, small |

> [!note]
> Production এ tabular ডেটার জন্য **Parquet** (Pandas দিয়ে) সবচেয়ে ভালো। NumPy array এর জন্য `.npy`/`.npz`। Image/audio এর জন্য নিজস্ব format (PNG, WAV ইত্যাদি)।

## Practical — Model Weights Save আর Load

একটা ছোট neural network এর weights save করে পরে load করে inference করার workflow:

```python
import numpy as np

rng = np.random.default_rng(42)

# Fake "training" — weights learn হওয়ার পর
W1 = rng.normal(0, 0.1, (128, 784))   # layer 1 weights
b1 = np.zeros(128)                     # layer 1 bias
W2 = rng.normal(0, 0.1, (10, 128))    # layer 2 weights
b2 = np.zeros(10)                      # layer 2 bias

# --- Save করো ---
np.savez("mnist_model.npz", W1=W1, b1=b1, W2=W2, b2=b2)
print("Model saved!")

# --- পরে Load করো ---
data = np.load("mnist_model.npz")
W1_loaded = data["W1"]
b1_loaded = data["b1"]
W2_loaded = data["W2"]
b2_loaded = data["b2"]

# verify — হুবহু এক?
print(np.allclose(W1, W1_loaded))   # True
data.close()
```

> [!tip]
> Real project এ PyTorch/TF নিজস্ব format ব্যবহার করে কিন্তু ভেতরে concept একই — weights গুলো save করে রাখা আর load করে inference। NumPy দিয়ে নিজে model বানালে `.npz` perfect format।

## Summary

`.npy` single array এর জন্য, `.npz` multiple array এর জন্য, `memmap` বিশাল file এর জন্য। CSV এর জন্য Pandas ব্যবহার করো। Model weights save করে পরে load করে কাজ চালানো যায়। পরের chapter এ structured আর masked array শিখবো।