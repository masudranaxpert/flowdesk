## Modern Generator API

NumPy 2.x তে random number তৈরি করার modern উপায় হলো **Generator API**। আগের পুরোনো `np.random.rand()` style এখনো কাজ করে, কিন্তু নতুন `default_rng` ব্যবহার করাই best practice — এটা faster, ভালো quality random number দেয়, আর reproducibility নিয়ন্ত্রণ করা সহজ।

```python
import numpy as np

# Modern way — Generator তৈরি
rng = np.random.default_rng()

# এখন এই rng থেকে সব random number generate করবো
print(rng.random())            # একটা float (0.0 to 1.0)
print(rng.random(5))           # ৫টা float এর array
```

> [!note]
> `np.random.default_rng()` হলো entry point। এটা একটা `Generator` object ফেরত দেয়। এই object থেকে সব distribution এর method call করা যায়। Old `np.random.rand()` style হলো global state — modern API তে প্রতিটা generator আলাদা।

## Random Integers

```python
rng = np.random.default_rng()

# 0 থেকে 9 (10 exclusive)
print(rng.integers(0, 10, size=5))
# [3 7 1 9 4]

# 2D random integers
print(rng.integers(1, 100, size=(3, 3)))
# [[45 12 89]
#  [ 3 67 23]
#  [91 56 78]]

# endpoint=True দিলে upper bound inclusive হয়
print(rng.integers(1, 6, size=3, endpoint=True))   # ডাইস! [2 5 1]
```

## Common Distributions

### Normal Distribution (Gaussian)

সবচেয়ে common distribution — প্রকৃতিতে সবকিছু normal follow করে (উচ্চতা, পরীক্ষার নম্বর, ইত্যাদি):

```python
rng = np.random.default_rng()

# mean=0, std=1 (standard normal)
print(rng.normal(size=5))
# [-0.42  1.15  0.03 -0.87  0.55]

# custom mean আর std
# গড় উচ্চতা 170cm, std 8cm
heights = rng.normal(loc=170, scale=8, size=1000)
print(f"গড়: {heights.mean():.1f}cm")     # ~170.0
print(f"Std: {heights.std():.1f}cm")       # ~8.0
```

```python
import numpy as np

rng = np.random.default_rng(42)

# Binomial — coin flip
# 10টা coin flip, 0.5 probability, 1000 বার repeat
flips = rng.binomial(n=10, p=0.5, size=1000)
print(f"গড় heads: {flips.mean():.1f}")   # ~5.0

# Poisson — rare events (call center, earthquake)
# গড় 3 event per hour, 1000 hours simulate
events = rng.poisson(lam=3, size=1000)
print(f"গড় events: {events.mean():.1f}")  # ~3.0
```

| Distribution | Method | কখন দরকার |
|-------------|--------|-----------|
| Uniform | `rng.uniform(low, high, size)` | সব value সমান সম্ভাবনা |
| Normal | `rng.normal(loc, scale, size)` | প্রাকৃতিক ঘটনা (উচ্চতা, নম্বর) |
| Binomial | `rng.binomial(n, p, size)` | yes/no experiment (coin flip) |
| Poisson | `rng.poisson(lam, size)` | rare event count |
| Choice | `rng.choice(array, size)` | নির্দিষ্ট option থেকে pick |

## Uniform Distribution

```python
rng = np.random.default_rng()

# 0 থেকে 1 এর মধ্যে
print(rng.uniform(size=5))
# [0.72 0.15 0.91 0.38 0.54]

# custom range
print(rng.uniform(low=10, high=50, size=3))
# [32.4 18.7 45.1]
```

## rng.choice — নির্দিষ্ট ডেটা থেকে pick

```python
rng = np.random.default_rng()

names = ["Karim", "Rahim", "Sadia", "Tania", "Imran"]

# একজন random pick
print(rng.choice(names))               # "Sadia"

# ৩ জন random pick (repeat হতে পারে)
print(rng.choice(names, size=3))       # ['Karim' 'Sadia' 'Karim']

# repeat ছাড়া (replace=False)
print(rng.choice(names, size=3, replace=False))  # ['Tania' 'Imran' 'Karim']

# weighted choice — কারো সম্ভাবনা বেশি
print(rng.choice(names, size=5, p=[0.4, 0.2, 0.2, 0.1, 0.1]))
```

> [!tip]
> `replace=False` দিলে একই item দুইবার আসবে না — এটা random sampling এ খুব দরকারি। Train/test split করার সময় এটা লাগে।

## Shuffle আর Permutation

```python
rng = np.random.default_rng()

a = np.arange(10)
print(a)  # [0 1 2 3 4 5 6 7 8 9]

# shuffle — in-place (original array change হয়)
rng.shuffle(a)
print(a)  # [3 7 1 9 4 0 8 2 6 5]

# permutation — copy তে কাজ করে (original অপরিবর্তিত)
b = np.arange(5)
shuffled = rng.permutation(b)
print(b)         # [0 1 2 3 4] — পরিবর্তন নেই
print(shuffled)  # [2 4 0 3 1]
```

## Seeding — Reproducibility

ML experiment এ random result এলোমেলো হলে সমস্যা — একই কোড দুইবার চালালে আলাদা result আসবে। **Seed** দিলে একই random sequence বারবার পাওয়া যায়।

```python
# seed 42 দিয়ে Generator বানাও
rng1 = np.random.default_rng(42)
print(rng1.integers(0, 10, size=5))   # [0 7 6 4 4]

# একই seed আবার দিলে — একই result!
rng2 = np.random.default_rng(42)
print(rng2.integers(0, 10, size=5))   # [0 7 6 4 4]  ← হুবহু এক!
```

> [!danger]
> একই script এ seed একবার দাও, সব random call একই `rng` object থেকে করো। প্রতিটা function এ আলাদা seed দিলে আলাদা sequence পাবে — সেটা ভুল workflow।

## Practical — ML Experiment Seeding

মেশিন লার্নিং এ সব জায়গায় seed দিতে হয় — নাহলে result reproduce করা যায় না:

```python
import numpy as np

def set_all_seeds(seed=42):
    """সব জায়গায় seed সেট করো"""
    rng = np.random.default_rng(seed)
    return rng

# experiment setup
rng = set_all_seeds(seed=42)

# Fake dataset তৈরি
X = rng.normal(loc=0, scale=1, size=(100, 5))   # 100 sample, 5 feature
y = rng.integers(0, 2, size=100)                 # binary label

# Train/test split (manual)
indices = rng.permutation(100)
train_idx, test_idx = indices[:80], indices[80:]

X_train, X_test = X[train_idx], X[test_idx]
y_train, y_test = y[train_idx], y[test_idx]

print(f"Train: {X_train.shape}, Test: {X_test.shape}")
# Train: (80, 5), Test: (20, 5)
```

> [!example]
> যেকোনো ML project এ script এর শুরুতে seed set করো। তাহলে তুমি আর তোমার teammate একই result পাবে। Paper এ result reproduce করার সময় seed জানানো বাধ্যতামূলক।

## Old API না New API?

```python
# ❌ পুরোনো — global state, less flexible
np.random.seed(42)
np.random.rand(5)

# ✅ নতুন — local Generator, better quality, faster
rng = np.random.default_rng(42)
rng.random(5)
```

> [!warn]
> পুরোনো `np.random.seed()` + `np.random.rand()` style এখনো কাজ করে কিন্তু deprecated ধরা যায়। নতুন কোডে সবসময় `default_rng()` ব্যবহার করো। Old API তে global state থাকে — এক library random call করলে আরেকটার result পরিবর্তন হয়ে যায়!

## Summary

NumPy 2.x তে `np.random.default_rng()` ব্যবহার করো random number এর জন্য। Seed দিলে result reproducible হয়। `rng.normal`, `rng.uniform`, `rng.choice` — এগুলো সব common distribution। ML experiment এ সবসময় seed সেট করো। পরের chapter এ array save/load শিখবো।