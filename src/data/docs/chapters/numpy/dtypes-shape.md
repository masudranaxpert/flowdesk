## Dtype কী আর কেন দরকার?

NumPy array তৈরি করার সময় প্রতিটা element এর একটা fixed type থাকে — এটাই **dtype** (data type)। Python list এ mixed type রাখা যায়, কিন্তু NumPy array তে সব element একই type এর হয়। এটাই NumPy কে এত fast আর memory-efficient বানায়।

```python
import numpy as np

a = np.array([1, 2, 3])
print(a.dtype)   # int64

b = np.array([1.5, 2.5, 3.5])
print(b.dtype)   # float64

c = np.array(["hello", "world"])
print(c.dtype)   # <U5  (unicode string, max 5 chars)
```

> [!note]
> dtype জানা খুব জরুরি — কারণ ভুল dtype এ ডেটা overflow করতে পারে বা precision হারাতে পারে। যেমন `int8` এ সর্বোচ্চ 127 রাখা যায় — এর বেশি হলে overflow হয়ে negative হয়ে যাবে!

## সব Dtype এক নজরে

| Category | Dtype গুলো | উদাহরণ |
|----------|-----------|---------|
| Integer | `int8`, `int16`, `int32`, `int64` | `np.array([1], dtype=np.int8)` |
| Unsigned int | `uint8`, `uint16`, `uint32`, `uint64` | image pixel (0-255) |
| Float | `float16`, `float32`, `float64` | `np.array([3.14], dtype=np.float32)` |
| Complex | `complex64`, `complex128` | `np.array([1+2j])` |
| Boolean | `bool` | `np.array([True, False])` |
| String | `str`, `U10` (unicode) | `np.array(["abc"])` |
| Object | `object` | mixed Python objects |
| Datetime | `datetime64` | `np.datetime64('2026-01-15')` |

```python
import numpy as np

# int8 range: -128 to 127
small = np.array([100, 120, 200], dtype=np.int8)
print(small)   # [100  120 -56]  ← 200 overflow করে -56 হয়ে গেছে!

# uint8: 0 to 255 — image pixel এর জন্য perfect
pixels = np.array([0, 128, 255], dtype=np.uint8)

# datetime64 — date আর time একসাথে
dates = np.array(['2026-01-01', '2026-06-15', '2026-12-31'], dtype='datetime64')
print(dates)
```

> [!danger]
> `int8` ব্যবহার করে যদি 127 এর বেশি value রাখো — silent overflow হবে, কোনো error আসবে না! Production এ এই ভুল থেকে অনেক কষ্ট হয়। সবসময় range মাথায় রাখো।

## Array এর Property চেক করা

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

print(a.dtype)   # int64
print(a.shape)   # (2, 3) — 2 row, 3 column
print(a.ndim)    # 2 — কয়টা dimension
print(a.size)    # 6 — মোট element সংখ্যা
print(a.nbytes)  # 48 — মোট byte (6 × 8)
```

| Property | কী দেয় |
|----------|---------|
| `.dtype` | element এর type |
| `.shape` | প্রতিটা dimension এ কতটা element |
| `.ndim` | dimension সংখ্যা |
| `.size` | মোট element |
| `.nbytes` | মোট byte খরচ |

## Type Conversion — astype()

ডেটা type বদলাতে `.astype()` ব্যবহার করো:

```python
a = np.array([1.7, 2.3, 3.9])
print(a.dtype)   # float64

# float → int (decimal ফেলে দেবে, round করবে না)
b = a.astype(np.int32)
print(b)         # [1 2 3]

# int → float
c = b.astype(np.float64)
print(c)         # [1. 2. 3.]

# বড় array তে float32 ব্যবহার করে memory বাঁচানো
big = np.arange(1_000_000, dtype=np.float64)
print(big.nbytes)          # 8,000,000 bytes (8 MB)

big32 = big.astype(np.float32)
print(big32.nbytes)        # 4,000,000 bytes (4 MB) — অর্ধেক!
```

> [!tip]
> Deep learning এ সবসময় `float32` ব্যবহার হয় কারণ GPU তে দ্রুত গতি পাওয়া যায় এবং memory অর্ধেক লাগে। `float64` শুধু scientific computing এ দরকার হয় যেখানে precision খুব জরুরি।

## Reshape — Shape বদলানো

`.reshape()` দিয়ে array এর shape বদলানো যায় — ডেটা একই থাকে, শুধু arrangement বদলায়:

```python
a = np.arange(12)          # [0, 1, 2, ... 11]
print(a.shape)             # (12,)

# 1D → 2D
b = a.reshape(3, 4)
print(b)
```

```text
[[ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]]
```

### -1 এর জাদু

যে dimension এ `-1` দিলে NumPy নিজে থেকে calculate করে নেয়:

```python
a = np.arange(12)

# row সংখ্যা বলে দিলাম, column নিজে বের করবে
print(a.reshape(2, -1))     # shape: (2, 6)
print(a.reshape(-1, 3))     # shape: (4, 3)
print(a.reshape(-1))        # shape: (12,) — 1D তে flatten
```

> [!note]
> `-1` মানে হলো "তুমি নিজে figure out করো"। reshape এ একটা dimension এ শুধু একবার `-1` দেওয়া যায়। বাকি dimension থেকে NumPy বাকিটা calculate করে।

## Flatten vs Ravel — 2D থেকে 1D

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

# ravel — original array এর view ফেরত দেয় (memory efficient)
r = a.ravel()
print(r)   # [1 2 3 4 5 6]

# flatten — সবসময় copy করে
f = a.flatten()
print(f)   # [1 2 3 4 5 6]
```

```text
2D array:              Flatten/Ravel → 1D:
[[1, 2, 3],              [1, 2, 3, 4, 5, 6]
 [4, 5, 6]]
```

> [!tip]
> `.ravel()` যখনই পাররো use করো — এটা copy করে না, view দেয়, তাই memory বাঁচে। `.flatten()` সবসময় copy করে। শুধু `.flatten()` তখন দরকার যখন তুমি চাও original পরিবর্তন না হোক।

## Transpose আর Swapaxes

```python
a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.shape)        # (2, 3)

# transpose — row আর column উল্টে দেয়
t = a.T
print(t)
```

```text
[[1 4]
 [2 5]
 [3 6]]
```

```python
# 3D array তে swapaxes — নির্দিষ্ট axis বদলানো
c = np.zeros((2, 3, 4))
print(c.shape)                       # (2, 3, 4)
print(np.swapaxes(c, 0, 2).shape)    # (4, 3, 2)
```

## Squeeze আর Expand_dims

```python
# squeeze — 1 দীর্ঘ dimension সরিয়ে দেয়
a = np.array([[[1], [2], [3]]])
print(a.shape)            # (1, 3, 1)

s = np.squeeze(a)
print(s.shape)            # (3,)

# expand_dims — নতুন dimension যোগ করে
b = np.array([1, 2, 3])
print(b.shape)            # (3,)

e = np.expand_dims(b, axis=0)
print(e.shape)            # (1, 3) — row vector

e2 = np.expand_dims(b, axis=1)
print(e2.shape)           # (3, 1) — column vector
```

> [!example]
> Deep learning framework (PyTorch/TensorFlow) এ সবসময় দেখবে `(batch_size, height, width, channels)` shape লাগে। `expand_dims` দিয়ে missing dimension যোগ করতে হয়। যেমন single image `(224, 224, 3)` কে `(1, 224, 224, 3)` বানাতে `np.expand_dims(img, axis=0)` করো।

## NumPy 2.x — Removed Aliases

NumPy 2.0 এ কিছু old alias সরিয়ে দেওয়া হয়েছে:

```python
# ❌ NumPy 2.0 তে কাজ করবে না
# np.float_       → বদলে np.float64 ব্যবহার করো
# np.NaN          → বদলে np.nan ব্যবহার করো
# np.int0         → বদলে np.intp ব্যবহার করো
# np.unicode_     → বদলে np.str_ ব্যবহার করো

# ✅ সঠিক NumPy 2.x ভাবে
arr = np.array([1.0, 2.0, np.nan], dtype=np.float64)
```

> [!warn]
> যদি কোনো old tutorial বা library `np.float_` বা `np.NaN` ব্যবহার করে — সেটা NumPy 2.x তে `AttributeError` দেবে। `np.float64` আর `np.nan` ব্যবহার করো। NumPy 2.x তে copy semantics ও tightened হয়েছে — view বনাম copy আরো strict।

## Summary

dtype হলো array এর প্রতিটা element এর fixed type। `.reshape()`, `.ravel()`, `.T`, `.squeeze()`, `.expand_dims()` দিয়ে shape যেমন খুশি manipulate করা যায়। NumPy 2.x এ `np.float_` আর `np.NaN` রিমুভ করা হয়েছে — নতুন alias ব্যবহার করো। পরের chapter এ ufunc আর vectorization শিখবো।