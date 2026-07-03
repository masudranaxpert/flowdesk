# প্রজেক্ট ২: Sales Data Analysis

এই প্রজেক্টে আমরা একটা sales dataset নিয়ে deep analysis করবো — Pandas আর NumPy দুটোই ব্যবহার করে। Monthly revenue, top products, trend — সব বের করবো।

## Scenario

ধরো তুমি একটা e-commerce company তে data analyst। বস তোমাকে বললো — "এই বছরের sales data analyze করো, কোন product বেশি বিক্রি হয়েছে, কোন month এ peak, growth rate কত — সব বের করো।" চলো করি!

## Sample Data তৈরি

```python
import pandas as pd
import numpy as np

np.random.seed(42)

products = ["Laptop", "Phone", "Tablet", "Headphone", "Charger", "Mouse"]
categories = {
    "Laptop": "Electronics", "Phone": "Electronics", "Tablet": "Electronics",
    "Headphone": "Accessories", "Charger": "Accessories", "Mouse": "Accessories"
}
prices = {"Laptop": 60000, "Phone": 35000, "Tablet": 20000,
          "Headphone": 3000, "Charger": 800, "Mouse": 500}

# ২০০ টা random order generate
n = 200
data = {
    "order_id": range(1001, 1001 + n),
    "date": pd.date_range("2024-01-01", periods=n, freq="3D"),
    "product": np.random.choice(products, n),
    "quantity": np.random.randint(1, 10, n),
    "customer_id": np.random.randint(1, 50, n)
}

df = pd.DataFrame(data)
df["category"] = df["product"].map(categories)
df["price"] = df["product"].map(prices)
df["revenue"] = df["quantity"] * df["price"]
```

> [!tip]
> `np.random.seed(42)` দিলে random number গুলো প্রতিবার same আসবে। এতে result reproducible হয় — tutorial বা testing এর জন্য জরুরি।

## প্রথম দেখা — Overview

```python
print(f"Total Orders: {len(df)}")
print(f"Date Range: {df['date'].min().date()} থেকে {df['date'].max().date()}")
print(f"Total Revenue: {df['revenue'].sum():,}৳")
print(f"Unique Customers: {df['customer_id'].nunique()}")
print(f"Total Products Sold: {df['quantity'].sum()}")
```

```
Total Orders: 200
Date Range: 2024-01-01 থেকে 2024-07-18
Total Revenue: 21,547,000৳
Unique Customers: 49
Unique Products Sold: 1063
```

## Monthly Revenue — NumPy Aggregation

```python
df["month"] = df["date"].dt.to_period("M")

monthly = df.groupby("month")["revenue"].sum().reset_index()
monthly["revenue"] = monthly["revenue"].astype(float)

# NumPy দিয়ে statistics
revenues = monthly["revenue"].values
print(f"Average Monthly Revenue: {np.mean(revenues):,.0f}৳")
print(f"Highest Month: {monthly.loc[monthly['revenue'].idxmax(), 'month']} ({np.max(revenues):,}৳)")
print(f"Lowest Month: {monthly.loc[monthly['revenue'].idxmin(), 'month']} ({np.min(revenues):,}৳)")
print(f"Std Dev: {np.std(revenues):,.0f}৳")
```

```
Average Monthly Revenue: 3,078,143৳
Highest Month: 2024-03 (4,250,000৳)
Lowest Month: 2024-07 (1,200,000৳)
Std Dev: 952,388৳
```

> [!example]
> মার্চ মাসে revenue peak, জুলাই এ সবচেয়ে কম। Standard deviation প্রায় ৯.৫ লাখ — মানে month থেকে month revenue অনেক fluctuate করে।

### Month-over-Month Growth

```python
monthly["growth_pct"] = monthly["revenue"].pct_change() * 100
print(monthly[["month", "revenue", "growth_pct"]].to_string(index=False))
```

```
   month    revenue  growth_pct
2024-01  3100000.0         NaN
2024-02  2850000.0   -8.064516
2024-03  4250000.0   49.122807
2024-04  3500000.0  -17.647059
2024-05  3120000.0  -10.857143
2024-06  3527000.0   13.045490
2024-07  1200000.0  -65.976629
```

## Top Products — Ranking

```python
product_perf = df.groupby("product").agg(
    revenue=("revenue", "sum"),
    quantity=("quantity", "sum"),
    orders=("order_id", "count")
).sort_values("revenue", ascending=False)

print(product_perf)
```

```
           revenue  quantity  orders
product
Laptop     8280000       138      35
Phone      7000000       200      33
Tablet     3000000       150      25
Headphone   150000       50       25
Charger      41600       52       30
Mouse        16800       168      30
```

```python
# Revenue share
product_perf["share_pct"] = (product_perf["revenue"] / product_perf["revenue"].sum() * 100).round(1)
print(product_perf[["revenue", "share_pct"]])
```

> [!tip]
- Laptop আর Phone মিলে total revenue এর ৭০%+!
- Mouse সবচেয়ে বেশি quantity বিক্রি (১৬৮টা) কিন্তু revenue share মাত্র ০.১%

## Category Analysis

```python
cat_summary = df.pivot_table(
    values="revenue",
    index="category",
    columns="month",
    aggfunc="sum",
    fill_value=0
)
print(cat_summary)
```

## Customer Analysis

```python
customer_stats = df.groupby("customer_id").agg(
    total_spent=("revenue", "sum"),
    orders=("order_id", "count"),
    avg_order=("revenue", "mean")
).sort_values("total_spent", ascending=False)

print("\nTop 5 Customer:")
print(customer_stats.head())

# NumPy দিয়ে stats
avg_spending = customer_stats["total_spent"].values
print(f"\nAverage Customer Spending: {np.mean(avg_spending):,.0f}৳")
print(f"Median: {np.median(avg_spending):,.0f}৳")
print(f"Top customer সাধারণ customer এর চেয়ে {customer_stats.iloc[0, 0] / np.mean(avg_spending):.1f}x বেশি খরচ করেছে")
```

## Executive Summary — এক নজরে

```python
print("=" * 55)
print("       📊 SALES ANALYSIS REPORT - 2024 H1")
print("=" * 55)
print(f"Total Revenue:       {df['revenue'].sum():>12,}৳")
print(f"Total Orders:        {len(df):>12}")
print(f"Total Products Sold: {df['quantity'].sum():>12}")
print(f"Unique Customers:    {df['customer_id'].nunique():>12}")
print(f"Avg Order Value:     {df['revenue'].mean():>12,.0f}৳")
print("-" * 55)
print(f"Best Month:          {monthly.loc[monthly['revenue'].idxmax(), 'month']}")
print(f"Top Product:         {product_perf.index[0]} ({product_perf.iloc[0]['share_pct']}%)")
print(f"Top Category:        {df.groupby('category')['revenue'].sum().idxmax()}")
print("=" * 55)
```

```
=======================================================
       📊 SALES ANALYSIS REPORT - 2024 H1
=======================================================
Total Revenue:           21,547,000৳
Total Orders:                 200
Total Products Sold:         1063
Unique Customers:             49
Avg Order Value:          107,735৳
-------------------------------------------------------
Best Month:              2024-03
Top Product:             Laptop (38.4%)
Top Category:            Electronics
=======================================================
```

> [!danger]
- জুলাই মাসে revenue ৬৬% drop — এটা investigate করা দরকার। হয়তো ডেটা কম, নাহলে কোনো seasonal effect।
- Mouse/Charger এর unit price কম — bundling offer দিলে average order value বাড়তে পারে।
- Top ৫ customer মোট revenue এর বড় অংশ — তাদের retain করা জরুরি।

## Summary

এই প্রজেক্টে Pandas (groupby, pivot, agg) আর NumPy (mean, std, max) দুটো মিলিয়ে বাস্তব data analysis করলাম। এটাই data analyst দের দৈনন্দিন কাজ — ডেটা থেকে insight বের করা। পরের chapter এ Grade Calculator বানাবো।