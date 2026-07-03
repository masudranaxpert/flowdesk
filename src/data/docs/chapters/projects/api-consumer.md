## Project Overview

এই project এ আমরা একটা public API থেকে JSON ডেটা fetch করবো, `pd.json_normalize` দিয়ে flatten করবো, Pandas/NumPy দিয়ে analyze করবো। আগের সব knowledge — requests, JSON, Pandas, NumPy — একসাথে ব্যবহার করবো।

```
API → requests.get → JSON → json_normalize → DataFrame → Analyze → Visualize
```

> [!note]
> API মানে Application Programming Interface — একটা program থেকে আরেকটা program এর সাথে কথা বলার উপায়। REST API সাধারণত JSON ফরম্যাটে ডেটা দেয়। Weather, stock, crypto, social media — সবার API আছে।

## Setup

```bash
pip install requests pandas numpy matplotlib
```

```python
import requests
import pandas as pd
import numpy as np

print(f"Pandas: {pd.__version__}")
```

## Step 1 — API থেকে JSON Fetch

আমরা JSONPlaceholder ব্যবহার করবো — এটা free testing API:

```python
import requests

# JSONPlaceholder — free fake API for testing
url = "https://jsonplaceholder.typicode.com/users"

response = requests.get(url)
print(f"Status: {response.status_code}")   # 200
print(f"Content-Type: {response.headers['Content-Type']}")  # application/json

# JSON parse
data = response.json()
print(f"Records: {len(data)}")
print(f"First user keys: {list(data[0].keys())}")
```

```text
First user keys: ['id', 'name', 'username', 'email', 'address', 'phone',
                  'website', 'company']
```

> [!tip]
> `response.json()` স্বয়ংক্রিয়ভাবে JSON string কে Python dict/list তে convert করে। `response.status_code == 200` মানে success। `raise_for_status()` দিয়ে error handle করা যায় — 404, 500 ইত্যাদি হলে exception ছোড়ে।

## Step 2 — Nested JSON Flatten

API response সাধারণত nested থাকে — `address.city`, `company.name` ইত্যাদি। `pd.json_normalize` দিয়ে flat DataFrame বানানো যায়:

```python
import pandas as pd

# Nested JSON — দেখো address আর company nested
print(data[0]["address"])
# {'street': 'Kulas Light', 'suite': 'Apt. 556',
#  'city': 'Gwenborough', 'zipcode': '92998-3874',
#  'geo': {'lat': '-37.3159', 'lng': '81.1496'}}

# json_normalize — nested structure কে flat columns এ
df = pd.json_normalize(data)
print(df.columns.tolist())
```

```text
['id', 'name', 'username', 'email', 'phone', 'website',
 'address.street', 'address.suite', 'address.city', 'address.zipcode',
 'address.geo.lat', 'address.geo.lng',
 'company.name', 'company.catchPhrase', 'company.bs']
```

```python
# দরকারি column গুলো রাখো
df_clean = df[["id", "name", "username", "email",
                "address.city", "address.zipcode",
                "address.geo.lat", "address.geo.lng",
                "company.name", "phone", "website"]].copy()

df_clean.columns = ["id", "name", "username", "email",
                     "city", "zipcode", "lat", "lng",
                     "company", "phone", "website"]
print(df_clean.head())
```

> [!example]
> `json_normalize` হলো nested JSON handle করার best tool। যেকোনো depth এর nesting flat column এ পরিণত হয় — `address.geo.lat` হয়ে যায় একটা column। API data analysis এর প্রথম ধাপ সাধারণত এটাই।

## Step 3 — Crypto API (Real-time Data)

এখন একটু real-time data দিয়ে কাজ করি — CoinGecko free API থেকে crypto price:

```python
import requests
import pandas as pd
import numpy as np

# CoinGecko free API — কোনো API key লাগে না
url = "https://api.coingecko.com/api/v3/coins/markets"
params = {
    "vs_currency": "usd",
    "order": "market_cap_desc",
    "per_page": 50,
    "page": 1,
    "sparkline": False
}

response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

df = pd.json_normalize(data)
print(df[["id", "symbol", "current_price", "market_cap",
          "price_change_percentage_24h"]].head(10))
```

> [!warn]
> Free API তে rate limit থাকে — এক মিনিটে কতবার call করা যাবে সেটা নির্দিষ্ট। খুব দ্রুত বারবার call করলে `429 Too Many Requests` error পাবে। সবসময় কিছু delay রাখো (`time.sleep(1)`)। API key লাগলে environment variable এ রাখো — কখনো কোডে hardcoded করবে না।

## Step 4 — Analyze with NumPy আর Pandas

```python
import numpy as np

# Column rename for clarity
df["price"] = df["current_price"]
df["change_24h"] = df["price_change_percentage_24h"]
df["market_cap_b"] = df["market_cap"] / 1e9   # billions

# Top gainers আর losers
gainers = df.nlargest(5, "change_24h")[["id", "price", "change_24h"]]
losers = df.nsmallest(5, "change_24h")[["id", "price", "change_24h"]]

print("=== Top 5 Gainers (24h) ===")
print(gainers.to_string(index=False))
print("\n=== Top 5 Losers (24h) ===")
print(losers.to_string(index=False))

# NumPy statistics
prices = df["price"].to_numpy()
caps = df["market_cap_b"].to_numpy()

print(f"\n=== Market Statistics ===")
print(f"Total Market Cap: {caps.sum():.1f}B USD")
print(f"Mean Price:       ${prices.mean():.2f}")
print(f"Median Price:     ${np.median(prices):.2f}")
print(f"Price Std:        ${prices.std():.2f}")
```

```python
# Market cap distribution — NumPy histogram
bins = [0, 1, 10, 50, 100, 500, np.inf]
labels = ["<1B", "1-10B", "10-50B", "50-100B", "100-500B", "500B+"]
df["cap_tier"] = pd.cut(df["market_cap_b"], bins=bins, labels=labels)

distribution = df["cap_tier"].value_counts().sort_index()
print("Market Cap Distribution:")
print(distribution)
```

> [!note]
> দেখো কীভাবে Pandas আর NumPy মিলে কাজ করছে — Pandas দিয়ে filter/sort/categorize, NumPy দিয়ে fast statistical computation। `.to_numpy()` দিয়ে column কে array তে convert করে vectorized math করা যায়। এটাই data analysis workflow।

## Step 5 — Visualization Concept

Chart বানাতে `matplotlib` ব্যবহার করা যায়:

```python
import matplotlib.pyplot as plt

# Bar chart — Top 10 by market cap
top10 = df.nlargest(10, "market_cap_b")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Left: Market cap bar chart
axes[0].barh(top10["id"], top10["market_cap_b"], color="steelblue")
axes[0].set_xlabel("Market Cap (Billion USD)")
axes[0].set_title("Top 10 Crypto by Market Cap")

# Right: Price change distribution histogram
changes = df["change_24h"].dropna()
axes[1].hist(changes, bins=30, color="coral", edgecolor="black")
axes[1].axvline(x=0, color="red", linestyle="--", label="0% change")
axes[1].set_xlabel("24h Price Change (%)")
axes[1].set_title("Price Change Distribution")
axes[1].legend()

plt.tight_layout()
plt.savefig("crypto_analysis.png", dpi=150)
plt.show()
print("Chart saved: crypto_analysis.png")
```

> [!tip]
> Visualization data story বলার সবচেয়ে ভালো উপায়। Left chart এ দেখবে Bitcoin আর Ethereum বাকিদের চেয়ে কত বড়। Right chart এ দেখবে বেশিরভাগ coin এর change 0% এর কাছে — কিছু outlier দুই দিকে। এই insight সংখ্যা দিয়ে বোঝানো কঠিন, chart এ স্পষ্ট।

## Complete Script

```python
"""
API Consumer Project — Crypto Market Analysis
Fetch → Normalize → Analyze → Visualize
"""
import requests
import pandas as pd
import numpy as np
import time

def fetch_crypto_data(per_page=50):
    """CoinGecko API থেকে top crypto data fetch"""
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": 1,
        "sparkline": False
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()

def analyze(data):
    """JSON → DataFrame → Analysis"""
    df = pd.json_normalize(data)
    prices = df["current_price"].to_numpy()
    caps = df["market_cap"].to_numpy() / 1e9

    print(f"Coins analyzed: {len(df)}")
    print(f"Total Market Cap: {caps.sum():.1f}B USD")
    print(f"Top 3: {df.nlargest(3, 'market_cap')['id'].tolist()}")
    print(f"Avg 24h change: {df['price_change_percentage_24h'].mean():.2f}%")

    # Save
    df.to_parquet("crypto_data.parquet", engine="pyarrow")
    df.to_csv("crypto_data.csv", index=False)
    print("Saved: Parquet + CSV")
    return df

# --- Main ---
if __name__ == "__main__":
    data = fetch_crypto_data()
    df = analyze(data)
```

> [!example]
> পুরো pipeline: API call → JSON parse → DataFrame flatten → NumPy analysis → export। এই pattern production এ বারবার দেখবে — dashboard backend, data pipeline, trading bot, সবখানে। Function আলাদা রাখা যাতে পরে আলাদা API বা logic swap করা যায়।

## Summary

এই project এ আমরা API থেকে JSON fetch করে analyze করার সম্পূর্ণ pipeline বানালাম। `requests.get` দিয়ে API call, `pd.json_normalize` দিয়ে nested JSON flatten, Pandas/NumPy দিয়ে analysis, matplotlib দিয়ে visualization। API rate limit সম্মান করো, error handle করো, আর result Parquet এ save করো। Python + NumPy + Pandas একসাথে — এটাই data science workflow।