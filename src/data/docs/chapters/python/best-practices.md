"Pythonic" code মানে — Python এর idiomatic pattern মেনে লেখা, যেন দেখলেই বোঝা যায় এটা Python code, জাভা বা C++ এর Python translation না। এই chapter এ আমরা দেখবো কিভাবে তোমার code সত্যিকারের Pythonic হবে।

## PEP 8 — Style Guide

PEP 8 হলো Python এর official style guide। কিছু essential নিয়ম:

```python
# ✅ ভালো — snake_case function/variable
def calculate_average(scores):
    total_score = sum(scores)
    return total_score / len(scores)

# ❌ খারাপ — camelCase (জাভা স্টাইল)
# def calculateAverage(scores):
#     totalScore = sum(scores)

# ✅ Class নাম PascalCase
class UserProfile:
    pass

# ✅ Constants UPPER_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# ✅ Import — এক লাইনে একটা
import os
import sys
from pathlib import Path

# ❌ এক লাইনে একাধিক
# import os, sys
```

> [!note]
> PEP 8 মনে রাখার দরকার নেই — `ruff` সব automatically fix করে দেবে। শুধু tool টা ব্যবহার করো, নিচে দেখানো হয়েছে।

## PEP 20 — The Zen of Python

```python
import this
```

```text
The Zen of Python, by Tim Peters

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Readability counts.
...
```

> [!tip]
> `import this` terminal এ run করে দেখো — Python এর ১৯টা design principle। এগুলো শুধু পড়লেই হবে না, code এ প্রয়োগ করতে হবে। "Explicit is better than implicit" আর "Readability counts" — এই দুটো বিশেষ মনে রাখবে।

## Pythonic Idioms

### Truthiness — `if items:` না কি `if len(items) > 0:`

```python
# ❌ Unpythonic
items = [1, 2, 3]
if len(items) > 0:
    print("list এ element আছে")

if items != []:
    print("list empty না")

if len(items) == 0:
    print("list empty")

# ✅ Pythonic
if items:           # truthy check
    print("list এ element আছে")

if not items:       # falsy check
    print("list empty")
```

### Enumeration — index সহ loop

```python
# ❌ Unpythonic
fruits = ["apple", "banana", "cherry"]
for i in range(len(fruits)):
    print(f"{i}: {fruits[i]}")

# ✅ Pythonic
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")
# 0: apple
# 1: banana
# 2: cherry
```

### Multiple Assignment

```python
# ❌ temp variable দিয়ে swap
a = 5
b = 10
temp = a
a = b
b = temp

# ✅ Pythonic — tuple unpacking
a, b = b, a

# Multiple variables
x, y, z = 1, 2, 3

# tuple unpack
name, age, city = ("Karim", 25, "Dhaka")
```

### EAFP vs LBYL

```python
# LBYL (Look Before You Leap) — ❌ less Pythonic
def get_value(dictionary, key):
    if key in dictionary:
        return dictionary[key]
    else:
        return None

# EAFP (Easier to Ask Forgiveness than Permission) — ✅ Pythonic
def get_value(dictionary, key):
    try:
        return dictionary[key]
    except KeyError:
        return None
```

> [!example]
> Python এ EAFP style বেশি preferred — "try করে দেখো, error হলে handle করো"। এটা দ্রুত (race condition avoid করে) আর readable। বিশেষ করে file, dict, database operation এ।

### String Join

```python
words = ["Python", "হলো", "দারুণ"]

# ❌ loop দিয়ে concatenate
sentence = ""
for word in words:
    sentence += word + " "
sentence = sentence.strip()

# ✅ Pythonic — join
sentence = " ".join(words)
```

### Dict `.get()` আর `.setdefault()`

```python
user = {"name": "Karim"}

# ❌
if "age" in user:
    age = user["age"]
else:
    age = 0

# ✅ Pythonic
age = user.get("age", 0)
```

## `ruff` — 2026 এর Linter আর Formatter

`ruff` (Astral এর) হলো 2026 এর Python linter আর formatter — flake8, black, isort সব একটায়। Rust এ লেখা, অনেক fast:

```bash
# ইনস্টল
uv add ruff --dev

# Lint চেক
ruff check src/

# Auto-fix
ruff check --fix src/

# Format করো (black এর বিকল্প)
ruff format src/
```

```toml
# pyproject.toml এ configuration
[tool.ruff]
line-length = 100
target-version = "py314"

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort (import sorting)
    "UP",   # pyupgrade (modern syntax)
    "B",    # flake8-bugbear
]
```

> [!tip]
> `ruff` কে `pre-commit` hook আর CI/CD pipeline এ যোগ করো। প্রতিটা commit এ automatically lint আর format হবে। `black` আর `flake8` এর জায়গায় সবাই এখন `ruff` ব্যবহার করে — একটাই tool, অনেক fast।

## `logging` — `print` এর জায়গায়

```python
# ❌ Production এ print না
def process_order(order_id):
    print(f"Processing {order_id}")
    # ...
    print("Done!")

# ✅ logging module ব্যবহার করো
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def process_order(order_id: str) -> None:
    logger.info(f"Processing order {order_id}")
    try:
        # ... processing logic
        logger.info(f"Order {order_id} completed successfully")
    except Exception as e:
        logger.error(f"Order {order_id} failed: {e}", exc_info=True)
```

```text
2026-07-03 14:30:15 [INFO] myapp.orders: Processing order #12345
2026-07-03 14:30:16 [INFO] myapp.orders: Order #12345 completed successfully
```

> [!danger]
> Production code এ কখনো `print()` ব্যবহার করবে না। `logging` module দিয়ে — log level control (DEBUG/INFO/WARNING/ERROR), file output, structured logging — সব পাওয়া যায়। `print` শুধু quick debugging এর জন্য।

## Debugging — `breakpoint()`

```python
def calculate_total(items: list[float]) -> float:
    total = 0
    for item in items:
        total += item
        breakpoint()  # এখানে execution pause হবে!
        # pdb/python3.14 এর debugger খুলবে
    return total
```

```text
> /path/to/file.py(5)calculate_total()
-> total += item
(Pdb) p total        # variable দেখো
(Pdb) p item
(Pdb) n              # next line
(Pdb) c              # continue
(Pdb) q              # quit
```

> [!note]
> `breakpoint()` হলো Python 3.7+ এর built-in debugger entry point। যেকোনো জায়গায় লাগিয়ে দাও, code সেখানে pause হবে আর interactive debugger খুলবে। `pdb` command গুলো শিখে রাখো — `n` (next), `c` (continue), `p` (print), `l` (list), `q` (quit)।

## `if __name__ == "__main__":` Guard

```python
# main.py
def main():
    print("App চলছে...")

# ✅ সবসময় guard রাখবে
if __name__ == "__main__":
    main()
```

> [!tip]
> এই guard ছাড়া, যদি কেউ তোমার ফাইল import করে, `main()` automatically চলে যাবে — যেটা তুমি চাও না। সব entry-point script এ এটা রাখো।

## Project Layout

```text
myproject/
├── pyproject.toml        # config এর single source
├── uv.lock               # dependency lock
├── README.md
├── src/
│   └── myproject/
│       ├── __init__.py
│       ├── main.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   └── test_main.py
└── .github/
    └── workflows/
        └── ci.yml
```

> [!example]
> `src/` layout হলো 2026 এর standard — package কে `src/` এর ভেতরে রাখা। এতে import test করা সহজ (installed package থেকে import হয়, current directory থেকে না) আর packaging ও clean হয়।

## Summary

Pythonic code লিখতে — idiomatic pattern ব্যবহার করো (`if items:` না কি `if len(items) > 0:`), EAFP style, comprehension, tuple unpacking। `ruff` দিয়ে lint আর format করো। Production এ `logging`, `print` না। Debugging এ `breakpoint()`। সব script এ `__main__` guard। `src/` layout ব্যবহার করো। এগুলো অভ্যস্ত হলে তোমার code পেশাদার মানের হবে।