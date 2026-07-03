## Format বেছে নেওয়া

Pandas দিয়ে ডেটা অনেক ধরনের format এ read আর write করা যায়। সবচেয়ে common হলো CSV, কিন্তু production এর জন্য **Parquet** সবচেয়ে ভালো। চলো এক এক করে দেখি।

```python
import pandas as pd
import numpy as np

rng = np.random.default_rng(42)
df = pd.DataFrame({
    "id": range(10000),
    "name": rng.choice(["Karim", "Sadia", "Rahim", "Tania", "Imran"], 10000),
    "department": rng.choice(["Eng", "Sales", "Marketing", "HR"], 10000),
    "salary": rng.integers(30000, 120000, 10000),
    "join_date": pd.date_range("2020-01-01", periods=10000, freq="h")
})
```

## CSV — সবচেয়ে Common

```python
# Write
df.to_csv("employees.csv", index=False)

# Read
df_csv = pd.read_csv("employees.csv", parse_dates=["join_date"])
```

```python
# Pandas 2.x — PyArrow engine দিয়ে fast read
df_fast = pd.read_csv("employees.csv", engine="pyarrow",
                       parse_dates=["join_date"])
```

> [!note]
> Pandas 2.x এ `engine="pyarrow"` দিলে CSV read অনেক fast হয় — বিশেষ করে বড় file এ। Default C engine এর চেয়ে কয়েক গুণ quick। Arrow dtype support ও পাওয়া যায়।

## Excel

```python
# Write (openpyxl engine)
df.to_excel("employees.xlsx", index=False, sheet_name="Employees")

# Read
df_xlsx = pd.read_excel("employees.xlsx", sheet_name="Employees")

# Multiple sheet
with pd.ExcelWriter("multi.xlsx") as writer:
    df.to_excel(writer, sheet_name="data", index=False)
    df_summary.to_excel(writer, sheet_name="summary", index=False)
```

> [!tip]
> Excel এর জন্য `openpyxl` package দরকার: `pip install openpyxl`। Excel file human-readable কিন্তু slow আর বড় — 10K row এর বেশি হলে CSV বা Parquet ব্যবহার করো। Excel মূলত report আর presentation এর জন্য ভালো।

## Parquet — Production Standard

Parquet হলো **columnar** format — প্রতিটা column আলাদাভাবে store হয়। এটা CSV এর চেয়ে অনেক ছোট, অনেক fast, আর dtype preserve করে।

```python
# Write
df.to_parquet("employees.parquet", engine="pyarrow")

# Read
df_parquet = pd.read_parquet("employees.parquet")

# Size তুলনা
import os
print(f"CSV size:     {os.path.getsize('employees.csv') / 1024:.0f} KB")
print(f"Parquet size: {os.path.getsize('employees.parquet') / 1024:.0f} KB")
```

```text
CSV size:     350 KB
Parquet size: 85 KB
```

> [!danger]
> দেখলে তো? Parquet ৪ গুণ ছোট! আর read/write speed ও অনেক fast। সবচেয়ে বড় সুবিধা — dtype preserve হয়। CSV তে date string হয়ে যায়, আবার parse করতে হয়। Parquet তে date তারিখই থাকে, category তে category থাকে। Production এ সবসময় Parquet ব্যবহার করো!

### Parquet এর সুবিধা

| Feature | CSV | Parquet |
|---------|-----|---------|
| File size | বড় | ৪-১০ গুণ ছোট |
| Read speed | ধীর | fast |
| Dtype preserve | না | হ্যাঁ |
| Compression | না | built-in |
| Schema | নেই | আছে |
| Human readable | হ্যাঁ | না |

## SQL — Database Read/Write

```python
from sqlalchemy import create_engine

# Database connection
engine = create_engine("sqlite:///company.db")
# PostgreSQL: "postgresql://user:pass@localhost:5432/dbname"
# MySQL:      "mysql+pymysql://user:pass@localhost/dbname"

# Write — DataFrame কে SQL table এ
df.to_sql("employees", engine, if_exists="replace", index=False)

# Read — SQL query থেকে DataFrame
df_sql = pd.read_sql("SELECT * FROM employees WHERE salary > 50000", engine)

# Chunk read — বড় table এর জন্য
for chunk in pd.read_sql("SELECT * FROM big_table", engine, chunksize=10000):
    process(chunk)
```

> [!note]
> `to_sql` এর `if_exists` parameter: `"replace"` (overwrite), `"append"` (add), `"fail"` (error)। `chunksize` দিয়ে বড় table কে ভাগ করে read করা যায় — memory overflow এড়াতে।

## JSON

```python
# Write
df.to_json("employees.json", orient="records", indent=2)

# Read
df_json = pd.read_json("employees.json", orient="records")

# Nested JSON — json_normalize দিয়ে
import json
with open("nested.json") as f:
    raw = json.load(f)
df_nested = pd.json_normalize(raw)
```

> [!example]
> API response সাধারণত nested JSON হয়। `pd.json_normalize()` দিয়ে nested JSON কে flat DataFrame বানানো যায়। যেমন `{"user": {"name": "Karim", "address": {"city": "Dhaka"}}}` — এটা থেকে `user.name`, `user.address.city` column তৈরি হবে।

## Big File — Chunk Read

বিশাল CSV যেটা RAM এ একসাথে আসে না — chunk করে read করো:

```python
# chunksize দিয়ে read
chunk_iter = pd.read_csv("huge_file.csv", chunksize=50000)

results = []
for chunk in chunk_iter:
    # প্রতিটা chunk process করো
    summary = chunk.groupby("department")["salary"].mean()
    results.append(summary)

# সব chunk এর result combine
final = pd.concat(results).groupby(level=0).mean()
print(final)
```

> [!warn]
> 10GB CSV কে একবারে `read_csv` দিলে RAM full হয়ে program crash করবে! `chunksize` দিয়ে ভাগ করে read করো। প্রতিটা chunk process করে result accumulate করো। এটাই big data pipeline এর ভিত্তি।

## HDF5 — Scientific Data

```python
# HDF5 store — এক file এ multiple table
df.to_hdf("store.h5", key="employees", mode="w")

# Read
df_hdf = pd.read_hdf("store.h5", key="employees")

# Multiple table
with pd.HDFStore("store.h5") as store:
    store["employees"] = df
    store["departments"] = df_dept
    print(store.keys())  # ['/employees', '/departments']
```

> [!tip]
> HDF5 মূলত scientific computing এ ব্যবহার হয় — numerical data, simulation result ইত্যাদি। সাধারণ tabular data এর জন্য Parquet বেশি ভালো পছন্দ। HDF5 তে random access আর update সম্ভব।

## Pandas 2.x — Arrow Dtype

Pandas 2.x এ PyArrow backed dtype ব্যবহার করা যায় — দ্রুত গতি আর memory efficiency:

```python
# Arrow dtype দিয়ে read
df_arrow = pd.read_csv("employees.csv",
                        engine="pyarrow",
                        dtype_backend="pyarrow")

print(df_arrow.dtypes)
# id                int64[pyarrow]
# name             string[pyarrow]
# salary            int64[pyarrow]
# join_date    timestamp[ns][pyarrow]
```

```python
# Explicit Arrow dtype
df["salary"] = df["salary"].astype(pd.ArrowDtype(pa.int64()))
```

> [!note]
> Pandas 2.x এ `dtype_backend="pyarrow"` দিলে সব column Arrow dtype এ আসে — null handling ভালো, memory efficient, আর missing value তে NaN এর বদলে proper null। Numeric column এ `pd.NA` support পাওয়া যায়। Modern Pandas এর future হলো Arrow।

## Format বেছে নেওয়ার Guide

| Use case | Format | কেন |
|----------|--------|------|
| Quick share | CSV | universal |
| Production storage | **Parquet** | small, fast, dtype preserve |
| Report/dashboard | Excel | human friendly |
| API integration | JSON | web standard |
| Database | SQL | query support |
| Scientific data | HDF5 | numerical, random access |
| Huge file process | Chunk CSV | memory safe |

## Summary

CSV সবচেয়ে common কিন্তু production এর জন্য **Parquet** best — ছোট, fast, dtype preserve। Excel report এর জন্য, JSON API এর জন্য, SQL database এর জন্য। Big file এর জন্য `chunksize` দিয়ে read করো। Pandas 2.x এ PyArrow engine আর Arrow dtype ব্যবহার করো modern workflow এর জন্য। পরের chapter এ project শুরু হবে।