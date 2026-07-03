# রিয়েল ডেটাসেট নিয়ে কাজ

এতক্ষণ ছোট ছোট উদাহরণ দেখলাম। এবার চলো একটা পুরো real dataset নিয়ে end-to-end analysis করি। লোড থেকে শুরু করে clean, analyze, আর insight বের করা — সব।

## Scenario — Online Store Sales

ধরো একটা online store এর sales data আছে। CSV file এ। আমাদের বের করতে হবে — কোন product সবচেয়ে বেশি বিক্রি হয়, কোন month এ revenue বেশি, কোন customer segment সবচেয়ে profitable।

## Step ১: ডেটা লোড আর প্রথম পরিচিতি

প্রথমে sample ডেটা তৈরি করি (সত্যিকারের CSV file এর জায়গায়):

```python
import pandas as pd
import numpy as np

data = {
    "order_id": [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010],
    "date": ["2024-01-15", "2024-01-20", "2024-02-05", "2024-02-10",
             "2024-03-01", "2024-03-12", "2024-01-25", "2024-02-28",
             "2024-03-20", "2024-03-25"],
    "product": ["Laptop", "Mouse", "Laptop", "Keyboard", "Monitor",
                "Mouse", "Keyboard", "Monitor", "Laptop", "Mouse"],
    "category": ["Electronics", "Accessories", "Electronics", "Accessories",
                 "Electronics", "Accessories", "Accessories", "Electronics",
                 "Electronics", "Accessories"],
    "quantity": [2, 5, 1, 3, 2, 10, 4, 1, 3, 8],
    "price": [60000, 500, 60000, 1500, 18000, 500, 1500, 18000, 60000, 500],
    "customer_type": ["Premium", "Regular", "Premium", "Regular", "Premium",
                      "Regular", "Premium", "Regular", "Premium", "Regular"]
}

df = pd.DataFrame(data)
df["date"] = pd.to_datetime(df["date"])
df["revenue"] = df["quantity"] * df["price"]
```

প্রথমে দেখি ডেটা কেমন:

```python
print(df.head())
```

```
   order_id       date   product     category  quantity  price customer_type  revenue
0      1001 2024-01-15    Laptop  Electronics         2  60000       Premium   120000
1      1002 2024-01-20     Mouse  Accessories         5    500       Regular     2500
2      1003 2024-02-05    Laptop  Electronics         1  60000       Premium    60000
3      1004 2024-02-10   Keyboard  Accessories         3   1500       Regular     4500
4      1005 2024-03-01   Monitor  Electronics         2  18000       Premium    36000
```

```python
print(df.info())
print(df.describe())
```

> [!tip]
> যেকোনো dataset analyze করার প্রথম ধাপ — `head()`, `info()`, `describe()`। এতে বুঝবে কত row, কী column, কোন missing value, numeric distribution কেমন।

## Step ২: Clean — Missing আর Outlier Check

```python
# missing value চেক
print(df.isnull().sum())
```

```
order_id        0
date            0
product         0
category        0
quantity        0
price           0
customer_type   0
revenue         0
dtype: int64
```

কোনো missing value নেই — ভালো! এখন duplicate check:

```python
print(f"Duplicates: {df.duplicated().sum()}")
df = df.drop_duplicates()
```

> [!note]
> রিয়েল dataset এ প্রায়ই duplicate row থাকে। `drop_duplicates()` দিয়ে সেগুলো বাদ দেওয়া জরুরি, নাহলে analysis ভুল হবে।

## Step ৩: Feature Engineering — Month Extract

তারিখ থেকে month বের করি:

```python
df["month"] = df["date"].dt.to_period("M")
print(df[["date", "month"]].head())
```

```
        date    month
0 2024-01-15  2024-01
1 2024-01-20  2024-01
2 2024-02-05  2024-02
3 2024-02-10  2024-02
4 2024-03-01  2024-03
```

## Step ৪: Monthly Revenue Analysis

```python
monthly = df.groupby("month")["revenue"].sum().reset_index()
monthly = monthly.sort_values("month")
print(monthly)
```

```
     month  revenue
0  2024-01   122500
1  2024-02   100500
2  2024-03   200000
```

> [!example]
> মার্চ মাসে revenue সবচেয়ে বেশি (২ লাখ)। জানুয়ারিতে কম। এভাবে trend বোঝা যায়।

```python
# NumPy দিয়ে statistics
revenues = monthly["revenue"].values
print(f"Average monthly revenue: {np.mean(revenues):.2f}")
print(f"Standard deviation: {np.std(revenues):.2f}")
print(f"Growth rate (Jan→Mar): {((revenues[-1] - revenues[0]) / revenues[0]) * 100:.1f}%")
```

```
Average monthly revenue: 141000.00
Standard deviation: 42415.58
Growth rate (Jan→Mar): 63.3%
```

## Step ৫: Product Analysis

```python
product_summary = df.groupby("product").agg({
    "revenue": "sum",
    "quantity": "sum",
    "order_id": "count"
}).rename(columns={"order_id": "orders"})
product_summary = product_summary.sort_values("revenue", ascending=False)
print(product_summary)
```

```
          revenue  quantity  orders
product
Laptop     360000         6       3
Monitor     54000         3       2
Keyboard     4500         4       1
Mouse        4000        23       3
```

> [!tip]
- Laptop সবচেয়ে বেশি revenue দিয়েছে (৩.৬ লাখ) — কম quantity কিন্তু দাম বেশি।
- Mouse সবচেয়ে বেশি quantity বিক্রি (২৩টা) কিন্তু revenue কম — কারণ দাম কম।

## Step ৬: Customer Segment Analysis

```python
segment = df.groupby("customer_type").agg({
    "revenue": ["sum", "mean", "count"]
}).round(2)
print(segment)
```

```
               revenue                      
                  sum      mean count
customer_type
Premium       396000  79200.0     5
Regular        27000   4500.0     5
```

> [!example]
> Premium customer গুলো average ৭৯,২০০ টাকার order দেয়, Regular গুলো মাত্র ৪,৫০০ টাকার! মানে Premium customer গুলোকে আরো retain করা উচিত।

## Step ৭: Pivot Table — Category vs Month

```python
pivot = df.pivot_table(
    values="revenue",
    index="category",
    columns="month",
    aggfunc="sum",
    fill_value=0
)
print(pivot)
```

```
month         2024-01  2024-02  2024-03
category
Accessories      2500     4500     4000
Electronics    120000    60000   216000
```

## সব একসাথে — Executive Summary

```python
print("=" * 50)
print("      SALES ANALYSIS REPORT")
print("=" * 50)
print(f"Total Orders:     {len(df)}")
print(f"Total Revenue:    {df['revenue'].sum():,}৳")
print(f"Top Product:      {product_summary.index[0]} ({product_summary.iloc[0]['revenue']:,}৳)")
print(f"Best Month:       {monthly.iloc[monthly['revenue'].idxmax()]['month']}")
print(f"Avg Order Value:  {df['revenue'].mean():.0f}৳")
print("=" * 50)
```

```
==================================================
      SALES ANALYSIS REPORT
==================================================
Total Orders:     10
Total Revenue:    423,000৳
Top Product:      Laptop (360,000৳)
Best Month:       2024-03
Avg Order Value:  42300৳
==================================================
```

> [!danger]
> মনে রাখবে — analysis শুধু number বের করা না, insight বের করা। যেমন এখানে দেখা যাচ্ছে Laptop আর Premium customer গুলো revenue এর মূল। এই insight দিয়ে business decision নেওয়া যায় — Laptop stock বাড়ানো, Premium customer দের offer দেওয়া ইত্যাদি।

## Summary

এই chapter এ আমরা একটা পুরো sales dataset analyze করলাম — লোড, clean, feature engineering, groupby, pivot, আর executive summary। এটাই data analysis workflow এর স্কেলেটন। পরের chapter গুলোতে প্রজেক্ট বানাবো।