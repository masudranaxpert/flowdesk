# Array তৈরি আর বেসিক অপারেশন

আগের chapter এ দেখলাম NumPy কী আর কেন দ্রুত। এবার চলো আসলে array তৈরি করা আর বেসিক operation গুলো শিখি।

## np.array() দিয়ে Array তৈরি

সবচেয়ে direct উপায় — `np.array()` দিয়ে Python list কে NumPy array তে convert করা:

```python
import numpy as np

# 1D array
a = np.array([1, 2, 3, 4, 5])
print(a)   # [1 2 3 4 5]

# 2D array (matrix)
b = np.array([[1, 2, 3],
              [4, 5, 6]])
print(b)
# [[1 2 3]
#  [4 5 6]]
```

## Array Attribute গুলো

প্রতিটা array এর কিছু important attribute থাকে:

```python
a = np.array([1, 2, 3, 4, 5])
b = np.array([[1, 2, 3], [4, 5, 6]])

print(a.ndim)     # 1 — কয় dimension
print(b.ndim)     # 2

print(a.shape)    # (5,) — প্রতি dimension এর size
print(b.shape)    # (2, 3) — 2 row, 3 column

print(a.dtype)    # int64 — element এর data type
print(a.size)     # 5 — total element সংখ্যা
print(b.size)     # 6
```

| Attribute | কী দেখায় | উদাহরণ |
|-----------|----------|--------|
| `.ndim` | dimension সংখ্যা | `1`, `2`, `3` |
| `.shape` | প্রতি dimension এর size | `(3,)`, `(2, 3)` |
| `.dtype` | element এর type | `int64`, `float64` |
| `.size` | total element | `6` |

> [!tip]
> dtype specify করে দেওয়া যায়। যেমন `np.array([1, 2, 3], dtype='float64')`। memory save করতে `int32` বা `float32` ও দেওয়া যায়।

## Special Array তৈরির Function

NumPy তে অনেক built-in function আছে specific pattern এর array বানানোর জন্য:

### zeros আর ones

```python
# সব 0
z = np.zeros(5)
print(z)   # [0. 0. 0. 0. 0.]

# সব 1
o = np.ones((2, 3))
print(o)
# [[1. 1. 1.]
#  [1. 1. 1.]]
```

### arange — Range এর মতো

```python
# 0 থেকে 9
a = np.arange(10)
print(a)   # [0 1 2 3 4 5 6 7 8 9]

# start, stop, step
b = np.arange(0, 10, 2)
print(b)   # [0 2 4 6 8]

# এমনকি float step ও!
c = np.arange(0, 1, 0.25)
print(c)   # [0.   0.25 0.5  0.75]
```

### linspace — Evenly Spaced

`linspace` দিয়ে নির্দিষ্ট সংখ্যক evenly spaced value বানানো যায়:

```python
# 0 থেকে 1, 5 টা evenly spaced value
x = np.linspace(0, 1, 5)
print(x)   # [0.   0.25 0.5  0.75 1.  ]
```

> [!note]
> `arange` আর `linspace` এর পার্থক্য: `arange(0, 1, 0.25)` দেয় step size, `linspace(0, 1, 5)` দেয় কয়টা point চাই। শেষ value `arange` এ exclude, `linspace` এ include।

## Random Array

```python
# 0 থেকে 1 এর মধ্যে random value
r = np.random.rand(3)
print(r)   # [0.548 0.715 0.602]

# নির্দিষ্ট range এ random integer
ri = np.random.randint(0, 100, size=5)
print(ri)  # [42 17 83 55 29]
```

## Element-wise Math

NumPy এর সবচেয়ে powerful জিনিস — **element-wise operation**। Loop ছাড়াই পুরো array এ math করা যায়:

```python
a = np.array([1, 2, 3, 4])
b = np.array([10, 20, 30, 40])

# যোগ
print(a + b)    # [11 22 33 44]

# গুণ
print(a * b)    # [10 40 90 160]

# scalar দিয়ে
print(a * 2)    # [2 4 6 8]
print(b - 5)    # [ 5 15 25 35]

# power
print(a ** 2)   # [ 1  4  9 16]
```

> [!example]
> এই সব operation এ কোনো loop নেই! NumPy internally C তে পুরো array একসাথে process করে। এটাকে **vectorization** বলে।

## Math Function

```python
a = np.array([1, 4, 9, 16])

print(np.sqrt(a))    # [1. 2. 3. 4.]
print(np.square(a))  # [  1  16  81 256]
print(np.log(a))     # natural log
print(np.abs(a))     # absolute value
```

## Aggregation — Summary Statistics

```python
a = np.array([3, 1, 4, 1, 5, 9, 2, 6])

print(np.sum(a))     # 31
print(np.mean(a))    # 3.875
print(np.max(a))     # 9
print(np.min(a))     # 1
print(np.std(a))     # standard deviation
```

> [!warn]
> Python built-in `sum()` আর `np.sum()` আলাদা। ছোট array তে পার্থক্য নেই, কিন্তু বড় array তে `np.sum()` অনেক দ্রুত। সবসময় `np.sum()` ব্যবহার করবে।

## 2D Array এ Math

```python
m = np.array([[1, 2, 3],
              [4, 5, 6]])

# সব row এর sum
print(m.sum(axis=1))   # [ 6 15]

# প্রতিটা column এর sum
print(m.sum(axis=0))   # [5 7 9]

# পুরো matrix এর mean
print(m.mean())        # 3.5
```

> [!tip]
> `axis=0` মানে column বরাবর (উপর থেকে নিচে), `axis=1` মানে row বরাবর (বাম থেকে ডানে)। এই axis concept পরে groupby আর aggregation এ বারবার আসবে।

## reshape — Shape বদলানো

```python
a = np.arange(12)
print(a.shape)   # (12,)

b = a.reshape(3, 4)
print(b)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]
```

## Summary

এই chapter এ দেখলাম array তৈরি (`np.array`, `zeros`, `ones`, `arange`, `linspace`), attribute (`ndim`, `shape`, `dtype`), element-wise math, আর aggregation। পরের chapter এ indexing আর slicing শিখবো।