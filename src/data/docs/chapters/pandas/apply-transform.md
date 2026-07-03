## Apply কী আর কেন দরকার?

Pandas এ সব কাজ built-in method দিয়ে হয়ে যায়। কিন্তু মাঝে মাঝে এমন জটিল logic দরকার হয় যেটা এক লাইনে করা যায় না। তখন `apply()` ব্যবহার করো — এটা যেকোনো function কে DataFrame বা Series এর উপর চালায়।

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "name": ["Karim", "Sadia", "Rahim", "Tania"],
    "math": [85, 92, 65, 78],
    "english": [75, 88, 70, 95],
    "science": [90, 85, 60, 80]
})
```

## df.apply — Row বা Column এর উপর Function

`df.apply(func, axis=)` দিয়ে প্রতিটা row বা column এর উপর একটা function চালানো যায়।

```python
# axis=0 → প্রতিটা column এর উপর (default)
print(df[["math", "english", "science"]].apply(np.mean))
# math       80.0
# english    82.0
# science    78.75

# axis=1 → প্রতিটা row এর উপর
# প্রতিটা student এর average
df["average"] = df[["math", "english", "science"]].apply(np.mean, axis=1)
print(df)
```

```text
     name  math  english  science  average
0   Karim    85       75       90    83.33
1   Sadia    92       88       85    88.33
2   Rahim    65       70       60    65.00
3   Tania    78       95       80    84.33
```

### Lambda দিয়ে Custom Logic

```python
# প্রতিটা row তে custom logic
df["grade"] = df[["math", "english", "science"]].apply(
    lambda row: "A" if row.mean() >= 85 else ("B" if row.mean() >= 70 else "C"),
    axis=1
)
print(df[["name", "average", "grade"]])
```

```text
     name  average grade
0   Karim    83.33     B
1   Sadia    88.33     A
2   Rahim    65.00     C
3   Tania    84.33     B
```

> [!tip]
> `axis=1` দিলে প্রতিটা row একটা Series হিসেবে function এ যায়। তখম `row["math"]`, `row["english"]` দিয়ে individual column access করা যায়। এটা সবচেয়ে common pattern।

## Series.map — Value Substitution

`Series.map()` দিয়ে একটা column এর value গুলো map করা যায় — dictionary বা function দিয়ে:

```python
# Dictionary দিয়ে value replace
grade_map = {"A": "Excellent", "B": "Good", "C": "Average"}
df["grade_label"] = df["grade"].map(grade_map)
print(df[["name", "grade", "grade_label"]])
```

```text
     name grade grade_label
0   Karim     B        Good
1   Sadia     A   Excellent
2   Rahim     C     Average
3   Tania     B        Good
```

```python
# Function দিয়েও map করা যায়
df["math_bonus"] = df["math"].map(lambda x: x + 5 if x < 70 else x)
```

> [!note]
> `map()` শুধু Series এ কাজ করে (single column)। এটা মূলত value substitution বা transformation এর জন্য। Dictionary দিয়ে সবচেয়ে বেশি use হয় — categorical encoding, label mapping ইত্যাদি।

## Series.apply — Element-wise Function

```python
# Series তে apply — প্রতিটা element এ function
df["math_curve"] = df["math"].apply(lambda x: x ** 0.5 * 10)
print(df[["name", "math", "math_curve"]].head())
```

> [!warn]
> Pandas 2.0+ এ `.applymap()` deprecated হয়ে গেছে। DataFrame এর সব cell এ function apply করতে এখন `.map()` ব্যবহার করো।
>
> ```python
> # ❌ পুরোনো — deprecated
> df_nums.applymap(lambda x: x * 2)
>
> # ✅ নতুন — Pandas 2.x
> df_nums.map(lambda x: x * 2)
> ```

## df.transform — Same Shape Output

`transform` আর `apply` এর মধ্যে পার্থক্য হলো — `transform` সবসময় input এর সমান shape output দেয়। Groupby এর সাথে দারুণ কাজ করে।

```python
# প্রতিটা column standardize
normalized = df[["math", "english", "science"]].transform(
    lambda x: (x - x.mean()) / x.std()
)
print(normalized)
```

```text
       math   english   science
0  0.269426 -0.479634  0.929024
1  0.808279  0.418934  0.458382
2 -1.077704 -0.859714 -1.403914
3  0.000000  0.920414  0.016508
```

```python
# groupby + transform — প্রতিটা group এর মধ্যে normalize
df2 = pd.DataFrame({
    "city": ["Dhaka", "Dhaka", "Sylhet", "Sylhet", "Rajshahi"],
    "sales": [100, 150, 80, 90, 200]
})

# প্রতিটা city এর average sales বের করে সেই column যোগ
df2["city_avg"] = df2.groupby("city")["sales"].transform("mean")
print(df2)
```

```text
       city  sales  city_avg
0     Dhaka    100     125.0
1     Dhaka    150     125.0
2    Sylhet     80      85.0
3    Sylhet     90      85.0
4  Rajshahi    200     200.0
```

> [!example]
> `groupby + transform` হলো একটা killer combo! Groupby করে aggregate করলে result ছোট হয়ে যায় (group সংখ্যা পর্যন্ত)। কিন্তু `transform` দিলে মূল DataFrame এর সমান row থাকে — শুধু value গুলো group-wise aggregate হয়। এটা feature engineering এ বারবার লাগে।

## Performance — Vectorized সবসময় আগে!

`apply` সুবিধাজনক কিন্তু slow — কারণ এটা Python loop এর মতো কাজ করে। Vectorized operation সবসময় fast।

```python
import pandas as pd
import numpy as np
import time

df = pd.DataFrame({"a": np.random.rand(1_000_000), "b": np.random.rand(1_000_000)})

# ❌ Slow — apply দিয়ে
start = time.perf_counter()
df["c_slow"] = df.apply(lambda row: row["a"] + row["b"], axis=1)
t_apply = time.perf_counter() - start

# ✅ Fast — vectorized
start = time.perf_counter()
df["c_fast"] = df["a"] + df["b"]
t_vec = time.perf_counter() - start

print(f"Apply: {t_apply:.3f}s")
print(f"Vectorized: {t_vec:.3f}s")
print(f"Speedup: {t_apply/t_vec:.0f}x")
```

```text
Apply: 8.5s
Vectorized: 0.002s
Speedup: 4250x
```

> [!danger]
> `apply` দিয়ে কাজ করা যায় এমন সব কাজ সবসময় vectorized ভাবে করার চেষ্টা করো। `apply(axis=1)` সবচেয়ে slow — কারণ প্রতিটা row তে Python function call হয়। `np.where`, vectorized arithmetic, `.str` accessor — এগুলো ব্যবহার করো আগে। `apply` শুধু তখন, যখন vectorized উপায় নেই।

## Performance তুলনা সারণি

| উপায় | Speed | কখন ব্যবহার করবে |
|--------|-------|-------------------|
| Vectorized (`+`, `-`, `np.where`) | সবচেয়ে fast | সবসময় চেষ্টা করো |
| `.str` accessor | Fast | text operation |
| `.apply()` (axis=0) | Medium | column-wise function |
| `.apply()` (axis=1) | Slow | row-wise, শেষ উপায় |
| `.map()` | Fast (1 column) | value substitution |

## Practical — New Column Derive আর Normalize

```python
import pandas as pd
import numpy as np

rng = np.random.default_rng(42)
df = pd.DataFrame({
    "product": ["A", "B", "C", "D", "E"] * 20,
    "price": rng.uniform(100, 1000, 100).round(2),
    "quantity": rng.integers(1, 50, 100)
})

# 1. Vectorized — total revenue (fast!)
df["revenue"] = df["price"] * df["quantity"]

# 2. map — category encode
product_cat = {"A": "Electronics", "B": "Clothing", "C": "Food",
               "D": "Books", "E": "Toys"}
df["category"] = df["product"].map(product_cat)

# 3. transform — category-wise price normalization
df["price_norm"] = df.groupby("category")["price"].transform(
    lambda x: (x - x.mean()) / x.std()
)

# 4. apply — শুধু যেখানে vectorized উপায় নেই
df["tier"] = df.apply(
    lambda r: "Premium" if r["revenue"] > 20000 and r["quantity"] > 25 else "Standard",
    axis=1
)

print(df.head())
```

> [!tip]
> Real project এ এই pattern দেখো — vectorized দিয়ে শুরু, `map` দিয়ে encoding, `transform` দিয়ে group-wise feature, আর `apply` শুধু জটিল multi-column logic এ। এটাই efficient workflow।

## Summary

`df.apply()` row/column এর উপর custom function চালায়। `Series.map()` value substitution এর জন্য। `df.transform` same shape output দেয়, groupby এর সাথে killer combo। Pandas 2.x এ `.applymap` deprecated — `.map` ব্যবহার করো। সবসময় vectorized আগে, `apply` শেষ উপায়। পরের chapter এ time series শিখবো।