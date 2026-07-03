## Ufunc কী?

**ufunc** মানে হলো "universal function" — এমন একটা function যেটা array এর প্রতিটা element এ একসাথে (element-wise) কাজ করে। Loop লেখার দরকার নেই, এক লাইনে পুরো array তে operation apply হয়ে যায়। এটাই vectorization।

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])

# Python loop দিয়ে
result_loop = []
for x in a:
    result_loop.append(x * 2)
# [2, 4, 6, 8, 10]

# ufunc দিয়ে — এক লাইনে!
result_ufunc = a * 2
# [2  4  6  8 10]
```

> [!tip]
> আসলে `a * 2` লেখার পর NumPy ভেতরে `np.multiply(a, 2)` কল করে — এটাই একটা ufunc! Python এর সব arithmetic operator (`+`, `-`, `*`, `/`, `**`) NumPy তে ufunc হিসেবে কাজ করে।

## Arithmetic Ufunc গুলো

| Operator | Ufunc | উদাহরণ |
|----------|-------|--------|
| `+` | `np.add` | `np.add(a, b)` |
| `-` | `np.subtract` | `np.subtract(a, b)` |
| `*` | `np.multiply` | `np.multiply(a, b)` |
| `/` | `np.divide` | `np.divide(a, b)` |
| `**` | `np.power` | `np.power(a, 2)` |
| `//` | `np.floor_divide` | `np.floor_divide(a, b)` |
| `%` | `np.mod` | `np.mod(a, b)` |

```python
a = np.array([10, 20, 30])
b = np.array([3, 7, 4])

print(a + b)              # [13 27 34]
print(np.power(a, 2))     # [100 400 900]
print(np.mod(a, b))       # [1 6 2]
```

## Math Ufunc গুলো

```python
angles = np.array([0, np.pi/2, np.pi])

# Trigonometric
print(np.sin(angles))         # [0.  1.  0.]

# Exponential আর log
x = np.array([1, 2, 3])
print(np.exp(x))              # [ 2.718  7.389  20.086]
print(np.log(x))              # [0.     0.693  1.099]
print(np.sqrt(x))             # [1.     1.414  1.732]
```

> [!note]
> `np.log` হলো natural log (base $e$)। base 10 চাইলে `np.log10`, base 2 চাইলে `np.log2` ব্যবহার করো।

## np.where — Condition দিয়ে কাজ

`np.where(condition, x, y)` — condition সত্যি হলে `x`, মিথ্যা হলে `y`:

```python
a = np.array([15, 25, 35, 45, 55])

# 30 এর বেশি হলে "pass", নাহলে "fail"
result = np.where(a > 30, "pass", "fail")
print(result)   # ['fail' 'fail' 'pass' 'pass' 'pass']

# সংখ্যা দিয়েও কাজ করে
# negative value গুলো 0 করে দাও (ReLU activation!)
values = np.array([-3, -1, 0, 2, 5])
relu = np.where(values > 0, values, 0)
print(relu)     # [0 0 0 2 5]
```

> [!example]
> Neural network এর ReLU activation function হলো $\text{ReLU}(x) = \max(0, x)$। এটা `np.where(x > 0, x, 0)` অথবা `np.maximum(x, 0)` দিয়ে করা যায়।

## np.maximum vs np.max

এই দুটো confuse করে — খেয়াল রাখো:

```python
a = np.array([1, 5, 3])
b = np.array([4, 2, 6])

# np.maximum — element-wise comparison (দুটো array)
print(np.maximum(a, b))    # [4 5 6] — প্রতিটা position এ বড়টা

# np.max — পুরো array এর সবচেয়ে বড় value
print(np.max(a))           # 5
```

## Aggregation — Sum, Mean আর Axis

```python
a = np.array([[1, 2, 3],
              [4, 5, 6]])

print(a.sum())              # 21 — সব যোগ
print(a.mean())             # 3.5 — গড়
print(a.std())              # 1.708 — standard deviation

# axis দিয়ে direction নির্ধারণ
print(a.sum(axis=0))        # [5 7 9] — column wise (উপর থেকে নিচে)
print(a.sum(axis=1))        # [6 15]  — row wise (বাম থেকে ডান)
```

```text
axis=0 (column wise):  axis=1 (row wise):
[[1, 2, 3]              [[1+2+3] = [6]
  [4, 5, 6]]             [4+5+6]] = [15]
 ↓   ↓   ↓
[5   7   9]
```

> [!tip]
> মনে রাখার trick: `axis=0` মানে "row গুলোর উপর দিয়ে যাও" — তাই column গুলো একসাথে যোগ হয়। `axis=1` মানে "column গুলোর উপর দিয়ে যাও" — তাই row গুলো একসাথে যোগ হয়।

## out= Parameter — Memory Efficiency

`out=` দিয়ে result একটা existing array তে store করা যায় — নতুন memory allocate করতে হয় না:

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
result = np.zeros(3)

np.add(a, b, out=result)
print(result)   # [5. 7. 9.]
```

> [!note]
> বিশাল array তে বারবার কাজ করলে `out=` দিয়ে memory allocation বাঁচানো যায়। Real-time বা embedded system এ এটা খুব useful।

## np.vectorize — সাবধানে!

`np.vectorize` দেখে মনে হয় fast — কিন্তু আসলে এটা **আসলে কোনো speedup দেয় না**! এটা শুধু convenience — Python function কে উপরে থেকে array এ apply করার সুবিধা দেয়, ভেতরে এখনো Python loop চলে।

```python
# একটা জটিল function
def my_func(x):
    if x > 0:
        return x ** 2
    else:
        return x * -1

a = np.array([-2, -1, 0, 3, 5])

# ❌ এটা vectorized function নয়, একে একে element apply করে
vfunc = np.vectorize(my_func)
print(vfunc(a))   # [2 1 0 9 25]

# একই কাজ np.where দিয়ে (REAL vectorized — fast!)
result = np.where(a > 0, a**2, -a)
print(result)     # [2 1 0 9 25]
```

> [!warn]
> `np.vectorize` শুধু syntax সুন্দর করে, speed বাড়ায় না! Performance লাগলে `np.where` বা built-in ufunc ব্যবহার করো। সত্যিকারের vectorization C level এ হয়।

## Ufunc কেন এত Fast?

কারণ ufunc ভেতরে C তে লেখা। Python loop প্রতিটা element এর জন্য Python interpreter overhead পায়। কিন্তু ufunc একটা tight C loop চালায়, আর অনেক সময় SIMD ব্যবহার করে একসাথে একাধিক element process করে।

চলো speed তুলনা করি:

```python
import time

size = 1_000_000
a = np.arange(size)

# Python loop
start = time.perf_counter()
result_loop = [x ** 2 for x in a]
time_loop = time.perf_counter() - start

# NumPy ufunc
start = time.perf_counter()
result_ufunc = a ** 2
time_ufunc = time.perf_counter() - start

print(f"Python loop: {time_loop:.4f}s")
print(f"NumPy ufunc: {time_ufunc:.4f}s")
print(f"Speedup: {time_loop / time_ufunc:.0f}x")
```

```text
Python loop: 0.2350s
NumPy ufunc: 0.0012s
Speedup: 195x
```

> [!example]
> দেখলে তো? ১৯৫ গুণ fast! এটাই NumPy এর superpower। বিশাল array তে কাজ করলে এই difference আরও বেশি হয়। তাই সবসময় vectorized operation ব্যবহার করো, loop এড়িয়ে চলো।

## Summary

ufunc হলো element-wise vectorized function। Arithmetic আর math operation সব ufunc হিসেবে কাজ করে। `np.where` দিয়ে conditional logic vectorize করা যায়। `np.vectorize` fast নয় — সত্যিকারের ufunc ব্যবহার করো। ufunc এত fast কারণ ভেতরে C loop চলে। পরের chapter এ random number generation শিখবো।