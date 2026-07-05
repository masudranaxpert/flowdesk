# Standard Library Gems

Python's standard library is a massive treasure chest — there are ready-made modules for almost everything. Knowing them will make your code much more powerful and reduce your reliance on third-party packages. Let's look at the most useful ones.

## `collections` — Advanced Data Structures

### `Counter` — Easy Counting

```python
from collections import Counter

text = "the quick brown fox jumps over the lazy dog the fox"
word_counts = Counter(text.split())
print(word_counts)
# Counter({'the': 3, 'fox': 2, 'quick': 1, 'brown': 1, ...})

# Most common ones
print(word_counts.most_common(3))
# [('the', 3), ('fox', 2), ('quick', 1)]
```

### `defaultdict` — Default Value for Missing Keys

```python
from collections import defaultdict

# Old way — verbose
groups = {}
for name, dept in [("Karim", "IT"), ("Sadia", "HR"), ("Rahim", "IT")]:
    if dept not in groups:
        groups[dept] = []
    groups[dept].append(name)

# With defaultdict — clean!
groups = defaultdict(list)
for name, dept in [("Karim", "IT"), ("Sadia", "HR"), ("Rahim", "IT")]:
    groups[dept].append(name)  # if key doesn't exist, automatically an empty list

print(dict(groups))  # {'IT': ['Karim', 'Rahim'], 'HR': ['Sadia']}
```

### `namedtuple` — Self-Documenting Tuples

```python
from collections import namedtuple

# Old way — you have to remember the index
point = (3, 5)
print(point[0])  # x? who knows!

# namedtuple — readable
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 5)
print(p.x)       # 3
print(p.y)       # 5
print(p[0])      # 3 (index works too)
```

### `deque` — Fast Double-Ended Queue

```python
from collections import deque

# Inserting at the start of a list is O(n) — slow
# With deque, both ends are O(1) — fast!

queue = deque(["Karim", "Sadia"])
queue.append("Rahim")       # right side
queue.appendleft("Nadia")   # left side
print(queue)  # deque(['Nadia', 'Karim', 'Sadia', 'Rahim'])

queue.pop()       # Rahim (from the right)
queue.popleft()   # Nadia (from the left)
print(queue)      # deque(['Karim', 'Sadia'])
```

> [!tip]
> When you need a queue or stack, use `deque`, not `list`. Inserting or removing at the beginning of a list requires shifting all elements (O(n)), but with deque it's O(1).

## `itertools` — A Treasure Trove of Iterator Tools

```python
from itertools import chain, product, combinations, permutations
```

### `chain` — Join Multiple Iterables

```python
a = [1, 2, 3]
b = [4, 5, 6]

# More memory efficient than list concatenation
for item in chain(a, b):
    print(item, end=" ")
# 1 2 3 4 5 6
```

### `product` — Cartesian Product

```python
# All combinations of two dice
dice = list(product([1, 2, 3, 4, 5, 6], repeat=2))
print(len(dice))  # 36
print(dice[:5])
# [(1, 1), (1, 2), (1, 3), (1, 4), (1, 5)]
```

### `combinations` and `permutations`

```python
people = ["Karim", "Sadia", "Rahim"]

# Pairs (order doesn't matter)
pairs = list(combinations(people, 2))
print(pairs)
# [('Karim', 'Sadia'), ('Karim', 'Rahim'), ('Sadia', 'Rahim')]

# Arrangements (order matters)
arrangements = list(permutations(people, 2))
print(arrangements)
# [('Karim', 'Sadia'), ('Karim', 'Rahim'), ('Sadia', 'Karim'), ...]
```

## `functools` — Higher-Order Functions

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

### `partial` — Fixing Some Arguments of a Function

```python
from functools import partial

def power(base, exponent):
    return base ** exponent

# Fix the exponent to create a new function
square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))  # 25
print(cube(3))    # 27
```

### `reduce` — Cumulative Operation

```python
from functools import reduce

# Multiply all elements in a list
nums = [1, 2, 3, 4, 5]
product_all = reduce(lambda a, b: a * b, nums)
print(product_all)  # 120

# Alternative — this is more Pythonic:
import math
print(math.prod(nums))  # 120
```

## `pathlib` — The Modern Way to Handle File Paths

```python
from pathlib import Path

# Path creation and operations
p = Path("data") / "reports" / "2026" / "july.csv"
print(p)            # data/reports/2026/july.csv
print(p.suffix)     # .csv
print(p.stem)       # july
print(p.parent)     # data/reports/2026

# Find all Python files
py_files = list(Path(".").rglob("*.py"))
print(f"Found {len(py_files)} Python files")

# File read/write — in one line!
content = Path("config.txt").read_text(encoding="utf-8")
Path("output.txt").write_text("New content", encoding="utf-8")
```

## `datetime` — Dates and Times

```python
from datetime import datetime, date, timedelta

# Current time
now = datetime.now()
print(f"Now: {now:%d/%m/%Y %H:%M:%S}")

# A specific date
birthday = date(2000, 5, 15)
today = date.today()
age_days = (today - birthday).days
print(f"{age_days} days since birth")

# Date arithmetic
next_week = today + timedelta(weeks=1)
print(f"Next week: {next_week}")

# ISO format parsing
event = datetime.fromisoformat("2026-07-03T14:30:00")
print(f"Event: {event}")
```

> [!note]
> For working with timezones in Python 3.9+, use the `zoneinfo` module — it's part of the standard library. For complex date manipulation, the third-party packages `pendulum` or `arrow` are popular.

## `math` and `statistics`

```python
import math
import statistics

# Math
print(math.ceil(3.2))      # 4 (round up)
print(math.floor(3.8))     # 3 (round down)
print(math.factorial(5))   # 120
print(math.log2(8))        # 3.0
print(math.gcd(12, 8))     # 4

# Statistics
scores = [85, 92, 78, 95, 88, 67, 91]
print(statistics.mean(scores))     # 85.14
print(statistics.median(scores))   # 88
print(statistics.mode(scores))     # most common
print(statistics.stdev(scores))    # standard deviation
```

## All Together — A Mini Data Analysis

```python
from collections import Counter
from pathlib import Path
from statistics import mean
import datetime

# IP frequency and average response time from a log file
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

print("Top 5 IPs:")
for ip, count in ip_counter.most_common(5):
    print(f"  {ip}: {count} times")

if response_times:
    print(f"\nAverage response time: {mean(response_times):.1f}ms")
```

> [!example]
> Notice — this entire analysis was done with the standard library, no third-party package needed. Python's stdlib truly is "batteries included"!

## Summary

Python's standard library is a goldmine. `collections` gives you Counter, defaultdict, and deque for everyday tasks. `itertools` and `functools` enable powerful data processing. `pathlib` and `datetime` are the modern standards. Knowing these means you can accomplish a lot without any third-party packages.