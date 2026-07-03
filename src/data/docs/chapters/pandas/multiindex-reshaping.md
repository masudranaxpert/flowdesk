## MultiIndex কী আর কেন দরকার?

সাধারণ DataFrame এ index একটা level এর হয়। কিন্তু মাঝে মাঝে ডেটার hierarchy থাকে — যেমন: প্রথমে country, তারপর city, তারপর আবার তারিখ। এই nested hierarchy handle করার জন্য **MultiIndex** দরকার। এটা hierarchical indexing — একসাথে একাধিক level এ index করা যায়।

```python
import pandas as pd
import numpy as np

# সাধারণ উদাহরণ — multiple column দিয়ে index
df = pd.DataFrame({
    "country": ["BD", "BD", "US", "US", "UK", "UK"],
    "city": ["Dhaka", "Chittagong", "NYC", "LA", "London", "Manchester"],
    "population": [9.5, 2.6, 8.3, 3.9, 9.0, 2.7]
})
```

## MultiIndex তৈরি করা

### set_index দিয়ে

```python
data = {
    "country": ["BD", "BD", "BD", "US", "US", "US"],
    "city": ["Dhaka", "Dhaka", "Chittagong", "NYC", "NYC", "LA"],
    "year": [2024, 2025, 2025, 2024, 2025, 2025],
    "population": [9.5, 9.8, 2.6, 8.3, 8.4, 3.9]
}
df = pd.DataFrame(data)
df = df.set_index(["country", "city", "year"])
print(df)
```

```text
                      population
country city       year
BD      Dhaka      2024        9.5
                   2025        9.8
        Chittagong 2025        2.6
US      NYC        2024        8.3
                   2025        8.4
        LA         2025        3.9
```

> [!note]
> এখন `country`, `city`, `year` — তিনটা level এ index হয়েছে। এটাই MultiIndex। যেকোনো level দিয়ে query করা যায়। সাধারণ DataFrame এ এই কাজ করতে গেলে complex filtering লাগতো।

### from_tuples দিয়ে

```python
# Tuple থেকে MultiIndex
index = pd.MultiIndex.from_tuples([
    ("BD", "Dhaka"),
    ("BD", "Chittagong"),
    ("US", "NYC"),
    ("US", "LA")
], names=["country", "city"])

df2 = pd.DataFrame({"population": [9.5, 2.6, 8.3, 3.9]}, index=index)
print(df2)
```

### from_product দিয়ে

```python
# Cartesian product — সব combination
countries = ["BD", "US"]
years = [2024, 2025]
index = pd.MultiIndex.from_product([countries, years], names=["country", "year"])
df3 = pd.DataFrame({"value": [10, 12, 20, 22]}, index=index)
```

## MultiIndex থেকে ডেটা Select করা

### .loc দিয়ে

```python
df = df.set_index(["country", "city", "year"])

# একটা country এর সব
print(df.loc["BD"])

# নির্দিষ্ট country + city
print(df.loc[("BD", "Dhaka")])

# নির্দিষ্ট country + city + year
print(df.loc[("BD", "Dhaka", 2025)])
```

### .xs — Cross-section

`.xs()` দিয়ে নির্দিশ্ট level থেকে select করা যায়:

```python
# সব country এর 2025 সালের ডেটা
print(df.xs(2025, level="year"))

# সব শহরের Dhaka এর ডেটা
print(df.xs("Dhaka", level="city"))
```

> [!tip]
> `.xs()` খুব useful যখন inner level থেকে select করতে চাও কিন্তু outer level সব চাও। `.loc[("BD", "Dhaka")]` দিলে outer থেকে যেতে হয়, কিন্তু `.xs(level="year")` দিলে সরাসরি যেকোনো level query করা যায়।

## stack আর unstack — Long ↔ Wide

```python
# Wide format
df_wide = pd.DataFrame({
    "city": ["Dhaka", "Dhaka", "NYC", "NYC"],
    "year": [2024, 2025, 2024, 2025],
    "pop": [9.5, 9.8, 8.3, 8.4]
})
df_wide = df_wide.set_index(["city", "year"])

# unstack — inner index কে column এ নিয়ে যায় (long → wide)
wide = df_wide["pop"].unstack("year")
print(wide)
```

```text
year    2024  2025
city
Dhaka   9.5   9.8
NYC     8.3   8.4
```

```python
# stack — আবার long format এ ফেরত (wide → long)
long = wide.stack()
print(long)
```

```text
city   year
Dhaka  2024    9.5
       2025    9.8
NYC    2024    8.3
       2025    8.4
```

> [!note]
> `unstack` = inner index level কে column এ পাঠায় (long → wide)। `stack` = column কে index level এ আনে (wide → long)। এগুলো reshape এর মূল অস্ত্র।

## melt — Wide → Long

```python
# Wide format
df_wide = pd.DataFrame({
    "city": ["Dhaka", "NYC", "London"],
    "2024": [9.5, 8.3, 9.0],
    "2025": [9.8, 8.4, 9.1]
})

# melt — একাধিক column কে row তে নিয়ে যায়
df_long = df_wide.melt(id_vars=["city"],
                        var_name="year",
                        value_name="population")
print(df_long)
```

```text
     city  year  population
0   Dhaka  2024         9.5
1     NYC  2024         8.3
2  London  2024         9.0
3   Dhaka  2025         9.8
4     NYC  2025         8.4
5  London  2025         9.1
```

## pivot_table — Groupby এর Powerful ভাই

```python
df = pd.DataFrame({
    "region": ["East", "East", "West", "West", "East", "West"],
    "product": ["A", "B", "A", "B", "A", "B"],
    "sales": [100, 150, 120, 180, 90, 200]
})

# Region × product table
table = df.pivot_table(values="sales", index="region", columns="product",
                        aggfunc="sum", fill_value=0)
print(table)
```

```text
product    A    B
region
East     190  150
West     120  380
```

```python
# Multiple aggregation
table2 = df.pivot_table(values="sales", index="region",
                         aggfunc=["sum", "mean", "count"])
```

> [!example]
> `pivot_table` আর `groupby` অনেকটা এক — কিন্তু pivot_table সুন্দর 2D table বানায়। Excel এর pivot table এর মতো। Report আর dashboard বানাতে দারুণ। `aggfunc` দিয়ে sum/mean/count — যা খুশি দাও।

## reset_index — Index থেকে Column এ

```python
df_multi = df.set_index(["region", "product"])

# Index গুলো আবার column এ ফেরত
df_flat = df_multi.reset_index()
print(df_flat.columns)   # Index(['region', 'product', 'sales'], ...)
```

> [!tip]
> কাজ শেষে MultiIndex কে flat করতে `reset_index()` ব্যবহার করো। Export করার আগে সাধারণত flatten করা ভালো — অন্য tool (Excel, BI dashboard) MultiIndex বুঝবে না।

## Practical — Survey Data Reshape

```python
import pandas as pd

# Long format survey data
survey = pd.DataFrame({
    "respondent": ["R1", "R1", "R1", "R2", "R2", "R2", "R3", "R3", "R3"],
    "question": ["Q1", "Q2", "Q3", "Q1", "Q2", "Q3", "Q1", "Q2", "Q3"],
    "score": [5, 3, 4, 2, 1, 3, 4, 5, 2]
})

# Long → Wide: প্রতিটা respondent এর row তে সব question
wide = survey.pivot(index="respondent", columns="question", values="score")
print(wide)
```

```text
question    Q1  Q2  Q3
respondent
R1           5   3   4
R2           2   1   3
R3           4   5   2
```

```python
# এখন analysis সহজ
print(f"প্রতিটা respondent এর average: \n{wide.mean(axis=1)}")
print(f"\nপ্রতিটা question এর average: \n{wide.mean(axis=0)}")
```

> [!example]
> Survey data সাধারণত long format এ store হয় (database friendly)। কিন্তু analysis আর visualization এর জন্য wide format দরকার। `pivot`/`unstack` দিয়ে reshape করো। এটাই real-world data wrangling।

## Summary

MultiIndex দিয়ে hierarchical data handle করা যায়। `set_index` বা `from_tuples` দিয়ে তৈরি করো। `.xs()` দিয়ে level query করো। `stack/unstack` দিয়ে long↔wide reshape করো। `melt` দিয়ে wide→long করো। `pivot_table` দিয়ে powerful summary table বানাও। পরের chapter এ string accessor আর categorical শিখবো।