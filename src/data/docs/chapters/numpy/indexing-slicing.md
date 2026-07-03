# Indexing আর Slicing

Array থেকে specific element বা অংশ বের করাকে indexing আর slicing বলে। এটা Python list এর মতোই, কিন্তু multi-dimensional হওয়ায় কিছু বেশি feature আছে।

## 1D Indexing

1D array indexing Python list এর exactly same:

```python
import numpy as np

a = np.array([10, 20, 30, 40, 50])

print(a[0])    # 10 — প্রথম element
print(a[2])    # 30
print(a[-1])   # 50 — শেষ element
```

## 2D Indexing

2D (matrix) array তে row আর column দুটাই index লাগে:

```python
b = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

print(b[0, 0])   # 1 — প্রথম row, প্রথম col
print(b[1, 2])   # 6 — ২য় row, ৩য় col
print(b[2])      # [7 8 9] — পুরো ৩য় row
```

> [!note]
> `b[row, column]` — এই format। `b[1, 2]` মানে row index 1, column index 2। মনে রাখবে index 0 থেকে শুরু।

## Slicing — অংশ কেটে নেওয়া

`[start:stop:step]` syntax দিয়ে array এর একটা অংশ নেওয়া যায়:

### 1D Slicing

```python
a = np.array([10, 20, 30, 40, 50, 60])

print(a[1:4])     # [20 30 40] — index 1, 2, 3
print(a[:3])      # [10 20 30] — শুরু থেকে index 2
print(a[3:])      # [40 50 60] — index 3 থেকে শেষ
print(a[::2])     # [10 30 50] — প্রতি ২য় element
print(a[::-1])    # [60 50 40 30 20 10] — reverse
```

### 2D Slicing

2D তে `[row_slice, col_slice]` format:

```python
b = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12]])

# প্রথম ২ row, সব column
print(b[0:2, :])
# [[1 2 3 4]
#  [5 6 7 8]]

# সব row, প্রথম ২ column
print(b[:, 0:2])
# [[ 1  2]
#  [ 5  6]
#  [ 9 10]]

# নির্দিষ্ট অংশ — row 1-2, col 1-3
print(b[1:3, 1:4])
# [[ 6  7  8]
#  [10 11 12]]
```

> [!tip]
> `b[1:3, :]` এর মানে হলো — row 1 থেকে 2 (3 exclude), সব column। মাথায় রাখবে slicing এ stop index include হয় না।

## Boolean Indexing — Condition দিয়ে Filter

এটা NumPy এর সবচেয়ে useful feature গুলোর একটা। condition দিয়ে element filter করা যায়:

```python
a = np.array([3, 7, 1, 9, 4, 6, 8, 2])

# 5 এর বড় গুলো
mask = a > 5
print(mask)          # [False  True False  True False False  True False]
print(a[mask])       # [7 9 8]

# এক লাইনে
print(a[a > 5])      # [7 9 8]

# জোড় সংখ্যা
print(a[a % 2 == 0])  # [4 6 8 2]
```

> [!example]
> `a > 5` দিলে NumPy একটা boolean array দেয় (True/False)। সেটা দিয়ে index করলে শুধু True গুলোর value পাওয়া যায়। একে **boolean mask** বলে।

### Multiple Condition

```python
a = np.array([3, 7, 1, 9, 4, 6, 8, 2])

# 5 এর বড় আর জোড়
print(a[(a > 5) & (a % 2 == 0)])    # [6 8]

# 2 এর ছোট অথবা 8 এর বড়
print(a[(a < 2) | (a > 8)])         # [1 9]
```

> [!warn]
> Boolean condition এ `and`/`or` ব্যবহার করবে না। NumPy তে `&` আর `|` দিতে হবে। আর প্রতিটা condition কে `( )` তে wrap করতে হবে — নাহলে error আসবে।

## Fancy Indexing — Integer Array দিয়ে

Integer array দিয়ে নির্দিষ্ট index গুলো বের করা যায়:

```python
a = np.array([10, 20, 30, 40, 50])

# নির্দিষ্ট index গুলো
indices = [0, 2, 4]
print(a[indices])    # [10 30 50]

# 2D তে
b = np.array([[1, 2], [3, 4], [5, 6]])
rows = [0, 2]
print(b[rows])
# [[1 2]
#  [5 6]]
```

### সব row থেকে নির্দিষ্ট column

```python
b = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

# row 0 এর col 2, row 1 এর col 1, row 2 এর col 0
print(b[[0, 1, 2], [2, 1, 0]])   # [3 5 7]
```

> [!note]
> Fancy indexing এ result সবসময় 1D array হয়। কারণ এটা pair করে (row, col) element বের করে।

## where — Condition Based Value

`np.where()` দিয়ে condition অনুযায়ী value বসানো যায়:

```python
a = np.array([1, -2, 3, -4, 5])

# negative গুলো 0 করে দাও
result = np.where(a < 0, 0, a)
print(result)   # [1 0 3 0 5]
```

## Slicing আর Copy

```python
a = np.array([1, 2, 3, 4, 5])

# slicing করলে view পাওয়া যায়, copy না
b = a[1:4]
b[0] = 99
print(a)   # [ 1 99  3  4  5] — original ও change হয়ে গেছে!
```

> [!danger]
> NumPy slicing এ **view** return করে, copy না। মানে slice change করলে original array ও change হয়ে যায়! যদি independent copy দরকার হয়, `.copy()` ব্যবহার করো: `b = a[1:4].copy()`

## Summary

| Technique | Syntax | Use Case |
|-----------|--------|----------|
| Basic indexing | `a[0]`, `b[1, 2]` | single element |
| Slicing | `a[1:4]`, `b[:, 0:2]` | অংশ নেওয়া |
| Boolean | `a[a > 5]` | condition দিয়ে filter |
| Fancy | `a[[0, 2, 4]]` | নির্দিষ্ট index |
| where | `np.where(cond, x, y)` | condition based replace |

এসব technique দিয়ে যেকোনো array থেকে ডেটা extract করা যায়। পরের chapter এ broadcasting আর vectorization শিখবো।