# Pandas কী ও Series/DataFrame

Pandas হলো Python এর সবচেয়ে জনপ্রিয় data analysis library। Excel এর মতো টেবিল নিয়ে কাজ করা যায় — কিন্তু অনেক বেশি powerful। CSV, Excel, JSON, database — যেকোনো জায়গা থেকে ডেটা নিয়ে analyze করা যায়।

## Pandas কী?

Pandas দিয়ে তুমি বিশাল ডেটা টেবিল load করতে পারো, clean করতে পারো, filter করতে পারো, summarize করতে পারো — সব কয়েক লাইন কোডে। এটা data science workflow এর কেন্দ্রে আছে।

```python
import pandas as pd

print(pd.__version__)
```

## Series vs DataFrame — দুটো মূল Structure

Pandas এ মূল structure দুটি — **Series** আর **DataFrame**।

### Series — 1D

Series হলো এক dimensional labeled array। একটা column এর মতো:

```python
import pandas as pd

s = pd.Series([10, 20, 30, 40, 50])
print(s)
```

```
0    10
1    20
2    30
3    40
4    50
dtype: int64
```

> [!note]
> বাম পাশের সংখ্যা গুলো (0, 1, 2...) হলো **index** — label। ডান পাশে আসল value। Series হলো NumPy array + custom index।

Custom index ও দেওয়া যায়:

```python
marks = pd.Series([85, 92, 78], index=["Karim", "Rahim", "Sadia"])
print(marks)
```

```
Karim    85
Rahim    92
Sadia    78
dtype: int64
```

```python
print(marks["Rahim"])   # 92
```

### DataFrame — 2D Table

DataFrame হলো 2 dimensional table — row আর column দুটাই আছে। একাধিক Series জুড়ে একটা DataFrame বানে। Excel sheet এর মতো:

```python
data = {
    "name": ["Karim", "Rahim", "Sadia", "Tania"],
    "age": [22, 24, 21, 23],
    "city": ["Dhaka", "Chittagong", "Sylhet", "Dhaka"],
    "cgpa": [3.75, 3.50, 3.90, 3.65]
}

df = pd.DataFrame(data)
print(df)
```

```
     name  age        city  cgpa
0   Karim   22      Dhaka  3.75
1   Rahim   24  Chittagong  3.50
2   Sadia   21      Sylhet  3.90
3  Tania   23      Dhaka  3.65
```

> [!tip]
> দেখো কত সুন্দর table বানিয়ে দিলো! Dictionary এর key গুলো column হয়ে গেছে, value গুলো row হয়েছে। এটাই Pandas এর জাদু।

## DataFrame তৈরির উপায়

### Dictionary থেকে

```python
df = pd.DataFrame({
    "product": ["Laptop", "Phone", "Tablet"],
    "price": [60000, 35000, 20000],
    "stock": [10, 25, 15]
})
```

### List of Dictionary থেকে

```python
records = [
    {"name": "Karim", "score": 85},
    {"name": "Rahim", "score": 92},
    {"name": "Sadia", "score": 78},
]
df = pd.DataFrame(records)
```

### List of List থেকে

```python
data = [
    ["Karim", 22, "Dhaka"],
    ["Rahim", 24, "Chittagong"],
]
df = pd.DataFrame(data, columns=["name", "age", "city"])
```

## DataFrame Attribute গুলো

```python
df = pd.DataFrame({
    "name": ["Karim", "Rahim", "Sadia"],
    "age": [22, 24, 21]
})

print(df.shape)      # (3, 2) — 3 row, 2 column
print(df.columns)    # Index(['name', 'age'])
print(df.index)      # RangeIndex(start=0, stop=3)
print(df.dtypes)     # প্রতিটা column এর type
```

| Attribute | কী দেখায় |
|-----------|---------|
| `.shape` | (row, column) সংখ্যা |
| `.columns` | column name গুলো |
| `.index` | row label গুলো |
| `.dtypes` | প্রতিটা column এর data type |
| `.values` | NumPy array হিসেবে ডেটা |

## Pandas ইনস্টল করা

```bash
pip install pandas
```

Anaconda থাকলে আগে থেকেই installed।

```python
import pandas as pd
print(pd.__version__)   # 2.2.3
```

> [!note]
> Pandas আর NumPy সবসময় একসাথে ব্যবহার হয়। Pandas install করলে NumPy ও automatically install হয়ে যায় dependency হিসেবে।

## NumPy Array থেকে DataFrame

```python
import numpy as np

matrix = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])

df = pd.DataFrame(matrix, columns=["A", "B", "C"])
print(df)
```

```
   A  B  C
0  1  2  3
1  4  5  6
2  7  8  9
```

> [!example]
> NumPy array থেকে DataFrame বানানো খুব সহজ। শুধু `columns=` দিয়ে column name দিয়ে দাও। এটা ML preprocessing এ বারবার লাগে।

## Series vs DataFrame — এক নজরে

| Feature | Series | DataFrame |
|---------|--------|-----------|
| Dimension | 1D | 2D |
| Analogy | একটা column | পুরো table |
| Creation | `pd.Series([...])` | `pd.DataFrame({...})` |
| Use | single feature | multiple feature |

## Summary

Pandas এর কোর হলো Series (1D) আর DataFrame (2D table)। Dictionary, list, NumPy array — যেকোনো জায়গা থেকে DataFrame বানানো যায়। পরের chapter এ ডেটা লোড আর inspect করা শিখবো।