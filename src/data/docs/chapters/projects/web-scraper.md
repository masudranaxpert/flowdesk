## Project Overview

এই project এ আমরা একটা webpage থেকে table data scrape করবো, clean করবো, analyze করবো, আর সুন্দর report বানিয়ে save করবো। আগের chapter গুলোতে যা শিখেছি — requests, Pandas, NumPy — সব একসাথে ব্যবহার করবো।

```
Webpage → requests → pandas.read_html → Clean → Analyze → Export
```

> [!note]
> Web scraping মানে হলো website থেকে automatically ডেটা collect করা। Data science এর জন্য ডেটা source খোঁজার দারুণ উপায়। তবে সব site scrape করা legal না — সবসময় site এর `robots.txt` আর terms of service চেক করো।

## Setup

```bash
pip install requests pandas lxml pyarrow
```

```python
import requests
import pandas as pd
import numpy as np

print(f"Pandas: {pd.__version__}")    # 2.2.x
print(f"NumPy:  {np.__version__}")     # 2.x
```

## Step 1 — Page Fetch আর Table Read

সবচেয়ে easy উপায় হলো `pandas.read_html()` — এটা একটা URL থেকে সব HTML table বের করে আনে।

```python
import requests
import pandas as pd

# Wikipedia page এর table scrape (country population data)
url = "https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)"

# User-Agent header দেওয়া ভালো — অনেক site এটা ছাড়া block করে
headers = {
    "User-Agent": "Mozilla/5.0 (compatible; DataAnalysisBot/1.0)"
}
response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")   # 200

# HTML থেকে সব table extract করো
tables = pd.read_html(response.text)
print(f"Tables found: {len(tables)}")

# প্রথম table টা নাও (সাধারণত main table)
df = tables[0]
print(df.head())
```

> [!tip]
> `pd.read_html()` ভেতরে `lxml` বা `html5lib` ব্যবহার করে। `lxml` install থাকা লাগবে (`pip install lxml`)। এটা সবচেয়ে সহজ উপায় table scrape করার — manually HTML parse করার দরকার নেই।

## Step 2 — Clean আর Prepare

Scrape করা raw ডেটা সাধারণত messy হয়। Clean করতে হবে:

```python
import pandas as pd
import numpy as np

# Column rename (Wikipedia table গুলোর column name বড় থাকে)
df.columns = ["country", "region", "subregion", "population_2022",
              "population_2023", "change_pct"]

# Numeric column গুলো clean করো
# String এ থাকতে পারে: "1,425,000,000" (comma), "−0.5" (unicode minus)
df["population_2022"] = (df["population_2022"]
                          .astype(str)
                          .str.replace(",", "", regex=False)
                          .str.replace("[^0-9.-]", "", regex=True)
                          .replace("", np.nan)
                          .astype(float))

df["population_2023"] = (df["population_2023"]
                          .astype(str)
                          .str.replace(",", "", regex=False)
                          .str.replace("[^0-9.-]", "", regex=True)
                          .replace("", np.nan)
                          .astype(float))

# Change percentage clean
df["change_pct"] = pd.to_numeric(df["change_pct"], errors="coerce")

# Missing value আর duplicate handle
df = df.dropna(subset=["population_2023"])
df = df.drop_duplicates(subset=["country"])

print(df.info())
print(df.head(10))
```

> [!example]
> Wikipedia থেকে scrape করা ডেটা প্রায় সবসময় clean করতে হয় — comma, footnote reference `[1]`, unicode character, missing value — সব থাকে। `.str.replace` আর `.astype` দিয়ে numeric column fix করো। এটাই real-world data cleaning।

## Step 3 — Analyze with NumPy আর Pandas

```python
import numpy as np

# Top 10 most populous countries
top10 = df.nlargest(10, "population_2023")[["country", "population_2023"]]
print("Top 10 Countries by Population:")
print(top10.to_string(index=False))

# Region wise total population
region_pop = df.groupby("region")["population_2023"].sum().sort_values(ascending=False)
print(f"\nPopulation by Region:\n{region_pop}")

# NumPy দিয়ে statistics
populations = df["population_2023"].to_numpy()
print(f"\nGlobal Population: {populations.sum() / 1e9:.2f} billion")
print(f"Mean:              {populations.mean() / 1e6:.1f} million")
print(f"Median:            {np.median(populations) / 1e6:.1f} million")
print(f"Std:               {populations.std() / 1e6:.1f} million")
```

```python
# Growth rate analysis — fastest growing countries
df["growth_abs"] = df["population_2023"] - df["population_2022"]
fastest = df.nlargest(5, "change_pct")[["country", "change_pct"]]
declining = df.nsmallest(5, "change_pct")[["country", "change_pct"]]

print("Fastest Growing:")
print(fastest.to_string(index=False))
print("\nFastest Declining:")
print(declining.to_string(index=False))
```

> [!note]
> দেখো কীভাবে NumPy আর Pandas একসাথে কাজ করছে — Pandas দিয়ে filter আর group, NumPy দিয়ে fast statistical computation। `.to_numpy()` দিয়ে Pandas column কে NumPy array তে convert করে pure NumPy operation করা যায়।

## Step 4 — Export

```python
# CSV — quick share
df.to_csv("world_population.csv", index=False)

# Parquet — production storage (recommend!)
df.to_parquet("world_population.parquet", engine="pyarrow")

# Excel — report এর জন্য
df.to_excel("world_population.xlsx", index=False, sheet_name="Data")

# Summary table আলাদা sheet এ
summary = df.groupby("region")["population_2023"].agg(["sum", "mean", "count"])
with pd.ExcelWriter("report.xlsx") as writer:
    df.to_excel(writer, sheet_name="Raw Data", index=False)
    summary.to_excel(writer, sheet_name="Summary")

print("Exported: CSV, Parquet, Excel")
```

## BeautifulSoup — যখন Table না থাকে

`read_html` শুধু `<table>` tag খুঁজে। কিন্তু অনেক site তে ডেটা `<div>`, `<li>` ইত্যাদিতে থাকে। তখন **BeautifulSoup** দরকার:

```python
from bs4 import BeautifulSoup
import requests

response = requests.get("https://example.com/products", headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

# সব product card extract করো
products = []
for card in soup.find_all("div", class_="product-card"):
    name = card.find("h3", class_="name").text.strip()
    price = card.find("span", class_="price").text.strip()
    products.append({"name": name, "price": price})

df_products = pd.DataFrame(products)
print(df_products.head())
```

```bash
pip install beautifulsoup4
```

> [!warn]
> সব site scrape করা যায় না! কিছু site JavaScript দিয়ে ডেটা render করে — সেগুলোতে `requests` দিয়ে raw HTML তে ডেটা থাকবে না। তখন `Selenium` বা `Playwright` দরকার (browser automate করে)। সবসময় site এর `robots.txt` চেক করো আর rate limit মেনে চলো — একসাথে অনেক request পাঠিও না।

## Complete Script — End to End

```python
"""
Web Scraper Project — Country Population Analysis
Scrape → Clean → Analyze → Export
"""
import requests
import pandas as pd
import numpy as np

def scrape_population_data():
    """Wikipedia থেকে population table scrape করো"""
    url = ("https://en.wikipedia.org/wiki/"
           "List_of_countries_by_population_(United_Nations)")
    headers = {"User-Agent": "Mozilla/5.0 (compatible; EduBot/1.0)"}

    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    tables = pd.read_html(response.text)
    return tables[0]

def clean_data(df):
    """Raw ডেটা clean আর prepare করো"""
    df = df.copy()  # Pandas 2.x CoW safe
    df.columns = ["country", "region", "subregion",
                  "pop_2022", "pop_2023", "change_pct"]

    for col in ["pop_2022", "pop_2023"]:
        df[col] = (df[col].astype(str)
                   .str.replace(r"[^\d.]", "", regex=True)
                   .replace("", np.nan)
                   .astype(float))

    df["change_pct"] = pd.to_numeric(df["change_pct"], errors="coerce")
    df = df.dropna(subset=["pop_2023"]).drop_duplicates("country")
    return df

def analyze(df):
    """Statistical analysis আর insight"""
    pops = df["pop_2023"].to_numpy()
    print(f"Total countries: {len(df)}")
    print(f"World population: {pops.sum() / 1e9:.2f} billion")
    print(f"Average:          {pops.mean() / 1e6:.1f} million")
    print(f"Top 5: {df.nlargest(5, 'pop_2023')['country'].tolist()}")

def export(df):
    """Multiple format এ save করো"""
    df.to_csv("population.csv", index=False)
    df.to_parquet("population.parquet", engine="pyarrow")
    print("Saved: CSV + Parquet")

# --- Main ---
if __name__ == "__main__":
    raw = scrape_population_data()
    clean = clean_data(raw)
    analyze(clean)
    export(clean)
```

> [!example]
> পুরো pipeline এক script এ! Scrape → Clean → Analyze → Export — এই pattern যেকোনো data project এ ব্যবহার হয়। Function গুলো আলাদা করা যাতে পরে test আর maintain করা সহজ হয়।

## Summary

এই project এ আমরা একটা সম্পূর্ণ web scraping pipeline বানালাম। `requests` দিয়ে page fetch, `pd.read_html` দিয়ে table extract, Pandas আর NumPy দিয়ে clean আর analyze, শেষে CSV/Parquet এ save। জটিল site এর জন্য BeautifulSoup। এটাই real-world data collection workflow। পরের chapter এ API consumer project দেখবো।