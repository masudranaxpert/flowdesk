# Best Practices

"Pythonic" code means — writing code that follows Python's idiomatic patterns, so that just by looking at it, you can tell it's Python code, not a Java or C++ translation into Python. In this chapter, we'll see how to make your code truly Pythonic.

## PEP 8 — Style Guide

PEP 8 is Python's official style guide. Some essential rules:

```python
# ✅ Good — snake_case for functions/variables
def calculate_average(scores):
    total_score = sum(scores)
    return total_score / len(scores)

# ❌ Bad — camelCase (Java style)
# def calculateAverage(scores):
#     totalScore = sum(scores)

# ✅ Class names in PascalCase
class UserProfile:
    pass

# ✅ Constants in UPPER_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# ✅ Imports — one per line
import os
import sys
from pathlib import Path

# ❌ Multiple imports on one line
# import os, sys
```

> [!note]
> You don't need to memorize PEP 8 — `ruff` will fix everything automatically. Just use the tool, as shown below.

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
> Run `import this` in the terminal to see Python's 19 design principles. Just reading them isn't enough — you need to apply them in your code. Pay special attention to "Explicit is better than implicit" and "Readability counts."

## Pythonic Idioms

### Truthiness — `if items:` instead of `if len(items) > 0:`

```python
# ❌ Unpythonic
items = [1, 2, 3]
if len(items) > 0:
    print("The list has elements")

if items != []:
    print("The list is not empty")

if len(items) == 0:
    print("The list is empty")

# ✅ Pythonic
if items:           # truthy check
    print("The list has elements")

if not items:       # falsy check
    print("The list is empty")
```

### Enumeration — Looping with Index

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
# ❌ Swap with a temp variable
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
> Python prefers the EAFP style — "try it first, handle errors if they happen." It's faster (avoids race conditions) and more readable. Especially useful for file, dict, and database operations.

### String Join

```python
words = ["Python", "is", "awesome"]

# ❌ Concatenate with a loop
sentence = ""
for word in words:
    sentence += word + " "
sentence = sentence.strip()

# ✅ Pythonic — join
sentence = " ".join(words)
```

### Dict `.get()` and `.setdefault()`

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

## `ruff` — The 2026 Linter and Formatter

`ruff` (by Astral) is the 2026 Python linter and formatter — it replaces flake8, black, and isort all in one. Written in Rust, incredibly fast:

```bash
# Install
uv add ruff --dev

# Lint check
ruff check src/

# Auto-fix
ruff check --fix src/

# Format (alternative to black)
ruff format src/
```

```toml
# Configuration in pyproject.toml
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
> Add `ruff` to your `pre-commit` hooks and CI/CD pipeline. Every commit will be automatically linted and formatted. Everyone now uses `ruff` instead of `black` and `flake8` — one tool, much faster.

## `logging` — Instead of `print`

```python
# ❌ Don't use print in production
def process_order(order_id):
    print(f"Processing {order_id}")
    # ...
    print("Done!")

# ✅ Use the logging module
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

> [!important]
> Never use `print()` in production code. The `logging` module gives you — log level control (DEBUG/INFO/WARNING/ERROR), file output, structured logging — everything you need. `print` is only for quick debugging.

## Debugging — `breakpoint()`

```python
def calculate_total(items: list[float]) -> float:
    total = 0
    for item in items:
        total += item
        breakpoint()  # execution will pause here!
        # opens the pdb / Python 3.14 debugger
    return total
```

```text
> /path/to/file.py(5)calculate_total()
-> total += item
(Pdb) p total        # inspect a variable
(Pdb) p item
(Pdb) n              # next line
(Pdb) c              # continue
(Pdb) q              # quit
```

> [!note]
> `breakpoint()` is Python 3.7+'s built-in debugger entry point. Put it anywhere and the code will pause there, opening an interactive debugger. Learn the `pdb` commands — `n` (next), `c` (continue), `p` (print), `l` (list), `q` (quit).

## `if __name__ == "__main__":` Guard

```python
# main.py
def main():
    print("App is running...")

# ✅ Always keep this guard
if __name__ == "__main__":
    main()
```

> [!tip]
> Without this guard, if someone imports your file, `main()` will run automatically — which you probably don't want. Keep this in all entry-point scripts.

## Project Layout

```text
myproject/
├── pyproject.toml        # single source of configuration
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
> The `src/` layout is the 2026 standard — keep the package inside `src/`. This makes import testing easier (it imports from the installed package, not the current directory) and keeps packaging clean.

## Summary

To write Pythonic code — use idiomatic patterns (`if items:` instead of `if len(items) > 0:`), the EAFP style, comprehensions, and tuple unpacking. Use `ruff` for linting and formatting. In production, use `logging`, not `print`. Use `breakpoint()` for debugging. Keep the `__main__` guard in all scripts. Use the `src/` layout. Once these become habits, your code will be of professional quality.