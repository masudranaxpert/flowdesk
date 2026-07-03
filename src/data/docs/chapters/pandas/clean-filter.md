# Filter, Select আর Clean

রিয়েল ডেটা কখনো পরিষ্কার থাকে না — missing value, wrong format, extra row থাকে। এই chapter এ দেখবো কীভাবে ডেটা filter করতে হয়, clean করতে হয়, আর transform করতে হয়।

## loc আর iloc — Row/Column Select

Pandas এ row আর column select করার দুটো main way আছে — `loc` আর `iloc`।

### loc — Label Based

`loc` label (index/column name) দিয়ে select করে:

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Karim", "Rahim", "Sadia", "Tania"],
    "age": [22, 24, 21, 23],
    "cgpa": [3.75, 3.50, 3.90, 3.65]
}, index=["a", "b", "c", "d"])

# label দিয়ে row
print(df.loc["b"])
# name    Rahim
# age        24
# cgpa     3.50
# Name: b, dtype: object

# একাধিক row আর column
print(df.loc[["a", "c"], ["name", "cgpa"]])
#     name  cgpa
# a  Karim  3.75
# c  Sadia  3.90
```

### iloc — Position Based

`iloc` integer position (0, 1, 2...) দিয়ে select করে:

```python
# প্রথম row
print(df.iloc[0])

# row 0 থেকে 1, column 0 থেকে 1
print(df.iloc[0:2, 0:2])
#     name  age
# a  Karim   22
# b  Rahim   24

# শেষ row
print(df.iloc[-1])
```

> [!tip]
> `loc` → label/name দিয়ে, `iloc` → number/position দিয়ে। সহজে মনে রাখার উপায়: `loc` এ **l**abel, `iloc` এ **i**nteger।

### loc vs iloc

| Feature | `loc` | `iloc` |
|---------|-------|--------|
| Based on | Label | Integer position |
| Slicing | Inclusive | Exclusive (Python style) |
| Example | `df.loc[0:2]` → row 0, 1, 2 | `df.iloc[0:2]` → row 0, 1 |

## Row Filter করা

Condition দিয়ে row filter করা যায় — NumPy boolean indexing এর মতো:

```python
df = pd.DataFrame({
    "name": ["Karim", "Rahim", "Sadia", "Tania", "Jamal"],
    "age": [22, 24, 21, 23, 17],
    "cgpa": [3.75, 3.50, 3.90, 3.65, 3.20],
    "city": ["Dhaka", "Chittagong", "Dhaka", "Sylhet", "Dhaka"]
})

# age 18 এর বেশি
adults = df[df["age"] > 18]
print(adults)

# Dhaka এর student
dhaka = df[df["city"] == "Dhaka"]
```

### Multiple Condition

```python
# age > 18 আর cgpa > 3.5
result = df[(df["age"] > 18) & (df["cgpa"] > 3.5)]

# Dhaka অথবা Sylhet
result = df[df["city"].isin(["Dhaka", "Sylhet"])]

# নির্দিষ্ট column select
result = df.loc[df["age"] > 18, ["name", "cgpa"]]
```

> [!warn]
> Multiple condition এ `and`/`or` ব্যবহার করবে না! Pandas তে `&` আর `|` দিতে হবে। আর প্রতিটা condition `( )` তে wrap করতে হবে, নাহলে error আসবে।

## Missing Value (NaN) Handle

রিয়েল ডেটাতে missing value (`NaN`) থাকে। দুটো উপায়ে handle করা যায় — **drop** বা **fill**।

### dropna — Missing Row বাদ দেওয়া

```python
df = pd.DataFrame({
    "name": ["Karim", "Rahim", "Sadia", None],
    "age": [22, None, 21, 23],
    "cgpa": [3.75, 3.50, None, 3.65]
})

# যেকোনো missing value থাকলে row বাদ
clean = df.dropna()

# সব column missing হলেই বাদ
clean = df.dropna(how="all")

# নির্দিষ্ট column এ missing থাকলে বাদ
clean = df.dropna(subset=["name"])
```

### fillna — Missing Value Fill করা

```python
# missing গুলোতে 0 বসাও
filled = df.fillna(0)

# নির্দিষ্ট column এ mean দিয়ে fill
df["age"] = df["age"].fillna(df["age"].mean())
df["cgpa"] = df["cgpa"].fillna(df["cgpa"].mean())

# forward fill (আগের value দিয়ে)
df["name"] = df["name"].ffill()
```

> [!tip]
> Missing value বাদ দেওয়ার চেয়ে fill করা অনেক সময় ভালো। বিশেষ করে numeric column এ mean/median দিয়ে fill করলে ডেটা বেশি থাকে।

## Column Rename করা

```python
df = pd.DataFrame({"old_name": [1, 2], "age_yrs": [22, 24]})

# নির্দিষ্ট column rename
df = df.rename(columns={"old_name": "id", "age_yrs": "age"})

# সব column lowercase
df.columns = df.columns.str.lower()
```

## astype — Type Conversion

কখনো column এর type ভুল থাকে। `astype()` দিয়ে convert করা যায়:

```python
df = pd.DataFrame({
    "price": ["100", "200", "300"],
    "quantity": ["5", "10", "15"]
})

# string থেকে int
df["price"] = df["price"].astype(int)
df["quantity"] = df["quantity"].astype(int)

# সব একসাথে
df = df.astype({"price": "int64", "quantity": "float64"})
```

> [!danger]
> যদি column এ NaN থাকে, তাহলে `int` এ convert করা যাবে না — error আসবে। আগে NaN handle করে তারপর convert করতে হবে। অথবা `pd.to_numeric(df["price"], errors="coerce")` ব্যবহার করো।

## apply — Custom Function

`apply()` দিয়ে প্রতিটা value তে custom function চালানো যায়:

```python
df = pd.DataFrame({"celsius": [30, 35, 25, 40]})

# Celsius থেকে Fahrenheit
df["fahrenheit"] = df["celsius"].apply(lambda c: (c * 9/5) + 32)
print(df)
```

```
   celsius  fahrenheit
0       30        86.0
1       35        95.0
2       25        77.0
3       40       104.0
```

> [!example]
> `apply()` দিয়ে যেকোনো custom logic apply করা যায়। Categorize করা, text transform, complex calculation — সব। কিন্তু বড় dataset এ এটা ধীর হতে পারে, তখন vectorized operation চেষ্টা করবে।

## সব একসাথে — Clean Pipeline

```python
import pandas as pd

# ১. লোড
df = pd.read_csv("messy_data.csv")

# ২. column rename
df = df.rename(columns={"Name": "name", "Age(Years)": "age"})

# ৩. missing value fill
df["age"] = df["age"].fillna(df["age"].median())
df["email"] = df["email"].fillna("unknown")

# ৪. type convert
df["age"] = df["age"].astype(int)

# ৫. filter
clean = df[(df["age"] >= 18) & (df["age"] <= 65)]

print(f"Original: {len(df)} rows → Clean: {len(clean)} rows")
```

## Summary

এই chapter এ দেখলাম — `loc`/`iloc` দিয়ে select, condition দিয়ে filter, `dropna`/`fillna` দিয়ে missing value handle, `rename`/`astype` দিয়ে transform। এই clean pipeline টা প্রতিটা data project এ লাগবে। পরের chapter এ groupby আর merge শিখবো।