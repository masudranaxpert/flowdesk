## .str Accessor — Text Data Handle

Pandas এ যখন কোনো column এ text data থাকে, তখন `.str` accessor দিয়ে সব ধরনের string operation করা যায়। Python string method গুলোর vectorized version — এক লাইনে পুরো column এ apply হয়।

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["  Karim ", "SADIA", "  rahim  ", "Tania", "IMRAN"],
    "email": ["Karim@GMAIL.com", "sadia@yahoo.com", "rahim@test.org", "TANIA@Gmail.COM", "imran@test.org"],
    "phone": ["+8801712345678", "019-123-45678", "01712 345 678", "+8801823456789", "N/A"]
})
```

## Basic String Operation

```python
# Case conversion
df["name_clean"] = df["name"].str.strip()         # leading/trailing space সরাও
df["name_title"] = df["name_clean"].str.title()    # Title Case
df["name_upper"] = df["name_clean"].str.upper()
df["name_lower"] = df["name_clean"].str.lower()

# Length
df["name_len"] = df["name_clean"].str.len()

print(df[["name", "name_clean", "name_title"]])
```

```text
        name  name_clean  name_title
0    Karim        Karim       Karim
1      SADIA       SADIA       Sadia
2    rahim        rahim        Rahim
3      Tania       Tania       Tania
4     IMRAN       IMRAN       Imran
```

> [!tip]
> `.str.strip()` হলো data cleaning এর প্রথম ধাপ — messy text data তে leading/trailing space থাকে যেটা খালি চোখে দেখা যায় না। "Karim" আর "Karim " দুটো আলাদা value! সব text data clean করার সময় strip করো আগে।

## Email Clean — Real World

```python
# Email গুলো lowercase করো (email case-insensitive)
df["email_clean"] = df["email"].str.lower().str.strip()

# Domain extract করো
df["domain"] = df["email_clean"].str.extract(r"@(.+)$")
print(df[["email_clean", "domain"]])
```

```text
         email_clean       domain
0    karim@gmail.com     gmail.com
1   sadia@yahoo.com     yahoo.com
2    rahim@test.org      test.org
3   tania@gmail.com     gmail.com
4    imran@test.org      test.org
```

## .str.contains — Pattern Search

```python
# Gmail user কারা?
gmail_users = df[df["email_clean"].str.contains("gmail", case=False)]
print(gmail_users["name_title"])
```

```python
# Regex pattern
# যাদের phone তে 017 আছে
has_017 = df[df["phone"].str.contains(r"017", regex=True)]
```

## .str.replace — Find আর Replace

```python
# Simple replace
df["phone_clean"] = df["phone"].str.replace("N/A", "")

# Regex দিয়ে clean
df["phone_clean"] = df["phone_clean"].str.replace(r"[-+\s]", "", regex=True)
print(df[["phone", "phone_clean"]])
```

```text
           phone      phone_clean
0  +8801712345678   8801712345678
1   019-123-45678    01912345678
2  01712 345 678    01712345678
3  +8801823456789   8801823456789
4             N/A
```

> [!example]
> Phone number clean করা data cleaning এর classic problem। মানুষ নানা ভাবে লেখে — স্পেস, ড্যাশ, + সব মিশে থাকে। `str.replace` দিয়ে regex pattern match করে সব special character সরিয়ে clean number বানানো যায়।

## .str.split আর .str.extract

```python
# Split — value কে ভাগ করো
df["email_parts"] = df["email_clean"].str.split("@")
print(df["email_parts"][0])   # ['karim', 'gmail.com']

# Split আর expand — আলাদা column
df[["username", "domain2"]] = df["email_clean"].str.split("@", expand=True)
print(df[["username", "domain2"]].head())
```

```text
  username     domain2
0    karim   gmail.com
1    sadia  yahoo.com
2    rahim   test.org
3    tania   gmail.com
4    imran   test.org
```

```python
# extract — regex দিয়ে group capture
df["area_code"] = df["phone_clean"].str.extract(r"(\d{3})")
```

## আরও দরকারি .str Method

| Method | কাজ |
|--------|------|
| `.str.startswith("Mr")` | দিয়ে শুরু হয় কিনা |
| `.str.endswith(".com")` | দিয়ে শেষ হয় কিনা |
| `.str.cat(sep=", ")` | সব value জোড়া লাগাও |
| `.str.count("a")` | কতবার আছে |
| `.str.find("sub")` | position |
| `.str.zfill(5)` | বামে zero বসাও |

```python
# startswith / endswith
dot_com = df[df["email_clean"].str.endswith(".com")]

# cat — concatenate
all_emails = df["email_clean"].str.cat(sep=", ")
print(all_emails)
# karim@gmail.com, sadia@yahoo.com, rahim@test.org, ...
```

## Categorical Dtype — Memory Save

যখন একটা column এ অল্প কিছু unique value বারবার আসে (low cardinality) — যেমন gender, country, product type — তখন `category` dtype ব্যবহার করলে memory অনেক বাঁচে আর speed বাড়ে।

```python
df = pd.DataFrame({
    "city": ["Dhaka"] * 100000 + ["Chittagong"] * 50000 + ["Sylhet"] * 30000
})

# Default — object dtype
print(df["city"].dtype)       # object
print(df["city"].memory_usage(deep=True))   # ~11 MB

# Category তে convert
df["city"] = df["city"].astype("category")
print(df["city"].dtype)       # category
print(df["city"].memory_usage(deep=True))   # ~180 KB — 60x ছোট!
```

> [!danger]
> 180,000 row এর city column object হিসেবে 11 MB খাচ্ছিল, category তে মাত্র 180 KB! ৬০ গুণ ছোট! বড় dataset এ এটা বিশাপা difference। যেকোনো column যেখানে unique value কম (low cardinality), সেখানে category ব্যবহার করো।

## কখন Categorical Use করবে?

```python
# Rule of thumb: unique value < total row এর 50%
df = pd.DataFrame({
    "gender": np.random.choice(["M", "F"], 100000),
    "country": np.random.choice(["BD", "US", "UK", "IN", "CN"], 100000),
    "user_id": range(100000)  # সব unique — category করা মানেই নেই!
})

df["gender"] = df["gender"].astype("category")     # ✅ শুধু 2 unique
df["country"] = df["country"].astype("category")    # ✅ শুধু 5 unique
# df["user_id"] → category করবে না — সব unique, কোনো লাভ নেই
```

| উপায় | Memory | Speed | কখন |
|--------|--------|-------|------|
| `object` (string) | বেশি | ধীর | high cardinality |
| `category` | কম | fast | low cardinality (<50%) |
| `int/float` | সবচেয়ে কম | fast | numeric data |

## .cat Accessor

Categorical column এর উপর `.cat` accessor দিয়ে নিয়ন্ত্রণ করা যায়:

```python
df = pd.DataFrame({"grade": ["B", "A", "C", "A", "B", "C"]})
df["grade"] = df["grade"].astype("category")

# সব category দেখো
print(df["grade"].cat.categories)   # Index(['A', 'B', 'C'])

# Ordered category (sorting সঠিক হবে)
df["grade"] = pd.Categorical(df["grade"],
                              categories=["C", "B", "A"],
                              ordered=True)
print(df.sort_values("grade"))
```

```python
# Rename categories
df["grade"] = df["grade"].cat.rename_categories({"A": "Excellent", "B": "Good", "C": "Average"})
```

> [!example]
> Ordered category দারুণ — এটা sorting আর comparison enable করে। `"A" > "B"` কাজ করবে। Survey rating (1-5), education level, priority — এসব ordered category এর জন্য perfect।

## Practical — Messy Text Clean + Category

```python
import pandas as pd
import numpy as np

rng = np.random.default_rng(42)
df = pd.DataFrame({
    "department": rng.choice(["Engineering  ", " ENG", "Marketing", " Mkt", "Sales  "], 200),
    "level": rng.choice(["junior", "JUNIOR", "senior", "SENIOR", "lead", "LEAD"], 200),
    "salary": rng.integers(30000, 120000, 200)
})

# Step 1: clean text
df["dept_clean"] = (df["department"]
                     .str.strip()
                     .str.replace("ENG", "Engineering", regex=False)
                     .str.replace("Mkt", "Marketing", regex=False))

df["level_clean"] = (df["level"]
                      .str.strip()
                      .str.lower()
                      .str.title())

# Step 2: convert to category
df["dept_cat"] = df["dept_clean"].astype("category")
df["level_cat"] = pd.Categorical(df["level_clean"],
                                  categories=["Junior", "Senior", "Lead"],
                                  ordered=True)

print(df[["dept_cat", "level_cat", "salary"]].head())
print(f"\nMemory before: {df.memory_usage(deep=True).sum() / 1024:.0f} KB")
```

> [!tip]
> এটাই real-world data cleaning pipeline: messy text → strip/replace/normalize → category convert। প্রতিটা step এ ডেটা পরিষ্কার হয়, শেষে memory-optimized categorical column। Production pipeline এ এই pattern বারবার দেখবে।

## Summary

`.str` accessor দিয়ে text data clean আর transform করো — `.strip()`, `.replace()`, `.contains()`, `.extract()` সব খুব useful। Low cardinality column এ `category` dtype ব্যবহার করলে memory বাঁচে আর speed বাড়ে। `.cat` accessor দিয়ে ordered category আর rename করা যায়। পরের chapter এ I/O আর export শিখবো।