## Structured Array কী?

সাধারণ NumPy array তে সব element একই type এর হয়। কিন্তু মাঝে মাঝে দরকার হয় — প্রতিটা element এ একাধিক field থাকবে, প্রতিটা field এর type আলাদা। Database row বা C struct এর মতো। এটাই **structured array**।

```python
import numpy as np

# একটা structured dtype তৈরি
dt = np.dtype([
    ('name', 'U20'),        # unicode string, max 20 char
    ('age', 'i4'),          # 32-bit int
    ('height', 'f8'),       # 64-bit float
    ('active', '?')         # boolean
])

# এই dtype দিয়ে array তৈরি
people = np.array([
    ('Karim', 25, 5.9, True),
    ('Sadia', 22, 5.4, False),
    ('Rahim', 30, 5.11, True)
], dtype=dt)

print(people)
# [('Karim', 25, 5.9 , True) ('Sadia', 22, 5.4 , False) ('Rahim', 30, 5.11, True)]
```

> [!note]
> dtype code গুলো: `'i4'` = 32-bit int, `'f8'` = 64-bit float, `'U20'` = unicode string (20 char), `'?'` = boolean, `'datetime64[D]'` = date। এগুলো C এর type specifier থেকে এসেছে।

## Field Access

Structured array তে field গুলো **name দিয়ে** access করা যায় — column এর মতো:

```python
# শুধু age field
print(people['age'])
# [25 22 30]

# শুধু height
print(people['height'])
# [5.9  5.4  5.11]

# একটা record পুরো
print(people[0])
# ('Karim', 25, 5.9, True)

# নির্দিষ্ট field filter
adults = people[people['age'] >= 25]
print(adults['name'])
# ['Karim' 'Rahim']
```

> [!tip]
> Structured array হলো C struct বা database row এর NumPy version। যখন অনেক record এর উপর fast column-wise operation দরকার, তখন এটা useful। তবে সাধারণ analysis এর জন্য Pandas DataFrame বেশি comfortable।

## কেন Structured Array?

```python
# Binary file থেকে structured data read (C output, sensor data, etc.)
dt = np.dtype([('timestamp', 'datetime64[ms]'), ('value', 'f8')])
sensor_data = np.zeros(1000, dtype=dt)

# এখন memory efficient আর fast
sensor_data['value'] = rng.normal(0, 1, 1000)
print(sensor_data[:3])
```

> [!note]
> Structured array খুব memory efficient — C struct এর মতো contiguous memory তে থাকে। Binary file format (sensor log, scientific instrument output) parse করার সময় এটা দারুণ কাজে দেয়।

## Masked Array — Invalid Data Handle

কখনো ডেটার কিছু value invalid থাকে — sensor error, missing reading, outlier। `NaN` দিয়েও mark করা যায় কিন্তু integer array তে `NaN` রাখা যায় না। এখানে **masked array** (`np.ma`) কাজে দেয় — invalid value গুলো mask করে দেওয়া যায়, computation স্বয়ংক্রিয়ভাবে masked value ignore করে।

```python
import numpy.ma as ma

# sensor reading — কিছু -9999 (invalid sentinel)
readings = np.array([23.5, 24.1, -9999, 22.8, 25.0, -9999, 24.5])

# -9999 গুলো mask করো
masked = ma.masked_where(readings == -9999, readings)
print(masked)
# [23.5 24.1 -- 22.8 25.0 -- 24.5]

# mean করলে masked value automatically ignore হবে
print(masked.mean())   # 23.98 — valid value গুলোর গড়

# তুলনা: সাধারণ mean
print(readings.mean())   # -2824.8 — ভুল! -9999 গুলো এসে গেছে
```

> [!danger]
> দেখলে তো পার্থক্য? `-9999` গুলো বাদ না দিলে mean সম্পূর্ণ ভুল আসে! Masked array এটা স্বয়ংক্রিয়ভাবে handle করে। আর integer data তে `NaN` রাখা যায় না — masked array সেখানেও কাজ করে।

## np.ma এর কমন Method

```python
# masked_greater — একটা value এর বেশি গুলো mask
data = np.array([1, 5, 10, 15, 3, 20])
masked = ma.masked_greater(data, 10)
print(masked)               # [1 5 10 -- 3 --]
print(masked.mean())        # 4.75 — শুধু valid গুলোর mean

# masked_inside — range এর ভেতরের গুলো mask
masked2 = ma.masked_inside(data, 5, 15)
print(masked2)              # [1 -- -- -- 3 20]

# fill_value দিয়ে masked গুলো replace করা
filled = masked.filled(fill_value=np.nan)
print(filled)               # [1. 5. 10. nan 3. nan]
```

| Method | কী করে |
|--------|--------|
| `ma.masked_where(cond, arr)` | condition match হলে mask |
| `ma.masked_greater(arr, val)` | বড় value mask |
| `ma.masked_invalid(arr)` | NaN/inf mask |
| `.filled(val)` | masked গুলো value দিয়ে replace |
| `.compressed()` | masked গুলো বাদ দিয়ে 1D array |

## কখন Structured/Masked Array ব্যবহার করবে?

```python
# সাধারণ analysis → Pandas (বেশি comfortable)
import pandas as pd
df = pd.read_csv("data.csv")  # column name, missing value — সব easy

# কিন্তু যখন...
# 1. Memory efficiency extreme দরকার → structured array
# 2. Binary/C format data → structured array
# 3. Integer তে missing value → masked array
# 4. Scientific instrument output → masked array
```

> [!warn]
> সাধারণ data analysis এর জন্য Pandas ব্যবহার করো — এটা অনেক বেশি user-friendly। Structured আর masked array মূলত specialized scientific computing scenario তে দরকার হয়। তবে জেনে রাখা ভালো — কারেন্ট অ্যাপ্লিকেশন এ হঠাৎ দরকার হতে পারে।

## Practical — Sensor Data

```python
import numpy as np
import numpy.ma as ma

# Temperature sensor — কিছু reading corrupt
dt = np.dtype([('time', 'datetime64[s]'), ('temp', 'f4')])
raw = np.array([
    ('2026-01-01T00:00:00', 22.5),
    ('2026-01-01T01:00:00', -999.0),   # corrupt!
    ('2026-01-01T02:00:00', 21.8),
    ('2026-01-01T03:00:00', -999.0),   # corrupt!
    ('2026-01-01T04:00:00', 23.1),
], dtype=dt)

# corrupt value mask করো
temps = ma.masked_where(raw['temp'] < -100, raw['temp'])

print(f"Valid readings: {temps.count()}")       # 3
print(f"Average temp: {temps.mean():.1f}°C")    # 22.5°C
print(f"Max temp: {temps.max():.1f}°C")         # 23.1°C
```

> [!example]
> Sensor data, climate data, financial data — সব জায়গায় invalid/missing value common। Masked array দিয়ে এগুলো clean handle করা যায় একদম calculation এ গড়িয়ে না দিয়ে।

## Summary

Structured array তে multiple typed field থাকে — C struct বা DB row এর মতো। Masked array (`np.ma`) invalid value mask করে, computation সেগুলো ignore করে। সাধারণ analysis এ Pandas বেশি practical, কিন্তু এই advanced feature গুলো specialized ক্ষেত্রে powerful। পরের chapter এ performance tips শিখবো।