## Datetime — Time Series এর ভিত্তি

Time series হলো Pandas এর সবচেয়ে powerful feature গুলোর একটি। Stock price, temperature log, sales record — সবই time series। Pandas তারিখ বুঝে কাজ করতে পারে, যেটা plain Python এ খুব কঠিন।

```python
import pandas as pd
import numpy as np

# String থেকে datetime
dates = pd.to_datetime(["2026-01-15", "2026-03-20", "2026-07-04"])
print(dates)
# DatetimeIndex(['2026-01-15', '2026-03-20', '2026-07-04'], dtype='datetime64[ns]')
```

```python
# Column convert
df = pd.DataFrame({
    "date": ["2026-01-01", "2026-01-02", "2026-01-03"],
    "sales": [100, 150, 120]
})
df["date"] = pd.to_datetime(df["date"])
print(df.dtypes)
# date     datetime64[ns]
# sales             int64
```

> [!note]
> `pd.to_datetime()` যেকোনো format এর date string কে parse করতে পারে। কিন্তু অদ্ভুত format হলে `format=` parameter দিতে হয়: `pd.to_datetime(df["date"], format="%d/%m/%Y")`।

## pd.date_range — তারিখ সিকোয়েন্স তৈরি

```python
# প্রতিদিন — ১ মাস
daily = pd.date_range("2026-01-01", "2026-01-31", freq="D")
print(len(daily))   # 31

# প্রতি মাসের প্রথম দিন
monthly = pd.date_range("2026-01-01", "2026-12-31", freq="MS")
print(monthly)
# DatetimeIndex(['2026-01-01', '2026-02-01', ..., '2026-12-01'])

# প্রতি ঘন্টা
hourly = pd.date_range("2026-01-01", periods=24, freq="h")
print(len(hourly))  # 24
```

| freq code | মানে |
|-----------|------|
| `D` | প্রতিদিন |
| `W` | সাপ্তাহিক |
| `MS` | মাসের শুরু |
| `ME` | মাসের শেষ |
| `QE` | quarter এর শেষ |
| `h` | প্রতি ঘন্টা |
| `min` | প্রতি মিনিট |

## DatetimeIndex দিয়ে Indexing

Date কে index বানালে date দিয়ে query করা যায়:

```python
rng = np.random.default_rng(42)
dates = pd.date_range("2026-01-01", "2026-12-31", freq="D")
df = pd.DataFrame({
    "date": dates,
    "sales": rng.integers(50, 200, len(dates)).astype(float)
})
df = df.set_index("date")

# নির্দিষ্ট দিন
print(df.loc["2026-03-15"])

# একটা মাসের সব
print(df.loc["2026-03"].head())

# Date range
print(df.loc["2026-03-01":"2026-03-07"])
```

> [!tip]
> DatetimeIndex দিয়ে slicing খুব easy — `df.loc["2026-03"]` দিলে পুরো March এর ডেটা চলে আসে! String date দিয়েও range slice করা যায়: `df.loc["2026-01":"2026-06"]` — January থেকে June পর্যন্ত।

## resample — Downsample আর Upsample

`resample` হলো time-based groupby। যেমন daily ডেটা থেকে monthly summary:

```python
# Daily → Monthly (downsample)
monthly_sales = df["sales"].resample("ME").sum()
print(monthly_sales.head())
```

```text
date
2026-01-31    3850
2026-02-28    3520
2026-03-31    4100
...
```

```python
# একসাথে multiple aggregation
monthly_stats = df["sales"].resample("ME").agg(["sum", "mean", "max"])
print(monthly_stats.head())
```

```text
              sum        mean    max
date
2026-01-31  3850.0  124.193548  198.0
2026-02-28  3520.0  125.714286  195.0
2026-03-31  4100.0  132.258065  199.0
```

```python
# Upsample — daily থেকে hourly (missing value fill)
hourly = df["sales"].resample("h").ffill()  # forward fill
```

> [!note]
> Downsample মানে frequency কমানো (daily→monthly) — aggregate করতে হয় (`sum`, `mean`)। Upsample মানে frequency বাড়ানো (daily→hourly) — missing value fill করতে হয় (`ffill`, `interpolate`)।

## rolling — Moving Average

```python
# 7-day moving average
df["ma_7"] = df["sales"].rolling(window=7).mean()
print(df[["sales", "ma_7"]].head(10))
```

```text
              sales       ma_7
date
2026-01-01    112.0       NaN
2026-01-02    185.0       NaN
...
2026-01-07    145.0  133.857143
2026-01-08    198.0  143.571429
```

```python
# 30-day rolling with custom aggregation
df["rolling_std"] = df["sales"].rolling(30).std()
```

> [!example]
> Moving average হলো noise কমানোর classic technique। Stock price analysis এ daily price অনেক noisy — 7-day বা 30-day moving average দিলে trend পরিষ্কার দেখা যায়। `rolling(7).mean()` দিলে প্রতিটা point এ গত ৭ দিনের average বসে।

## shift আর diff

```python
# shift — value গুলো নিচে/উপরে সরায়
df["prev_day"] = df["sales"].shift(1)      # আগের দিনের value
df["next_day"] = df["sales"].shift(-1)     # পরের দিনের value

# diff — আগের দিনের সাথে পার্থক্য
df["daily_change"] = df["sales"].diff()    # today - yesterday

# pct_change — percentage change
df["pct_change"] = df["sales"].pct_change()

print(df[["sales", "prev_day", "daily_change", "pct_change"]].head(5))
```

```text
              sales  prev_day  daily_change  pct_change
date
2026-01-01    112.0       NaN           NaN         NaN
2026-01-02    185.0     112.0          73.0    0.651786
2026-01-03     95.0     185.0         -90.0   -0.486486
```

> [!tip]
> `shift` আর `diff` হলো time series feature engineering এর মূল টুল। Stock price এর "আগের দিনের price", sales এর "গত সপ্তাহের sales" — সব এই দুটো দিয়ে করা যায়। Machine learning model এ lag feature তৈরি করতে এগুলো লাগে।

## Timezone Handle

```python
# Timezone naive datetime
ts = pd.Timestamp("2026-01-15 10:00:00")

# Timezone localize — timezone assign
ts_dhaka = ts.tz_localize("Asia/Dhaka")
print(ts_dhaka)
# 2026-01-15 10:00:00+06:00

# Timezone convert — অন্য timezone এ convert
ts_utc = ts_dhaka.tz_convert("UTC")
print(ts_utc)
# 2026-01-15 04:00:00+00:00

ts_ny = ts_dhaka.tz_convert("America/New_York")
print(ts_ny)
# 2026-01-14 23:00:00-05:00
```

> [!warn]
> Timezone নিয়ে confuse হবে না! `tz_localize` হলো "এই timezone এ আছে" বলা — naive datetime কে timezone-aware বানায়। `tz_convert` হলো এক timezone থেকে আরেকটায় সরানো। Global app এ এই দুটো খুব জরুরি।

## Practical — Daily Sales Analysis

```python
import pandas as pd
import numpy as np

rng = np.random.default_rng(42)
dates = pd.date_range("2026-01-01", "2026-12-31", freq="D")

# Daily sales ডেটা তৈরি (trend + noise)
trend = np.linspace(100, 200, len(dates))
noise = rng.normal(0, 15, len(dates))
seasonal = 30 * np.sin(np.arange(len(dates)) * 2 * np.pi / 7)  # weekly pattern

df = pd.DataFrame({
    "date": dates,
    "sales": (trend + noise + seasonal).round(2)
}).set_index("date")

# Monthly summary
monthly = df["sales"].resample("ME").agg(["sum", "mean", "std"])

# 7-day moving average (trend দেখতে)
df["ma_7"] = df["sales"].rolling(7).mean()

# Day-over-day change
df["change"] = df["sales"].diff()

# Best month
best_month = monthly["sum"].idxmax()
print(f"Best month: {best_month.strftime('%B')} — {monthly.loc[best_month, 'sum']:.0f}")
```

> [!example]
> এটা একটা complete time series analysis pipeline! ডেটা তৈরি → resample (monthly) → rolling (smoothing) → diff (change detection)। এই pattern stock analysis, sales forecasting, weather analysis — সব জায়গায় ব্যবহার হয়।

## Summary

`pd.to_datetime` দিয়ে date convert করো। DatetimeIndex দিয়ে date ভিত্তি query করো। `resample` দিয়ে frequency change করো। `rolling` দিয়ে moving average, `shift/diff` দিয়ে lag feature তৈরি করো। Timezone `tz_localize`/`tz_convert` দিয়ে handle করো। Time series হলো Pandas এর superpower — পরের chapter এ MultiIndex শিখবো।