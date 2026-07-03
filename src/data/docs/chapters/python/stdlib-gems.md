Python এর standard library হলো এক বিশাল ভাণ্ডার — একদম সব কাজের জন্য ready-made module আছে। এগুলো জানলে তোমার code অনেক শক্তিশালী হবে আর third-party package ও কম লাগবে। চলো সবচেয়ে useful গুলো দেখি।

## `collections` — ডেটা Structure এর উন্নত সংস্করণ

### `Counter` — গণনা করার সহজ উপায়

```python
from collections import Counter

text = "the quick brown fox jumps over the lazy dog the fox"
word_counts = Counter(text.split())
print(word_counts)
# Counter({'the': 3, 'fox': 2, 'quick': 1, 'brown': 1, ...})

# সবচেয়ে common গুলো
print(word_counts.most_common(3))
# [('the', 3), ('fox', 2), ('quick', 1)]
```

### `defaultdict` — Missing Key তে Default Value

```python
from collections import defaultdict

# পুরোনো উপায় — verbose
groups = {}
for name, dept in [("Karim", "IT"), ("Sadia", "HR"), ("Rahim", "IT")]:
    if dept not in groups:
        groups[dept] = []
    groups[dept].append(name)

# defaultdict দিয়ে — clean!
groups = defaultdict(list)
for name, dept in [("Karim", "IT"), ("Sadia", "HR"), ("Rahim", "IT")]:
    groups[dept].append(name)  # key না থাকলে automatically empty list

print(dict(groups))  # {'IT': ['Karim', 'Rahim'], 'HR': ['Sadia']}
```

### `namedtuple` — Self-Documenting Tuple

```python
from collections import namedtuple

# পুরোনো — index মনে রাখতে হয়
point = (3, 5)
print(point[0])  # x? কে জানে!

# namedtuple — readable
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 5)
print(p.x)       # 3
print(p.y)       # 5
print(p[0])      # 3 (index ও চলে)
```

### `deque` — Fast Double-Ended Queue

```python
from collections import deque

# list এর শুরুতে insert করলে O(n) — slow
# deque এ দুই পাশেই O(1) — fast!

queue = deque(["Karim", "Sadia"])
queue.append("Rahim")       # ডানে
queue.appendleft("Nadia")   # বামে
print(queue)  # deque(['Nadia', 'Karim', 'Sadia', 'Rahim'])

queue.pop()       # Rahim (ডান থেকে)
queue.popleft()   # Nadia (বাম থেকে)
print(queue)      # deque(['Karim', 'Sadia'])
```

> [!tip]
> Queue বা stack implement করতে গেলে `deque` ব্যবহার করো, `list` না। List এর শুরুতে insert/remove করলে সব element shift করতে হয় (O(n)), কিন্তু deque এ O(1)।

## `itertools` — Iterator টুলের ভাণ্ডার

```python
from itertools import chain, product, combinations, permutations
```

### `chain` — একাধিক Iterable জোড়া লাগাও

```python
a = [1, 2, 3]
b = [4, 5, 6]

# list concatenation এর চেয়ে memory efficient
for item in chain(a, b):
    print(item, end=" ")
# 1 2 3 4 5 6
```

### `product` — Cartesian Product

```python
# দুই dice এর সব combination
dice = list(product([1, 2, 3, 4, 5, 6], repeat=2))
print(len(dice))  # 36
print(dice[:5])
# [(1, 1), (1, 2), (1, 3), (1, 4), (1, 5)]
```

### `combinations` আর `permutations`

```python
people = ["Karim", "Sadia", "Rahim"]

# জোড়া (order গুরুত্বপূর্ণ না)
pairs = list(combinations(people, 2))
print(pairs)
# [('Karim', 'Sadia'), ('Karim', 'Rahim'), ('Sadia', 'Rahim')]

# arrangement (order গুরুত্বপূর্ণ)
arrangements = list(permutations(people, 2))
print(arrangements)
# [('Karim', 'Sadia'), ('Karim', 'Rahim'), ('Sadia', 'Karim'), ...]
```

## `functools` — Higher-Order Function

### `lru_cache` — Automatic Memoization

```python
from functools import lru_cache
import time

@lru_cache(maxsize=256)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

start = time.perf_counter()
print(fib(200))  # 280571172992510140037611932413038677189525
print(f"{time.perf_counter() - start:.6f}s")
print(fib.cache_info())
# CacheInfo(hits=198, misses=201, maxsize=256, currsize=201)
```

### `partial` — Function এর কিছু Argument Fix করা

```python
from functools import partial

def power(base, exponent):
    return base ** exponent

# base fix করে নতুন function বানালাম
square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))  # 25
print(cube(3))    # 27
```

### `reduce` — Cumulative Operation

```python
from functools import reduce

# list এর সব element গুণ
nums = [1, 2, 3, 4, 5]
product_all = reduce(lambda a, b: a * b, nums)
print(product_all)  # 120

# বিকল্প — এটাই বেশি pythonic:
import math
print(math.prod(nums))  # 120
```

## `pathlib` — File Path এর Modern উপায়

```python
from pathlib import Path

# Path তৈরি আর operations
p = Path("data") / "reports" / "2026" / "july.csv"
print(p)            # data/reports/2026/july.csv
print(p.suffix)     # .csv
print(p.stem)       # july
print(p.parent)     # data/reports/2026

# সব Python ফাইল খোঁজা
py_files = list(Path(".").rglob("*.py"))
print(f"{len(py_files)} টা Python ফাইল পাওয়া গেছে")

# ফাইল read/write — এক লাইনে!
content = Path("config.txt").read_text(encoding="utf-8")
Path("output.txt").write_text("নতুন content", encoding="utf-8")
```

## `datetime` — তারিখ ও সময়

```python
from datetime import datetime, date, timedelta

# বর্তমান সময়
now = datetime.now()
print(f"এখন: {now:%d/%m/%Y %H:%M:%S}")

# নির্দিষ্ট তারিখ
birthday = date(2000, 5, 15)
today = date.today()
age_days = (today - birthday).days
print(f"জন্ম থেকে {age_days} দিন হলো")

# Date arithmetic
next_week = today + timedelta(weeks=1)
print(f"পরের সপ্তাহ: {next_week}")

# ISO format parsing
event = datetime.fromisoformat("2026-07-03T14:30:00")
print(f"Event: {event}")
```

> [!note]
> Timezone এর সাথে কাজ করতে হলে Python 3.9+ এ `zoneinfo` module ব্যবহার করো — এটা standard library এ আছে। আর জটিল date manipulation এর জন্য third-party `pendulum` বা `arrow` package popular।

## `math` আর `statistics`

```python
import math
import statistics

# Math
print(math.ceil(3.2))      # 4 (উপরের পূর্ণসংখ্যা)
print(math.floor(3.8))     # 3 (নিচের পূর্ণসংখ্যা)
print(math.factorial(5))   # 120
print(math.log2(8))        # 3.0
print(math.gcd(12, 8))     # 4

# Statistics
scores = [85, 92, 78, 95, 88, 67, 91]
print(statistics.mean(scores))     # 85.14
print(statistics.median(scores))   # 88
print(statistics.mode(scores))     # সবচেয়ে common
print(statistics.stdev(scores))    # standard deviation
```

## একসাথে — ছোট ডেটা Analysis

```python
from collections import Counter
from pathlib import Path
from statistics import mean
import datetime

# লগ ফাইল থেকে IP frequency আর average response time
log_lines = Path("access.log").read_text(encoding="utf-8").splitlines()

ip_counter = Counter()
response_times = []

for line in log_lines:
    parts = line.split()
    if len(parts) >= 3:
        ip = parts[0]
        ip_counter[ip] += 1
        if "ms" in parts[-1]:
            time_ms = int(parts[-1].replace("ms", ""))
            response_times.append(time_ms)

print("Top 5 IP:")
for ip, count in ip_counter.most_common(5):
    print(f"  {ip}: {count} বার")

if response_times:
    print(f"\nAverage response time: {mean(response_times):.1f}ms")
```

> [!example]
> লক্ষ্য করো — এই পুরো analysis টা standard library দিয়েই হলো, কোনো third-party package লাগে নি। Python stdlib সত্যিই "batteries included"!

## Summary

Python standard library হলো এক goldmine। `collections` এ Counter, defaultdict, deque প্রতিদিনের কাজে দারুণ। `itertools` আর `functools` দিয়ে powerful data processing। `pathlib` আর `datetime` হলে আধুনিক standard। এগুলো জানলে অনেক কাজ third-party package ছাড়াই হয়ে যায়।