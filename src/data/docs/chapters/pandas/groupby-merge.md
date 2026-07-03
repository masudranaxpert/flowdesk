# GroupBy, Merge আর Pivot

ডেটা analyze করতে গেলে এই তিনটা concept সবচেয়ে বেশি লাগে — GroupBy দিয়ে category অনুযায়ী summary, Merge দিয়ে একাধিক table join, আর Pivot দিয়ে table reshape করা।

## GroupBy — Category অনুযায়ী Summary

`groupby()` দিয়ে এক column এর value গুলো group করে তার উপর aggregation করা যায়। SQL এর `GROUP BY` এর মতো:

```python
import pandas as pd

df = pd.DataFrame({
    "department": ["CSE", "EEE", "CSE", "EEE", "CIVIL", "CSE", "CIVIL"],
    "name": ["Karim", "Rahim", "Sadia", "Tania", "Jamal", "Lisa", "Nadia"],
    "salary": [50000, 55000, 48000, 60000, 45000, 52000, 47000]
})

# department অনুযায়ী average salary
avg = df.groupby("department")["salary"].mean()
print(avg)
```

```
department
CSE      50000.000000
CIVIL    46000.000000
EEE      57500.000000
Name: salary, dtype: float64
```

> [!tip]
> GroupBy এর pattern হলো: `df.groupby('column')['target'].function()`। মানে — কোন column দিয়ে group করবে, কোন column এর value চাই, আর কোন function apply করবে।

### বিভিন্ন Aggregation Function

```python
print(df.groupby("department")["salary"].sum())     # যোগ
print(df.groupby("department")["salary"].mean())    # গড়
print(df.groupby("department")["salary"].max())     # সর্বোচ্চ
print(df.groupby("department")["salary"].min())     # সর্বনিম্ন
print(df.groupby("department")["salary"].count())   # কয়টা
print(df.groupby("department")["salary"].median())  # মধ্যমা
```

### agg() — একসাথে একাধিক Function

```python
summary = df.groupby("department")["salary"].agg(["mean", "max", "min", "count"])
print(summary)
```

```
            mean    max    min  count
department
CSE      50000.000000  52000  48000      3
CIVIL    46000.000000  47000  45000      2
EEE      57500.000000  60000  55000      2
```

> [!example]
> `agg()` দিয়ে একসাথে অনেক function চালানো যায়। এমনকি ভিন্ন column এ ভিন্ন function ও:

```python
summary = df.groupby("department").agg({
    "salary": ["mean", "max"],
    "name": "count"
})
```

## Multiple Column দিয়ে GroupBy

```python
df = pd.DataFrame({
    "city": ["Dhaka", "Dhaka", "Sylhet", "Sylhet", "Dhaka", "Sylhet"],
    "product": ["A", "B", "A", "B", "A", "B"],
    "sales": [100, 150, 80, 120, 90, 110]
})

# city আর product দুটো দিয়ে group
result = df.groupby(["city", "product"])["sales"].sum()
print(result)
```

```
city    product
Dhaka   A          190
        B          150
Sylhet  A           80
        B          230
Name: sales, dtype: int64
```

## Merge — দুটো Table Join

দুটো DataFrame কে common column এর উপর ভিত্তি করে join করাকে merge বলে। SQL এর `JOIN` এর মতো:

```python
employees = pd.DataFrame({
    "emp_id": [1, 2, 3, 4],
    "name": ["Karim", "Rahim", "Sadia", "Tania"],
    "dept_id": [10, 20, 10, 30]
})

departments = pd.DataFrame({
    "dept_id": [10, 20, 30],
    "dept_name": ["Engineering", "Marketing", "HR"]
})

# common column 'dept_id' এর উপর merge
merged = pd.merge(employees, departments, on="dept_id")
print(merged)
```

```
   emp_id   name  dept_id    dept_name
0       1  Karim       10  Engineering
1       2  Rahim       20    Marketing
2       3  Sadia       10  Engineering
3       4  Tania       30           HR
```

### Merge Type

```python
# inner (default) — শুধু common key গুলো
pd.merge(df1, df2, on="id", how="inner")

# left — বাম table এর সব row, ডানের টা match না হলে NaN
pd.merge(df1, df2, on="id", how="left")

# outer — দুটো table এর সব row
pd.merge(df1, df2, on="id", how="outer")
```

| Type | কী রাখে | SQL Equivalent |
|------|---------|----------------|
| `inner` | শুধু matching | `INNER JOIN` |
| `left` | বাম table সব + ডান match | `LEFT JOIN` |
| `right` | ডান table সব + বাম match | `RIGHT JOIN` |
| `outer` | দুটোর সব | `FULL OUTER JOIN` |

## concat — Stack করে যোগ

```python
# উপর-নিচ stack
df1 = pd.DataFrame({"A": [1, 2], "B": [3, 4]})
df2 = pd.DataFrame({"A": [5, 6], "B": [7, 8]})

result = pd.concat([df1, df2], ignore_index=True)
print(result)
#    A  B
# 0  1  3
# 1  2  4
# 2  5  7
# 3  6  8

# পাশাপাশি join (column যোগ)
df3 = pd.DataFrame({"C": [9, 10]})
result = pd.concat([df1, df3], axis=1)
```

> [!note]
> `merge` হলো SQL JOIN (common column দিয়ে match), `concat` হলো stack করে যোগ (উপর-নিচ বা পাশাপাশি)। দুটো আলাদা জিনিস — confuse করবে না।

## pivot_table — Cross Tabulation

`pivot_table` দিয়ে row আর column দুটো dimension এ ডেটা summarize করা যায়। Excel এর PivotTable এর মতো:

```python
df = pd.DataFrame({
    "city": ["Dhaka", "Dhaka", "Sylhet", "Sylhet", "Dhaka", "Sylhet"],
    "month": ["Jan", "Feb", "Jan", "Feb", "Jan", "Feb"],
    "sales": [100, 120, 80, 90, 110, 85]
})

pivot = df.pivot_table(values="sales", index="city", columns="month", aggfunc="sum")
print(pivot)
```

```
month   Feb  Jan
city
Dhaka   120  210
Sylhet   90  165
```

> [!example]
> দেখো কত সুন্দর! row তে city, column এ month, আর ভেতরে sales এর যোগ। এভাবে যেকোনো দুই dimension এ summarize করা যায়।

## রিয়েল উদাহরণ — Sales Analysis

```python
sales = pd.DataFrame({
    "region": ["North", "South", "North", "East", "South", "East", "North"],
    "product": ["Laptop", "Laptop", "Phone", "Phone", "Laptop", "Phone", "Phone"],
    "revenue": [50000, 45000, 30000, 28000, 52000, 32000, 35000],
    "quantity": [5, 4, 10, 8, 5, 12, 11]
})

# region আর product অনুযায়ী total revenue
summary = sales.pivot_table(
    values="revenue",
    index="region",
    columns="product",
    aggfunc="sum",
    fill_value=0
)
print(summary)
```

```
product  Laptop  Phone
region
East         0   60000
North    50000  65000
South    97000      0
```

> [!tip]
> `fill_value=0` দিলে missing combination গুলোতে 0 বসবে, NaN না। এতে output দেখতে পরিষ্কার লাগে।

## Summary

- **GroupBy** — category অনুযায়ী aggregate (`mean`, `sum`, `count`)
- **Merge** — দুটো table common column দিয়ে join
- **Concat** — DataFrame stack করে যোগ
- **Pivot Table** — দুই dimension এ cross-tabulation

এই চারটা মিলেই data analysis এর ৮০% কাজ হয়ে যায়। পরের chapter এ একটা পুরো real dataset analyze করবো।