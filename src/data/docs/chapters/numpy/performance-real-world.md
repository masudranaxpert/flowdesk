## NumPy কেন Fast?

NumPy fast কারণ এটা **contiguous memory** তে ডেটা store করে — সব element পাশাপাশি একটা block এ। Python list তে pointer দিয়ে প্রতিটা element separate object হিসেবে থাকে, cache miss হয়। NumPy তে CPU cache খুব efficient কাজ করে, আর C তে লেখা loop চলে — Python interpreter overhead নেই।

```python
import numpy as np
import time

size = 10_000_000

# Python list — slow
a_list = list(range(size))
b_list = list(range(size))
start = time.perf_counter()
c_list = [a + b for a, b in zip(a_list, b_list)]
t_list = time.perf_counter() - start

# NumPy — fast
a_np = np.arange(size)
b_np = np.arange(size)
start = time.perf_counter()
c_np = a_np + b_np
t_np = time.perf_counter() - start

print(f"Python list: {t_list:.3f}s")
print(f"NumPy:       {t_np:.3f}s")
print(f"Speedup:     {t_list/t_np:.0f}x")
```

```text
Python list: 1.850s
NumPy:       0.025s
Speedup:     74x
```

> [!note]
> এই speedup এর কারণ: (১) contiguous memory = CPU cache friendly, (২) C loop = no Python overhead, (৩) SIMD instruction = একসাথে একাধিক element process। এই তিনটা মিলে NumPy কে কয়েক শো গুণ fast করে।

## Loop এড়াও — Vectorize!

NumPy এর golden rule: **loop লিখো না**। যা কিছু vectorized way তে করা যায়, সেটা করো।

```python
a = np.random.rand(1_000_000)

# ❌ Slow — Python loop
result_slow = np.zeros(len(a))
for i in range(len(a)):
    if a[i] > 0.5:
        result_slow[i] = a[i] ** 2
    else:
        result_slow[i] = a[i] * -1

# ✅ Fast — vectorized
result_fast = np.where(a > 0.5, a ** 2, -a)

print(np.allclose(result_slow, result_fast))   # True — একই result
```

## In-place Operation

`+=`, `-=`, `*=` দিয়ে in-place operation — নতুন array create হয় না, memory বাঁচে:

```python
a = np.ones(1_000_000)

# ❌ নতুন array create
b = a + 1   # আরেকটা 1M array allocate হলো

# ✅ in-place — memory efficient
a += 1      # একই array তে update
```

> [!tip]
> বিশাল array নিয়ে কাজ করলে in-place operation (`+=`, `-=`, `*=`) memory allocation বাঁচায়। বিশেষ করে training loop এ এটা গুরুত্বপূর্ণ। তবে shared view থাকলে সাবধান — unexpected behavior হতে পারে।

## np.einsum — Multi-dim Contraction

`np.einsum` হলো একটা powerful tool — complex multi-dimensional operation এক লাইনে করা যায়। Einstein summation convention ব্যবহার করে।

```python
# Matrix multiplication: A @ B
A = np.random.rand(3, 4)
B = np.random.rand(4, 5)
C1 = A @ B                      # standard way
C2 = np.einsum('ij,jk->ik', A, B)  # einsum way
print(np.allclose(C1, C2))      # True

# Transpose: 'ij->ji'
print(np.allclose(A.T, np.einsum('ij->ji', A)))   # True

# Dot product: 'i,i->'
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(np.einsum('i,i->', a, b))   # 32 (= 1*4 + 2*5 + 3*6)

# Diagonal: 'ii->i'
M = np.array([[1, 2], [3, 4]])
print(np.einsum('ii->i', M))      # [1 4]
```

> [!example]
> Einstein notation এ `i,j` মানে index এর নাম। যে index দুই জায়গায় আছে সেটা sum হয়, যেটা output এ আছে সেটা থেকে যায়। `'ij,jk->ik'` মানে: $C_{ik} = \sum_j A_{ij} B_{jk}$ — এটাই matrix multiplication! Deep learning এ attention mechanism এ এসব দারুণ কাজে দেয়।

## Image কে Array হিসেবে দেখা

Image হলো আসলে একটা NumPy array! Shape সাধারণত `(height, width, channels)`।

```python
from PIL import Image
import numpy as np

# Image load → array
img = Image.open("photo.jpg")
arr = np.array(img)
print(arr.shape)      # (1080, 1920, 3) — height, width, RGB
print(arr.dtype)      # uint8 (0-255)

# Grayscale conversion (luminance formula)
gray = np.dot(arr[..., :3], [0.299, 0.587, 0.114])
print(gray.shape)     # (1080, 1920)

# Array → image save
Image.fromarray(gray.astype(np.uint8)).save("gray.jpg")
```

### Image Normalization

```python
# [0, 255] → [0, 1] range এ normalize (ML এর জন্য)
normalized = arr.astype(np.float64) / 255.0

# Standardization: mean=0, std=1
mean = arr.mean(axis=(0, 1))    # per-channel mean
std = arr.std(axis=(0, 1))
standardized = (arr.astype(np.float64) - mean) / (std + 1e-8)

# Random crop — augmentation
h, w = 224, 224
top = np.random.randint(0, arr.shape[0] - h)
left = np.random.randint(0, arr.shape[1] - w)
cropped = arr[top:top+h, left:left+w]
```

> [!tip]
> Deep learning model গুলো input হিসেবে normalized array চায় — `[0, 1]` বা `mean=0, std=1`। NumPy দিয়ে এই preprocessing এক লাইনে হয়। Image augmentation (crop, flip, rotate) সব NumPy operation দিয়ে করা যায়।

## Practical — Dataset Normalize

মেশিন লার্নিং এ feature scaling খুব দরকারি। দুটো common technique — MinMax আর Standard:

```python
rng = np.random.default_rng(42)

# Fake dataset: 1000 sample, 3 feature
X = rng.normal(loc=[10, 500, 0.5], scale=[2, 100, 0.1], size=(1000, 3))
print(f"Before: mean={X.mean(axis=0)}, std={X.std(axis=0)}")

# MinMax Scaling: [0, 1] range
X_min = X.min(axis=0)
X_max = X.max(axis=0)
X_minmax = (X - X_min) / (X_max - X_min)

# Standard Scaling: mean=0, std=1
X_mean = X.mean(axis=0)
X_std = X.std(axis=0)
X_standard = (X - X_mean) / X_std

print(f"Standardized: mean={X_standard.mean(axis=0).round(2)}")
# mean ≈ [0, 0, 0]
print(f"Standardized: std={X_standard.std(axis=0).round(2)}")
# std ≈ [1, 1, 1]
```

```python
# Euclidean distance — দুই point এর মধ্যে
def distance(p1, p2):
    diff = p1 - p2
    return np.sqrt(np.sum(diff ** 2))

a = np.array([0, 0, 0])
b = np.array([3, 4, 0])
print(distance(a, b))   # 5.0

# Vectorized — একসাথে অনেক point
points = rng.normal(0, 1, (100, 3))
distances = np.sqrt(np.sum((points - a) ** 2, axis=1))
print(distances[:5])
```

## Profiling — কোথায় Slow?

```python
import time

def time_it(func, *args):
    start = time.perf_counter()
    result = func(*args)
    elapsed = time.perf_counter() - start
    return result, elapsed

# Python এর built-in profiler
import cProfile
cProfile.run("np.linalg.eig(np.random.rand(500, 500))")
```

> [!warn]
> Premature optimization করবে না! প্রথমে সঠিক কোড লেখো, তারপর profiler দিয়ে দেখো কোথায় bottleneck। `cProfile` দিয়ে কোন function সবচেয়ে সময় নিচ্ছে সেটা বের করো, শুধু সেখানেই optimize করো।

## Memory Layout — Contiguous

```python
a = np.arange(12).reshape(3, 4)
print(a.flags['C_CONTIGUOUS'])   # True — C order (row-major)

# transpose করলে contiguous থাকে না — performance impact
b = a.T
print(b.flags['C_CONTIGUOUS'])   # False!

# .copy() দিলে contiguous হয়
c = b.copy()
print(c.flags['C_CONTIGUOUS'])   # True

# .ascontiguousarray() — explicit way
d = np.ascontiguousarray(b)
```

> [!note]
> যখন operation অনেক বার হবে (loop এ), তখন contiguous array দিয়ে কাজ করো। Non-contiguous array তে NumPy কে এক্সট্রা কাজ করতে হয়। `.ascontiguousarray()` দিয়ে ensure করা যায়।

## Summary

NumPy fast কারণ contiguous memory আর C loop। Loop এড়িয়ে vectorized operation করো। In-place op (`+=`) দিয়ে memory বাঁচাও। `np.einsum` দিয়ে complex multi-dim contraction করো। Image হলো NumPy array — `(H, W, C)` shape। Dataset normalize করা ML এর প্রথম ধাপ। এইভাবে NumPy real-world data science এর ভিত্তি।