# Linear Algebra আর রিয়েল ইউজ

Linear algebra হলো NumPy এর অন্যতম বড় use case। Machine learning এর পেছনের math, image processing, simulation — সবখানে matrix operation লাগে। চলো দেখি NumPy দিয়ে কীভাবে এসব করা যায়।

## Matrix Multiplication

দুটো array কে `*` দিলে element-wise গুণ হয়। কিন্তু আসল matrix multiplication এর জন্য `@` বা `np.dot()` লাগে:

```python
import numpy as np

a = np.array([[1, 2],
              [3, 4]])
b = np.array([[5, 6],
              [7, 8]])

# Element-wise (ভুল করবে না!)
print(a * b)
# [[ 5 12]
#  [21 32]]

# Matrix multiplication
print(a @ b)         # অথবা np.dot(a, b)
# [[19 22]
#  [43 50]]
```

> [!warn]
> `a * b` আর `a @ b` এক না! `*` হলো element-wise, `@` হলো matrix multiplication। ML এ ৯৯% ক্ষেত্রে `@` দরকার হয়। ভুল করলে silent bug হবে।

### np.dot vs np.matmul vs @

| Operator | কখন ব্যবহার | Note |
|----------|------------|------|
| `@` | 2D matrix multiply | সবচেয়ে readable |
| `np.matmul()` | 2D matrix multiply | `@` এর same |
| `np.dot()` | 1D বা 2D both | ছোট scalar ও কাজে লাগে |

```python
# 1D array এর dot product (inner product)
v1 = np.array([1, 2, 3])
v2 = np.array([4, 5, 6])
print(np.dot(v1, v2))   # 1*4 + 2*5 + 3*6 = 32
```

## Transpose (`.T`)

Matrix এর row আর column উল্টে দেওয়া কে transpose বলে:

```python
a = np.array([[1, 2, 3],
              [4, 5, 6]])

print(a.shape)    # (2, 3)

b = a.T
print(b)
# [[1 4]
#  [2 5]
#  [3 6]]
print(b.shape)    # (3, 2)
```

> [!tip]
> `.T` দিয়ে শুধু 2D না, যেকোনো dimension এর array transpose করা যায়। Neural network এ weight matrix transpose করা খুব common।

## reshape — Shape পরিবর্তন

```python
a = np.arange(12)
print(a.shape)   # (12,)

# 3x4 matrix
b = a.reshape(3, 4)
print(b)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

# 2x2x3 tensor
c = a.reshape(2, 2, 3)
```

`-1` দিলে NumPy automatically dimension infer করে:

```python
a = np.arange(12)

# 3 row, column automatic
b = a.reshape(3, -1)    # shape (3, 4)
c = a.reshape(-1, 2)    # shape (6, 2)
```

> [!note]
> `reshape(-1, 1)` দিলে 1D array কে column vector বানায়, `reshape(1, -1)` দিলে row vector। scikit-learn এ API গুলো এই format চায়।

## Aggregation আর axis

```python
a = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

# পুরো array এর sum
print(a.sum())         # 45

# প্রতিটা row এর sum (axis=1)
print(a.sum(axis=1))   # [ 6 15 24]

# প্রতিটা column এর sum (axis=0)
print(a.sum(axis=0))   # [12 15 18]

# অন্যান্য
print(a.mean(axis=0))  # column mean
print(a.max(axis=1))   # row max
print(a.std())         # overall standard deviation
```

> [!example]
> `axis=0` → column বরাবর (উপর-নিচ), `axis=1` → row বরাবর (বাম-ডান)। এই axis concept মুখস্থ করার বদলে ভাবলে বুঝবে।

## রিয়েল ইউজ ১: Dataset Normalization

ML এ feature scaling খুব common। Min-Max normalization করি:

$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

```python
# ৫ জন student এর ৩ বিষয়ে mark
data = np.array([
    [45, 67, 89],
    [23, 56, 78],
    [90, 88, 92],
    [55, 60, 70],
    [30, 45, 65]
])

col_min = data.min(axis=0)
col_max = data.max(axis=0)

normalized = (data - col_min) / (col_max - col_min)
print(normalized)
# [[0.34 0.55 0.86]
#  [0.   0.29 0.46]
#  [1.   1.   1.  ]
#  [0.51 0.40 0.17]
#  [0.11 0.   0.  ]]
```

> [!tip]
> প্রতিটা value এখন 0 থেকে 1 এর মধ্যে। এটাকে **Min-Max scaling** বলে। Neural network, KNN এর মতো algorithm গুলো scaling ছাড়া ভালো কাজ করে না।

## রিয়েল ইউজ ২: Simple Linear Regression

হাতে কিছু data point আছে — আমরা best-fit line বের করব।

সূত্র হলো:

$$w = \frac{n \sum xy - \sum x \sum y}{n \sum x^2 - (\sum x)^2}$$

$$b = \frac{\sum y - w \sum x}{n}$$

```python
# অধ্যয়ন ঘন্টা vs পরীক্ষার নম্বর
hours = np.array([1, 2, 3, 4, 5, 6, 7, 8])
marks = np.array([35, 45, 50, 55, 65, 70, 80, 85])

n = len(hours)
w = (n * np.sum(hours * marks) - np.sum(hours) * np.sum(marks)) / \
    (n * np.sum(hours ** 2) - np.sum(hours) ** 2)
b = (np.sum(marks) - w * np.sum(hours)) / n

print(f"Slope (w): {w:.2f}")
print(f"Intercept (b): {b:.2f}")
print(f"y = {w:.2f}x + {b:.2f}")
```

```
Slope (w): 7.14
Intercept (b): 27.14
y = 7.14x + 27.14
```

> [!example]
> মানে হলো — প্রতি ঘন্টা পড়লে নম্বর ৭.১৪ করে বাড়ে। আর ০ ঘন্টা পড়লেও ২৭.১৪ base mark আছে। এই line দিয়ে prediction করা যায়: `predicted = 7.14 * 10 + 27.14 = 98.54`।

### Prediction আর MSE

```python
# predict করা
predicted = w * hours + b

# error — Mean Squared Error
mse = np.mean((marks - predicted) ** 2)
print(f"MSE: {mse:.2f}")

# R² score
ss_res = np.sum((marks - predicted) ** 2)
ss_tot = np.sum((marks - np.mean(marks)) ** 2)
r2 = 1 - ss_res / ss_tot
print(f"R²: {r2:.4f}")
```

```
MSE: 5.89
R²: 0.9892
```

> [!note]
> R² = 0.99 মানে model ৯৯% variance explain করছে — খুব ভালো fit! এটাই data science এর সবচেয়ে basic algorithm — আর পুরোটাই NumPy দিয়ে হয়ে গেল।

## রিয়েল ইউজ ৩: Distance Matrix

দুই point এর মধ্যে Euclidean distance:

```python
point = np.array([1, 2, 3])
center = np.array([4, 5, 6])

distance = np.sqrt(np.sum((point - center) ** 2))
print(distance)   # 5.196
```

K-Means clustering, KNN — সবখানে এই distance calculation লাগে।

## Summary

NumPy দিয়ে matrix multiplication (`@`), transpose (`.T`), reshape, aggregation — সব linear algebra operation সহজে করা যায়। Normalization, regression, distance — এসবই ML আর data science এর ভিত্তি। পরের chapter এ Pandas শুরু করবো।