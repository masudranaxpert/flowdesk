# Broadcasting আর Vectorization

এই দুটো concept হলো NumPy এর superpower। Broadcasting দিয়ে ভিন্ন shape এর array নিয়েও math করা যায়, আর vectorization দিয়ে loop ছাড়াই দ্রুত computation করা যায়।

## Vectorization — Loop ছাড়া Math

Python এ আমরা loop দিয়ে element-by-element calculation করি। NumPy তে এটা এক command এ হয় — সেটাই vectorization:

```python
import numpy as np

# ❌ Pythonic loop — ধীর
a = list(range(1000000))
result = []
for x in a:
    result.append(x ** 2 + 2 * x + 1)

# ✅ NumPy vectorization — দ্রুত
arr = np.arange(1000000)
result = arr ** 2 + 2 * arr + 1   # এক লাইন!
```

> [!tip]
> NumPy তে কখনো explicit for loop লিখবে না যদি vectorized উপায় থাকে। Vectorization অনেক দ্রুত কারণ সব কাজ C layer এ হয়ে যায়।

## Broadcasting কী?

Broadcasting মানে — ভিন্ন shape এর দুটো array কে automatically align করে math operation করা। ছোট array টা বড় array এর shape এ "broadcast" হয়।

```python
a = np.array([1, 2, 3, 4])   # shape (4,)
b = np.array([10])            # shape (1,) — scalar like

print(a + b)   # [11 12 13 14]
```

এখানে `b` কে `[10, 10, 10, 10]` এর মতো behave করানো হয়েছে — automatically। এটাই broadcasting।

## Broadcasting Rule গুলো

NumPy broadcasting এর rule হলো — shape গুলো **right থেকে** compare করা হয়। দুটো dimension compatible হবে যদি:

1. দুটো same হয়, **অথবা**
2. একটা 1 হয়

```python
# (3, 4) array
a = np.ones((3, 4))
# (4,) array
b = np.array([1, 2, 3, 4])

print(a + b)
# [[2. 3. 4. 5.]
#  [2. 3. 4. 5.]
#  [2. 3. 4. 5.]]
```

> [!note]
> `a` এর shape `(3, 4)`, `b` এর shape `(4,)`। Right থেকে compare করলে — 4 == 4 ✅। তাই `b` কে প্রতিটা row এ add করা হয়েছে।

### Broadcasting Example গুলো

| Array A | Array B | Result Shape | Compatible? |
|---------|---------|--------------|-------------|
| `(3, 4)` | `(4,)` | `(3, 4)` | ✅ |
| `(3, 4)` | `(3, 1)` | `(3, 4)` | ✅ |
| `(3, 4)` | `(3,)` | — | ❌ |
| `(2, 3, 4)` | `(3, 4)` | `(2, 3, 4)` | ✅ |

```python
# (3, 1) কে (1, 4) এর সাথে broadcast
a = np.array([[1], [2], [3]])   # shape (3, 1)
b = np.array([10, 20, 30, 40])   # shape (4,)

print(a + b)
# [[11 21 31 41]
#  [12 22 32 42]
#  [13 23 33 43]]
```

> [!warn]
> যদি shape compatible না হয়, `ValueError: operands could not be broadcast together` error আসবে। তখন reshape করে align করতে হবে।

## Practical Broadcasting উদাহরণ

### প্রতিটা row থেকে mean subtract

```python
# 4 জন student এর ৩ subject এ mark
data = np.array([[80, 70, 90],
                 [60, 85, 75],
                 [90, 95, 88],
                 [55, 60, 70]])

# প্রতিটা subject এর mean
col_mean = data.mean(axis=0)     # shape (3,)
print(col_mean)   # [71.25 77.5  80.75]

# প্রতিটা value থেকে তার subject mean subtract
centered = data - col_mean       # broadcasting!
print(centered)
# [[  8.75  -7.5    9.25]
#  [-11.25   7.5   -5.75]
#  [ 18.75  17.5    7.25]
#  [-16.25 -17.5  -10.75]]
```

> [!example]
> এখানে `data` shape `(4, 3)`, `col_mean` shape `(3,)`। Broadcasting এ প্রতিটা row থেকে mean subtract হয়েছে — এক command এ! এটাকে **data centering** বলে, ML preprocessing এ ব্যবহার হয়।

## Universal Functions (ufuncs)

NumPy এর math function গুলোকে **universal function** বা **ufunc** বলে — এগুলো element-wise কাজ করে আর vectorized:

```python
a = np.array([1, 4, 9, 16, 25])

print(np.sqrt(a))    # [1. 2. 3. 4. 5.]
print(np.exp(a))     # e^a
print(np.log(a))     # natural log
print(np.abs(a))     # absolute value
print(np.square(a))  # a^2
```

Trigonometric function:

```python
angles = np.array([0, np.pi/2, np.pi])
print(np.sin(angles))   # [0. 1. 0.]
print(np.cos(angles))   # [1. 0. -1.]
```

Comparison function:

```python
a = np.array([1, 2, 3, 4])
b = np.array([4, 3, 2, 1])

print(np.maximum(a, b))   # [4 3 3 4]
print(np.minimum(a, b))   # [1 2 2 1]
```

> [!tip]
> সব ufunc vectorized — মানে loop ছাড়াই পুরো array এ apply হয়। এগুলো নিজে না লিখে built-in ব্যবহার করলে অনেক দ্রুত চলবে।

## Speed Comparison — Loop vs Vectorization

```python
import time

# ১ কোটি random number
a = np.random.rand(10_000_000)

# Loop দিয়ে
start = time.time()
result_loop = np.zeros_like(a)
for i in range(len(a)):
    result_loop[i] = a[i] ** 2
loop_time = time.time() - start

# Vectorized
start = time.time()
result_vec = a ** 2
vec_time = time.time() - start

print(f"Loop: {loop_time:.3f}s")
print(f"Vectorized: {vec_time:.3f}s")
print(f"Speedup: {loop_time / vec_time:.0f}x")
```

```
Loop: 2.847s
Vectorized: 0.021s
Speedup: 136x
```

> [!danger]
> ১৩৬ গুণ দ্রুত! এটাই vectorization এর power। বড় dataset এ এই difference আরো বেশি। তাই যেখানে পারবে সেখানে loop এড়িয়ে vectorized operation ব্যবহার করবে।

## Summary

- **Vectorization** — loop ছাড়া পুরো array এ math, অনেক দ্রুত
- **Broadcasting** — ভিন্ন shape এর array কে automatically align করে operation
- **ufuncs** — `np.sqrt`, `np.exp`, `np.sin` ইত্যাদি element-wise function

এই তিনটা মিলেই NumPy এর কোর power। পরের chapter এ linear algebra আর real-world use case দেখবো।